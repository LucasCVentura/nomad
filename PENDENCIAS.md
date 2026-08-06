# Pendências técnicas — Manual NF

Revisão feita em **31/07/2026**, depois da entrega do leitor de PDF com grifo
e anotações persistentes.

> **Status (06/08/2026):** todos os itens críticos e menores resolvidos —
> 1, 2a, 3, 4, 5, 6, 7, 8 e 9. O pagamento está em **produção**, verificado
> com uma cobrança real por Pix. Domínio próprio (`www.manualnf.com.br`) no
> ar, com SMTP próprio (Resend) e recuperação de senha funcionando ponta a
> ponta. Não há pendências abertas neste arquivo no momento.

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

- [x] ~~**Só pode ser fechado junto com a entrada do pagamento**~~ — **resolvido em 31/07/2026**

> Fechado junto com a integração do Asaas
> (`supabase/patches/2026-07-31-pagamento-obrigatorio.sql`). A aluna não
> insere mais em `purchases`: quem libera é o webhook, com a service role, e
> a Dra. liberando na mão pelo painel (`is_admin`).
>
> **Verificado em produção, depois da mudança:**
> - aluna tentando se dar acesso pela API → bloqueado pela RLS;
> - Dra. liberando pelo painel → continua funcionando;
> - compra completa (carrinho → Asaas → pagamento → webhook) → acesso
>   liberado em ~3 s, sem ninguém tocar no webhook manualmente.

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

- [x] ~~Decidir estratégia (avisar × re-ancorar)~~ — **resolvido em 31/07/2026**

> Re-ancoragem, feita a cada carregamento do leitor
> (`reanchorAnnotation` em `src/lib/annotation-utils.ts`): se os offsets não
> caem mais sobre o trecho guardado, o trecho é procurado de novo — primeiro
> no parágrafo de origem, depois no conteúdo inteiro. O que realmente sumiu
> (passagem reescrita ou removida) deixa de ser desenhado, em vez de aparecer
> no lugar errado. Nada é apagado do banco, e a correção não depende de
> escrita: é recalculada na leitura.
>
> O aviso da reconversão também foi reescrito — ele falava só das edições da
> Dra. e não mencionava as marcações das alunas.
>
> **Verificado:** corrompi de propósito o `paragraph_id` e os offsets de uma
> anotação real no banco; ela voltou a renderizar no lugar certo. (Duas outras
> anotações no banco são da "Aluna Teste" — a Dra. só vê as dela, como
> esperado.) Offsets restaurados depois do teste.

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

- [x] ~~Trocar o hover por visibilidade permanente no touch~~ — **resolvido em 31/07/2026**

> Visível por padrão, com o hover mantido só a partir de `sm` (e agora também
> revelado por foco de teclado). **Verificado:** opacidade 1 no iPhone 13.

O botão "Remover" em `src/components/reader/annotations-panel.tsx` usa
`opacity-0 ... group-hover:opacity-100`. Em telas de toque não existe hover,
então ele fica invisível (embora continue clicável). O mesmo padrão aparece
em `src/app/page.tsx:350`, onde é inofensivo — é só um "Ver na loja"
decorativo sobre um card que inteiro já é link.

### 7. Não existe recuperação de senha

- [x] ~~Implementar "esqueci minha senha"~~ — **resolvido em 06/08/2026**

> **Verificado:** pedido de reset em produção, e-mail chegou de
> `contato@manualnf.com.br` com o template em português, link levou pra
> `/redefinir-senha` e a senha nova funcionou pra logar.

Não havia nenhuma tela nem chamada de `resetPasswordForEmail` no projeto —
se uma aluna esquecesse a senha, não tinha saída pela interface.

**Como foi fechado:** três telas novas — `/entrar` ganhou o link "Esqueceu
a senha?"; `/esqueci-senha` pede o e-mail (mostra sempre a mesma confirmação,
já que a própria API do Supabase não revela se o e-mail existe);
`/redefinir-senha` é onde o link do e-mail cai, escutando o evento
`PASSWORD_RECOVERY` do client em vez de tentar interpretar a URL na mão —
link expirado/usado cai numa tela própria em vez de travar num spinner.

**Configuração feita fora do código, no painel do Supabase:**
- Authentication → URL Configuration → Site URL e Redirect URLs, apontando
  pro domínio novo (sem isso o link do e-mail cai na home, não na tela certa)
- SMTP próprio via Resend, com `manualnf.com.br` verificado (DKIM/SPF/DMARC),
  pra não sair mais pelo remetente genérico do Supabase
- Template do e-mail em português — `supabase/email-templates/redefinir-senha.html`
  colado em Authentication → Emails → Reset Password

**Uma pegadinha real no caminho:** depois de salvar o SMTP e o template, o
e-mail continuou chegando no padrão em inglês por vários minutos, mesmo com
tudo confirmado salvo (sobreviveu a reload). Não era cache normal nem rate
limit (esperamos passar dos 60s do limite por usuário, e não tinha nenhum
Auth Hook de "Send Email" configurado desviando o envio). Só voltou a
funcionar depois de **Project Settings → General → Restart project** —
o serviço de Auth não estava pegando a configuração nova sozinho.

