# Backend Supabase — Turmas Midas 2026

A aplicação está ligada a uma base de dados online (Supabase): **vários
utilizadores**, **vários computadores**, **auditoria** e **backups automáticos**.

Projeto: `escola-gestao` · `https://cfwntrkztoeiugbtcesh.supabase.co`

---

## Estado da ligação

| Item | Estado |
|---|---|
| URL + chave anon no código (`js/config.js`) | ✔ configurado |
| Cliente Supabase carregado no `index.html` | ✔ |
| Camada de dados online (`js/supabase-data.js`) | ✔ |
| Login por **e-mail + palavra-passe** (Supabase Auth) | ✔ |

> Para voltar ao modo **local** (localStorage), basta esvaziar `supabaseUrl`
> ou `supabaseAnonKey` em `js/config.js`.

## Passo único em falta — correr o SQL alinhado à app

O esquema foi **reescrito** para corresponder ao modelo da aplicação
(`estudantes`, `pagamentos`, `cursos`, `emolumentos`, `configuracoes`, `perfis`).
Isto **apaga as tabelas de scaffolding vazias** (alunos, matriculas, recibos,
anos_letivos, documentos) e recria no modelo correto.

1. Supabase → **SQL Editor** → **New query**.
2. Cole **todo** o conteúdo de `supabase/schema.sql` → **Run**.
3. O script repromove automaticamente `stvsonhonatv@gmail.com` a **admin**.

No **primeiro arranque** da app, as configurações, cursos e emolumentos são
semeados automaticamente na base.

## Entrar na aplicação

- **E-mail:** `stvsonhonatv@gmail.com`
- **Palavra-passe:** `Admin2026!` (altere em **Configurações → Conta**)

## Adicionar utilizadores

1. Supabase → **Authentication → Users → Add user** (marque *Auto Confirm User*).
2. Defina o perfil (menu **SQL Editor**):
   ```sql
   update public.perfis set perfil = 'secretaria', nome = 'Nome da Pessoa'
   where id = (select id from auth.users where email = 'pessoa@exemplo.com');
   ```
   Perfis: `admin`, `directora`, `secretaria`, `financeiro`, `coordenador`.

### Permissões por perfil (aplicadas no servidor via RLS)

| Perfil | Estudantes | Pagamentos | Cursos | Emolumentos | Configurações |
|---|---|---|---|---|---|
| admin | ✔ | ✔ | ✔ | ✔ | ✔ |
| directora | ✔ | ✔ | ✔ | ✔ | ✔ |
| coordenador | ler | ler | ✔ | ler | ler |
| secretaria | ✔ | ✔ | ler | ler | ler |
| financeiro | ler | ✔ | ler | ler | ler |

Todos os perfis autenticados **leem** tudo; a coluna indica quem pode **gravar**.

## Como funciona (arquitetura)

- Ao iniciar sessão, a app **carrega** tudo do Supabase para uma cache em
  memória; os ecrãs continuam a ler dessa cache (rápido).
- Cada gravação/eliminação **atualiza a cache e espelha no Supabase**
  (write-through). Outros dispositivos veem as alterações ao recarregar.
- Cada entidade é guardada como **JSONB** (preserva exatamente o objeto da app),
  com **matrícula** e **recibo** garantidos como **únicos** na base.
- **Auditoria** automática (triggers) regista quem criou/editou/eliminou e quando.

## Segurança

- A **anon public key** é própria para o navegador — o acesso é protegido pela
  **RLS**. **Nunca** coloque a chave `service_role` no código.
- A palavra-passe inicial do admin (`Admin2026!`) deve ser alterada no 1.º acesso.
