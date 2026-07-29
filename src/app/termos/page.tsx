import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Termos de Uso — NF Academy",
};

export default function TermosPage() {
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
          <h1 className="font-heading text-4xl text-foreground">Termos de Uso</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Última atualização: 29 de julho de 2026.
          </p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="mb-2 font-heading text-lg text-foreground">1. Aceitação</h2>
              <p>
                Estes Termos de Uso regem o acesso e uso da plataforma NF
                Academy (&quot;plataforma&quot;), operada por{" "}
                <span className="text-foreground">
                  [razão social / CPF ou CNPJ da Dra. Nathalia]
                </span>{" "}
                (&quot;NF Academy&quot;, &quot;nós&quot;). Ao criar uma conta
                ou usar a plataforma, você concorda com estes termos e com a
                nossa{" "}
                <a href="/privacidade" className="text-rose hover:underline">
                  Política de Privacidade
                </a>
                . Se você não concorda, não deve usar a plataforma.
              </p>
            </section>

            <section>
              <h2 className="mb-2 font-heading text-lg text-foreground">2. O que é a NF Academy</h2>
              <p>
                A NF Academy é uma plataforma de venda de materiais
                educacionais digitais (PDFs, vídeos e demais conteúdos) na
                área de estética, escritos e revisados pela própria Dra.
                Nathalia. Não é um marketplace aberto: todo o conteúdo
                disponível é produzido diretamente por nós.
              </p>
            </section>

            <section>
              <h2 className="mb-2 font-heading text-lg text-foreground">3. Cadastro e conta</h2>
              <p>
                Para comprar e acessar conteúdos, você precisa criar uma
                conta com nome, e-mail e senha válidos. Você é responsável
                por manter sua senha em sigilo e por todas as atividades
                realizadas na sua conta. Avise-nos imediatamente se
                desconfiar de acesso não autorizado.
              </p>
            </section>

            <section>
              <h2 className="mb-2 font-heading text-lg text-foreground">
                4. Compra e acesso ao conteúdo
              </h2>
              <p>
                Ao adquirir um conteúdo, você recebe uma licença pessoal,
                intransferível e não exclusiva para acessá-lo e estudá-lo,
                pelo tempo em que sua conta permanecer ativa. O conteúdo não
                pode ser copiado, compartilhado, redistribuído, publicado em
                outros sites, revendido ou usado para fins comerciais sem
                autorização expressa da NF Academy.
              </p>
              <p className="mt-2">
                Cada conteúdo comprado permanece disponível na sua área de
                estudos indefinidamente, incluindo eventuais atualizações
                feitas pela Dra. Nathalia no material.
              </p>
            </section>

            <section>
              <h2 className="mb-2 font-heading text-lg text-foreground">
                5. Direito de arrependimento e reembolso
              </h2>
              <p>
                Conforme o Código de Defesa do Consumidor, você tem até 7
                (sete) dias corridos a partir da data da compra para desistir
                da aquisição e solicitar reembolso integral, desde que o
                conteúdo ainda não tenha sido acessado de forma substancial.
                Após esse prazo, ou após o uso relevante do material, o
                reembolso pode ser negado, já que se trata de conteúdo
                digital de acesso imediato.
              </p>
            </section>

            <section>
              <h2 className="mb-2 font-heading text-lg text-foreground">
                6. Chat com a Dra. Nathalia
              </h2>
              <p>
                Cada conteúdo comprado dá acesso a um canal de conversa
                privado com a Dra. Nathalia para tirar dúvidas sobre aquele
                material. Esse canal deve ser usado de forma respeitosa e
                para o propósito a que se destina — dúvidas relacionadas ao
                conteúdo adquirido. A NF Academy pode remover mensagens ou
                suspender o acesso ao chat em caso de uso abusivo.
              </p>
            </section>

            <section>
              <h2 className="mb-2 font-heading text-lg text-foreground">
                7. Propriedade intelectual
              </h2>
              <p>
                Todo o conteúdo disponibilizado na plataforma — textos,
                imagens, vídeos, layout e marca — é protegido por direitos
                autorais e pertence à Dra. Nathalia e/ou à NF Academy. Nenhuma
                parte deste conteúdo pode ser reproduzida sem autorização.
              </p>
            </section>

            <section>
              <h2 className="mb-2 font-heading text-lg text-foreground">
                8. Suspensão e encerramento de conta
              </h2>
              <p>
                Podemos suspender ou encerrar o acesso de uma conta que viole
                estes termos — por exemplo, compartilhamento de conteúdo,
                tentativa de fraude ou uso abusivo do chat — sem prejuízo de
                outras medidas cabíveis.
              </p>
            </section>

            <section>
              <h2 className="mb-2 font-heading text-lg text-foreground">
                9. Alterações nestes termos
              </h2>
              <p>
                Podemos atualizar estes Termos de Uso periodicamente. Mudanças
                relevantes serão comunicadas na plataforma. O uso continuado
                após uma atualização representa aceite dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="mb-2 font-heading text-lg text-foreground">
                10. Lei aplicável
              </h2>
              <p>
                Estes termos são regidos pelas leis brasileiras. Eventuais
                disputas serão resolvidas no foro do domicílio da NF Academy,
                salvo disposição legal em contrário.
              </p>
            </section>

            <section>
              <h2 className="mb-2 font-heading text-lg text-foreground">11. Contato</h2>
              <p>
                Dúvidas sobre estes termos podem ser enviadas para{" "}
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