### 8. Nenhum limite de tamanho ou de páginas no PDF

- [x] ~~Validar antes de converter~~ — **resolvido em 31/07/2026**

> Dois tetos em `src/lib/pdf-convert.ts`, ambos checados **antes** de renderizar
> qualquer página, para falhar na hora em vez de depois de minutos de trabalho:
> **150 páginas** e **50 MB**.
>
> Os números vieram de medição, não de chute. Na conversão do curso publicado:
> ~420 KB por página de texto (uma digitalizada dá várias vezes isso) e ~0,14 s
> por página. O gargalo não é tempo — é **memória**: a conversão roda no
> navegador e segura todas as páginas em base64 até publicar, então o teto é o
> aparelho mais fraco que pode fazer isso (a Dra. pelo celular). 150 páginas
> ≈ 60 MB de imagem na memória de uma vez.
>
> Os buckets também ganharam teto próprio
> (`supabase/patches/2026-07-31-limites-de-arquivo.sql`), para a falha ser igual
> dos dois lados em vez de depender do limite global do projeto.
>
> **Verificado:** com um PDF de 200 páginas e outro de 55 MB, ambos barram em
> menos de 0,2 s com mensagem explicando o limite e o que fazer; o PDF real de
> 18 páginas continua convertendo normalmente.

`src/lib/pdf-convert.ts` só rejeita arquivo vazio (`file.size === 0`). Um PDF
muito grande vai travar a conversão no navegador ou estourar no insert,
provavelmente sem mensagem clara. Vale um teto de páginas/MB com aviso
explícito — e ele fica bem mais folgado depois do item 3.

### 9. O grifo é salvo sem verificar se deu certo

- [x] ~~Tratar falha de gravação~~ — **resolvido em 31/07/2026**

> A atualização otimista continua (marcar não espera a rede), mas agora um
> erro na escrita desfaz a marcação e avisa numa faixa temporária, em vez de
> deixar na tela algo que já se perdeu. Vale para criar e para remover.
>
> **Verificado:** derrubando só as requisições de `annotations`, a marcação
> aparece e é revertida, com o aviso na tela.

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


---

## Virar o pagamento para produção

- [x] ~~Sandbox → produção~~ — **resolvido em 05/08/2026**

> **Verificado:** cobrança real por Pix, confirmada na conta da Asaas,
> webhook liberou o conteúdo automaticamente — sem intervenção manual.

Os três passos originais (chave de produção, `ASAAS_ENV=production`, webhook
no painel de produção apontando para `https://www.manualnf.com.br/api/webhooks/asaas`)
foram feitos sem mexer em código. Mas dois bugs reais apareceram no caminho,
ambos específicos de ambiente de produção — vale saber que existem, caso
outro ambiente seja criado no futuro (staging, por exemplo):

**1. Login quebrado — variáveis `NEXT_PUBLIC_*` marcadas como "Sensitive" na
Vercel.** Esse modo restringe a variável a leitura em *runtime*; variáveis
`NEXT_PUBLIC_*` precisam existir no *build*, para irem embutidas no
JavaScript do navegador. Com o modo ativado, elas saíam vazias do build, e o
login tentava chamar `/auth/v1/token` no próprio domínio do site em vez do
Supabase — dando 404, que a tela mostrava como "e-mail ou senha incorretos"
(o catch de erro em `src/app/entrar/page.tsx` não distingue a causa).
Corrigido recriando `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
como não-sensíveis (`vercel env add ... --no-sensitive`) — são valores
públicos por definição, não há motivo para marcá-las como sensíveis. Vale
conferir isso em qualquer variável `NEXT_PUBLIC_*` nova.

**2. Pix não aparecia no checkout, e "Customer inválido" ao pagar.** Duas
causas empilhadas, ambas por reaproveitar estado do sandbox:
- `profiles.asaas_customer_id` guardava o ID de cliente criado no sandbox,
  que não existe na conta de produção (contas diferentes = clientes
  diferentes). O checkout reusava esse ID em vez de criar um novo
  (`src/app/api/checkout/route.ts:130`). Corrigido limpando o campo na conta
  de teste — o checkout recria o cliente sozinho quando o campo está vazio.
- O checkout também **reaproveita pedidos `pending` com os mesmos itens**
  (`route.ts:114`, a proteção contra cobrança duplicada) — então, mesmo
  depois de cadastrar a chave Pix na Asaas, o checkout continuava devolvendo
  uma cobrança *já criada* antes da chave existir, sem Pix. Corrigido
  cancelando os pedidos pendentes travados; qualquer pedido "pending" antigo
  numa conta pode mascarar uma mudança de configuração da mesma forma.

**Se um dia alguém pagar e o acesso não sair**, o primeiro lugar a olhar é a
fila do webhook no painel do Asaas: depois de 15 falhas seguidas ela pausa
sozinha e fica esperando reativação manual. Os eventos não se perdem, são
reenviados em ordem quando a fila volta.
