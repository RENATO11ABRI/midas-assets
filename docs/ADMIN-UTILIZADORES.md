# Gestão de utilizadores (painel do administrador)

Modelo: **uma conta de administrador com email real** (`stvsonhonatv@gmail.com`)
que cria e gere todos os outros acessos. A equipa entra com **nome de utilizador
+ senha** (sem email). Só o administrador cria, ativa/desativa e redefine senhas.

## ⚙️ Passo único: publicar a função do servidor

Criar utilizadores e redefinir senhas de outras pessoas exige a chave secreta
`service_role`, que **nunca** pode estar no navegador. Por isso essa parte corre
numa **Edge Function** segura no Supabase. Publique-a uma só vez:

1. Supabase → menu **Edge Functions** → **Create a function** (ou **Deploy a new function**).
2. Nome **exato**: `admin-users`.
3. Apague o conteúdo de exemplo e **cole todo** o ficheiro
   `supabase/functions/admin-users/index.ts` deste repositório.
4. **Deploy**.

> Não é preciso configurar segredos: o Supabase injeta automaticamente
> `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` na função.
>
> Se o Supabase tiver a opção **"Verify JWT"** na função, pode deixá-la ligada —
> a app envia o token do administrador na chamada.

## 👤 Como usar (na aplicação)

Entre como administrador → **Configurações → Utilizadores** (a aba só aparece ao admin).

- **Criar utilizador:** nome a mostrar, *nome de utilizador* (ex.: `maria`) ou
  email, senha (mín. 6 caracteres) e perfil. O acesso fica ativo de imediato.
- **Mudar perfil:** use a coluna *Perfil* (admin, directora, secretaria,
  financeiro, coordenador).
- **Ativar/Desativar:** bloqueia ou reativa o acesso sem apagar a conta.
- **Redefinir senha:** define uma nova senha para o utilizador.
- **Eliminar:** remove a conta definitivamente.

## 🔑 Entrar / recuperar senha

- **Login:** escreva o nome de utilizador (ou email) + senha.
  - Internamente, um nome de utilizador `maria` corresponde a `maria@midas.local`.
- **"Esqueci a senha"** (no ecrã de login): só funciona para a conta de
  **administrador** (tem email real) — envia um link de recuperação por email.
- **Equipa (contas por nome de utilizador):** a recuperação é feita pelo
  administrador em **Configurações → Utilizadores → Redefinir senha**.

## Perfis e permissões (recordatório)

| Perfil | Estudantes | Pagamentos | Cursos | Emolumentos | Config. | Utilizadores |
|---|---|---|---|---|---|---|
| admin | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| directora | ✔ | ✔ | ✔ | ✔ | ✔ | — |
| coordenador | ler | ler | ✔ | ler | ler | — |
| secretaria | ✔ | ✔ | ler | ler | ler | — |
| financeiro | ler | ✔ | ler | ler | ler | — |
