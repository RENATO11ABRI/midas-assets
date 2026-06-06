-- ============================================================================
-- Grupo Midas Angola — Turmas Midas 2026
-- Esquema da base de dados (Supabase / PostgreSQL)
-- Execute este script no Supabase: Dashboard → SQL Editor → New query → Run
-- ============================================================================

-- Extensões úteis
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------
-- PERFIS DE UTILIZADOR (ligados ao Supabase Auth)
-- ------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null default '',
  perfil      text not null default 'secretaria'
              check (perfil in ('admin','directora','secretaria','financeiro','coordenador')),
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);

-- Função auxiliar: perfil do utilizador autenticado
create or replace function public.meu_perfil()
returns text language sql stable security definer set search_path = public as $$
  select perfil from public.profiles where id = auth.uid()
$$;

create or replace function public.e_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select perfil = 'admin' from public.profiles where id = auth.uid()), false)
$$;

-- Cria automaticamente um profile quando um utilizador é criado no Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome, perfil)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email), 'secretaria')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------
-- CONFIGURAÇÕES (linha única)
-- ------------------------------------------------------------------
create table if not exists public.settings (
  id          int primary key default 1 check (id = 1),
  dados       jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);
insert into public.settings (id, dados) values (1, '{}'::jsonb) on conflict (id) do nothing;

