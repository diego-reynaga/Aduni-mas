import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN")?.trim() || "http://localhost:4200";

const CORS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

const ROLES = ["ADMINISTRADOR", "DOCENTE", "ESTUDIANTE", "PADRE_FAMILIA"] as const;
type AppRole = typeof ROLES[number];
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

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return response({ message: "Método no permitido." }, 405);

  let createdUserId: string | null = null;
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return response({ message: "Sesión requerida." }, 401);

    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!url || !anonKey || !serviceKey) throw new Error("La función no tiene configuración Supabase completa.");

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: callerData, error: callerError } = await userClient.auth.getUser(authHeader.slice(7));
    if (callerError || !callerData.user) return response({ message: "Token inválido." }, 401);

    const { data: caller, error: callerProfileError } = await admin
      .from("profiles")
      .select("id, username, rol, activo")
      .eq("id", callerData.user.id)
      .single();
    if (callerProfileError || !caller?.activo || caller.rol !== "ADMINISTRADOR") {
      return response({ message: "Solo un administrador activo puede gestionar usuarios." }, 403);
    }

    const payload = await req.json() as Record<string, unknown>;
    const action = text(payload.action) as Action;
    const userId = text(payload.userId);
    if (!["crear", "actualizar", "activar", "desactivar"].includes(action)) {
      throw new Error("Acción de usuario no válida.");
    }

    if (action === "crear") {
      const email = text(payload.email).toLowerCase();
      const password = text(payload.password);
      const personaId = text(payload.personaId);
      const username = text(payload.username) || email;
      const rol = text(payload.rol) as AppRole;
      if (!isEmail(email)) throw new Error("Debe indicar un correo válido para Supabase Auth.");
      if (password.length < 12) throw new Error("La contraseña debe tener al menos 12 caracteres.");
      if (!personaId) throw new Error("Debe seleccionar una persona.");
      if (!ROLES.includes(rol)) throw new Error("El rol no es válido.");

      const { data: person, error: personError } = await admin.from("personas").select("id,nombres,apellidos").eq("id", personaId).single();
      if (personError || !person) throw new Error("La persona seleccionada no existe.");
      const { data: duplicate } = await admin.from("profiles").select("id").eq("persona_id", personaId).maybeSingle();
      if (duplicate) throw new Error("La persona ya tiene un usuario asociado.");

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { rol, persona_id: personaId },
        user_metadata: { nombre: `${person.nombres} ${person.apellidos}`.trim() },
      });
      if (createError || !created.user) throw createError ?? new Error("Supabase Auth no creó el usuario.");
      createdUserId = created.user.id;

      const { data: profile, error: profileError } = await admin.from("profiles").insert({
        id: created.user.id,
        persona_id: personaId,
        rol,
        username,
        activo: true,
      }).select("id,persona_id,rol,username,activo").single();
      if (profileError) {
        await admin.auth.admin.deleteUser(created.user.id);
        createdUserId = null;
        throw profileError;
      }
      await admin.from("auditoria").insert({
        usuario_id: caller.id,
        accion: "CREAR_USUARIO",
        entidad: "profiles",
        entidad_id: profile.id,
        usuario_responsable: caller.username,
        detalle: { email, personaId, rol },
      });
      return response({ ...profile, email });
    }

    if (!userId) throw new Error("Debe indicar el usuario que desea modificar.");
    const { data: existing, error: existingError } = await admin.from("profiles").select("id,persona_id,rol,username,activo").eq("id", userId).single();
    if (existingError || !existing) throw new Error("El usuario no existe.");

    if (action === "activar" || action === "desactivar") {
      const activo = action === "activar";
      if (userId === caller.id && !activo) throw new Error("No puede desactivar su propia cuenta administrativa.");
      const { data: profile, error } = await admin.from("profiles").update({ activo }).eq("id", userId).select("id,persona_id,rol,username,activo").single();
      if (error) throw error;
      await admin.from("auditoria").insert({
        usuario_id: caller.id,
        accion: activo ? "ACTIVAR_USUARIO" : "DESACTIVAR_USUARIO",
        entidad: "profiles",
        entidad_id: userId,
        usuario_responsable: caller.username,
        detalle: { objetivo: existing.username },
      });
      return response(profile);
    }

    const email = text(payload.email).toLowerCase();
    const password = text(payload.password);
    const username = text(payload.username) || existing.username;
    const rol = (text(payload.rol) || existing.rol) as AppRole;
    if (email && !isEmail(email)) throw new Error("El correo no es válido.");
    if (password && password.length < 12) throw new Error("La contraseña debe tener al menos 12 caracteres.");
    if (!ROLES.includes(rol)) throw new Error("El rol no es válido.");
    if (userId === caller.id && rol !== "ADMINISTRADOR") throw new Error("No puede retirar su propio rol administrativo.");

    const authChanges: Record<string, unknown> = { app_metadata: { rol, persona_id: existing.persona_id } };
    if (email) authChanges.email = email;
    if (password) authChanges.password = password;
    const { error: authError } = await admin.auth.admin.updateUserById(userId, authChanges);
    if (authError) throw authError;
    const { data: profile, error: profileError } = await admin.from("profiles").update({ username, rol }).eq("id", userId).select("id,persona_id,rol,username,activo").single();
    if (profileError) throw profileError;
    await admin.from("auditoria").insert({
      usuario_id: caller.id,
      accion: "ACTUALIZAR_USUARIO",
      entidad: "profiles",
      entidad_id: userId,
      usuario_responsable: caller.username,
      detalle: { objetivo: existing.username, rol },
    });
    return response(profile);
  } catch (error) {
    console.error("administrar-usuario", error, createdUserId);
    return response({ message: error instanceof Error ? error.message : "Error inesperado al gestionar el usuario." }, 400);
  }
});
