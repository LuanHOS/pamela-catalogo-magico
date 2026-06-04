## Situação atual

Boa notícia: o backend **já está configurado como você quer**.

- A tabela `products` tem política RLS `Products are public` (SELECT liberado para `anon` e `authenticated`).
- A tabela `categories` tem política RLS `Categories are public` (SELECT liberado para `anon` e `authenticated`).
- Não existem múltiplos bancos por administrador — o Lovable Cloud usa **um único banco compartilhado**, então qualquer admin já vê/edita os mesmos produtos e categorias. O CRUD já é global e único.
- A página inicial (`src/routes/index.tsx`) faz a consulta sem exigir login.

Ou seja, produtos e categorias **já deveriam aparecer** para qualquer visitante (não logado). Se na prática não estão aparecendo, o problema é em outro lugar — provavelmente **imagens** (bucket privado) ou algum erro silencioso na consulta.

## O que vou fazer

### 1. Tornar o bucket `product-images` público
Hoje o bucket é privado e o admin usa URLs assinadas com validade de 10 anos. Isso funciona, mas:
- Imagens enviadas no passado podem ter URLs quebradas
- Toda nova imagem depende de gerar URL assinada (mais frágil)

Vou tornar o bucket público e adicionar política de SELECT pública. URLs ficam simples e permanentes (`getPublicUrl`). O upload de imagens vai usar a URL pública direta em vez de URL assinada.

### 2. Ajustar `uploadImage` no admin
Trocar `createSignedUrl` por `getPublicUrl` no `src/routes/admin.tsx`.

### 3. Verificar/garantir a página inicial pública
Confirmar que `src/routes/index.tsx` mostra os produtos mesmo sem login (já está configurado assim, mas vou validar o fluxo de carregamento e tratar erro caso a consulta falhe — hoje um erro é silencioso e a tela fica vazia).

### 4. Confirmação visual
Após implementar, abrir a tela inicial em modo anônimo (preview) e verificar se os produtos aparecem com imagens.

## O que NÃO precisa de mudança

- Não há nada a fazer no banco para "tornar CRUD global" — ele já é. Todos os admins enxergam e editam o mesmo catálogo.
- Não preciso alterar políticas RLS de products/categories — já estão públicas para leitura e restritas a admins para escrita.

## Detalhes técnicos

- Migração de storage: `UPDATE storage.buckets SET public = true WHERE id = 'product-images'` + política `CREATE POLICY "Public read product-images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'product-images')`.
- Upload no admin passa a usar `supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl`.
- Tratamento de erro na home: exibir mensagem se `error` retornar das consultas (em vez de simplesmente ficar vazio).

Posso seguir?