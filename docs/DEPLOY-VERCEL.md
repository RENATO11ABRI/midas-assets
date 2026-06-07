# Publicar na Vercel (repositório privado)

A aplicação é um site estático (HTML/CSS/JS) — **não há passo de build**. A Vercel
serve os ficheiros tal como estão e faz deploy automático a cada `push`.

## Passos (uma só vez, ~3 minutos)

1. Vá a **https://vercel.com** → **Sign up** / **Log in** com a conta **GitHub**
   (a mesma onde está o repositório `renato11abri/midas-assets`).
2. **Add New… → Project**.
3. Na lista de repositórios, escolha **`midas-assets`** → **Import**.
   - Se não aparecer, clique em **Adjust GitHub App Permissions** e dê acesso ao
     repositório (é privado).
4. Em **Configure Project**, deixe tudo no automático:
   - **Framework Preset:** `Other`
   - **Build Command:** (vazio)
   - **Output Directory:** (vazio / raiz)
   - **Root Directory:** `./`
5. Clique **Deploy**. Em ~1 minuto recebe um link tipo
   `https://midas-assets.vercel.app`.

## Depois do deploy

- Abra o link → ecrã de login → entre com o e-mail e a palavra-passe definidos
  no Supabase.
- Cada vez que fizer `push` para `main`, a Vercel republica automaticamente.
- Para um domínio próprio (ex.: `gestao.grupomidas.ao`): **Project → Settings →
  Domains → Add**.

## Notas

- A app usa *hash routing* (`#dashboard`, `#matricula`…), por isso **não são
  necessárias regras de reescrita** — todas as páginas são servidas pelo
  `index.html`.
- O `vercel.json` na raiz apenas ativa URLs limpos; não há configuração sensível.
- A ligação ao Supabase está em `js/config.js` (chave `anon`, pública e protegida
  por RLS) — funciona automaticamente assim que o site estiver no ar.
