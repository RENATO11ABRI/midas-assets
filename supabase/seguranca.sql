-- ============================================================================
-- SEGURANÇA — Reforços de RLS / permissões (Vaga 1)
-- Grupo Midas Angola · Turmas Midas 2026
--
-- ✅ SEGURO: este script NÃO apaga nem altera dados. Só (re)define funções,
--    políticas e permissões. É idempotente — pode correr mais do que uma vez.
-- Execute em: Supabase → SQL Editor → New query → cole tudo → Run.
--
-- O que faz:
--   1) Passa a exigir conta ATIVA em toda a RLS (bloqueia signups/contas inativas).
--   2) Novos utilizadores do Auth nascem INATIVOS (defesa em profundidade).
--   3) Pagamentos: a secretaria só pode INSERIR (append-only); ALTERAR/ELIMINAR
--      fica reservado a admin/direção (prevenção de fraude de caixa).
--   4) Revoga o acesso anónimo às funções RPC (numeração de recibos, etc.).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Exigir conta ATIVA em toda a RLS
--    meu_perfil()/e_admin() passam a devolver o perfil só se ativo = true.
--    Como todas as políticas usam estas funções, uma conta inativa fica sem
--    acesso a tudo, sem precisar de tocar em cada política.
-- ----------------------------------------------------------------------------
create or replace function public.meu_perfil()
returns text language sql stable security definer set search_path = public as $$
  select perfil from public.perfis where id = auth.uid() and ativo
$$;

create or replace function public.e_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select perfil = 'admin' from public.perfis where id = auth.uid() and ativo), false)
$$;

-- ----------------------------------------------------------------------------
-- 2) Novos utilizadores nascem INATIVOS (um admin ativa-os depois)
--    Não afeta as contas já existentes (continuam ativas).
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, nome, perfil, ativo)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email), 'secretaria', false)
  on conflict (id) do nothing;
  return new;
end; $$;

-- ----------------------------------------------------------------------------
-- 3) Pagamentos append-only para a secretaria
--    INSERT: admin/direção/secretaria/financeiro (registar pagamentos).
--    UPDATE/DELETE: só admin/direção (a secretaria não altera nem apaga caixa).
--    SELECT mantém-se na política p_pag_read existente.
-- ----------------------------------------------------------------------------
drop policy if exists p_pag_write  on public.pagamentos;
drop policy if exists p_pag_insert on public.pagamentos;
drop policy if exists p_pag_update on public.pagamentos;
drop policy if exists p_pag_delete on public.pagamentos;

create policy p_pag_insert on public.pagamentos for insert
  with check (public.meu_perfil() in ('admin','directora','secretaria','financeiro'));

create policy p_pag_update on public.pagamentos for update
  using      (public.meu_perfil() in ('admin','directora'))
  with check (public.meu_perfil() in ('admin','directora'));

create policy p_pag_delete on public.pagamentos for delete
  using (public.meu_perfil() in ('admin','directora'));

-- ----------------------------------------------------------------------------
-- 4) Revogar acesso anónimo às funções RPC (security definer)
--    No PostgreSQL as funções têm EXECUTE para PUBLIC por omissão. Mantemos
--    apenas 'authenticated'.
-- ----------------------------------------------------------------------------
revoke execute on function public.proximo_contador(text) from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on function public.proximo_contador(text) from anon';
  end if;
end $$;

-- Funções de escala (só existem se já tiver corrido escala.sql) — revoga se existirem.
do $$
begin
  if to_regprocedure('public.midas_estudantes_pagina(text,text,text,text,int,int)') is not null then
    execute 'revoke execute on function public.midas_estudantes_pagina(text,text,text,text,int,int) from public';
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute 'revoke execute on function public.midas_estudantes_pagina(text,text,text,text,int,int) from anon';
    end if;
  end if;
  if to_regprocedure('public.midas_dashboard()') is not null then
    execute 'revoke execute on function public.midas_dashboard() from public';
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute 'revoke execute on function public.midas_dashboard() from anon';
    end if;
  end if;
end $$;

-- ============================================================================
-- FIM. Nada de dados foi alterado. Para confirmar:
--   select perfil, ativo from public.perfis;            -- contas e estados
--   select polname, cmd from pg_policies where tablename = 'pagamentos';
-- ============================================================================
