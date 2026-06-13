-- ============================================================================
-- Grupo Midas Angola — Turmas Midas 2026
-- Esquema da base de dados (Supabase / PostgreSQL) — ALINHADO À APLICAÇÃO
--
-- Modelo: cada entidade é guardada como JSONB (preserva exatamente os objetos
-- da app), com chaves naturais (matrícula/recibo) garantidas como ÚNICAS.
--
-- ⚠️ Este script APAGA as tabelas de scaffolding vazias e recria no modelo da
--    app. A conta de administrador existente é preservada/repromovida.
-- Execute em: Supabase → SQL Editor → New query → cole tudo → Run
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 0) Limpeza do scaffolding (tabelas vazias com outro modelo)
-- ----------------------------------------------------------------------------
drop table if exists public.recibos       cascade;
drop table if exists public.matriculas    cascade;
drop table if exists public.documentos    cascade;
drop table if exists public.anos_letivos  cascade;
drop table if exists public.alunos        cascade;
drop table if exists public.pagamentos    cascade;
drop table if exists public.estudantes    cascade;
drop table if exists public.cursos        cascade;
drop table if exists public.emolumentos   cascade;
drop table if exists public.configuracoes cascade;
drop table if exists public.settings      cascade;
drop table if exists public.profiles      cascade;
drop table if exists public.auditoria     cascade;
drop table if exists public.perfis        cascade;

-- ----------------------------------------------------------------------------
-- 1) PERFIS (ligados ao Supabase Auth)
-- ----------------------------------------------------------------------------
create table public.perfis (
  id        uuid primary key references auth.users(id) on delete cascade,
  nome      text not null default '',
  perfil    text not null default 'secretaria'
            check (perfil in ('admin','directora','secretaria','financeiro','coordenador')),
  ativo     boolean not null default true,
  criado_em timestamptz not null default now()
);

create or replace function public.meu_perfil()
returns text language sql stable security definer set search_path = public as $$
  select perfil from public.perfis where id = auth.uid()
$$;

create or replace function public.e_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select perfil = 'admin' from public.perfis where id = auth.uid()), false)
$$;

-- Cria perfil automaticamente quando um utilizador é criado no Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, nome, perfil)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email), 'secretaria')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2) CONFIGURAÇÕES (linha única: settings + listas + reciclagem + sequências)
-- ----------------------------------------------------------------------------
create table public.configuracoes (
  id            int primary key default 1 check (id = 1),
  dados         jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3) ENTIDADES (JSONB) — cursos, emolumentos, estudantes, pagamentos
