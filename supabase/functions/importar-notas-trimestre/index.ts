import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:4200",
  "https://adunimas.appwrite.network",
];

function configuredOrigins(): Set<string> {
  const configured = [Deno.env.get("ALLOWED_ORIGINS"), Deno.env.get("ALLOWED_ORIGIN")]
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...configured]);
}

const ALLOWED_ORIGINS = configuredOrigins();

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin")?.trim() ?? "";
  // Do not reflect arbitrary origins. Browser clients must come from one of the
  // known application deployments or an explicitly configured origin.
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : DEFAULT_ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_SHEETS = 12;
const MAX_STUDENTS = 100;
const MAX_USEFUL_COLUMNS = 40;
const MAX_PROCESSED_CELLS = 5000;
const MAX_UNCOMPRESSED_BYTES = 50 * 1024 * 1024;
const FIRST_STUDENT_ROW = 16;
const DEFAULT_CAPACITY_NAMES = ["PRACTICA", "EXAMEN", "CUADERNO"] as const;

const COMPETENCES = [
  { number: 1, name: "Resuelve problemas de cantidad", noteCols: [5, 6, 7, 8, 9, 10] },
  { number: 2, name: "Resuelve problemas de regularidad, equivalencia y cambio", noteCols: [12, 13, 14, 15, 16, 17] },
  { number: 3, name: "Resuelve problemas de forma, movimiento y localización", noteCols: [19, 20, 21, 22, 23, 24] },
  { number: 4, name: "Resuelve problemas de gestión de datos e incertidumbre", noteCols: [26, 27, 28, 29, 30, 31] },
] as const;
const CAPACITY_NAME_ROW = 8;

const USEFUL_COLUMNS = new Set([
  0, 1,
  ...COMPETENCES.flatMap((item) => item.noteCols),
]);

type AppRole = "ADMINISTRADOR" | "DOCENTE" | "ESTUDIANTE" | "PADRE_FAMILIA";
type Trimester = "I_TRIMESTRE" | "II_TRIMESTRE" | "III_TRIMESTRE";
type ImportError = {
  filaExcel: number | null;
  estudianteTexto: string | null;
  campo: string;
  descripcionError: string;
  critico: boolean;
};

type ParsedNote = {
  numeroCapacidad: number;
  columnaExcel: string;
  nombreNota: string;
  valor: number | null;
  activa: boolean;
};
type ParsedCompetence = {
  numero: number;
  nombre: string;
  notas: ParsedNote[];
  promedioCompetencia: number | null;
};
type ParsedStudent = {
  filaExcel: number;
  numeroOrden: number | null;
  nombreExcel: string;
  idEstudiante: string | null;
  codigoEstudiante: string | null;
  estadoMapeo: "ENCONTRADO" | "NO_ENCONTRADO";
  competencias: ParsedCompetence[];
  promedioFinalTrimestre: number | null;
  errores: ImportError[];
};
type ParsedCapacityDefinition = {
  numero: number;
  columna: number;
  columnaExcel: string;
  nombre: string;
  encabezadoSignificativo: boolean;
  tieneValor: boolean;
  activa: boolean;
};
type ParsedCompetenceDefinition = {
  numero: number;
  nombre: string;
  capacidades: ParsedCapacityDefinition[];
};

function response(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json; charset=utf-8" },
  });
}

function fail(req: Request, message: string, status = 400): Response {
  return response(req, { message }, status);
}

