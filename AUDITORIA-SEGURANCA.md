# Auditoria de segurança — Manual NF

Feita em **06/08/2026**, contra o ambiente de **produção**. Método: assumir que
o atacante já conhece todo o schema e testar o que ele consegue *fazer* — não
auditoria de leitura de código, mas requisição real contra a API pública.

> **Sobre "o Supabase expõe os nomes das tabelas":** expõe mesmo, e isso não é
> falha. A chave `anon` está no JavaScript de todo visitante por desenho, e com
> ela qualquer um lista o schema via PostgREST. A defesa nunca foi esconder o
> schema — é a RLS. Por isso todo teste abaixo foi feito **com** a chave em
> mãos, que é a situação real.

## Resumo

| # | Severidade | Achado | Estado |
|---|---|---|---|
| 1 | 🔴 Crítico | Escrita em `contents` por qualquer visitante, via a view `store_contents` | Corrigido e reverificado |
| 2 | 🟠 Alto | Qualquer aluna logada lia e-mail + CPF de todas as outras | Corrigido e reverificado |
| 3 | 🟡 Baixo | Anotação gravável em conteúdo não comprado | Corrigido |
| 4 | 🟡 Baixo | Faltavam cabeçalhos de segurança (clickjacking etc.) | Corrigido |
| 5 | 🟠 Alto (latente) | `content-videos` era bucket público | Corrigido e reverificado |
| 6 | 🟡 Baixo | `NEXT_PUBLIC_SITE_URL` não definida em produção | Corrigido |

Correções de banco em `supabase/patches/2026-08-06-auditoria-seguranca.sql` e
`supabase/patches/2026-08-06-videos-privados.sql`, ambas já aplicadas em
produção e incorporadas ao `schema.sql`. **Nenhum item ficou em aberto.**

---

## 1. 🔴 Crítico — escrita em `contents` sem nenhum login

**O que dava para fazer.** Sem conta, sem login, só com a chave pública que
está no navegador de qualquer visitante:

```
POST /rest/v1/store_contents   → HTTP 201  (produto criado na loja)
PATCH .../store_contents?...   → HTTP 200  (preço e título alterados)
DELETE .../store_contents?...  → HTTP 204  (curso apagado)
```

Todos os três foram executados de verdade contra produção, com uma linha
descartável criada e removida na sequência.

**Impacto.** Apagar o catálogo inteiro; baixar o preço de um curso para
R$ 0,01 e comprá-lo legitimamente por um centavo (o checkout lê o preço do
banco — que é o comportamento certo, mas o banco é que estava editável);
publicar produto falso com texto de phishing na loja; despublicar tudo
mudando `status` para `draft`.

**Causa.** `store_contents` roda com `security_invoker = false`, de propósito:
é assim que a vitrine mostra título/preço sem expor o `body`, que é o produto.
O que ninguém previu é que a view é *simples* — e o Postgres torna views
simples **auto-atualizáveis**. Somado ao grant de escrita que acompanhou o
`grant select`, um INSERT na view virava INSERT em `contents` executado como o
**dono da view**, ignorando as policies "Only admin can insert/update/delete".

O detalhe cruel: as policies de `contents` estavam perfeitas, e a tabela base
resistiu a todos os ataques. A escrita entrava por uma porta lateral que as
policies nem chegavam a ver.

**Correção.** `revoke insert, update, delete, truncate, references` da view
para `anon` e `authenticated`. SELECT segue liberado. Estendido também para
`public_reviews` e `platform_stats` — hoje elas têm join/agregação e o Postgres
recusaria a escrita, mas depender disso é frágil: bastaria alguém simplificar
uma delas no futuro para o furo reabrir sozinho.

**Reverificado depois da correção:** os três ataques passaram a devolver
**HTTP 401**, e a vitrine continua listando os produtos normalmente.

## 2. 🟠 Alto — dados pessoais de todas as alunas expostos entre si

**O que dava para fazer.** Uma conta recém-criada, sem nenhuma compra, lia:

