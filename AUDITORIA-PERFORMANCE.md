# Auditoria de performance — Manual NF

Feita em **06/08/2026**, contra **produção**. Terceira auditoria, depois de RLS
(`AUDITORIA-SEGURANCA.md`) e resiliência (`AUDITORIA-RESILIENCIA.md`). Mesmo
método: medir, não supor.

Uma ressalva honesta antes de tudo: a base de produção é **minúscula** hoje
(2 conteúdos, 2 usuários, 0 mensagens). Isso significa que nenhuma tela está
lenta *agora* — o objetivo aqui foi achar o que **escala mal**, o que fica
lento quando houver centenas de alunas e milhares de mensagens. Onde o dado
real não bastava para provar um ponto, populei dados sintéticos, medi, e
limpei.

## Resumo

| # | Severidade | Achado | Estado |
|---|---|---|---|
| 1 | 🟠 Alto | 8,3 MB de lixo (bloat) na tabela `contents` | Corrigido |
| 2 | 🟠 Alto (latente) | 3 telas do admin "baixam tudo e agregam em JS" | Corrigido |
| 3 | 🔵 Observação | Landing com TTFB ~2,5 s no cold start | Registrado |
| 4 | 🔵 Observação | Autovacuum não dispara em `contents` | Registrado |
| — | ✅ Passou | Bundle, imagens, code-splitting, índices | — |

Correções de banco em `supabase/patches/2026-08-06-agregacoes-performance.sql`,
aplicadas em produção e no `schema.sql`. Código em `src/lib/conversations.ts` e
`src/app/admin/page.tsx`.

---

## 1. 🟠 8,3 MB de lixo na tabela `contents` — corrigido

A tabela tinha **8,5 MB para 2 linhas vivas**. A causa: 39 tuplas mortas no
TOAST (onde o `body` grande é guardado), sobras dos vários "reconverter PDF"
do início do projeto, quando cada reconversão gravava megabytes de base64 antes
de a correção mover as imagens para o storage.

O `body` de hoje está saudável (70 kB, todas as páginas apontando para o
storage, zero base64) — o peso era 100% lixo histórico que o autovacuum nunca
recolheu (ver item 4).

**Correção.** `VACUUM FULL contents`: **8,5 MB → 144 KB**. Instantâneo, porque
só há 2 linhas vivas. Fiz o mesmo em `purchases` e nas tabelas que receberam
dados de teste durante a auditoria.

Isso importava porque o bloat entra em todo backup, replicação e conta para o
teto de tamanho do plano Supabase.

## 2. 🟠 Três telas do admin baixavam tabelas inteiras — corrigido

O padrão, em `getAdminUnreadTotal`, `getAdminInboxRows` e no cálculo de receita
do dashboard: **baixar todas as linhas de uma tabela para o servidor Next e
somar/contar em JavaScript**. Escala com o histórico inteiro da plataforma, não
com o que aparece na tela.

O pior dos três é o **total de não-lidas**: roda no layout do admin *e*
re-executa a cada mensagem nova via Realtime. Ou seja, numa clínica com chat
ativo, cada mensagem que qualquer aluna manda faz a Dra. (se estiver no painel)
rebaixar o histórico inteiro de mensagens.

**Medição honesta** (com 5.000 mensagens sintéticas): o tempo de query no
Postgres é parecido nas duas formas (~0,8 ms — ambas varrem as linhas). A
diferença não está ali, está no que **trafega e é processado**:

| | Baixar tudo (antes) | Agregar no SQL (depois) |
|---|---|---|
| Trafega do banco pro Next | **~355 kB** | **8 bytes** (um número) |
| Objetos montados em JS | 5.000 | 0 |
| Escala com | histórico inteiro | O(1) no total / O(conversas) no inbox |

Com 5.000 mensagens são 355 kB por carregamento. Com o histórico de meses de
uma clínica ativa, vira megabytes transferidos e desserializados a cada evento
de chat.

**Correção.** Três funções no Postgres (`admin_unread_total`,
`admin_inbox_rows`, `admin_total_revenue`) que fazem a conta com índice e
devolvem só o resultado. São `security definer` com `is_admin()` embutido —
quem não é admin recebe zero/vazio mesmo chamando via RPC (verificado). O
código passou a chamar essas RPCs em vez de montar tudo em JS.

