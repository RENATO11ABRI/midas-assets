/* ==========================================================================
   config.js — Ligação ao Supabase (backend online)
   Grupo Midas Angola · Turmas Midas 2026

   A "anon public key" é segura para usar no navegador: o acesso aos dados é
   protegido pelas políticas RLS definidas em supabase/schema.sql.
   NUNCA coloque aqui a chave "service_role".

   Para desativar o backend e voltar ao modo local (localStorage), deixe
   supabaseUrl ou supabaseAnonKey vazios.
   ========================================================================== */
window.MIDAS_CONFIG = {
  supabaseUrl: "https://cfwntrkztoeiugbtcesh.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmd250cmt6dG9laXVnYnRjZXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTUyNzEsImV4cCI6MjA5NjMzMTI3MX0.dQcnYz89Eie0qRO1ujaXke-RFC-ORAjiqhItlxZp9Aw"
};
