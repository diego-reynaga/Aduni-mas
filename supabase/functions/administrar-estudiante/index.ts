import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN")?.trim() || "http://localhost:4200";
const CORS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

type Action = "crear" | "actualizar" | "activar" | "desactivar";

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
  });
}

function text(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

function optional(value: unknown): string | null {
  const result = text(value);
  return result || null;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function databaseMessage(error: { code?: string; message?: string; details?: string }): string {
  const detail = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
  if (error.code === "23505") {
    if (detail.includes("numero_documento")) return "Ya existe una persona con ese DNI o número de documento.";
    if (detail.includes("personas_correo")) return "Ya existe una persona con ese correo.";
    if (detail.includes("estudiantes_codigo") || detail.includes("codigo")) return "Ya existe un estudiante con ese código.";
    return "Los datos del estudiante duplican un registro existente.";
  }
  if (error.code === "42501") return "No tiene permisos para gestionar estudiantes.";
  return error.message || "No se pudo guardar el estudiante.";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return response({ message: "Método no permitido." }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return response({ message: "Sesión requerida." }, 401);

    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!url || !anonKey || !serviceKey) {
      return response({ message: "La función no tiene configuración Supabase completa." }, 500);
    }

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser(authHeader.slice(7));
    if (userError || !userData.user) return response({ message: "Token de usuario inválido." }, 401);

    const { data: caller, error: callerError } = await admin
      .from("profiles")
      .select("id,username,rol,activo")
      .eq("id", userData.user.id)
      .single();
    if (callerError || !caller?.activo || caller.rol !== "ADMINISTRADOR") {
      return response({ message: "Solo un administrador activo puede gestionar estudiantes." }, 403);
    }

    const payload = await req.json() as Record<string, unknown>;
    const action = text(payload.action).toLowerCase() as Action;
    if (!["crear", "actualizar", "activar", "desactivar"].includes(action)) {
      return response({ message: "Acción de estudiante no válida." }, 400);
    }

    const studentId = optional(payload.studentId);
    let person: Record<string, unknown> = {};
    let student: Record<string, unknown> = {};

    if (action === "crear" || action === "actualizar") {
      const inputPerson = (payload.person ?? {}) as Record<string, unknown>;
      const inputStudent = (payload.student ?? {}) as Record<string, unknown>;
      const nombres = text(inputPerson.nombres);
      const apellidos = text(inputPerson.apellidos);
      const documento = text(inputPerson.documentoIdentidad);
      const email = text(inputPerson.correo).toLowerCase();
      const code = (text(inputStudent.codigoEstudiante) || `EST-${documento}`)
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .toUpperCase()
        .slice(0, 30);

      if (!nombres || !apellidos) return response({ message: "Nombres y apellidos son obligatorios." }, 400);
      if (!documento) return response({ message: "El DNI o número de documento es obligatorio." }, 400);
      if (email && !isEmail(email)) return response({ message: "El correo no tiene un formato válido." }, 400);
      if (!code) return response({ message: "El código de estudiante es obligatorio." }, 400);
      if (action === "actualizar" && !studentId) return response({ message: "Debe indicar el estudiante que desea actualizar." }, 400);

      person = {
        nombres,
        apellidos,
        tipoDocumento: text(inputPerson.tipoDocumento) || "DNI",
        documentoIdentidad: documento,
        fechaNacimiento: optional(inputPerson.fechaNacimiento),
        genero: optional(inputPerson.genero),
        correo: email || null,
        telefono: optional(inputPerson.telefono),
        direccion: optional(inputPerson.direccion),
      };
      student = {
        codigoEstudiante: code,
        activo: inputStudent.activo !== false,
      };
    } else if (!studentId) {
      return response({ message: "Debe indicar el estudiante que desea modificar." }, 400);
    }

    const { data, error } = await admin.rpc("admin_manage_student", {
      p_action: action,
      p_student_id: studentId,
      p_person: person,
      p_student: student,
      p_actor_id: caller.id,
      p_actor_username: caller.username,
    });
    if (error) return response({ message: databaseMessage(error), code: error.code }, 400);
    return response({ student: data, message: action === "crear" ? "Estudiante registrado correctamente." : "Estudiante actualizado correctamente." });
  } catch (error) {
    console.error("administrar-estudiante", error);
    return response({ message: error instanceof Error ? error.message : "Error inesperado al gestionar el estudiante." }, 400);
  }
});
