# Pendências técnicas — Manual NF

Revisão feita em **31/07/2026**, depois da entrega do leitor de PDF com grifo
e anotações persistentes.

> **Status (31/07/2026):** itens 1, 2a, 3 e 4 resolvidos — o conteúdo pago não
> é mais acessível sem compra (nem pela API nem pelo storage), a linha do curso
> caiu de 7,74 MB para 214 KB, e as avaliações das alunas agora têm tela.
> Continua aberta a metade 2b, que depende do pagamento, e os itens menores.

Cada item tem: o que é, como foi constatado, a causa e o caminho de correção.
Ordenado por urgência, não por esforço.

---

## 🔴 Crítico

### 1. O conteúdo pago é baixável por qualquer pessoa, sem conta

- [x] ~~**Corrigir antes de divulgar a plataforma**~~ — **resolvido em 31/07/2026**

> **Como foi fechado:** patch aplicado no banco
> (`supabase/patches/2026-07-31-acesso-ao-conteudo.sql`) + telas de loja
> passando a ler a view `store_contents`.
>
> Verificado depois da correção, repetindo o mesmo teste que expôs a falha:
> - visitante sem conta lendo `contents.body` → **0 linhas**;
> - aluna logada que não comprou → **0 conteúdos** (vitrine continua visível);
> - Dra. (admin) → continua lendo normalmente;
> - landing, `/loja`, `/app/loja`, leitor e admin → todos funcionando, sem
>   erro de runtime; slug inexistente ainda dá 404.

**Constatado:** consultando a API do Supabase sem nenhum login, usando apenas
a chave anônima (que fica no bundle do navegador de todo visitante), retorna:

```
"Do Zero à Pratica Clinica" (R$ 50)
  páginas baixadas: 18
  MB de imagem:     7.74
  texto integral:   10.932 caracteres
```

O curso inteiro — todas as páginas em imagem e o texto completo — sai sem
compra e sem cadastro.

**Causa:** RLS no Postgres é por *linha*, não por *coluna*. A policy
`"Published contents are public"` (`supabase/schema.sql`) libera a linha
inteira de `contents` para qualquer um, e o `body` — que é o produto — está
nessa linha. A policy existe por um motivo legítimo (a loja precisa de
título, preço, capa), mas leva o conteúdo junto.

**Correção:** separar vitrine de produto, usando o mesmo padrão de view que o
schema já aplica em `public_reviews` / `platform_stats`:

```sql
-- Vitrine: só os campos de marketing, sem body.
create view public.store_contents with (security_invoker = false) as
  select id, slug, title, category, format, pages, price, description,
         cover_image_url, created_at
  from public.contents
  where status = 'published';

grant select on public.store_contents to anon, authenticated;

-- contents passa a exigir compra (ou admin).
drop policy "Published contents are public" on public.contents;

create policy "Quem comprou (ou a admin) lê o conteúdo"
  on public.contents for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.purchases p
      where p.content_id = contents.id and p.user_id = auth.uid()
    )
  );
```

**Telas que passam a ler `store_contents`:** `src/app/page.tsx`,
`src/app/loja/page.tsx`, `src/app/app/(dashboard)/loja/page.tsx`.
O leitor (`src/app/app/ler/[slug]/page.tsx`) e o admin continuam em
`contents` — já são cobertos por compra ou `is_admin()`.

---

### 2. Qualquer usuário logado pode se dar acesso a qualquer curso

Este item tem duas metades. Uma foi resolvida; a outra depende do pagamento.

#### 2a. Trocar o curso comprado por outro via update

- [x] ~~Restringir as colunas que a aluna pode alterar~~ — **resolvido em 31/07/2026**

A policy `"Users can update own purchase progress"` valida apenas o
`user_id`, ou seja, escopa a *linha* mas não as *colunas* — dava para
reescrever o `content_id` e trocar o curso barato comprado pelo caro.

Fechado com *column grants* no mesmo patch do item 1. Estado atual conferido
no banco:

```
update permitido (authenticated): completed_at, progress, rating, review, updated_seen_at
update do anon:                   (nenhum)
```

#### 2b. Criar a própria compra pela API

- [ ] **Só pode ser fechado junto com a entrada do pagamento**
- ⏳ **Bloqueado:** aguardando a liberação da conta no Asaas (31/07/2026).

