# Auditoria de resiliência — Manual NF

Feita em **06/08/2026**, contra **produção**. Continuação da auditoria de RLS
(`AUDITORIA-SEGURANCA.md`), agora sobre abuso de volume: força bruta, flood,
cadastro em massa. Método igual — atacar de verdade e medir, não supor.

Resumo antes do detalhe: **a plataforma está, no geral, bem protegida** — o
Supabase cobre login, reset e cadastro com rate limit próprio. Havia **um**
buraco de responsabilidade da aplicação (escrita sem limite), corrigido e
reverificado. O resto são recomendações de configuração de painel.

## Resumo

| Vetor | Estado | Quem protege |
|---|---|---|
| Força bruta de login | ✅ Protegido | Rate limit por IP do Supabase |
| Flood de e-mail de reset | ✅ Protegido | Supabase (1 a cada ~60s por conta) |
| Cadastro em massa | 🟡 Parcial | Confirmação de e-mail + rate limit frouxo |
| **Flood de escrita (chat/anotações)** | ✅ **Corrigido** | **Trigger novo no Postgres** |
| Checkout / webhook sem auth | ✅ Protegido | Já exigiam login / token |
| Política de senha | 🟡 Fraca (mín. 6) | Config do Supabase |

Correção de banco em `supabase/patches/2026-08-06-rate-limit-escrita.sql`, já
aplicada e no `schema.sql`.

---

## O que foi testado

### 1. Força bruta de login — ✅ protegido

15 tentativas sequenciais contra conta inexistente e 30 contra uma conta real
descartável passaram todas como "Invalid login credentials" sem travar a conta
(sem lockout — importante, senão um atacante tranca a conta da vítima de
propósito). Mas em **rajada paralela de 50, 36 levaram HTTP 429**: o Supabase
tem rate limit por IP, e o burst é barrado.

**Limitação inerente:** o limite é por IP. Um atacante com IPs rotativos
(botnet, proxies) dilui. A defesa contra isso é CAPTCHA — ver recomendações.

### 2. Flood de e-mail de reset de senha — ✅ bem protegido

10 pedidos seguidos de "esqueci a senha" para o mesmo e-mail: **1 passou, os
outros 9 barrados** com "you can only request this after ~58 seconds". Protege
a cota do Resend e evita usar o domínio para spam.

### 3. Cadastro em massa — 🟡 parcial

Signup não trava no burst (17 de 20 em paralelo criaram conta). **Mas a
confirmação de e-mail está ativada**: uma conta recém-criada não loga
("Email not confirmed"), então conta-fantasma não faz nada — não lê, não
escreve, não compra. Também apareceu um `email rate limit exceeded` global do
Supabase durante os testes, ou seja, existe um teto de e-mails.

O risco que sobra é de **abuso de e-mail**: cada signup dispara um e-mail de
confirmação pelo seu Resend. Em massa, isso consome cota e — se o atacante usar
e-mails de vítimas reais — manda "confirme seu cadastro no Manual NF" para
gente que não pediu, em nome do seu domínio. Mitigação: CAPTCHA no cadastro
(recomendação abaixo).

### 4. Flood de escrita — ✅ corrigido (era o furo real)

As escritas da aluna — grifos/anotações e mensagens de chat — vão do navegador
**direto ao PostgREST**, sem passar pelo app Next. A RLS controla *quem* pode
escrever, mas não *quanto*. Um teste inseriu **99 anotações num único burst
paralelo de 100**, sem nenhuma barreira.

**Impacto.** Requer conta confirmada (e, para anotações, com uma compra), então
não é anônimo — mas uma vez lá dentro, dava para inflar o banco com milhões de
linhas, e o plano do Supabase tem teto de tamanho. É DoS por volume de dados:
não vaza nem escala privilégio, mas degrada e custa.

**Por que foi corrigido aqui e não no app.** É o único vetor de volume que
depende da *aplicação*, não da infraestrutura do Supabase — e como a escrita
nem passa pelo servidor Next, o único lugar para pôr o freio é o próprio banco.

**Correção.** Um trigger `BEFORE INSERT` que conta quantas linhas o usuário
gravou no último minuto e recusa acima do teto (120/min para anotações, 60/min
para mensagens). Folga grande de propósito: um humano grifando ou digitando
nunca chega perto; um flood bate na hora. `service_role` (webhook, admin) não
tem `auth.uid()`, então passa livre.

**Reverificado.** Uso normal — 10 anotações espaçadas — passou 100%. Flood de
250 em paralelo: **exatamente 120 gravadas (201), 130 recusadas (400)**. O teto
corta cravado, e a transação de cada insert recusado reverte inteira (vale
também para insert em lote).

### 5. Checkout e webhook — ✅ já protegidos

`POST /api/checkout` sem login devolve **401**; `POST /api/webhooks/asaas` sem o
token combinado devolve **401**. O checkout ainda reaproveita um pedido
pendente idêntico em vez de criar uma cobrança nova a cada clique (visto no
código, `route.ts:105`), o que limita a criação de cobranças-lixo no Asaas.

### 6. Política de senha — 🟡 fraca

Senha mínima é **6 caracteres** (`"123"` e `"abc"` foram recusados). É o padrão
do Supabase. Funciona, mas 6 é curto e não há exigência de complexidade nem
checagem contra vazamentos conhecidos. Ver recomendações.

---

## Recomendações (configuração de painel, dependem de você)

Nenhuma é código — são ajustes no dashboard do Supabase que fecham o que sobrou.

1. **Ativar CAPTCHA no Auth** (hCaptcha ou Cloudflare Turnstile), em
   Authentication → Settings → Bot and Abuse Protection. É a defesa que falta
   contra os dois pontos que o rate-limit-por-IP não cobre: força bruta de
   login com IPs rotativos e cadastro em massa. Exige criar uma conta no
   provedor de CAPTCHA e colar a chave; o front (`/entrar`, `/registro`,
   `/esqueci-senha`) precisaria passar o token do widget — dá para eu
   implementar quando você tiver a chave.

2. **Endurecer a política de senha**, em Authentication → Settings: subir o
   mínimo para 8, e ligar **"Leaked password protection"** (checa a senha
   contra a base do HaveIBeenPwned e recusa senhas já vazadas). É um toggle,
   sem custo.

3. **Reduzir a validade da sessão** se quiser, mas o padrão do Supabase (JWT de
   1h com refresh) é razoável — não é prioridade.

4. **Ficar de olho na cota do Resend** no começo. Se o cadastro virar alvo de
   abuso antes do CAPTCHA entrar, aparece como pico de e-mails enviados lá.

## O que ficou de fora e por quê

- **DDoS volumétrico** (encher a banda, derrubar o site com tráfego bruto) não
  é defensável na aplicação — é a Vercel e a Cloudflare do Supabase que
  absorvem. Fora do escopo do que dá para fazer no código.
- **Não testei criar cobranças reais em massa no Asaas de produção** — seria um
  teste destrutivo (geraria cobranças de verdade). Pelo código, o reuso de
  pedido pendente já limita o pior caso.
