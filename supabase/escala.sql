-- ============================================================================
-- ESCALA — Índices e RPC para carregamento paginado / agregação no servidor
-- Grupo Midas Angola · Turmas Midas 2026
--
-- Correr APENAS quando ativar o modo de escala (MIDAS_CONFIG.escala = true).
-- Seguro de repetir (idempotente). As funções respeitam a RLS (security invoker):
-- só utilizadores autenticados conseguem ler, tal como nas políticas existentes.
-- ============================================================================

-- 1) Índices para pesquisa/filtros sobre JSONB ------------------------------
create extension if not exists pg_trgm;
create index if not exists idx_est_nome_trgm on public.estudantes using gin ((dados->>'nome') gin_trgm_ops);
create index if not exists idx_est_estado    on public.estudantes ((dados->>'estado'));
create index if not exists idx_est_curso     on public.estudantes ((dados->>'curso'));
create index if not exists idx_pag_data      on public.pagamentos ((dados->>'data'));

-- 2) Listagem paginada de estudantes (pesquisa + filtros + ordenação) -------
create or replace function public.midas_estudantes_pagina(
  p_busca   text default '',
  p_curso   text default '',
  p_estado  text default '',
  p_ordenar text default 'recente',
  p_limite  int  default 50,
  p_offset  int  default 0
) returns table(dados jsonb, total bigint)
language sql stable as $$
  with filtrados as (
    select e.dados, e.criado_em
    from public.estudantes e
    where (p_busca = '' or (
            (e.dados->>'nome')          ilike '%'||p_busca||'%' or
            coalesce(e.dados->>'contacto','')  ilike '%'||p_busca||'%' or
            coalesce(e.dados->>'matricula','') ilike '%'||p_busca||'%' or
            coalesce(e.dados->>'bi','')        ilike '%'||p_busca||'%'))
      and (p_curso  = '' or e.dados->>'curso'  = p_curso)
      and (p_estado = '' or e.dados->>'estado' = p_estado)
  )
  select dados, count(*) over() as total
  from filtrados
  order by
    case when p_ordenar = 'nome'  then dados->>'nome' end asc nulls last,
    case when p_ordenar <> 'nome' then dados->>'dataMatricula' end desc nulls last,
    criado_em desc
  limit greatest(p_limite, 1) offset greatest(p_offset, 0);
$$;
grant execute on function public.midas_estudantes_pagina(text,text,text,text,int,int) to authenticated;

-- 3) Agregados do Dashboard (calculados no servidor) ------------------------
create or replace function public.midas_dashboard()
returns jsonb language sql stable as $$
  select jsonb_build_object(
    'totalEstudantes', (select count(*) from public.estudantes),
    'ativos',          (select count(*) from public.estudantes where dados->>'estado' = 'ativo'),
    'totalRecebido',   (select coalesce(sum(nullif(dados->>'valorPago','')::numeric),0) from public.pagamentos),
    'porMes', (select coalesce(jsonb_object_agg(m, v), '{}'::jsonb) from (
        select left(dados->>'data',7) m, sum(nullif(dados->>'valorPago','')::numeric) v
        from public.pagamentos where dados->>'data' is not null
        group by 1 order by 1 desc limit 12) t),
    'porCurso', (select coalesce(jsonb_object_agg(c, v), '{}'::jsonb) from (
        select coalesce(dados->>'curso','—') c, sum(nullif(dados->>'valorPago','')::numeric) v
        from public.pagamentos group by 1) t),
    'porForma', (select coalesce(jsonb_object_agg(f, v), '{}'::jsonb) from (
        select coalesce(dados->>'formaPagamento','—') f, sum(nullif(dados->>'valorPago','')::numeric) v
        from public.pagamentos group by 1) t)
  );
$$;
grant execute on function public.midas_dashboard() to authenticated;

-- ============================================================================
-- FIM. A versão paginada das restantes listas (pagamentos) será adicionada
-- numa fase seguinte, seguindo o mesmo padrão.
-- ============================================================================
