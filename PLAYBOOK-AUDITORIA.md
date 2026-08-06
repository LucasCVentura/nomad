# Playbook de auditoria — Segurança, Resiliência e Performance

Runbook para **um agente (Claude Code) executar** contra um projeto na
arquitetura **Next.js (App Router) + Supabase (Postgres/Auth/Storage) + Vercel**,
opcionalmente com gateway de pagamento (Asaas/Stripe) e SMTP próprio.

Foi destilado de uma auditoria real. Copie este arquivo para o repositório do
projeto novo e diga: *"execute o PLAYBOOK-AUDITORIA fase por fase"*. Ajuste os
nomes de tabela/coluna ao schema de lá — a estrutura e o método são o que
transfere, não os nomes.

---

## PRINCÍPIO CENTRAL (não pule)

**Ataque de verdade e prove antes/depois. Nunca conclua por leitura de código.**

- Toda "vulnerabilidade" vira um `curl`/`psql` que a demonstra funcionando,
  depois a correção, depois **o mesmo ataque de novo** mostrando que falha.
- Todo "isto escala mal" vira uma medição com dados sintéticos, não um palpite.
- Um `HTTP 204`/`200` pode ser RLS filtrando em silêncio (0 linhas afetadas),
  não permissão concedida. **Sempre confirme contra uma linha real** se o dado
  mudou de fato.
- Schema do Supabase é público por desenho (PostgREST entrega para quem tem a
  anon key, que está no bundle de todo visitante). A defesa é a RLS, nunca
  esconder nomes de tabela. **Teste com a anon key em mãos** — é a situação real.

---

## FASE 0 — Descoberta e setup

```bash
# Do .env.local do projeto:
URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | cut -d= -f2-)
ANON=$(grep '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' .env.local | cut -d= -f2-)
SVC=$(grep '^SUPABASE_SECRET_KEY=' .env.local | cut -d= -f2-)   # ou SUPABASE_SERVICE_ROLE_KEY
REF=$(echo "$URL" | sed -E 's#https://([^.]+).*#\1#')           # project ref

# Conexão direta ao Postgres (peça a senha do banco ao usuário se não tiver;
# avise que ela fica no histórico e deve ser rotacionada depois).
# A região do pooler não é óbvia — descubra por tentativa:
for r in sa-east-1 us-east-1 us-east-2 us-west-1 eu-west-1 eu-central-1 ap-southeast-1; do
  echo "=== $r ==="
  psql "postgresql://postgres.$REF:SENHA@aws-0-$r.pooler.supabase.com:5432/postgres?connect_timeout=6" -c "select 1" 2>&1 | grep -E "ok|1 row|FATAL|not found"
done
# A que responder "1 row" é a certa. Guarde como PGURI.
```

### Armadilhas de shell que vão te atrapalhar (todas reais)

- **zsh: nunca use `path` como variável** (`for path in ...`). Em zsh `path` é a
  mesma coisa que `$PATH` — o loop destrói o PATH e tudo vira "command not
  found". Use `rota`, `p`, `item`.
- **zsh: `UID` é read-only.** `UID=$(...)` com um valor não-numérico dá "bad math
  expression". Use `ACCT`, `uid_var`.
- **`SET LOCAL` só funciona dentro de transação.** Para simular sessão RLS via
  psql, envolva em `begin; ... rollback;` — senão roda como superusuário (sem
  RLS) e os números mentem.
- **`timeout` pode não existir no macOS.** Use `psql "...?connect_timeout=6"`.
- **PATH quebrado a meio da sessão** → `export PATH="/usr/bin:/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"`.
  Mas isso pode tirar o git credential helper: para `git push`, restaure o
  ambiente completo (`source ~/.zshrc`) ou rode o push num shell limpo.

---

## FASE 1 — Segurança / RLS

### 1.1 Mapear RLS e policies reais (do banco, não do schema.sql)