> ⚠️ **Enquanto isso, não publicar com o carrinho ativo.** O furo maior aqui
> não é a policy, é o próprio botão de finalizar compra: ele libera o curso
> sem cobrar nada, pela tela, sem precisar de API nenhuma. Enquanto o
> pagamento não entra, ou o app fica fora do ar, ou sobe com o checkout
> desligado — a loja como vitrine e a Dra. liberando pelo painel, que já
> existe (`src/components/admin/student-access-list.tsx`).

**Causa:** a policy de insert em `purchases` é
`with check (auth.uid() = user_id or public.is_admin())` — o próprio usuário
cria a própria compra.

**Por que não dá para fechar agora:** o checkout
(`src/components/cart-drawer.tsx`) insere a compra direto do navegador, sem
cobrança. Remover a permissão hoje deixaria ninguém "comprando" nada.

**Por que não pode ser esquecido:** se essa regra continuar como está quando
o pagamento entrar, o gateway vira decoração — dá para criar a compra pela
API sem passar pelo checkout.

**Correção (junto com o pagamento):** a policy de insert para o usuário comum
sai, e só o webhook do gateway (com *service role*) passa a inserir em
`purchases`.

---

## 🟠 Antes de escalar

### 3. 7,74 MB numa única linha do banco (imagens em base64)

- [x] ~~Mover páginas para o storage~~ — **resolvido em 31/07/2026**

> **A causa real era outra, e melhor:** o fluxo de *criar* conteúdo sempre
> subiu as páginas para o storage. Quem não subia era o *salvar* da tela de
> editar — então toda reconversão gravava o curso inteiro em base64 de volta
> na linha. (As 4 reconversões feitas durante o conserto do grifo, em
> 31/07, foram o que inflou a linha até 7,74 MB.)
>
> **O que mudou:**
> - a subida virou `uploadContentImages` em `src/lib/content-media.ts`, usada
>   pelos **dois** fluxos — era código duplicado só no de criar;
> - as páginas saíram de `content-images` (público) para o bucket
>   **`content-pages`, privado**, com URL assinada gerada por requisição
>   (`signPageUrls`). O slug é público, então no bucket público bastava montar
>   `/content-images/<slug>/page-0.jpg` para baixar o curso — **havia 18
>   páginas expostas assim, já removidas**;
> - o conteúdo publicado foi migrado (18 imagens) e a linha caiu de
>   **7,74 MB para 214 KB**.
>
> **Verificado:** URL pública adivinhada → 400; visitante tentando assinar →
> negado; admin assina e baixa → 200. Leitor abre em ~2 s com 18/18 imagens,
> grifo funcionando por cima; miniaturas da tela de editar 18/18; capa e
> vitrine intactas. Reconverter + salvar de novo mantém a linha em 214 KB.

**Constatado:** medindo a linha do conteúdo publicado — 7,74 MB de JSON, dos
quais **97% são imagem em base64**. O texto e a geometria do grifo somam
213 KB.

**Causa:** `src/lib/pdf-convert.ts` gera cada página com
`canvas.toDataURL("image/jpeg", 0.85)` e grava a data URL dentro do
`contents.body`. As páginas nunca vão para o storage (capa e vídeos vão).

**Impactos observados:**
- a tela de editar conteúdo leva ~28 s para abrir localmente;
- toda visita ao leitor transfere 7,74 MB pelo servidor, sem CDN e sem cache;
- nada renderiza antes de tudo chegar (não há carregamento sob demanda);
- base64 é ~33% maior que o binário equivalente;
- um PDF de 100 páginas daria ~43 MB numa linha só.

**Correção:** subir as páginas para o storage e guardar só as URLs — o JSON
cai para ~200 KB e as imagens passam a carregar sob demanda.

> ⚠️ **Tem que ser bucket privado com URL assinada.** Um bucket público
> recriaria o vazamento do item 1 por outro caminho. Hoje `content-images` é
> público (correto para capas, que são material de vitrine — errado para as
> páginas do curso).

Fica em aberto, como melhoria menor: adicionar `loading="lazy"` nas imagens
de página — hoje nenhuma das 9 tags `<img>` do projeto tem, então as 18
páginas são buscadas de uma vez.

---

### 4. As avaliações das alunas não aparecem em lugar nenhum

- [x] ~~Criar a tela no admin~~ — **resolvido em 31/07/2026**

