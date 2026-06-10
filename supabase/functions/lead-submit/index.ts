// ============================================================================
// Edge Function: lead-submit  (PÚBLICA — pré-matrícula online / captação)
// Grupo Midas Angola — Turmas Midas 2026
//
// Recebe o formulário público (inscricao.html) e regista um "lead" na tabela
// public.leads usando a service_role (que fica SÓ no servidor). A tabela não
// tem acesso anónimo direto — toda a inserção pública passa por aqui, com
// validação e proteção anti-spam (campo "honeypot").
//
// Publicar: Supabase → Edge Functions → Create function → nome "lead-submit"
//   → colar este código → Deploy. IMPORTANTE: desative "Verify JWT" nesta
//   função (Settings da função) para permitir chamadas públicas.
// ============================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não suportado." }, 405);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Pedido inválido." }, 400); }

  // Honeypot: se o campo invisível "website" vier preenchido, é um robô.
  if ((body.website || "").toString().trim() !== "") return json({ ok: true });

  const nome = (body.nome || "").toString().trim();
  const contacto = (body.contacto || "").toString().trim();
  if (nome.length < 3) return json({ error: "Indique o seu nome completo." }, 400);
  if (contacto.length < 6) return json({ error: "Indique um contacto válido." }, 400);

  const lead = {
    id: "lead_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    nome,
    contacto,
    whatsapp: (body.whatsapp || "").toString().trim(),
    cursoInteresse: (body.curso || "").toString().trim(),
    periodo: (body.periodo || "").toString().trim(),
    unidade: (body.unidade || "").toString().trim(),
    mensagem: (body.mensagem || "").toString().slice(0, 1000),
    estado: "Novo",
    origem: "site",
    criadoEm: new Date().toISOString(),
  };

  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(url, key);
  const { error } = await sb.from("leads").insert({ id: lead.id, dados: lead });
  if (error) return json({ error: "Não foi possível registar agora. Tente mais tarde." }, 500);

  return json({ ok: true });
});