-- ------------------------------------------------------------------
-- CURSOS
-- ------------------------------------------------------------------
create table if not exists public.cursos (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  tipo          text default '',
  duracao       text default '',
  periodo       text default '',
  regime        text default '',
  valor_inscricao   numeric default 0,
  valor_matricula   numeric default 0,
  valor_mensalidade numeric default 0,
  valor_estagio     numeric default 0,
  valor_defesa      numeric default 0,
  valor_certificado numeric default 0,
  valor_total       numeric default 0,
  unidade       text default '',
  estado        text default 'ativo',
  criado_em     timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- EMOLUMENTOS
-- ------------------------------------------------------------------
create table if not exists public.emolumentos (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  categoria   text default 'Outros',
  valor       numeric default 0,
  curso       text default '',
  tipo_curso  text default '',
  unidade     text default '',
  estado      text default 'ativo',
  observacoes text default '',
  criado_em   timestamptz not null default now(),
  unique (nome, curso, unidade)
);

-- ------------------------------------------------------------------
-- ESTUDANTES
-- ------------------------------------------------------------------
create table if not exists public.estudantes (
  id              uuid primary key default gen_random_uuid(),
  matricula       text unique not null,
  nome            text not null,
  bi              text default '',
  data_nascimento date,
  contacto        text default '',
  whatsapp        text default '',
  morada          text default '',
  encarregado     text default '',
  encarregado_contacto text default '',
  curso           text default '',
  unidade         text default '',
  periodo         text default '',
  tipo_curso      text default '',
  duracao         text default '',
  regime          text default '',
  data_matricula  date,
  valor_inscricao numeric default 0,
  valor_matricula numeric default 0,
  valor_pago      numeric default 0,
  forma_pagamento text default '',
  funcionario     text default '',
  estado          text default 'ativo',
  observacoes     text default '',
  criado_por      uuid references auth.users(id),
  criado_em       timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- PAGAMENTOS / RECIBOS
-- ------------------------------------------------------------------
create table if not exists public.pagamentos (
  id             uuid primary key default gen_random_uuid(),
  recibo         text unique not null,
  estudante_id   uuid references public.estudantes(id) on delete set null,
  estudante_nome text default '',
  matricula      text default '',
  contacto       text default '',
  curso          text default '',
  periodo        text default '',
  unidade        text default '',
  emolumento     text default '',
  categoria      text default '',
  mes_referencia text default '',
  valor_pago     numeric default 0,
  forma_pagamento text default '',
  funcionario    text default '',
  referencia     text default '',
  observacoes    text default '',
  data           timestamptz not null default now(),
  criado_por     uuid references auth.users(id),
  criado_em      timestamptz not null default now()
);
create index if not exists idx_pag_estudante on public.pagamentos(estudante_id);
create index if not exists idx_pag_data on public.pagamentos(data);

-- ------------------------------------------------------------------
-- AUDITORIA (quem criou/editou/eliminou)
-- ------------------------------------------------------------------
create table if not exists public.auditoria (
  id         bigint generated always as identity primary key,
  tabela     text not null,
  registo_id text,
  accao      text not null,           -- INSERT | UPDATE | DELETE
  utilizador uuid,
  utilizador_nome text,
  quando     timestamptz not null default now(),
  dados      jsonb
);

create or replace function public.fn_auditoria()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_nome text;
  v_id text;
begin
  select nome into v_nome from public.profiles where id = auth.uid();
  v_id := coalesce((case when tg_op = 'DELETE' then old.id else new.id end)::text, '');
  insert into public.auditoria(tabela, registo_id, accao, utilizador, utilizador_nome, dados)
  values (tg_table_name, v_id, tg_op, auth.uid(), v_nome,
          to_jsonb(case when tg_op = 'DELETE' then old else new end));
  return case when tg_op = 'DELETE' then old else new end;
end; $$;

drop trigger if exists aud_estudantes on public.estudantes;
create trigger aud_estudantes after insert or update or delete on public.estudantes
  for each row execute function public.fn_auditoria();
drop trigger if exists aud_pagamentos on public.pagamentos;
create trigger aud_pagamentos after insert or update or delete on public.pagamentos
  for each row execute function public.fn_auditoria();
drop trigger if exists aud_cursos on public.cursos;
create trigger aud_cursos after insert or update or delete on public.cursos
  for each row execute function public.fn_auditoria();
drop trigger if exists aud_emolumentos on public.emolumentos;
create trigger aud_emolumentos after insert or update or delete on public.emolumentos
  for each row execute function public.fn_auditoria();

-- ------------------------------------------------------------------
-- RLS (Row Level Security) + POLÍTICAS POR PERFIL
-- ------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.settings    enable row level security;
alter table public.cursos      enable row level security;
alter table public.emolumentos enable row level security;
alter table public.estudantes  enable row level security;
alter table public.pagamentos  enable row level security;
alter table public.auditoria   enable row level security;

-- PROFILES: cada um vê o seu; admin vê/edita todos
drop policy if exists p_profiles_self on public.profiles;
create policy p_profiles_self on public.profiles for select using (id = auth.uid() or public.e_admin());
drop policy if exists p_profiles_admin on public.profiles;
create policy p_profiles_admin on public.profiles for all using (public.e_admin()) with check (public.e_admin());

-- Tabelas de referência (cursos, emolumentos, settings): todos os autenticados leem; admin/directora escrevem
drop policy if exists p_ref_read_cursos on public.cursos;
create policy p_ref_read_cursos on public.cursos for select using (auth.role() = 'authenticated');
drop policy if exists p_ref_write_cursos on public.cursos;
create policy p_ref_write_cursos on public.cursos for all
  using (public.meu_perfil() in ('admin','directora','coordenador'))
  with check (public.meu_perfil() in ('admin','directora','coordenador'));

drop policy if exists p_ref_read_emol on public.emolumentos;
create policy p_ref_read_emol on public.emolumentos for select using (auth.role() = 'authenticated');
drop policy if exists p_ref_write_emol on public.emolumentos;
create policy p_ref_write_emol on public.emolumentos for all
  using (public.meu_perfil() in ('admin','directora'))
  with check (public.meu_perfil() in ('admin','directora'));

drop policy if exists p_settings_read on public.settings;
create policy p_settings_read on public.settings for select using (auth.role() = 'authenticated');
drop policy if exists p_settings_write on public.settings;
create policy p_settings_write on public.settings for all
  using (public.meu_perfil() in ('admin','directora'))
  with check (public.meu_perfil() in ('admin','directora'));

-- ESTUDANTES: todos leem; secretaria/admin/directora criam e editam
drop policy if exists p_est_read on public.estudantes;
create policy p_est_read on public.estudantes for select using (auth.role() = 'authenticated');
drop policy if exists p_est_write on public.estudantes;
create policy p_est_write on public.estudantes for all
  using (public.meu_perfil() in ('admin','directora','secretaria'))
  with check (public.meu_perfil() in ('admin','directora','secretaria'));

-- PAGAMENTOS: todos leem; secretaria/financeiro/admin/directora criam
drop policy if exists p_pag_read on public.pagamentos;
create policy p_pag_read on public.pagamentos for select using (auth.role() = 'authenticated');
drop policy if exists p_pag_write on public.pagamentos;
create policy p_pag_write on public.pagamentos for all
  using (public.meu_perfil() in ('admin','directora','secretaria','financeiro'))
  with check (public.meu_perfil() in ('admin','directora','secretaria','financeiro'));

-- AUDITORIA: só leitura (admin/directora); escrita feita pelos triggers (security definer)
drop policy if exists p_aud_read on public.auditoria;
create policy p_aud_read on public.auditoria for select using (public.meu_perfil() in ('admin','directora'));

-- ============================================================================
-- FIM. Próximo passo: criar o primeiro utilizador ADMIN (ver docs/SUPABASE.md)
-- ============================================================================
