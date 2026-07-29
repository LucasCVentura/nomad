import Link from "next/link";
import {
  ShoppingBag,
  Highlighter,
  GraduationCap,
  MessageCircle,
  Star,
  ArrowRight,
  ArrowUpRight,
  MoveHorizontal,
  FileText,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Logomark } from "@/components/logo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const features = [
  {
    icon: ShoppingBag,
    title: "Loja de conteúdos",
    description:
      "PDFs e apostilas escritos pela própria Dra. Nathalia, organizados por área e prontos pra estudar na hora.",
  },
  {
    icon: Highlighter,
    title: "Leitor com anotações",
    description:
      "Visualizador de conteúdo rico direto na plataforma: grife, comente e volte exatamente onde parou.",
  },
  {
    icon: GraduationCap,
    title: "Sua área de estudos",
    description:
      "Todos os materiais que você adquiriu organizados num só lugar, com seu progresso salvo.",
  },
  {
    icon: MessageCircle,
    title: "Fale com a Dra. Nathalia",
    description:
      "Um chat exclusivo em cada conteúdo que você compra pra tirar dúvidas direto com quem escreveu o material.",
  },
];

const catalog = [
  {
    title: "Harmonização Facial na Prática",
    category: "Facial",
    format: "PDF · 84 páginas",
  },
  {
    title: "Fundamentos de Peeling Químico",
    category: "Skincare",
    format: "PDF · 52 páginas",
  },
  {
    title: "Protocolos de Microagulhamento",
    category: "Procedimentos",
    format: "PDF · 63 páginas",
  },
  {
    title: "Anatomia Aplicada à Estética",
    category: "Fundamentos",
    format: "PDF · 120 páginas",
  },
  {
    title: "Skincare Baseado em Evidência",
    category: "Skincare",
    format: "PDF · 71 páginas",
  },
];

const steps = [
  {
    title: "Crie sua conta",
    description: "Cadastro rápido pra ter acesso à loja e ao chat com a Dra. Nathalia.",
  },
  {
    title: "Escolha seus materiais",
    description: "Compre os conteúdos que fazem sentido pra sua especialização.",
  },
  {
    title: "Estude e anote",
    description: "Leia direto na plataforma e registre suas próprias observações.",
  },
  {
    title: "Tire dúvidas com a Dra. Nathalia",
    description: "Manda sua pergunta sobre o material direto pra ela, sem intermediário.",
  },
];

const testimonialsRowA = [
  {
    name: "Camila R.",
    role: "Esteticista",
    quote:
      "Finalmente um lugar só pra estudar estética sem PDF espalhado em mil pastas.",
  },
  {
    name: "Juliana M.",
    role: "Biomédica esteta",
    quote:
      "A Dra. Nathalia mesma respondeu minha dúvida de protocolo no mesmo dia.",
  },
  {
    name: "Patrícia A.",
    role: "Dermatofuncional",
    quote:
      "Anotar direto em cima do material mudou como eu reviso antes de atender.",
  },
  {
    name: "Renata F.",
    role: "Esteticista",
    quote: "Comprei um material às 22h e já tava lendo dois minutos depois.",
  },
];

const testimonialsRowB = [
  {
    name: "Bianca S.",
    role: "Biomédica esteta",
    quote: "Ter um chat separado por curso facilita muito organizar minhas dúvidas.",
  },
  {
    name: "Larissa T.",
    role: "Esteticista",
    quote: "Uso as anotações como se fosse meu caderno de plantão, só que digital.",
  },
  {
    name: "Fernanda K.",
    role: "Dermatofuncional",
    quote: "Indiquei pra toda a equipe da clínica onde trabalho.",
  },
  {
    name: "Aline P.",
    role: "Esteticista",
    quote: "Preço justo e o material é realmente escrito por quem atende.",
  },
];