> Nova tela em `/admin/avaliacoes` (`src/app/admin/avaliacoes/page.tsx`), com
> entrada na sidebar do desktop ("Avaliações") e na barra inferior do celular
> ("Notas", 5ª aba). Mostra a nota média geral com a contagem, uma quebra por
> conteúdo — que só aparece com dois ou mais cursos avaliados, senão repetiria
> a média geral — e a lista de comentários com aluna, curso e data.
>
> Já havia uma avaliação guardada e invisível no banco desde 30/07 (5
> estrelas, "Muito bom!"), que agora aparece.
>
> **Verificado:** nota, comentário e nome da aluna na tela; título do topo
> correto; no celular as 5 abas cabem sem estouro horizontal (390px); estado
> vazio conferido zerando a avaliação temporariamente e restaurando em
> seguida.

**Situação:** ao concluir um curso, a aluna avalia de 1 a 5 estrelas e pode
escrever um comentário. Isso é salvo em `purchases.rating` / `purchases.review`
— e não é exibido em nenhum lugar. Os depoimentos da landing (única tela que
lia esses dados) foram removidos, e o painel admin nunca teve nada.

**Por que importa:** o resumo entregue à Dra. descreve a avaliação como "uma
forma simples de você acompanhar o que está agradando mais". Hoje essa
promessa não se cumpre.

**Correção:** uma seção no admin com nota média por conteúdo e a lista de
comentários. As views `public_reviews` / `platform_stats` continuam no banco
e voltam a ser úteis quando os depoimentos voltarem à landing.

---

### 5. Reconverter ou editar um conteúdo quebra os grifos das alunas

- [ ] Decidir estratégia (avisar × re-ancorar)

**Causa:** as anotações são ancoradas por `paragraph_id` + posição de
caractere (`start_offset` / `end_offset`). Se a Dra. reconverter o PDF ou
editar o texto, o agrupamento de parágrafos e as posições mudam, e as
marcações passam a apontar para o trecho errado — em silêncio.

**Por que virou risco agora:** até esta semana os grifos se perdiam no reload
de qualquer jeito. Agora que são persistidos, existe dado real para quebrar.

**Correção:** a anotação já guarda o texto marcado (`annotations.text`), então
dá para re-ancorar procurando esse texto no conteúdo novo e descartar só o
que não casar. O mínimo, e barato: incluir o aviso no `confirm()` de
"Reconverter PDF original", que hoje fala apenas das edições manuais da Dra.
e não menciona as anotações das alunas.

---

## 🟡 Menores

### 6. No celular não dá para apagar uma anotação

- [ ] Trocar o hover por visibilidade permanente no touch

O botão "Remover" em `src/components/reader/annotations-panel.tsx` usa
`opacity-0 ... group-hover:opacity-100`. Em telas de toque não existe hover,
então ele fica invisível (embora continue clicável). O mesmo padrão aparece
em `src/app/page.tsx:350`, onde é inofensivo — é só um "Ver na loja"
decorativo sobre um card que inteiro já é link.

### 7. Não existe recuperação de senha

- [ ] Implementar "esqueci minha senha"

Não há nenhuma tela nem chamada de `resetPasswordForEmail` no projeto. Se uma
aluna esquecer a senha, não há saída pela interface. Já estava listado como
pendência no resumo entregue à Dra.

### 8. Nenhum limite de tamanho ou de páginas no PDF

- [ ] Validar antes de converter

`src/lib/pdf-convert.ts` só rejeita arquivo vazio (`file.size === 0`). Um PDF
muito grande vai travar a conversão no navegador ou estourar no insert,
provavelmente sem mensagem clara. Vale um teto de páginas/MB com aviso
explícito — e ele fica bem mais folgado depois do item 3.

### 9. O grifo é salvo sem verificar se deu certo

- [ ] Tratar falha de gravação

Em `src/components/reader/reader-view.tsx`, `persistAnnotation` e
`deleteAnnotation` disparam a escrita sem aguardar nem tratar erro
(intencional, para não travar a leitura). Se a rede cair, a aluna vê a
marcação na tela e ela some no acesso seguinte, sem aviso. Vale ao menos
reverter o estado local e avisar quando a gravação falhar.

---

## Notas

- O middleware (`middleware.ts` + `src/lib/supabase/middleware.ts`) está
  correto: usa `getUser()` (verificado no servidor) e só roda em `/app` e
  `/admin`.
- As policies de `annotations`, `conversations` e `conversation_messages`
  estão bem escritas e escopadas.
- Não há `console.log` esquecido no código de produção.
- O conteúdo publicado foi reconvertido em 31/07/2026 com o conversor
  corrigido (larguras vindas do `item.width` do pdf.js). Qualquer material
  convertido antes disso precisa de "Reconverter PDF original" para o grifo
  pegar o fim das linhas.
