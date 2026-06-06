# Migração para Supabase — Guia de configuração

Este guia liga o **Turmas Midas 2026** a uma base de dados online (Supabase),
permitindo **vários utilizadores**, **vários computadores**, **auditoria** e
**backups automáticos**.

> Plano gratuito do Supabase é suficiente para começar.

---

## Passo 1 — Criar o projeto Supabase

1. Vá a **https://supabase.com** → **Start your project** → inicie sessão (GitHub/e-mail).
2. **New project**:
   - **Name:** `turmas-midas-2026`
   - **Database password:** defina uma forte e **guarde-a**
   - **Region:** escolha a mais próxima (ex.: *West Europe / London*)
3. Aguarde ~2 minutos até o projeto ficar pronto.

## Passo 2 — Criar as tabelas

1. No projeto: menu lateral → **SQL Editor** → **New query**.
2. Abra o ficheiro **`supabase/schema.sql`** deste repositório, copie **todo** o conteúdo.
3. Cole no editor e clique em **Run**.
4. Deve aparecer *Success. No rows returned*. (Cria tabelas, perfis, RLS e auditoria.)

## Passo 3 — Criar o primeiro utilizador (Administrador)

1. Menu lateral → **Authentication** → **Users** → **Add user** → **Create new user**.
   - **Email:** o seu e-mail (ex.: `admin@midas.ao`)
   - **Password:** defina uma
   - Marque **Auto Confirm User** (para entrar sem confirmar e-mail)
2. Torne-o **admin**: menu lateral → **SQL Editor** → cole e **Run**:
   ```sql
   update public.profiles set perfil = 'admin', nome = 'Administrador Geral'
   where id = (select id from auth.users where email = 'admin@midas.ao');
   ```
   (troque o e-mail pelo que usou)

Os próximos utilizadores criam-se em **Authentication → Users** e o perfil
ajusta-se na app (Configurações → Utilizadores) ou por SQL. Perfis disponíveis:
`admin`, `directora`, `secretaria`, `financeiro`, `coordenador`.

## Passo 4 — Obter as chaves de ligação

1. Menu lateral → **Project Settings** (engrenagem) → **API**.
2. Copie:
   - **Project URL** (ex.: `https://xxxxxxxx.supabase.co`)
   - **anon public** key (a chave longa em *Project API keys → anon public*)

> A chave **anon public** é segura para usar no navegador (é protegida pelas
> políticas RLS). **Nunca** use a chave `service_role` no site.

## Passo 5 — Ligar a aplicação

Envie-me (ou cole na app, quando o ecrã de ligação estiver disponível):

- **Project URL**
- **anon public key**

Com isto, finalizo a integração: o login passa a usar contas reais do Supabase,
e todos os dados (estudantes, pagamentos, recibos, cursos, emolumentos,
configurações) passam a ser guardados e partilhados na base online.

---

## O que esta migração ativa

| Funcionalidade | Estado após ligar |
|---|---|
| Vários utilizadores com **perfis e permissões** | ✔ (RLS no servidor) |
| **Mesma base** em vários computadores/telemóveis | ✔ |
| **Auditoria** (quem criou/editou/eliminou + data/hora) | ✔ (triggers) |
| **Backups automáticos** | ✔ (geridos pelo Supabase) |
| Numeração sequencial, recibos/fichas A4, relatórios | ✔ (mantêm-se) |

## Notas

- A versão atual (localStorage) continua a funcionar offline por dispositivo.
  A migração é opcional e não apaga o que já existe — pode **exportar** os dados
  atuais (Configurações → Dados → Exportar backup) antes de migrar.
- Segurança: as permissões são aplicadas no **servidor** (RLS), não apenas no ecrã.