-- ----------------------------------------------------------------------------
create table public.cursos (
  id            text primary key,
  dados         jsonb not null,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.emolumentos (
  id            text primary key,
  dados         jsonb not null,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.estudantes (
  id            text primary key,
  matricula     text generated always as (dados->>'matricula') stored,
  dados         jsonb not null,
  criado_por    uuid default auth.uid(),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create unique index idx_est_matricula on public.estudantes(matricula) where matricula is not null;

create table public.pagamentos (
  id            text primary key,
  recibo        text generated always as (dados->>'recibo') stored,
  estudante_id  text generated always as (dados->>'estudanteId') stored,
  dados         jsonb not null,
  criado_por    uuid default auth.uid(),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create unique index idx_pag_recibo on public.pagamentos(recibo) where recibo is not null;
create index        idx_pag_estud  on public.pagamentos(estudante_id);

-- ----------------------------------------------------------------------------
-- 4) AUDITORIA (quem criou/editou/eliminou + data/hora)
-- ----------------------------------------------------------------------------
create table public.auditoria (
  id              bigint generated always as identity primary key,
  tabela          text not null,
  registo_id      text,
  accao           text not null,           -- INSERT | UPDATE | DELETE
  utilizador      uuid,
  utilizador_nome text,
  quando          timestamptz not null default now(),
  dados           jsonb
);

create or replace function public.fn_auditoria()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_nome text;
begin
  select nome into v_nome from public.perfis where id = auth.uid();
  insert into public.auditoria(tabela, registo_id, accao, utilizador, utilizador_nome, dados)
  values (tg_table_name,
          (case when tg_op = 'DELETE' then old.id else new.id end),
          tg_op, auth.uid(), v_nome,
          to_jsonb(case when tg_op = 'DELETE' then old else new end));
  return case when tg_op = 'DELETE' then old else new end;
end; $$;

create trigger aud_estudantes  after insert or update or delete on public.estudantes
  for each row execute function public.fn_auditoria();
create trigger aud_pagamentos  after insert or update or delete on public.pagamentos
  for each row execute function public.fn_auditoria();
create trigger aud_cursos      after insert or update or delete on public.cursos
  for each row execute function public.fn_auditoria();
create trigger aud_emolumentos after insert or update or delete on public.emolumentos
  for each row execute function public.fn_auditoria();

-- ----------------------------------------------------------------------------
-- 5) RLS + POLÍTICAS POR PERFIL
-- ----------------------------------------------------------------------------
alter table public.perfis        enable row level security;
alter table public.configuracoes enable row level security;
alter table public.cursos        enable row level security;
alter table public.emolumentos   enable row level security;
alter table public.estudantes    enable row level security;
alter table public.pagamentos    enable row level security;
alter table public.auditoria     enable row level security;

-- PERFIS: cada um vê o seu; admin vê e gere todos
create policy p_perfis_self  on public.perfis for select using (id = auth.uid() or public.e_admin());
create policy p_perfis_admin on public.perfis for all    using (public.e_admin()) with check (public.e_admin());

-- CONFIGURAÇÕES: todos os autenticados leem; admin/directora escrevem
create policy p_cfg_read  on public.configuracoes for select using (auth.uid() is not null);
create policy p_cfg_write on public.configuracoes for all
  using (public.meu_perfil() in ('admin','directora'))
  with check (public.meu_perfil() in ('admin','directora'));

-- CURSOS: leem todos; escrevem admin/directora/coordenador
create policy p_cursos_read  on public.cursos for select using (auth.uid() is not null);
create policy p_cursos_write on public.cursos for all
  using (public.meu_perfil() in ('admin','directora','coordenador'))
  with check (public.meu_perfil() in ('admin','directora','coordenador'));

-- EMOLUMENTOS: leem todos; escrevem admin/directora
create policy p_emol_read  on public.emolumentos for select using (auth.uid() is not null);
create policy p_emol_write on public.emolumentos for all
  using (public.meu_perfil() in ('admin','directora'))
  with check (public.meu_perfil() in ('admin','directora'));

-- ESTUDANTES: leem todos; escrevem admin/directora/secretaria
create policy p_est_read  on public.estudantes for select using (auth.uid() is not null);
create policy p_est_write on public.estudantes for all
  using (public.meu_perfil() in ('admin','directora','secretaria'))
  with check (public.meu_perfil() in ('admin','directora','secretaria'));

-- PAGAMENTOS: leem todos; escrevem admin/directora/secretaria/financeiro
create policy p_pag_read  on public.pagamentos for select using (auth.uid() is not null);
create policy p_pag_write on public.pagamentos for all
  using (public.meu_perfil() in ('admin','directora','secretaria','financeiro'))
  with check (public.meu_perfil() in ('admin','directora','secretaria','financeiro'));

-- AUDITORIA: só leitura (admin/directora); escrita feita pelos triggers
create policy p_aud_read on public.auditoria for select using (public.meu_perfil() in ('admin','directora'));

-- ----------------------------------------------------------------------------
-- 6) Promover o administrador existente (conta já criada no Auth)
-- ----------------------------------------------------------------------------
insert into public.perfis (id, nome, perfil, ativo)
select id, 'Administrador Geral', 'admin', true
from auth.users
where email = 'stvsonhonatv@gmail.com'
on conflict (id) do update set perfil = 'admin', ativo = true;

-- ----------------------------------------------------------------------------
-- 7) CONTADORES ATÓMICOS (numeração segura de matrículas/recibos multi-utilizador)
-- ----------------------------------------------------------------------------
create table if not exists public.contadores (
  tipo  text primary key,           -- 'matricula' | 'recibo'
  valor bigint not null default 0
);
alter table public.contadores enable row level security;
drop policy if exists p_cont_sel on public.contadores;
create policy p_cont_sel on public.contadores for select using (auth.uid() is not null);
-- (sem política de escrita direta: só a função abaixo, security definer, escreve)

create or replace function public.proximo_contador(p_tipo text)
returns bigint language plpgsql security definer set search_path = public as $$
declare v bigint;
begin
  insert into public.contadores(tipo, valor) values (p_tipo, 1)
  on conflict (tipo) do update set valor = public.contadores.valor + 1
  returning valor into v;
  return v;
end; $$;
grant execute on function public.proximo_contador(text) to authenticated;

-- Inicializa os contadores acima do maior número já existente (evita colisões
-- com matrículas/recibos criados antes desta migração).
insert into public.contadores(tipo, valor) values
  ('matricula', coalesce((select max(substring(dados->>'matricula' from '(\d+)$')::bigint) from public.estudantes), 0)),
  ('recibo',    coalesce((select max(substring(dados->>'recibo'    from '(\d+)$')::bigint) from public.pagamentos), 0))
on conflict (tipo) do nothing;

-- ----------------------------------------------------------------------------
-- 8) FECHO DE CAIXA (registo diário por funcionário)
-- ----------------------------------------------------------------------------
create table if not exists public.fechos (
  id            text primary key,
  dados         jsonb not null,
  criado_por    uuid default auth.uid(),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
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

-- ----------------------------------------------------------------------------
-- 9) ESTÁGIOS
-- ----------------------------------------------------------------------------
create table if not exists public.estagios (
  id            text primary key,
  dados         jsonb not null,
  criado_por    uuid default auth.uid(),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
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

-- ----------------------------------------------------------------------------
-- 10) LEADS (pré-matrícula online / funil de captação)
--     Inserções vêm da Edge Function "lead-submit" (service role); o staff
--     autenticado lê e gere. Não há acesso anónimo direto à tabela.
-- ----------------------------------------------------------------------------
create table if not exists public.leads (
  id            text primary key,
  dados         jsonb not null,
  criado_por    uuid default auth.uid(),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
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

-- ----------------------------------------------------------------------------
-- 11) MENSAGENS-MODELO (biblioteca do CRM WhatsApp)
--     Modelos de texto com variáveis {nome} {curso} {periodo} {telefone}.
--     Geridos pela equipa comercial; sem envio automático (apenas wa.me).
-- ----------------------------------------------------------------------------
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
-- FIM. A aplicação preenche configurações/cursos/emolumentos no primeiro arranque.
-- ============================================================================
