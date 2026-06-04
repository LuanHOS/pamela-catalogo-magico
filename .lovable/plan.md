## Lista de alterações que farei

### 1. Tema visual — branco, cinza e roxo claro (pastel)
- Atualizar tokens em `src/styles.css`: fundo branco/cinza claro, primary em roxo pastel, accent em lavanda. Manter contraste para UI/UX.

### 2. Botão "Limpar" no carrinho
- Adicionar botão no `CartDrawer` que chama `cart.clear()` com confirmação.

### 3. Botões de visualização (Grade/Lista) corrigidos
- Hoje os dois modos são variações em grid (compacto/confortável). Vou trocar para **Grade** (2+ colunas) e **Lista** (1 coluna, layout horizontal com imagem à esquerda).

### 4. Pop-up de detalhes do produto
- Modal ao clicar no card mostrando imagem grande, nome, descrição completa, preço (com promocional se houver), botão de adicionar/ajustar quantidade no carrinho.

### 5. Preço promocional
- Adicionar coluna `sale_price` (numeric, nullable) em `products` via migration.
- Form do admin com campo "Preço promocional (opcional)".
- Card e modal: quando houver `sale_price`, mostrar preço normal riscado e o promocional em destaque.
- Etiqueta "PROMOÇÃO" no canto do card.

### 6. "Sem estoque" mais visível na área do admin
- Card do produto no admin recebe overlay/borda destacada e selo grande quando `in_stock = false`.

### 7. Bucket de imagens corrigido
- Criar bucket público `product-images` para upload funcionar.
- Políticas RLS: leitura pública; upload/delete somente para admins.

### 8. Painel "Administradores" completo
- Listar todos os administradores (via novo server function que usa `supabaseAdmin` para buscar usuários auth + roles).
- Permitir **criar**, **editar usuário/senha** e **excluir** administradores.
- Proteção: o usuário `admin` é fixo e nunca pode ser excluído; sempre garantir pelo menos 1 admin.
- Atualizar a senha do usuário `admin` para `adminpamelafortes` (migration/seed via server-side reset). O login `admin/admin` deixará de funcionar — passará a ser `admin/adminpamelafortes`.

### 9. Configuração do número de WhatsApp pelo admin
- Criar tabela `app_settings` (key/value) com a chave `whatsapp_number`.
- Seed inicial com `5545984311918`.
- Aba/seção nova no painel admin: "Configurações" com campo para alterar o número.
- `WhatsAppFloat` e `finalizar()` passam a ler o número dessa tabela (com fallback para o atual).

### 10. Mostrar apenas o nome do usuário (sem `@banquinha.local`)
- No header do dashboard, exibir só a parte antes do `@` ("Logado como **admin**").

### 11. Comunicação sempre em PT-BR
- Memorizar essa preferência em `mem://~user`.

---

## Detalhes técnicos (resumo)

- **Migrations**: adicionar coluna `products.sale_price numeric NULL`; criar tabela `app_settings`; criar bucket `product-images` + políticas; reset de senha do `admin` será feito via server function (não via SQL).
- **Server functions** novas em `src/lib/admin.functions.ts`:
  - `listAdmins()` — lista user_id + email + username (via `supabaseAdmin.auth.admin.listUsers`).
  - `updateAdmin({userId, user?, password?})` — atualiza email/senha; bloqueia editar username do `admin` fixo.
  - `deleteAdmin({userId})` — bloqueia excluir o `admin` fixo; valida que ao menos 1 admin permanece.
- **Login**: a senha do `admin` mudará. Removerei o mapeamento `admin/admin → admin123`. Você passará a entrar com `admin / adminpamelafortes`.
- **Cards/Lista/Modal/Promoção**: alterações concentradas em `src/routes/index.tsx`.
- **Tema**: ajuste somente em `src/styles.css` (tokens semânticos), sem trocar classes nos componentes.

---

## Pontos que preciso confirmar antes de começar

1. **Senha do admin**: confirma trocar para `adminpamelafortes` agora? (login atual `admin/admin` deixa de funcionar).
2. **Modo Lista**: ok ser 1 coluna com imagem à esquerda + infos à direita + botão de adicionar?
3. **Etiqueta de promoção**: cor sólida no canto superior esquerdo do card escrito "PROMOÇÃO" serve, ou prefere outro texto (ex: "OFERTA", "-X%")?