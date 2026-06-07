// ============================================================================
// Edge Function: admin-users
// Grupo Midas Angola — Turmas Midas 2026
//
// Permite ao ADMINISTRADOR (autenticado na app) criar/gerir utilizadores em
// segurança. A chave secreta service_role fica SÓ no servidor (nunca no
// navegador). Cada chamada é validada: só prossegue se quem chama for 'admin'.
//
// Ações (POST JSON { action, ... }):
//   list                                  -> lista utilizadores + perfis
//   create  { nome, login, password, perfil }
//   setRole { userId, perfil }
//   setActive { userId, ativo }
//   setPassword { userId, password }
//   remove  { userId }
//
// "login" pode ser um email real ou um nome de utilizador; sem "@" é convertido
// para <login>@midas.local (conta interna sem email real).
//
// Publicar: Supabase → Edge Functions → Create function → nome "admin-users"
//           → colar este código → Deploy. (service_role e URL são injetados.)
// ============================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DOMINIO_INTERNO = "midas.local";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Devolve sempre HTTP 200 (com {error} no corpo quando aplicável) para que o
// cliente (supabase-js) consiga ler a mensagem sem ter de inspecionar o status.
function json(body: unknown, _status = 200): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function loginParaEmail(login: string): string {
  login = (login || "").trim();
  return login.includes("@") ? login.toLowerCase() : login.toLowerCase() + "@" + DOMINIO_INTERNO;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

  // 1) Identificar quem chama (a partir do token enviado pela app)
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return json({ error: "Sem sessão." }, 401);

  const asCaller = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await asCaller.auth.getUser();
  if (userErr || !userData?.user) return json({ error: "Sessão inválida." }, 401);

  // 2) Confirmar que é admin (com a chave service_role, sem RLS a atrapalhar)
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: perfil } = await admin
    .from("perfis").select("perfil").eq("id", userData.user.id).maybeSingle();
  if (!perfil || perfil.perfil !== "admin") {
    return json({ error: "Apenas o administrador pode gerir utilizadores." }, 403);
  }

  // 3) Executar a ação pedida
  let payload: any = {};
  try { payload = await req.json(); } catch { /* corpo vazio */ }
  const action = payload.action;

  try {
    if (action === "list") {
      const { data: list, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (error) throw error;
      const { data: perfis } = await admin.from("perfis").select("id, nome, perfil, ativo");
      const byId: Record<string, any> = {};
      (perfis || []).forEach((p: any) => { byId[p.id] = p; });
      const users = (list?.users || [])
        .map((u: any) => {
          const p = byId[u.id] || {};
          const email = u.email || "";
          return {
            id: u.id,
            email,
            utilizador: email.endsWith("@" + DOMINIO_INTERNO) ? email.split("@")[0] : email,
            nome: p.nome || (u.user_metadata?.nome ?? ""),
            perfil: p.perfil || "secretaria",
            ativo: p.ativo !== false,
            criadoEm: u.created_at,
          };
        })
        .sort((a: any, b: any) => (a.nome || a.utilizador).localeCompare(b.nome || b.utilizador));
      return json({ users });
    }

    if (action === "create") {
      const email = loginParaEmail(payload.login);
      const password = String(payload.password || "");
      const nome = String(payload.nome || "").trim();
      const perfilNovo = String(payload.perfil || "secretaria");
      if (!payload.login || password.length < 6) {
        return json({ error: "Indique o login e uma senha com pelo menos 6 caracteres." }, 400);
      }
      const { data: created, error } = await admin.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { nome },
      });
      if (error) throw error;
      await admin.from("perfis").upsert({
        id: created.user.id, nome: nome || email, perfil: perfilNovo, ativo: true,
      });
      return json({ ok: true, id: created.user.id });
    }

    if (action === "setRole") {
      const { error } = await admin.from("perfis")
        .update({ perfil: String(payload.perfil) }).eq("id", payload.userId);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "setActive") {
      const ativo = !!payload.ativo;
      const { error } = await admin.from("perfis").update({ ativo }).eq("id", payload.userId);
      if (error) throw error;
      // Bloqueia/desbloqueia o início de sessão de facto
      await admin.auth.admin.updateUserById(payload.userId, {
        ban_duration: ativo ? "none" : "876000h",
      });
      return json({ ok: true });
    }

    if (action === "setPassword") {
      const password = String(payload.password || "");
      if (password.length < 6) return json({ error: "A senha deve ter pelo menos 6 caracteres." }, 400);
      const { error } = await admin.auth.admin.updateUserById(payload.userId, { password });
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "remove") {
      if (payload.userId === userData.user.id) {
        return json({ error: "Não pode eliminar a sua própria conta." }, 400);
      }
      const { error } = await admin.auth.admin.deleteUser(payload.userId);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "Ação desconhecida." }, 400);
  } catch (e) {
    return json({ error: (e as Error).message || "Erro no servidor." }, 400);
  }
});