const faq = [
  {
    question: "Quem produz os conteúdos da plataforma?",
    answer:
      "Todos os materiais são escritos e revisados pela própria Dra. Nathalia. A NF Academy não é uma loja aberta pra outros criadores publicarem conteúdo.",
  },
  {
    question: "Preciso de assinatura pra usar a plataforma?",
    answer:
      "Não. Você compra os materiais avulsos que quiser, sem mensalidade obrigatória.",
  },
  {
    question: "Os conteúdos ficam disponíveis pra sempre depois da compra?",
    answer:
      "Sim, todo material adquirido fica salvo na sua área de estudos com acesso ilimitado.",
  },
  {
    question: "Como funciona o contato com a Dra. Nathalia?",
    answer:
      "Cada conteúdo que você compra tem um chat exclusivo com a Dra. Nathalia pra tirar dúvidas sobre aquele material. A conversa é só entre você e ela — não é um fórum público.",
  },
];

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-3 text-xs font-medium tracking-[0.2em] text-gold uppercase">
      <span className="text-rose">✦</span>
      {children}
      <span className="h-px w-10 bg-gold/40" />
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60 px-6 pb-28 pt-16 sm:pt-20">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-130 opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(50% 55% at 15% 10%, oklch(0.72 0.13 5 / 45%), transparent 70%)",
            }}
          />
          <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <Kicker>Feito para profissionais da estética</Kicker>
              <h1 className="font-heading text-5xl leading-[1.05] text-foreground sm:text-6xl lg:text-[4.25rem]">
                Estude estética
                <br />
                com quem já sabe{" "}
                <span className="relative inline-block text-rose">
                  o caminho
                  <svg
                    viewBox="0 0 200 14"
                    className="absolute -bottom-2 left-0 h-3 w-full text-gold"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2 10.5C40 2 90 1 130 6.5C155 10 178 9 198 4"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </span>
              </h1>
              <p className="mt-7 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                Os materiais de estudo, o leitor com anotações e o contato
                direto com a <span className="text-foreground">Dra. Nathalia</span> —
                tudo em um só lugar, feito pra quem vive de estética.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="bg-rose text-rose-foreground hover:bg-rose/90"
                  render={<Link href="/registro" />}
                  nativeButton={false}
                >
                  Criar conta grátis
                  <ArrowRight className="size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  render={<Link href="/loja" />}
                  nativeButton={false}
                >
                  Ver conteúdos
                </Button>
              </div>

              <div className="mt-14 flex items-center gap-8">
                <div>
                  <p className="font-heading text-2xl text-foreground">120+</p>
                  <p className="text-xs text-muted-foreground">materiais</p>
                </div>
                <span className="h-8 w-px bg-border" />
                <div>
                  <p className="font-heading text-2xl text-foreground">4.9</p>
                  <p className="text-xs text-muted-foreground">avaliação</p>
                </div>
                <span className="h-8 w-px bg-border" />
                <div>
                  <p className="font-heading text-2xl text-foreground">2.400+</p>
                  <p className="text-xs text-muted-foreground">profissionais</p>
                </div>
              </div>
            </div>

            {/* Product mockup: annotation viewer */}
            <div className="relative hidden lg:block">
              <div className="relative mx-auto max-w-sm -rotate-2 rounded-2xl border border-border/70 bg-card p-6 shadow-2xl shadow-black/40">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Harmonização Facial na Prática · p. 24
                  </span>
                  <FileText className="size-4 text-gold" />
                </div>
                <div className="space-y-2.5">
                  <div className="h-2.5 w-full rounded-full bg-muted-foreground/15" />
                  <div className="h-2.5 w-11/12 rounded-full bg-muted-foreground/15" />
                  <div className="h-2.5 w-full rounded-full bg-rose/25" />
                  <div className="h-2.5 w-4/5 rounded-full bg-rose/25" />
                  <div className="h-2.5 w-full rounded-full bg-muted-foreground/15" />
                  <div className="h-2.5 w-3/4 rounded-full bg-muted-foreground/15" />
                  <div className="h-2.5 w-10/12 rounded-full bg-muted-foreground/15" />
                </div>

                <div className="absolute -bottom-6 -right-8 w-56 rotate-3 rounded-xl border border-gold/30 bg-popover p-4 shadow-xl">
                  <p className="font-heading text-sm italic leading-snug text-foreground">
                    &quot;Voltar nesse protocolo antes de atender amanhã&quot;
                  </p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    sua anotação · agora
                  </p>
                </div>
              </div>

              <div className="absolute -left-6 top-6 flex items-center gap-2 -rotate-6 rounded-full border border-border/70 bg-popover px-4 py-2 shadow-lg">
                <MessageCircle className="size-3.5 text-rose" />
                <span className="text-xs text-foreground">Resposta direto da Dra. Nathalia</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="recursos" className="border-b border-border/60 px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-xl">
              <Kicker>O que você recebe</Kicker>
              <h2 className="font-heading text-3xl text-foreground sm:text-4xl">
                Tudo o que você precisa pra estudar de verdade
              </h2>
            </div>
            <div className="mt-14 divide-y divide-border/60 md:grid md:grid-cols-2 md:gap-x-16 md:divide-y-0">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-6 border-border/60 py-8 md:border-t"
                >
                  <span className="font-heading text-3xl italic text-gold/70">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <feature.icon className="size-4 text-rose" />
                      <h3 className="font-heading text-lg text-foreground">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About */}
        <section id="sobre" className="border-b border-border/60 px-6 py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="relative mx-auto w-full max-w-xs">
              <div className="flex aspect-square w-full items-center justify-center rounded-3xl border border-border/60 bg-linear-to-br from-rose/15 to-gold/15">
                <User className="size-16 text-gold/70" />
              </div>
              <div className="absolute -bottom-5 -right-5 rotate-3 rounded-xl border border-border/60 bg-popover px-4 py-3 shadow-xl">
                <p className="font-heading text-sm text-foreground">10+ anos</p>
                <p className="text-[11px] text-muted-foreground">de atuação clínica</p>
              </div>
            </div>
            <div>
              <Kicker>Quem ensina</Kicker>
              <h2 className="font-heading text-3xl text-foreground sm:text-4xl">
                Dra. Nathalia
              </h2>
              <p className="mt-2 text-xs font-medium tracking-[0.15em] text-gold uppercase">
                Especialista em Harmonização Facial e Skincare
              </p>
              <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">
                A NF Academy não é uma loja aberta pra qualquer criador de
                conteúdo — todo material é escrito e revisado pela própria
                Dra. Nathalia, com base na prática real de clínica. Quando
                você compra um conteúdo aqui, tá aprendendo direto com
                quem atende.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Formação em Estética e Cosmetologia",
                  "Especialização em Harmonização Facial",
                  "Mais de 10 anos atendendo e ensinando",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-foreground"
                  >
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-rose" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Catalog shelf */}
        <section id="conteudos" className="border-b border-border/60 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <Kicker>Na loja agora</Kicker>
                <h2 className="font-heading text-3xl text-foreground sm:text-4xl">
                  Conteúdos em destaque
                </h2>
              </div>
              <Button
                variant="outline"
                render={<Link href="/loja" />}
                nativeButton={false}
              >
                Ver loja completa
                <ArrowUpRight className="size-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1.5 px-6 text-xs text-muted-foreground sm:hidden">
            <MoveHorizontal className="size-3.5" />
            arraste pra ver mais
          </div>

          <div className="mt-8 flex gap-5 overflow-x-auto px-6 pb-4 no-scrollbar snap-x snap-mandatory sm:mt-10">
            {catalog.map((item, index) => (
              <div
                key={item.title}
                className={`group w-64 shrink-0 snap-start rounded-2xl border border-border/60 bg-card p-5 transition-transform hover:-translate-y-1 hover:border-rose/40 ${
                  index % 2 === 0 ? "sm:rotate-1" : "sm:-rotate-1"
                } sm:hover:rotate-0`}
              >
                <div className="mb-4 flex aspect-3/4 items-center justify-center rounded-lg bg-linear-to-br from-gold/15 to-rose/15">
                  <FileText className="size-8 text-gold" />
                </div>
                <span className="text-[11px] font-medium tracking-wide text-gold uppercase">
                  {item.category}
                </span>
                <h3 className="mt-1.5 font-heading text-base leading-snug text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">{item.format}</p>
              </div>
            ))}
            <div className="w-1 shrink-0" />
          </div>
        </section>

        {/* How it works */}
        <section className="border-b border-border/60 px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <Kicker>Passo a passo</Kicker>
            <h2 className="font-heading text-3xl text-foreground sm:text-4xl">
              Como funciona
            </h2>
            <div className="relative mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              <span className="absolute top-5 left-0 hidden h-px w-full bg-[repeating-linear-gradient(90deg,var(--border)_0_10px,transparent_10px_20px)] lg:block" />
              {steps.map((step, index) => (
                <div key={step.title} className="relative pl-14">
                  <span className="relative z-10 mb-3 flex size-10 items-center justify-center rounded-full border border-gold/40 bg-background font-heading text-lg text-gold">
                    {index + 1}
                  </span>
                  <h3 className="font-heading text-lg text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Chat with the doctor */}
        <section id="chat" className="border-b border-border/60 px-6 py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
            <div>
              <Kicker>Fale com a doutora</Kicker>
              <h2 className="font-heading text-3xl text-foreground sm:text-4xl">
                Tire dúvidas direto com quem escreveu o material
              </h2>
              <p className="mt-4 max-w-md text-muted-foreground">
                Cada conteúdo que você compra vem com um chat exclusivo com a
                Dra. Nathalia. Nada de fórum público — é só você, o material
                e uma resposta de quem realmente entende do assunto.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Um chat exclusivo em cada conteúdo que você compra",
                  "Resposta direto da Dra. Nathalia, não de outros alunos",
                  "Conversa privada e salva, sem se perder em grupo de WhatsApp",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-foreground"
                  >
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-rose" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Chat window mockup */}
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl shadow-black/30">
              <div className="flex items-center gap-1.5 border-b border-border/60 px-4 py-3">
                <span className="size-2.5 rounded-full bg-rose/70" />
                <span className="size-2.5 rounded-full bg-gold/70" />
                <span className="size-2.5 rounded-full bg-muted-foreground/40" />
                <span className="ml-3 font-mono text-[11px] text-muted-foreground">
                  Dra. Nathalia · Harmonização Facial
                </span>
              </div>
              <div className="space-y-3 p-4">
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl bg-rose px-4 py-2.5 text-sm text-rose-foreground">
                    Como sequencio microagulhamento após peeling?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl border border-border/60 bg-background/60 px-4 py-2.5 text-sm text-foreground">
                    <p className="mb-0.5 text-[11px] font-medium text-gold">
                      Dra. Nathalia
                    </p>
                    Dá um intervalo de pelo menos 15 dias entre os dois
                    procedimentos, com a pele bem cicatrizada.
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl bg-rose px-4 py-2.5 text-sm text-rose-foreground">
                    Perfeito, muito obrigada!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials marquee */}
        <section className="border-b border-border/60 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <Kicker>Depoimentos</Kicker>
            <h2 className="font-heading text-3xl text-foreground sm:text-4xl">
              Quem já estuda por aqui
            </h2>
          </div>

          <div className="mt-12 space-y-4">
            <div data-marquee className="fade-edges-x overflow-hidden">
              <div className="flex w-max animate-marquee-left gap-4">
                {[...testimonialsRowA, ...testimonialsRowA].map((t, i) => (
                  <TestimonialCard key={`a-${i}`} {...t} />
                ))}
              </div>
            </div>
            <div data-marquee className="fade-edges-x overflow-hidden">
              <div className="flex w-max animate-marquee-right gap-4">
                {[...testimonialsRowB, ...testimonialsRowB].map((t, i) => (
                  <TestimonialCard key={`b-${i}`} {...t} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="duvidas" className="border-b border-border/60 px-6 py-24">
          <div className="mx-auto max-w-3xl">
            <Kicker>Dúvidas</Kicker>
            <h2 className="font-heading text-3xl text-foreground sm:text-4xl">
              Perguntas frequentes
            </h2>
            <Accordion defaultValue={[0]} className="mt-10">
              {faq.map((item, index) => (
                <AccordionItem key={item.question} value={index}>
                  <AccordionTrigger className="text-left font-heading text-base font-normal text-foreground">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section id="comecar" className="px-6 py-24">
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-border/60 bg-linear-to-br from-rose/10 via-card to-gold/10 px-8 py-16 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-gold/40">
              <Logomark className="size-6 text-gold" />
            </div>
            <h2 className="mt-6 font-heading text-3xl text-foreground sm:text-4xl">
              Comece a estudar hoje
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              Crie sua conta gratuita, acesse a loja e tire suas dúvidas
              direto com a Dra. Nathalia.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="bg-rose text-rose-foreground hover:bg-rose/90"
                render={<Link href="/registro" />}
                nativeButton={false}
              >
                Criar conta grátis
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href="/entrar" />}
                nativeButton={false}
              >
                Já tenho conta
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function TestimonialCard({
  name,
  role,
  quote,
}: {
  name: string;
  role: string;
  quote: string;
}) {
  return (
    <div className="w-80 shrink-0 rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex gap-0.5 text-gold">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="size-3 fill-current" />
        ))}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-foreground">
        &quot;{quote}&quot;
      </p>
      <p className="mt-4 text-xs text-muted-foreground">
        <span className="text-foreground">{name}</span> · {role}
      </p>
    </div>
  );
}