function clean(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function average(values: number[]): number | null {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function excelColumn(zeroBased: number): string {
  let current = zeroBased + 1;
  let result = "";
  while (current > 0) {
    const remainder = (current - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    current = Math.floor((current - 1) / 26);
  }
  return result;
}

function isCapacityPlaceholder(value: string): boolean {
  const normalized = normalizeName(value);
  return /^CAPACIDAD\s*\d+$/.test(normalized) || /^NOTA\s*(?:[A-Z]{1,3}|\d{1,2})$/.test(normalized);
}

function capacityName(header: string, number: number): string {
  if (header && !isCapacityPlaceholder(header)) return header;
  return DEFAULT_CAPACITY_NAMES[number - 1] ?? `CAPACIDAD ${number}`;
}

function importErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === "string" && error.trim()) return error.trim();
  if (error && typeof error === "object") {
    const candidate = error as Record<string, unknown>;
    for (const key of ["message", "details", "hint", "error_description"]) {
      const value = clean(candidate[key]);
      if (value) return value;
    }
  }
  return "No se pudo procesar el Excel. Revise el archivo y vuelva a intentarlo.";
}

function validateZipEnvelope(bytes: Uint8Array): void {
  if (bytes.length < 22 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new Error("El archivo no es un XLSX válido (contenedor ZIP ausente).");
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const searchStart = Math.max(0, bytes.length - 65_557);
  let eocd = -1;
  for (let offset = bytes.length - 22; offset >= searchStart; offset--) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) throw new Error("El archivo XLSX está truncado o dañado.");

  const entries = view.getUint16(eocd + 10, true);
  const centralSize = view.getUint32(eocd + 12, true);
  const centralOffset = view.getUint32(eocd + 16, true);
  if (entries > 1000 || centralOffset + centralSize > bytes.length) {
    throw new Error("El contenedor XLSX excede los límites de seguridad.");
  }

  let offset = centralOffset;
  let uncompressedTotal = 0;
  for (let index = 0; index < entries; index++) {
    if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50) {
      throw new Error("La estructura interna del XLSX no es válida.");
    }
    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    const uncompressed = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    if ((flags & 0x1) !== 0 || (method !== 0 && method !== 8)) {
      throw new Error("El XLSX usa cifrado o compresión no permitida.");
    }
    uncompressedTotal += uncompressed;
    if (uncompressedTotal > MAX_UNCOMPRESSED_BYTES) {
      throw new Error("El XLSX se expande por encima del límite seguro de 50 MB.");
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
}

function readCellFactory(workbook: XLSX.WorkBook) {
  let processed = 0;
  return (sheet: XLSX.WorkSheet, row: number, column: number): unknown => {
    processed += 1;
    if (processed > MAX_PROCESSED_CELLS) {
      throw new Error("El archivo supera 5000 celdas procesadas.");
    }
    const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })] as XLSX.CellObject | undefined;
    // SheetJS never evaluates formulas. For formula cells, only the cached value is read.
    return cell?.v ?? null;
  };
}

function globalError(campo: string, descripcionError: string): ImportError {
  return { filaExcel: null, estudianteTexto: null, campo, descripcionError, critico: true };
}

function rowError(row: number, student: string, campo: string, descripcionError: string): ImportError {
  return { filaExcel: row, estudianteTexto: student, campo, descripcionError, critico: false };
}