```bash
# RLS ativa em toda tabela?
psql "$PGURI" -c "select c.relname, c.relrowsecurity as rls,
  (select count(*) from pg_policies p where p.tablename=c.relname and p.schemaname='public') as policies
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind='r' order by c.relrowsecurity, c.relname;"

# Toda policy, com as expressões USING e WITH CHECK:
psql "$PGURI" -A -F ' | ' -c "select tablename, policyname, cmd, roles::text,
  coalesce(qual,'-'), coalesce(with_check,'-') from pg_policies
  where schemaname='public' order by tablename, cmd;"
```

Bandeiras vermelhas nas expressões:
- `using (auth.uid() is not null)` numa tabela com dado pessoal → **vaza a linha
  inteira** (ver 1.4).
- policy de INSERT/UPDATE só com `USING` e `with_check` vazio → escrita sem
  validação de conteúdo (ver 1.5).
- tabela com RLS ligada e **0 policies** → ninguém acessa (ou é intencional, ou
  é bug).

### 1.2 Views que furam a RLS — O FURO MAIS PROVÁVEL E MAIS GRAVE

Views com `security_invoker = false` (padrão!) rodam com o privilégio do dono e
**passam por cima da RLS da tabela base**. Se a view é "simples" (sem
join/agregação/distinct), o Postgres a torna **auto-atualizável**, e o
`grant select ... to anon` costuma ter arrastado grants de escrita junto. O
resultado: **INSERT/UPDATE/DELETE na view viram escrita na tabela base como
dono, ignorando todas as policies.**

```bash
# Achar as views, o dono, e se são atualizáveis:
psql "$PGURI" -A -F ' | ' -c "select table_name, is_updatable, is_insertable_into
  from information_schema.views where table_schema='public';"
psql "$PGURI" -A -F ' | ' -c "select table_name, grantee, privilege_type
  from information_schema.role_table_grants
  where table_schema='public' and grantee in ('anon','authenticated')
    and privilege_type in ('INSERT','UPDATE','DELETE') order by table_name;"

# PROVA DE ATAQUE — sem login nenhum, tentar escrever pela view:
curl -s -w '\nHTTP %{http_code}\n' -X POST "$URL/rest/v1/NOME_DA_VIEW" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"COL_UNICA":"__poc__","...":"..."}'
# 201 = FURO CRÍTICO. Apague o poc em seguida (DELETE via mesma view) e prossiga.
```

**Correção:**
```sql
revoke insert, update, delete, truncate, references
  on public.NOME_DA_VIEW from anon, authenticated;
-- Aplique em TODAS as views expostas, mesmo as que hoje têm join (não
-- atualizáveis) — alguém pode simplificá-las no futuro e reabrir o furo.
```

**Reprova:** repita o `curl` de ataque → deve virar **401**. E confirme que o
SELECT público ainda funciona (a vitrine não pode quebrar).

### 1.3 Varredura anônima (leitura e escrita) em cada tabela

```bash
# Leitura anon — deve vir 0 em tudo, exceto o que é público por desenho (views):
for t in tabela1 tabela2 view_publica ...; do
  n=$(curl -s "$URL/rest/v1/$t?select=*&limit=2" -H "apikey: $ANON" | python3 -c "import sys,json
try: d=json.load(sys.stdin); print(len(d) if isinstance(d,list) else 'erro')
except: print('?')")
  printf "%-24s linhas=%s\n" "$t" "$n"
done

# Escrita anon — INSERT deve dar 401/403 em toda tabela base:
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$URL/rest/v1/TABELA" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" -H "Content-Type: application/json" -d '{...}'
# UPDATE anon: cuidado com falso negativo. 204 pode ser "0 linhas casaram".
# Confirme contra uma LINHA REAL e cheque no banco se o valor mudou.
```

### 1.4 O vazamento de dados pessoais entre usuários

Crie uma conta descartável **confirmada** e veja o que uma sessão comum enxerga:

```bash
ACCT=$(curl -s -X POST "$URL/auth/v1/admin/users" -H "apikey: $SVC" -H "Authorization: Bearer $SVC" \
  -H "Content-Type: application/json" -d '{"email":"audit@ex.test","password":"Aud!2026#x","email_confirm":true}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
TOKEN=$(curl -s -X POST "$URL/auth/v1/token?grant_type=password" -H "apikey: $ANON" \
  -H "Content-Type: application/json" -d '{"email":"audit@ex.test","password":"Aud!2026#x"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

# Quantos perfis alheios ela lê? (deve ser só o dela)
curl -s "$URL/rest/v1/profiles?select=id,email,cpf" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN"

# Escalonamento: consegue virar admin / trocar perfil alheio / se auto-liberar acesso?
curl -s -o /dev/null -w '%{http_code}\n' -X PATCH "$URL/rest/v1/profiles?id=eq.$ACCT" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"is_admin":true}'
# depois confira no banco se is_admin virou true de fato.

# LIMPE no fim:
curl -s -X DELETE "$URL/auth/v1/admin/users/$ACCT" -H "apikey: $SVC" -H "Authorization: Bearer $SVC"
```

Causa clássica: `using (auth.uid() is not null)` — resquício de "mostrar o nome
do autor num fórum". **RLS é por linha, não por coluna**: pra expor só o nome,
essa policy entrega email/cpf junto. Correção: **remover a policy**; se precisar
expor colunas públicas, faça uma VIEW só com elas. Antes de remover, confirme no
código que ninguém depende dela (geralmente só a caixa de entrada do admin lê
perfil alheio, e ela já é coberta por `is_admin()`).

### 1.5 Checagens que faltam (aplique onde couber)

- **`WITH CHECK` em toda policy de INSERT/UPDATE**, não só `USING`. Ex.:
  anotação/comentário só em conteúdo que a pessoa tem acesso —
  `with check (auth.uid() = user_id and public.has_content_access(content_id))`.
  Mantenha o `USING` só na posse, pra ela ainda ler/apagar o que é dela.
- **Column grants** pra restringir UPDATE a colunas específicas (RLS não faz
  isso): `revoke update on tabela from authenticated; grant update (col1,col2) on tabela to authenticated;`
- **Funções `SECURITY DEFINER`**: todas com `set search_path = public` (ou
  vazio), E confirme que `anon`/`authenticated` **não podem criar** no schema
  public (`has_schema_privilege('anon','public','CREATE')` deve ser false) —
  senão `search_path=public` é explorável.

### 1.6 Storage

```bash
psql "$PGURI" -A -F ' | ' -c "select id, public from storage.buckets;"
psql "$PGURI" -A -F ' | ' -c "select policyname, cmd, coalesce(qual,'-'), coalesce(with_check,'-')
  from pg_policies where schemaname='storage' and tablename='objects' order by cmd;"
```

Regra: **todo bucket com produto pago = privado + URL assinada gerada no
servidor após checar a compra.** Um bucket público é adivinhável se a pasta é o
slug/id (que é público). Padrão da policy de leitura:

```sql
create policy "..." on storage.objects for select using (
  bucket_id = 'BUCKET' and (public.is_admin() or exists (
    select 1 from purchases p join contents c on c.id = p.content_id
    where p.user_id = auth.uid()
      and c.slug = split_part(storage.objects.name, '/', 1))));
```

No código: `upload...` guarda o **caminho**, não `getPublicUrl`; e uma função
`signUrls` chama `createSignedUrls` na hora de renderizar. **Atenção à
convenção de pasta**: se uma tela usa `slug` e outra usa `id`, a policy quebra —
padronize e/ou aceite as duas (`c.slug = ... or c.id::text = ...`).

Prova: com o caminho exato e sem login, `GET /storage/v1/object/public/...`,
`GET /object/...` e `POST /object/sign/...` devem todos dar **400**. E com RLS
real (transação psql simulando a sessão): comprador vê o arquivo, não-comprador
vê 0.

### 1.7 Rotas de API e chave de serviço

- `createAdminClient` (service role) só em rotas de servidor, módulo com
  `import "server-only"`. **Nunca** responde algo do navegador sem antes checar
  `getUser()`.
- Checkout: `getUser()` (valida no servidor) e **não** `getSession()`; preços
  lidos do banco, não do request; tudo escopado a `user.id`.
