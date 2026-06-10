-- ============================================================================
-- MIDAS2026 — Tabelas/funções adicionais (Partes 1 e 2 do guia)
-- Grupo Midas Angola
--
-- Corra ESTE ficheiro no Supabase → SQL Editor se o schema base já existe.
-- É IDEMPOTENTE: pode correr várias vezes sem problema.
-- (Requer que o schema base — supabase/schema.sql — já tenha sido aplicado,
--  pois usa public.meu_perfil() e public.fn_auditoria().)
-- ============================================================================

-- 1) CONTADORES — numeração de matrículas/recibos sem repetições -------------
create table if not exists public.contadores (tipo text primary key, valor bigint not null default 0);
alter table public.contadores enable row level security;
drop policy if exists p_cont_sel on public.contadores;
create policy p_cont_sel on public.contadores for select using (auth.uid() is not null);

create or replace function public.proximo_contador(p_tipo text)
returns bigint language plpgsql security definer set search_path = public as $$
declare v bigint; begin
  insert into public.contadores(tipo, valor) values (p_tipo, 1)
  on conflict (tipo) do update set valor = public.contadores.valor + 1
  returning valor into v;
  return v;
end; $$;
grant execute on function public.proximo_contador(text) to authenticated;

-- Semeia os contadores a partir dos dados já existentes (não sobrescreve)
insert into public.contadores(tipo, valor) values
 ('matricula', coalesce((select max(substring(dados->>'matricula' from '(\d+)$')::bigint) from public.estudantes), 0)),
 ('recibo',    coalesce((select max(substring(dados->>'recibo'    from '(\d+)$')::bigint) from public.pagamentos), 0))
on conflict (tipo) do nothing;

-- 2) FECHOS DE CAIXA ---------------------------------------------------------
create table if not exists public.fechos (
  id text primary key, dados jsonb not null, criado_por uuid default auth.uid(),
  criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now());
alter table public.fechos enable row level security;
drop policy if exists p_fechos_read on public.fechos;
drop policy if exists p_fechos_write on public.fechos;
create policy p_fechos_read  on public.fechos for select using (auth.uid() is not null);
create policy p_fechos_write on public.fechos for all
  using (public.meu_perfil() in ('admin','directora','secretaria','financeiro'))
  with check (public.meu_perfil() in ('admin','directora','secretaria','financeiro'));
drop trigger if exists aud_fechos on public.fechos;
create trigger aud_fechos after insert or update or delete on public.fechos
  for each row execute function public.fn_auditoria();

-- 3) ESTÁGIOS ----------------------------------------------------------------
create table if not exists public.estagios (
  id text primary key, dados jsonb not null, criado_por uuid default auth.uid(),
  criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now());
alter table public.estagios enable row level security;
drop policy if exists p_estagios_read on public.estagios;
drop policy if exists p_estagios_write on public.estagios;
create policy p_estagios_read  on public.estagios for select using (auth.uid() is not null);
create policy p_estagios_write on public.estagios for all
  using (public.meu_perfil() in ('admin','directora','secretaria','coordenador'))
  with check (public.meu_perfil() in ('admin','directora','secretaria','coordenador'));
drop trigger if exists aud_estagios on public.estagios;
create trigger aud_estagios after insert or update or delete on public.estagios
  for each row execute function public.fn_auditoria();

-- 4) LEADS — pré-matrícula online -------------------------------------------
create table if not exists public.leads (
  id text primary key, dados jsonb not null, criado_por uuid default auth.uid(),
  criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now());
alter table public.leads enable row level security;
drop policy if exists p_leads_read on public.leads;
drop policy if exists p_leads_write on public.leads;
create policy p_leads_read  on public.leads for select using (auth.uid() is not null);
create policy p_leads_write on public.leads for all
  using (public.meu_perfil() in ('admin','directora','secretaria','coordenador'))
  with check (public.meu_perfil() in ('admin','directora','secretaria','coordenador'));
drop trigger if exists aud_leads on public.leads;
create trigger aud_leads after insert or update or delete on public.leads
  for each row execute function public.fn_auditoria();

-- FIM. Confirme: SELECT * FROM public.contadores;  (deve mostrar matricula/recibo)