```
Aluna Teste | lucascv8525@gmail.com | cpf: 15091282718 | asaas: cus_000192002160
Dra. Nathalia | nathaliafialho18@gmail.com | ...
```

**Impacto.** Vazamento de dado pessoal entre clientes — e-mail, **CPF** e o
identificador de cliente no Asaas. É exposição de dado sensível sob a LGPD, e
qualquer pessoa que criasse uma conta grátis tinha acesso à base inteira.

**Causa.** Uma policy `using (auth.uid() is not null)` em `profiles`, que
liberava a **linha inteira** para qualquer sessão autenticada. Como as policies
são combinadas com OR, ela anulava na prática a policy correta que existia ao
lado ("owner or admin").

Ela era resquício de quando a "comunidade" era um fórum público e cada post
mostrava o nome do autor. O fórum virou chat privado 1:1 e a policy ficou
órfã — ninguém a removeu junto. **RLS é por linha, não por coluna:** para
mostrar "só o nome" ela entregava tudo.

**Correção.** Policy removida. Antes de remover, confirmei que nenhuma tela
depende dela: a única leitura de perfil de terceiro é a caixa de entrada do
admin (`getAdminInboxRows`), que já é coberta por `is_admin()`.

**Reverificado:** conta nova agora lê **1** perfil (o próprio). Simulando a
sessão da Dra. com RLS ativa no Postgres, ela continua vendo os 2 perfis, os
2 conteúdos e a compra — a área admin não quebrou.

## 3. 🟡 Baixo — anotação em conteúdo não comprado

A policy de `annotations` exigia só que a linha fosse da própria aluna, sem
checar se ela tem acesso ao conteúdo anotado. Não vazava material (ela não
passava a ler o conteúdo por causa disso), mas permitia gravar texto arbitrário
na base apontando para qualquer curso.

Corrigido movendo a checagem para o `WITH CHECK` (que governa INSERT/UPDATE) e
mantendo o `USING` só na posse — assim ela continua conseguindo ler e apagar as
próprias anotações mesmo que perca o acesso ao conteúdo depois.

## 4. 🟡 Baixo — cabeçalhos de segurança ausentes

Só HSTS vinha, por conta da Vercel. Adicionados em `next.config.ts` e
verificados num build de produção:

- `X-Frame-Options: DENY` — sem isso o site podia ser embutido num iframe
  invisível de terceiro para capturar cliques de uma aluna já logada
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin` — antes, um link a partir
  de `/app/ler/<slug>` entregava ao destino o que ela estava lendo
- `Permissions-Policy` negando câmera/microfone/localização/pagamento

Sem CSP: a app usa estilo inline do Tailwind e o pdf.js monta worker em
runtime, então uma CSP útil exigiria nonce em toda a árvore. A parte que
protege contra clickjacking (`frame-ancestors`) está coberta pelo
X-Frame-Options.

## 5. 🟠 Alto (latente) — vídeo de curso era público

Vídeo anexado a um curso é **produto pago**, mas o bucket estava marcado como
público, com uma policy `Public read of content videos` sem nenhuma checagem de
compra. O argumento registrado no schema era "a URL não circula fora do
conteúdo" — que não se sustenta: a pasta do arquivo é o **slug**, que é
público, então o endereço era adivinhável.

**Não houve vazamento: o bucket estava vazio.** Era risco latente, que viraria
vazamento real no primeiro vídeo anexado. Corrigido antes disso.

**Correção.** O bucket passou a privado e ganhou a mesma policy de
`content-pages` (comprou ou é admin). No código, `uploadVideoAttachments`
passou a guardar o **caminho** em vez de um link público, e a antiga
`signPageUrls` virou `signContentUrls`, assinando páginas e vídeos — cada um no
seu bucket, porque são separados.

Junto veio uma inconsistência que teria quebrado a policy: a tela de criação
usava o slug como pasta e a de **edição usava o id**. O código foi padronizado
no slug, e a policy aceita as duas formas para nenhum vídeo ficar ilegível por
um detalhe de rota.

**Reverificado com um vídeo real** subido só para o teste e removido depois.
Sem login: URL pública direta, download e geração de URL assinada devolveram
todos **HTTP 400**, e a listagem do bucket veio vazia. Com a RLS aplicada de
verdade no Postgres: quem comprou vê **1** arquivo, quem não comprou vê **0**,
a Dra. vê **1**.

## 6. 🟡 Baixo — `NEXT_PUBLIC_SITE_URL` não definida

O checkout monta a URL de retorno assim
(`src/app/api/checkout/route.ts:176`):

```ts
successUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin}/app/pedidos`
```