- Webhook de pagamento: exige token no header, idempotente. Teste:
  `curl -X POST .../api/webhooks/PROVIDER` sem token → 401.

### 1.8 O que vaza no navegador + headers

```bash
# Baixe os chunks e cace segredos (esperado: só a anon key, que é pública):
curl -s "$URL_DO_SITE/" -o /tmp/h.html
for f in $(grep -oE '/_next/static/chunks/[a-zA-Z0-9_.-]+\.js' /tmp/h.html | sort -u); do
  curl -s "$URL_DO_SITE$f"; done | grep -oiE "service_role|SUPABASE_SECRET|sk_live|aact_prod" | sort -u
# Falsos positivos comuns: 'sb_secret_' e 'resend' aparecem como literais dentro
# do SDK. Confirme o contexto antes de gritar.

# Headers (Vercel só manda HSTS sozinho):
curl -sI "$URL_DO_SITE/" | grep -iE "strict-transport|x-frame|x-content|referrer|permissions"
```

Correção dos headers em `next.config.ts`:
```ts
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];
const nextConfig = { async headers() { return [{ source: "/:path*", headers: securityHeaders }]; } };
```
(CSP fica de fora se a app usa estilo inline / worker de runtime tipo pdf.js —
exigiria nonce em toda a árvore. `X-Frame-Options` já cobre clickjacking.)

---

## FASE 2 — Resiliência (brute force, flood, abuso)

Boa parte é o Supabase que protege; o objetivo é **confirmar por teste** e
tapar o que sobra. Sempre limpe as contas de teste no fim
(`@ex.test`/`@flood.test`).

### 2.1 Brute force de login

```bash
# Rajada paralela — procura 429 (rate limit por IP do Supabase):
seq 1 50 | xargs -P 20 -I{} curl -s -o /dev/null -w '%{http_code}\n' \
  -X POST "$URL/auth/v1/token?grant_type=password" -H "apikey: $ANON" \
  -H "Content-Type: application/json" -d '{"email":"x@x.test","password":"errada"}' | sort | uniq -c
```
Esperado: parte vira **429**. Confirme que a conta **não trava** (lockout
permitiria travar a conta da vítima de propósito). Limite é por IP → só CAPTCHA
cobre IP rotativo (recomendação de painel, ver 2.6).

### 2.2 Flood de e-mail de reset

```bash
for i in $(seq 1 10); do curl -s -o /dev/null -w '%{http_code} ' \
  -X POST "$URL/auth/v1/recover" -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d '{"email":"real@dominio.com"}'; done; echo
```
Esperado: 1× `200`, resto `429` (~60s). Protege a cota do provedor de e-mail.

### 2.3 Cadastro em massa / confirmação de e-mail

```bash
# Signup retorna sessão na hora? (se sim, confirmação está DESLIGADA = ruim)
curl -s -X POST "$URL/auth/v1/signup" -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d '{"email":"c@flood.test","password":"Senha123456!"}' | python3 -c "import sys,json;d=json.load(sys.stdin);print('sessao imediata' if d.get('access_token') else 'exige confirmacao (bom)')"
# E: conta não confirmada NÃO deve logar (deve dar 'Email not confirmed').
```
Confirmação de e-mail ligada é o que impede conta-fantasma de fazer algo. O
risco que sobra (e-mails de confirmação disparados em massa) → CAPTCHA.

### 2.4 Flood de ESCRITA por usuário logado — o furo que É seu, não do Supabase

Escritas do cliente (chat, anotações, comentários) vão do navegador **direto ao
PostgREST**, sem passar pelo Next. A RLS diz *quem* escreve, não *quanto*.

```bash
# Com uma conta de teste logada e com acesso, floode uma tabela:
seq 1 200 | xargs -P 30 -I{} curl -s -o /dev/null -w '%{http_code}\n' \
  -X POST "$URL/rest/v1/TABELA_DE_ESCRITA" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" --data-binary @/tmp/corpo.json | sort | uniq -c
# Se ~todas dão 201, não há freio → inflação de banco (DoS de dados).
```

