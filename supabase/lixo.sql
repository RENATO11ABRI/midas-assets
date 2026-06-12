-- ============================================================================
-- RECICLAGEM (LIXO) — tabela própria
-- Grupo Midas Angola · Turmas Midas 2026
--
-- ✅ SEGURO: cria a tabela `public.lixo`, MIGRA os itens que hoje vivem dentro
--    de `configuracoes.dados->'lixo'` para a nova tabela e remove essa chave da
--    config. NÃO apaga registos — os itens da reciclagem são preservados.
--    Idempotente. Execute em: Supabase → SQL Editor → cole tudo → Run.
--
-- Porquê: hoje a reciclagem está dentro da linha única `configuracoes` (id=1),
-- que é last-write-wins — dois admins a apagar em simultâneo perdiam itens, e os
-- deletes de uma secretária ficavam só no dispositivo dela. Uma tabela própria,
-- com upsert por item, elimina essas perdas.
-- ============================================================================

create table if not exists public.lixo (
  id            text primary key,
  dados         jsonb not null,
  criado_por    uuid default auth.uid(),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.lixo enable row level security;

-- Leem todos os autenticados; inserem quem pode eliminar entidades; só
-- admin/direção podem restaurar/esvaziar (UPDATE/DELETE).
drop policy if exists p_lixo_read   on public.lixo;
drop policy if exists p_lixo_insert on public.lixo;
drop policy if exists p_lixo_modify on public.lixo;
drop policy if exists p_lixo_delete on public.lixo;
create policy p_lixo_read on public.lixo for select using (auth.uid() is not null);
create policy p_lixo_insert on public.lixo for insert
  with check (public.meu_perfil() in ('admin','directora','secretaria','financeiro','coordenador'));
create policy p_lixo_delete on public.lixo for delete
  using (public.meu_perfil() in ('admin','directora'));

-- Auditoria (quem apagou/restaurou e quando).
drop trigger if exists aud_lixo on public.lixo;
create trigger aud_lixo after insert or update or delete on public.lixo
  for each row execute function public.fn_auditoria();

-- ----------------------------------------------------------------------------
-- Migração: move os itens de lixo de dentro da configuração para a tabela.
-- ----------------------------------------------------------------------------
insert into public.lixo (id, dados)
select (item->>'id'), item
from public.configuracoes,
     jsonb_array_elements(coalesce(dados->'lixo', '[]'::jsonb)) as item
where public.configuracoes.id = 1
  and item->>'id' is not null
on conflict (id) do nothing;

-- Remove a chave 'lixo' da configuração (já não é a fonte de verdade).
update public.configuracoes set dados = dados - 'lixo' where id = 1;

-- ============================================================================
-- FIM. Confirmar:  select count(*) from public.lixo;
-- ============================================================================
