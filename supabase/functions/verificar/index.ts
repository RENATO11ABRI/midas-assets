// ============================================================================
// Edge Function: verificar  (PÚBLICA — autenticidade de documentos / QR)
// Grupo Midas Angola — Turmas Midas 2026
//
// Confirma a validade de um recibo ou de uma matrícula a partir do número
// impresso no documento (ligado pelo QR code → verificar.html). Devolve apenas
// informação mínima de confirmação. Usa service_role (só no servidor).
//
// Uso:  GET  ?t=recibo&id=REC-000123     ou   ?t=matricula&id=MAT-2026-0001
//       POST { tipo, id }
//
// Publicar: Edge Functions → Create function → "verificar" → Deploy.
//   Desative "Verify JWT" (chamada pública).
// ============================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
function json(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const u = new URL(req.url);
  let tipo = u.searchParams.get("t") || "";
  let id = u.searchParams.get("id") || "";
  if (req.method === "POST") {
    try { const b = await req.json(); tipo = (b.tipo || tipo); id = (b.id || id); } catch { /* ignora */ }
  }
  id = (id || "").toString().trim();
  if (!id) return json({ valido: false, erro: "Sem identificador." });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Os números de recibo/matrícula são sequenciais e, por isso, "adivinháveis".
  // Para reduzir a recolha de dados por enumeração, devolvemos o MÍNIMO: nome
  // mascarado (primeiro nome + inicial) e SEM valores monetários.
  function mascararNome(n: string): string {
    const partes = (n || "").trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return "—";
    if (partes.length === 1) return partes[0];
    return partes[0] + " " + partes[partes.length - 1][0].toUpperCase() + ".";
  }

  if (tipo === "matricula") {
    const { data } = await sb.from("estudantes").select("dados").eq("dados->>matricula", id).maybeSingle();
    if (!data) return json({ valido: false });
    const e = data.dados as Record<string, unknown>;
    return json({ valido: true, tipo: "matricula", numero: e.matricula, nome: mascararNome(String(e.nome || "")), curso: e.curso, data: e.dataMatricula });
  }

  // por omissão: recibo
  const { data } = await sb.from("pagamentos").select("dados").eq("dados->>recibo", id).maybeSingle();
  if (!data) return json({ valido: false });
  const p = data.dados as Record<string, unknown>;
  return json({ valido: true, tipo: "recibo", numero: p.recibo, nome: mascararNome(String(p.estudanteNome || "")), curso: p.curso, emolumento: p.emolumento, data: p.data });
});