**Correção — trigger de rate limit no próprio banco** (único lugar possível,
já que não passa pelo Next):
```sql
create or replace function public.enforce_insert_rate_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare limite int := coalesce((tg_argv[0])::int,120); col text := tg_argv[1];
        u uuid := auth.uid(); qtd int;
begin
  if u is null then return new; end if;         -- service_role passa livre
  execute format('select count(*) from public.%I where %I=$1 and created_at > now() - interval ''1 minute''',
                 tg_table_name, col) into qtd using u;
  if qtd >= limite then
    raise exception 'Muitos registros em pouco tempo. Aguarde um instante.'
      using errcode='check_violation';
  end if;
  return new;
end $$;
-- índice pro count ser barato:
create index if not exists tabela_user_created_idx on public.TABELA (COL_DONO, created_at);
create trigger tabela_rate_limit before insert on public.TABELA
  for each row execute function public.enforce_insert_rate_limit('120','COL_DONO');
```
Limites generosos (humano nunca alcança, flood bate na hora). Reprova: flood de
250 deve gravar ~120 e recusar o resto. **Confirme que uso normal (10 espaçados)
passa 100%.**

### 2.5 Checkout / webhook

`POST /api/checkout` sem login → 401. `POST /api/webhooks/...` sem token → 401.
Confirmar reuso de pedido pendente idêntico (evita cobranças-lixo). Não teste
criar cobranças reais em massa em produção (destrutivo).

### 2.6 Recomendações de painel (não são código)

- **CAPTCHA** (hCaptcha/Turnstile) em Auth → Bot & Abuse Protection: única defesa
  contra brute force com IP rotativo e cadastro em massa. Precisa da chave do
  provedor; o front (`/entrar`, `/registro`, `/esqueci-senha`) passa o token.
- **Política de senha**: mínimo 8 + **Leaked password protection** (HaveIBeenPwned).
- **SMTP próprio** verificado (DKIM/SPF/DMARC) pra e-mail não cair em spam nem
  gastar a cota compartilhada.

---

## FASE 3 — Performance

Se a base é pequena, **nada está lento agora** — cace o que **escala mal**.
Onde o dado real não prova, popule sintético, meça, limpe.

### 3.1 Bloat (lixo de UPDATE/DELETE)

```bash
psql "$PGURI" -A -F ' | ' -c "select relname, n_live_tup, n_dead_tup,
  pg_size_pretty(pg_total_relation_size(relid)) as total, last_autovacuum
  from pg_stat_user_tables where schemaname='public'
  order by pg_total_relation_size(relid) desc limit 8;"
# Tabela pequena com tamanho grande + muitas dead tuples = bloat (TOAST de
# jsonb/base64 antigo é o suspeito). Correção:
psql "$PGURI" -c "vacuum (full, analyze) public.TABELA;"
```
Autovacuum só dispara acima de ~50 dead tuples — tabela pequena acumula bloat
sem limpeza. Tuning opcional por tabela:
`alter table T set (autovacuum_vacuum_threshold=10, autovacuum_vacuum_scale_factor=0);`

### 3.2 "Baixa tudo e agrega em JS" — o padrão que mais escala mal

Procure no código server-side: query sem filtro seguida de `.reduce`/`.filter`/
`.map` pra contar/somar/agrupar. Pior caso: roda em layout ou re-executa via
Realtime a cada evento.

```bash
grep -rn "\.from(" src --include="*.ts" --include="*.tsx" | grep -v "supabase/"
# Suspeitos: select sem .eq/.limit + reduce/filter depois; select('*'); await dentro de .map/for.
```

**Prove o ganho com dados sintéticos** (o tempo de query pode ser parecido — o
ganho está no PAYLOAD e na CPU do Next):
```bash
# insira N mil linhas via psql (bypassa o trigger de rate limit: auth.uid() é null)
psql "$PGURI" -c "insert into TABELA(...) select ... from generate_series(1,5000);"
# meça o payload que a abordagem atual traz:
psql "$PGURI" -t -A -c "select pg_size_pretty(sum(length(col)+60)) from TABELA;"
```
Referência real desta auditoria: 5.000 linhas = **355 kB e 5.000 objetos JS por
carregamento** vs **8 bytes** com agregação no banco.