**Verificado:** as funções devolvem os mesmos números da lógica antiga (testado
com os 5.000 registros), e a checagem de admin segura — sessão de aluna recebe
0 no total e 0 linhas no inbox.

## 3. 🔵 Landing com TTFB ~2,5 s no cold start — registrado

Medições de produção (melhor de 3):

| Rota | TTFB | Cache | Observação |
|---|---|---|---|
| `/` (landing) | ~2,5 s (cold) | MISS | dinâmica: checa sessão + lista catálogo |
| `/loja` | ~0,25 s | MISS | dinâmica, mas leve |
| `/entrar` | ~0,7 s | HIT | estática (prerender) |

A landing é renderizada no servidor a cada request porque lê a sessão (para
trocar "Entrar" pelo botão do painel) e busca o catálogo em destaque. O ~2,5 s
é o cold start da função serverless somado às queries; requests seguintes são
mais rápidos.

Não corrigi porque a solução tem trade-off que merece decisão, não um ajuste
silencioso: dá para tornar a landing estática com revalidação (ISR) e mover a
troca "Entrar/Painel" para o cliente, o que derrubaria o TTFB para ~50 ms — mas
muda como a página é montada. Fica registrado para decidir se o tempo de
carregamento da landing virar prioridade.

## 4. 🔵 Autovacuum não dispara em `contents` — registrado

O autovacuum do Postgres só age acima de ~50 tuplas mortas
(`threshold 50 + 0.2 × linhas`). Numa tabela de poucas linhas como `contents`,
esse gatilho quase nunca é atingido, então o bloat de reconversões se acumula
sem limpeza automática (foi como o item 1 chegou a 8,5 MB).

Hoje cada reconversão deixa uma tupla morta de ~70 kB (não mais os megabytes de
base64 de antes), então o crescimento é lento. Se incomodar no futuro, dá para
deixar o autovacuum mais sensível só nessa tabela:

```sql
alter table public.contents set (autovacuum_vacuum_threshold = 10,
                                 autovacuum_vacuum_scale_factor = 0);
```

Deixei sem aplicar por ser mais um ajuste de tuning do que uma correção — o
VACUUM do item 1 já zerou o passado.

---

## O que foi medido e passou

**Bundle do navegador.** O maior chunk é 122 kB gzipped — saudável. O
`pdfjs-dist` (a dependência mais pesada, ~1 MB) está corretamente **code-split**:
é carregado com `await import("pdfjs-dist")` só quando uma conversão de PDF
roda, e só o admin o importa. A landing e a área da aluna não pagam por ele.

**Imagens.** A foto da Dra. passa pelo `next/image`: **96 kB → 36 kB** (e WebP
para navegadores modernos), servida sob demanda no tamanho pedido.

**Índices.** As tabelas têm os índices que suas queries usam; as varreduras
sequenciais que aparecem nas estatísticas são todas em tabelas de 0–4 linhas,
onde o planner escolhe seq scan por ser mais rápido que índice — muda sozinho
quando houver volume.

**Queries do app no banco.** Nenhuma query das minhas telas aparece entre as
mais custosas do `pg_stat_statements`. As do topo são todas de infraestrutura
do Supabase (auth, storage) e o polling de WAL do Realtime — este último domina
96 % do tempo acumulado, mas é inerente ao chat em tempo real (é o que faz a
mensagem aparecer sem recarregar), não algo acionável no código.

**Sem N+1.** Nenhuma query dentro de loop, nenhum `select("*")` trazendo coluna
demais, e as buscas por página já usam `Promise.all` para rodar em paralelo em
vez de em cascata.

---

## Recomendações que dependem de decisão

- **Landing estática (ISR)** se o TTFB dela virar prioridade — item 3. É a
  única mudança de performance com trade-off de arquitetura; as demais já foram
  aplicadas.
- **Nada urgente além disso.** Com o volume atual a plataforma é rápida; as
  correções aplicadas são o que a mantém rápida quando crescer.
