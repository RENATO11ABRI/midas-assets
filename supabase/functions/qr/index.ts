// ============================================================================
// Edge Function: qr  (PÚBLICA — gera o QR code dos documentos, em SVG)
// Grupo Midas Angola — Turmas Midas 2026
//
// Os documentos (recibos, comprovativos) embutem <img src=".../qr?data=URL">.
// O QR é gerado no servidor (sem bibliotecas no navegador nem CDN no cliente).
//
// Uso:  GET ?data=<texto/URL a codificar>
//
// Publicar: Edge Functions → Create function → "qr" → Deploy.
//   Desative "Verify JWT" (a imagem é carregada publicamente pelo navegador).
// ============================================================================
import QRCode from "https://esm.sh/qrcode@1.5.3";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const data = new URL(req.url).searchParams.get("data") || "";
  if (!data) return new Response("Falta o parâmetro 'data'.", { status: 400, headers: cors });

  try {
    const svg: string = await QRCode.toString(data, { type: "svg", margin: 1, width: 240, errorCorrectionLevel: "M" });
    return new Response(svg, {
      headers: { ...cors, "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, max-age=86400" },
    });
  } catch (_e) {
    return new Response("Não foi possível gerar o QR.", { status: 500, headers: cors });
  }
});