A variável não estava definida em produção, então sempre caía no fallback, que
deriva do host da requisição. Funcionava porque a Vercel entrega o host certo, e
o impacto era baixo (é só o redirecionamento pós-pagamento; quem libera o acesso
é o webhook). Mas é uma dependência silenciosa de algo que vem de fora.

**Correção.** `NEXT_PUBLIC_SITE_URL=https://www.manualnf.com.br` definida no
ambiente de produção da Vercel.

---

## O que foi testado e passou

Registro do que resistiu, para não parecer que só se olhou onde havia problema:

**Isolamento entre alunas** — conta nova, sem compras, não leu nenhum
conteúdo, pedido, compra, conversa, mensagem nem anotação de terceiros.

**Sem escalonamento de privilégio** — não conseguiu se tornar admin
(`is_admin` continuou `false`), não alterou o perfil da Dra., não se liberou
uma compra sem pagar (HTTP 403), não inseriu conteúdo pela tabela base.

**Acesso anônimo** — leitura bloqueada em todas as 8 tabelas; só passam as
views públicas por desenho. INSERT bloqueado em todas (HTTP 401). UPDATE contra
uma linha real não alterou nada (o preço do curso seguiu R$ 5,00 — o HTTP 204
que aparece é a RLS filtrando em silêncio, não permissão concedida).

**Storage** — o produto pago está bem protegido. Com o caminho exato do
arquivo em mãos e sem login: download da página do curso bloqueado, download do
PDF original bloqueado, e geração de URL assinada bloqueada. Listagem dos
buckets `content-pages` (130 arquivos) e `content-pdfs` (10) devolve vazio para
anônimo.

**Chave de serviço** — usada em exatamente 2 lugares (`api/checkout` e
`api/webhooks/asaas`), ambos no servidor, e o módulo tem guarda `server-only`.
Não vazou para o navegador.

**Bundle do navegador** — 17 chunks de produção varridos atrás de segredos.
Dois matches, ambos falso positivo: `sb_secret_` aparece só como literal dentro
da função do próprio SDK que detecta formato de chave, e `resend` é o método de
reenvio do Realtime, nada a ver com o provedor de e-mail. A chave
`sb_publishable_` está lá — e deve estar, é pública por definição.

**Checkout** — usa `getUser()` (valida a sessão com o servidor de auth, não
confia só no cookie), lê preços do banco e não do que o navegador mandou, e
escopa todas as consultas ao `user.id`. Sem IDOR.

**Funções `SECURITY DEFINER`** — as 4 têm `search_path` fixo, e confirmei que
`anon`/`authenticated` não podem criar objetos no schema `public`, que é o que
tornaria `search_path=public` explorável.

**RLS** — ativa nas 8 tabelas, nenhuma com RLS ligada e sem policy. Os grants
de coluna que restringem o UPDATE de `purchases` a
`completed_at, progress, rating, review, updated_seen_at` continuam de pé (era
a correção do item 2a de julho — não houve regressão).

---

## Recomendações que dependem de você

**Trocar a senha do banco.** Ela passou por conversa de chat mais de uma vez.
Nada indica vazamento, mas senha que trafegou fora de um cofre não deveria
seguir valendo: Supabase → Settings → Database → Reset database password.

**Rotacionar a chave de API do Asaas de produção**, pelo mesmo motivo, se em
algum momento ela foi copiada para fora do painel.

**Storage:** `content-images` segue público de propósito — guarda capa de
curso e imagens que aparecem na loja para quem ainda não comprou. Se um dia
uma imagem virar parte do material pago, ela precisa ir para `content-pages`,
não para lá.
