import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Política de Privacidade — Manual NF",
};

export default function PrivacidadePage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex flex-1 flex-col px-6 py-16">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-3 flex items-center gap-3 text-xs font-medium tracking-[0.2em] text-gold uppercase">
            <span className="text-rose">✦</span>
            Legal
            <span className="h-px w-10 bg-gold/40" />
          </div>
          <h1 className="font-heading text-4xl text-foreground">Política de Privacidade</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Última atualização: 29 de julho de 2026.
          </p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
            <section>
              <p>
                Esta política explica como o Manual NF coleta, usa e
                protege os dados pessoais de quem usa a plataforma, em
                conformidade com a Lei Geral de Proteção de Dados (LGPD —
                Lei nº 13.709/2018).
              </p>
            </section>

            <section>
              <h2 className="mb-2 font-heading text-lg text-foreground">
                1. Quem trata os seus dados
              </h2>
              <p>
                O Manual NF, operado por{" "}
                <span className="text-foreground">
                  [razão social / CPF ou CNPJ da Dra. Nathalia]
                </span>
                , é a controladora dos dados pessoais tratados nesta
                plataforma.
              </p>
            </section>

            <section>
              <h2 className="mb-2 font-heading text-lg text-foreground">
                2. Quais dados coletamos
              </h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Nome e e-mail, informados no cadastro;</li>
                <li>Senha, armazenada de forma criptografada — nunca em texto simples;</li>
                <li>Histórico de compras e progresso de leitura dos conteúdos;</li>
                <li>Anotações feitas nos materiais;</li>
                <li>Mensagens trocadas no chat privado com a Dra. Nathalia;</li>
                <li>Dados técnicos básicos de acesso (como data e hora de login).</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 font-heading text-lg text-foreground">
                3. Para que usamos esses dados
              </h2>
              <p>Usamos os dados coletados para:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Criar e manter sua conta e dar acesso aos conteúdos comprados;</li>
                <li>Viabilizar o chat entre você e a Dra. Nathalia;</li>
                <li>Salvar seu progresso de leitura e anotações entre sessões;</li>
                <li>Enviar comunicações relacionadas à sua conta ou compras;</li>
                <li>Cumprir obrigações legais e prevenir fraude.</li>
              </ul>
              <p className="mt-2">
                Não vendemos seus dados pessoais a terceiros.
              </p>
            </section>

            <section>
              <h2 className="mb-2 font-heading text-lg text-foreground">
                4. Compartilhamento com terceiros
              </h2>
              <p>
                Usamos a Supabase, empresa especializada em infraestrutura
                de dados, para hospedar o banco de dados, autenticação e
                arquivos da plataforma. A Supabase atua como operadora dos
                dados, seguindo nossas instruções, e não usa seus dados para
                fins próprios.
              </p>
            </section>

            <section>
              <h2 className="mb-2 font-heading text-lg text-foreground">
                5. Armazenamento e segurança
              </h2>
              <p>
                Seus dados são armazenados em servidores com controle de
                acesso restrito. Senhas nunca são armazenadas em texto
                simples. Cada aluna só tem acesso aos próprios dados e aos
                conteúdos que comprou; conversas no chat são privadas entre
                você e a Dra. Nathalia.
              </p>
            </section>

            <section>
              <h2 className="mb-2 font-heading text-lg text-foreground">
                6. Seus direitos
              </h2>
              <p>De acordo com a LGPD, você pode a qualquer momento:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Confirmar quais dados seus tratamos e acessá-los;</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
                <li>Solicitar a exclusão dos seus dados, observadas obrigações legais de guarda;</li>
                <li>Solicitar a portabilidade dos seus dados;</li>
                <li>Revogar consentimentos dados anteriormente.</li>
              </ul>
              <p className="mt-2">
                Para exercer qualquer um desses direitos, entre em contato
                pelo e-mail{" "}
                <span className="text-foreground">[e-mail de contato]</span>.
              </p>
            </section>

            <section>
              <h2 className="mb-2 font-heading text-lg text-foreground">7. Cookies</h2>
              <p>
                Usamos apenas cookies essenciais para manter você logada
                entre visitas. Não usamos cookies de rastreamento
                publicitário.
              </p>
            </section>

            <section>
              <h2 className="mb-2 font-heading text-lg text-foreground">
                8. Retenção de dados
              </h2>
              <p>
                Mantemos seus dados enquanto sua conta estiver ativa. Se
                você solicitar a exclusão da conta, apagamos ou anonimizamos
                seus dados pessoais, exceto quando a lei exigir retenção por
                período determinado (por exemplo, registros fiscais de
                compras).
              </p>
            </section>

            <section>
              <h2 className="mb-2 font-heading text-lg text-foreground">
                9. Alterações nesta política
              </h2>
              <p>
                Podemos atualizar esta política periodicamente. Mudanças
                relevantes serão comunicadas na plataforma.
              </p>
            </section>

            <section>
              <h2 className="mb-2 font-heading text-lg text-foreground">10. Contato</h2>
              <p>
                Dúvidas sobre esta política ou sobre o tratamento dos seus
                dados podem ser enviadas para{" "}
                <span className="text-foreground">[e-mail de contato]</span>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
