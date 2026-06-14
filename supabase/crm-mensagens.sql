-- ============================================================================
-- Grupo Midas Angola — MIDAS2026 · CRM WhatsApp
-- MIGRAÇÃO SEGURA: só ACRESCENTA a tabela de mensagens-modelo.
--
-- ✅ Pode correr numa base de dados COM DADOS REAIS — não apaga nada.
--    (Não contém DROP/DELETE/TRUNCATE. Usa "create table if not exists".)
--
-- Quando usar: para ativar a biblioteca de mensagens do CRM sem ter de correr
-- o schema.sql completo (esse script recria tabelas e APAGARIA dados existentes).
--
-- Como correr: Supabase → SQL Editor → New query → cole TUDO → Run.
-- Requer que o schema base já exista (funções public.meu_perfil() e
-- public.fn_auditoria(), criadas pelo schema.sql na instalação inicial).
-- ============================================================================

-- A tabela "leads" já existe no schema base; aqui só garantimos "mensagens".
create table if not exists public.mensagens (
  id            text primary key,
  dados         jsonb not null,
  criado_por    uuid default auth.uid(),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.mensagens enable row level security;

drop policy if exists p_msg_read on public.mensagens;
drop policy if exists p_msg_write on public.mensagens;
create policy p_msg_read  on public.mensagens for select using (auth.uid() is not null);
create policy p_msg_write on public.mensagens for all
  using (public.meu_perfil() in ('admin','directora','secretaria','coordenador'))
  with check (public.meu_perfil() in ('admin','directora','secretaria','coordenador'));

drop trigger if exists aud_mensagens on public.mensagens;
create trigger aud_mensagens after insert or update or delete on public.mensagens
  for each row execute function public.fn_auditoria();

-- ============================================================================
-- FIM. Nada foi apagado. A aplicação preenche os modelos no primeiro arranque.
-- ============================================================================