function isSummary(name: string): boolean {
  const value = normalizeName(name);
  return ["MATRICULADOS", "EVALUADOS", "APROBADOS", "DESAPROBADOS", "LOGRO DESTACADO", "RESUMEN"]
    .some((label) => value.includes(label));
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return fail(req, "Método no permitido.", 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return fail(req, "Sesión requerida.", 401);

    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!url || !anonKey || !serviceKey) throw new Error("La función no tiene configuración Supabase completa.");

    const token = authHeader.slice(7);
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData.user) return fail(req, "Token de usuario inválido.", 401);

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, persona_id, rol, username, activo")
      .eq("id", userData.user.id)
      .single();
    if (profileError || !profile?.activo) return fail(req, "Perfil inactivo o inexistente.", 403);
    if (!["ADMINISTRADOR", "DOCENTE"].includes(profile.rol as AppRole)) {
      return fail(req, "Solo docentes y administradores pueden importar notas.", 403);
    }

    const form = await req.formData();
    const file = form.get("file");
    const assignmentId = clean(form.get("assignmentId"));
    const trimestre = clean(form.get("trimestre")) as Trimester;
    const mode = clean(form.get("modo")) || "preview";
    if (!(file instanceof File)) throw new Error("Debe adjuntar un archivo XLSX.");
    if (!assignmentId) throw new Error("Debe seleccionar una asignación docente.");
    if (!["I_TRIMESTRE", "II_TRIMESTRE", "III_TRIMESTRE"].includes(trimestre)) {
      throw new Error("El trimestre seleccionado no es válido.");
    }
    if (!["preview", "confirmar"].includes(mode)) throw new Error("Modo de importación inválido.");
    if (!file.name.toLowerCase().endsWith(".xlsx")) throw new Error("Solo se aceptan archivos .xlsx.");
    if (file.size <= 0 || file.size > MAX_FILE_BYTES) throw new Error("El archivo debe pesar como máximo 10 MB.");

    const { data: assignment, error: assignmentError } = await admin
      .from("asignaciones_docente")
      .select("id, docente_id, curso_id, periodo_id, estado, docentes!inner(id,persona_id), cursos!inner(id,grado_id,materias!inner(nombre,area)), periodos!inner(id,gestion_id,nombre)")
      .eq("id", assignmentId)
      .single();
    if (assignmentError || !assignment || assignment.estado !== "ACTIVA") {
      return fail(req, "La asignación docente no existe o está cerrada.", 404);
    }
    const assignmentTeacher = assignment.docentes as unknown as { persona_id: string };
    if (profile.rol === "DOCENTE" && assignmentTeacher.persona_id !== profile.persona_id) {
      return fail(req, "No puede importar notas de cursos asignados a otro docente.", 403);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    validateZipEnvelope(bytes);
    const workbook = XLSX.read(bytes, {
      type: "array",
      dense: false,
      cellFormula: true,
      cellHTML: false,
      cellNF: false,
      cellStyles: false,
      bookVBA: false,
      WTF: false,
    });
    if (workbook.SheetNames.length === 0 || workbook.SheetNames.length > MAX_SHEETS) {
      throw new Error(`El libro debe contener entre 1 y ${MAX_SHEETS} hojas.`);
    }
    const startSheet = workbook.Sheets["INICIO"];
    const trimesterSheet = workbook.Sheets[trimestre.replaceAll("_", " ")];
    if (!startSheet) throw new Error("El archivo no contiene la hoja INICIO.");
    if (!trimesterSheet) throw new Error(`El archivo no contiene la hoja ${trimestre.replaceAll("_", " ")}.`);

    if (USEFUL_COLUMNS.size > MAX_USEFUL_COLUMNS) {
      throw new Error(`La plantilla requiere más de ${MAX_USEFUL_COLUMNS} columnas útiles.`);
    }
    const readCell = readCellFactory(workbook);
    const metadata = {
      anio: Number(readCell(startSheet, 10, 4)) || null,
      nivel: clean(readCell(startSheet, 11, 1)),
      institucion: clean(readCell(startSheet, 12, 1)),
      lugar: clean(readCell(startSheet, 13, 1)),
      areaCurricular: clean(readCell(startSheet, 14, 1)),
      docente: clean(readCell(startSheet, 15, 1)),
      grado: clean(readCell(startSheet, 16, 1)),
      seccion: clean(readCell(startSheet, 16, 3)),
      trimestre,
    };

    const globalErrors: ImportError[] = [];
    if (!metadata.anio) globalErrors.push(globalError("anio", "No se pudo leer el año desde INICIO!E11."));
    if (!metadata.areaCurricular) globalErrors.push(globalError("areaCurricular", "No se pudo leer el área curricular."));
    if (!metadata.docente) globalErrors.push(globalError("docente", "No se pudo leer el docente."));
    if (!metadata.grado) globalErrors.push(globalError("grado", "No se pudo leer el grado."));
    if (!metadata.seccion) globalErrors.push(globalError("seccion", "No se pudo leer la sección."));

    const course = assignment.cursos as unknown as { grado_id: string; materias: { nombre: string; area: string | null } };
    const period = assignment.periodos as unknown as { gestion_id: string; nombre: string };
    const { data: enrollments, error: enrollmentError } = await admin
      .from("matriculas")
      .select("estudiante_id, estudiantes!inner(id,codigo,personas!inner(nombres,apellidos))")
      .eq("grado_id", course.grado_id)
      .eq("gestion_id", period.gestion_id)
      .eq("estado", "ACTIVA");
    if (enrollmentError) throw enrollmentError;

    const studentIndex = new Map<string, { id: string; codigo: string } | null>();
    for (const item of enrollments ?? []) {
      const student = item.estudiantes as unknown as { id: string; codigo: string; personas: { nombres: string; apellidos: string } };
      const candidates = [
        `${student.personas.apellidos}, ${student.personas.nombres}`,
        `${student.personas.apellidos} ${student.personas.nombres}`,
        `${student.personas.nombres} ${student.personas.apellidos}`,
      ];
      for (const candidate of candidates) {
        const key = normalizeName(candidate);
        const existing = studentIndex.get(key);
        studentIndex.set(key, existing && existing.id !== student.id ? null : { id: student.id, codigo: student.codigo });
      }
    }

    const parsedCompetenceDefinitions: ParsedCompetenceDefinition[] = COMPETENCES.map((definition) => ({
      numero: definition.number,
      nombre: definition.name,
      capacidades: definition.noteCols.map((column, index) => {
        const rawHeader = clean(readCell(trimesterSheet, CAPACITY_NAME_ROW, column));
        return {
          numero: index + 1,
          columna: column,
          columnaExcel: excelColumn(column),
          nombre: capacityName(rawHeader, index + 1),
          encabezadoSignificativo: Boolean(rawHeader) && !isCapacityPlaceholder(rawHeader),
          tieneValor: false,
          activa: false,
        };
      }),
    }));

    const students: ParsedStudent[] = [];
    let blankStreak = 0;
    for (let row = FIRST_STUDENT_ROW; row <= FIRST_STUDENT_ROW + MAX_STUDENTS; row++) {
      const rawName = clean(readCell(trimesterSheet, row, 1));
      if (!rawName || normalizeName(rawName).length < 4 || isSummary(rawName)) {
        blankStreak += 1;
        if (isSummary(rawName) || blankStreak >= 3) break;
        continue;
      }
      if (students.length >= MAX_STUDENTS) throw new Error(`La hoja supera ${MAX_STUDENTS} estudiantes.`);
      blankStreak = 0;
      const mapped = studentIndex.get(normalizeName(rawName)) ?? null;
      const errors: ImportError[] = [];
      if (!mapped) errors.push(rowError(row + 1, rawName, "estudiante", "Estudiante no encontrado o nombre ambiguo; no se crea automáticamente."));

      const competencies: ParsedCompetence[] = [];
      for (const [competenceIndex, definition] of COMPETENCES.entries()) {
        const parsedDefinition = parsedCompetenceDefinitions[competenceIndex];
        const rawNotes = definition.noteCols.map((column, index) => {
          const capacity = parsedDefinition.capacidades[index];
          const raw = readCell(trimesterSheet, row, column);
          const hasValue = raw !== null && clean(raw) !== "";
          if (hasValue) capacity.tieneValor = true;
          let value: number | null = null;
          if (hasValue) {
            const parsed = Number(clean(raw).replace(",", "."));
            if (!Number.isFinite(parsed)) {
              errors.push(rowError(row + 1, rawName, excelColumn(column), "La celda no contiene una nota numérica válida."));
            } else if (parsed < 0 || parsed > 20) {
              errors.push(rowError(row + 1, rawName, excelColumn(column), "La nota debe estar entre 0 y 20."));
            } else {
              value = parsed;
            }
          }
          return {
            numeroCapacidad: capacity.numero,
            columnaExcel: capacity.columnaExcel,
            nombreNota: capacity.nombre,
            valor: value,
            activa: hasValue || capacity.encabezadoSignificativo,
          };
        });
        // Match IFERROR(AVERAGE(capacity-range), "") from the workbook. The
        // source formula cache may be stale, so calculate from the source
        // capacity cells instead of trusting its cached result.
        const competenceAverage = average(
          rawNotes.map((note) => note.valor).filter((value): value is number => value !== null),
        );
        competencies.push({
          numero: definition.number,
          nombre: definition.name,
          notas: rawNotes,
          promedioCompetencia: competenceAverage,
        });
      }
      // Match IFERROR(AVERAGE(the four competency averages), "") from AL.
      const finalAverage = average(
        competencies.map((item) => item.promedioCompetencia).filter((value): value is number => value !== null),
      );
      if (finalAverage === null) errors.push(rowError(row + 1, rawName, "notas", "El estudiante no contiene notas válidas."));
      students.push({
        filaExcel: row + 1,
        numeroOrden: Number(readCell(trimesterSheet, row, 0)) || null,
        nombreExcel: rawName,
        idEstudiante: mapped?.id ?? null,
        codigoEstudiante: mapped?.codigo ?? null,
        estadoMapeo: mapped ? "ENCONTRADO" : "NO_ENCONTRADO",
        competencias: competencies,
        promedioFinalTrimestre: finalAverage,
        errores: errors,
      });
    }

    // Capacity counts are global per competency. A value present only in a
    // later student's fifth/sixth slot must still produce arrays of the same
    // length for every student before the atomic grade RPC validates them.
    for (const definition of parsedCompetenceDefinitions) {
      const activeCount = Math.max(3, definition.capacidades.reduce(
        (count, capacity) => capacity.encabezadoSignificativo || capacity.tieneValor ? capacity.numero : count,
        0,
      ));
      definition.capacidades.forEach((capacity) => {
        capacity.activa = capacity.numero <= activeCount;
      });
      for (const student of students) {
        const competence = student.competencias.find((item) => item.numero === definition.numero);
        if (competence) competence.notas = competence.notas.slice(0, activeCount);
      }
    }

    const evaluated = students.map((item) => item.promedioFinalTrimestre).filter((value): value is number => value !== null);
    const count = (predicate: (value: number) => boolean) => evaluated.filter(predicate).length;
    const resumen = {
      matriculados: students.length,
      evaluados: evaluated.length,
      noEvaluados: students.length - evaluated.length,
      aprobados: count((value) => value >= 11),
      desaprobados: count((value) => value < 11),
    };
    const preview = {
      metadata,
      resumen,
      estudiantes: students,
      errores: globalErrors,
      bloqueante: globalErrors.length > 0,
    };
    if (mode === "preview") return response(req, preview);
    if (preview.bloqueante) return fail(req, "La importación tiene errores estructurales bloqueantes.", 422);

    const importable = students.filter((item) => item.idEstudiante && item.promedioFinalTrimestre !== null && item.errores.length === 0);
    const allErrors = [...globalErrors, ...students.flatMap((item) => item.errores)];
    const competencies = parsedCompetenceDefinitions.map((definition) => ({
      numero_competencia: definition.numero,
      nombre_competencia: definition.nombre,
      nombres_capacidades: definition.capacidades
        .filter((capacity) => capacity.activa)
        .map((capacity) => capacity.nombre),
    }));
    const studentPayload = importable.map((student) => ({
      estudiante_id: student.idEstudiante,
      competencias: student.competencias.map((competence) => ({
        numero_competencia: competence.numero,
        notas: competence.notas.map((note) => note.valor),
      })),
    }));
    const detailCount = studentPayload.reduce(
      (total, student) => total + student.competencias.reduce(
        (subtotal, competence) => subtotal + competence.notas.filter((note) => note !== null).length,
        0,
      ),
      0,
    );
    const { data: persisted, error: persistError } = await userClient.rpc("confirmar_importacion_notas", {
      p_asignacion_id: assignmentId,
      p_trimestre: trimestre,
      p_nombre_archivo: file.name.slice(0, 180),
      p_hash_archivo: await sha256(bytes),
      p_metadata: metadata,
      p_total_registros: students.length,
      p_registros_validos: importable.length,
      p_detalle: `Importación confirmada para ${course.materias.nombre} / ${period.nombre}`,
      p_competencias: competencies,
      p_estudiantes: studentPayload,
      p_errores: allErrors.map((item) => ({
        fila_excel: item.filaExcel,
        estudiante_texto: item.estudianteTexto,
        campo: item.campo,
        descripcion: item.descripcionError,
        critico: item.critico,
      })),
    });
    if (persistError) throw persistError;
    const saved = persisted as { idImportacion: string; message: string; competenciasGuardadas: number; promediosFinalesGuardados: number };
    return response(req, {
      message: saved.message,
      idImportacion: saved.idImportacion,
      trimestre,
      totalFilas: students.length,
      totalCorrectas: importable.length,
      totalConError: students.length - importable.length,
      notasIndividualesGuardadas: detailCount,
      competenciasGuardadas: saved.competenciasGuardadas,
      promediosFinalesGuardados: saved.promediosFinalesGuardados,
      errores: allErrors,
    });
  } catch (error) {
    console.error("importar-notas-trimestre", error);
    return fail(req, importErrorMessage(error), 400);
  }
});