**Correção — função SQL `security definer` que agrega e devolve só o resultado**,
com `is_admin()` embutido pra continuar admin-only via RPC:
```sql
create or replace function public.admin_unread_total()
returns integer language sql security definer set search_path = public stable as $$
  select count(*)::int from messages m join conversations c on c.id=m.conversation_id
  where public.is_admin() and m.sender_id=c.user_id and m.created_at > c.admin_last_read_at;
$$;
```
No código: `supabase.rpc("admin_unread_total")` no lugar do fetch+reduce.
Adicione a assinatura em `database.types.ts` (bloco `Functions`). **Verifique
que a RPC devolve o mesmo número da lógica antiga** e que aluna recebe 0.
**Limpe os dados sintéticos e dê VACUUM** nas tabelas que floodou.

### 3.3 Bundle e imagens (geralmente já OK, confirme)

```bash
npm run build
find .next/static/chunks -name "*.js" | while read f; do echo "$(($(gzip -c "$f"|wc -c)/1024)) $(basename $f)"; done | sort -rn | head
```
- Dependência pesada (pdfjs, editores, charts) deve ser `await import(...)`
  dinâmico e restrita às telas que usam — não no bundle compartilhado. Confirme
  que a landing não a carrega.
- Imagens via `next/image` (não `<img>` cru servido de `/public`) — otimiza
  tamanho + WebP. Confira `/_next/image?url=...` no HTML.

### 3.4 Queries lentas reais e TTFB

```bash
# pg_stat_statements (ative se preciso). As do topo costumam ser infra do
# Supabase (auth/storage) e o WAL polling do Realtime (inerente ao tempo real).
# O que importa: alguma query SUA aparece no topo?
psql "$PGURI" -A -F ' | ' -c "select round(total_exec_time::numeric,1), calls,
  left(regexp_replace(query,'\s+',' ','g'),80) from pg_stat_statements
  where query not ilike '%pg_%' order by total_exec_time desc limit 15;"

# TTFB de produção (lembre do zsh: NÃO use 'path' como var):
for rota in "/" "/loja" "/entrar"; do
  t=$(curl -s -o /dev/null -w '%{time_starttransfer}' "$SITE$rota")
  c=$(curl -sI "$SITE$rota" | grep -i x-vercel-cache | cut -d: -f2-)
  echo "$rota  TTFB ${t}s  cache:$c"
done
```
Landing dinâmica (checa sessão + busca dados) tem TTFB alto no cold start.
Deixar estática com ISR + mover a troca "Entrar/Painel" pro cliente derruba pra
~50ms — mas é decisão de arquitetura, apresente como trade-off, não aplique
escondido.

---

## FECHAMENTO

- Aplique correções de banco como **patch idempotente** em `supabase/patches/AAAA-MM-DD-*.sql`
  E replique no `schema.sql` canônico (comentando a causa e a data).
- **Reprove cada correção rodando o mesmo ataque/medição** — o commit só fecha
  o item quando o antes/depois está demonstrado.
- Limpe **toda** conta e linha de teste (`@ex.test`, prefixos `ZZ`/`__poc__`) e
  dê VACUUM no que floodou. Cheque `count(*)` das tabelas contra o baseline.
- Escreva um relatório por auditoria (`AUDITORIA-*.md`): severidade, o ataque que
  funcionou, a causa, a correção, e a reprova. Separe "corrigido" de
  "recomendação de painel" de "decisão de arquitetura".
- **Recomende ao usuário rotacionar** qualquer segredo que passou pelo chat
  (senha do banco, chave do gateway).

### Ordem de prioridade (se o tempo for curto)
1. Views com grant de escrita (crítico, silencioso, trivial de corrigir).
2. Policy `auth.uid() is not null` em tabela com dado pessoal (LGPD).
3. Bucket público com produto pago (antes do primeiro upload).
4. Trigger de rate limit nas escritas do cliente.
5. Agregações em SQL.
6. Bloat / VACUUM.
7. Headers, CAPTCHA, política de senha (painel).
