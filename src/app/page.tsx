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
  AtSign,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/mobile-nav";
import { Logo, Logomark } from "@/components/logo";
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
      "PDFs, apostilas e cursos de estética organizados por área, prontos pra comprar e estudar na hora.",
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
    title: "Comunidade e dúvidas",
    description:
      "Um fórum pra trocar experiência com outras profissionais e tirar dúvidas dos conteúdos.",
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
    description: "Cadastro rápido pra ter acesso à loja e à comunidade.",
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
    title: "Tire dúvidas na comunidade",
    description: "Pergunte, responda e troque experiência com outras profissionais.",
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
      "A comunidade me ajudou a tirar uma dúvida de protocolo no mesmo dia.",
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
    quote: "O jeito que o fórum organiza por conteúdo facilita muito achar resposta.",
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
    question: "A comunidade é só pra quem compra conteúdo?",
    answer:
      "Qualquer pessoa cadastrada pode participar do fórum, tanto com dúvidas gerais quanto sobre materiais específicos.",
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
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-18 w-full max-w-6xl items-center justify-between px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#recursos" className="hover:text-foreground">
              Recursos
            </a>
            <a href="#conteudos" className="hover:text-foreground">
              Conteúdos
            </a>
            <a href="#comunidade" className="hover:text-foreground">
              Comunidade
            </a>
            <a href="#duvidas" className="hover:text-foreground">
              Dúvidas
            </a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="#comecar" />}
              nativeButton={false}
            >
              Entrar
            </Button>
            <Button
              size="sm"
              className="bg-rose text-rose-foreground hover:bg-rose/90"
              render={<Link href="#comecar" />}
              nativeButton={false}
            >
              Criar conta
            </Button>
          </div>
          <MobileNav />
        </div>
      </header>

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
                Materiais de estudo, um leitor com anotações e uma comunidade
                pra tirar dúvidas — tudo em um só lugar, feito pra quem vive
                de estética.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="bg-rose text-rose-foreground hover:bg-rose/90"
                  render={<Link href="#comecar" />}
                  nativeButton={false}
                >
                  Criar conta grátis
                  <ArrowRight className="size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  render={<Link href="#conteudos" />}
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
                <span className="text-xs text-foreground">12 respostas na comunidade</span>
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
                render={<Link href="#comecar" />}
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

        {/* Community */}
        <section id="comunidade" className="border-b border-border/60 px-6 py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
            <div>
              <Kicker>Comunidade</Kicker>
              <h2 className="font-heading text-3xl text-foreground sm:text-4xl">
                Tire dúvidas com quem entende do assunto
              </h2>
              <p className="mt-4 max-w-md text-muted-foreground">
                Um espaço no estilo fórum pra perguntas gerais de estética e
                pra dúvidas específicas dos materiais que você já comprou —
                com respostas de outras profissionais da área.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Dúvidas gerais sobre técnicas e procedimentos",
                  "Discussões vinculadas a cada conteúdo adquirido",
                  "Respostas e votos organizados pela comunidade",
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

            {/* Forum window mockup */}
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl shadow-black/30">
              <div className="flex items-center gap-1.5 border-b border-border/60 px-4 py-3">
                <span className="size-2.5 rounded-full bg-rose/70" />
                <span className="size-2.5 rounded-full bg-gold/70" />
                <span className="size-2.5 rounded-full bg-muted-foreground/40" />
                <span className="ml-3 font-mono text-[11px] text-muted-foreground">
                  nomad.app/comunidade
                </span>
              </div>
              <div className="space-y-3 p-4">
                {[
                  {
                    title: "Como vocês sequenciam microagulhamento após peeling?",
                    tag: "Procedimentos",
                    replies: 12,
                  },
                  {
                    title: "Dúvida no capítulo 3 de Harmonização Facial",
                    tag: "Harmonização Facial na Prática",
                    replies: 6,
                  },
                  {
                    title: "Indicação de material pra quem tá começando em skincare",
                    tag: "Skincare",
                    replies: 21,
                  },
                ].map((post) => (
                  <div
                    key={post.title}
                    className="rounded-xl border border-border/60 bg-background/60 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                        {post.tag}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageCircle className="size-3.5" />
                        {post.replies}
                      </span>
                    </div>
                    <p className="mt-2.5 text-sm text-foreground">{post.title}</p>
                  </div>
                ))}
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
              Crie sua conta gratuita, acesse a loja e faça parte da
              comunidade de profissionais de estética.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" className="bg-rose text-rose-foreground hover:bg-rose/90">
                Criar conta grátis
                <ArrowRight className="size-4" />
              </Button>
              <Button size="lg" variant="outline">
                Já tenho conta
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 px-6 py-14">
        <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Materiais de estudo e comunidade pra profissionais de estética.
            </p>
            <a
              href="#"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <AtSign className="size-4" />
              @nomad
            </a>
          </div>
          <div>
            <p className="mb-3 text-xs font-medium tracking-[0.2em] text-gold uppercase">
              Produto
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#recursos" className="hover:text-foreground">Recursos</a></li>
              <li><a href="#conteudos" className="hover:text-foreground">Loja</a></li>
              <li><a href="#comunidade" className="hover:text-foreground">Comunidade</a></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-medium tracking-[0.2em] text-gold uppercase">
              Suporte
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#duvidas" className="hover:text-foreground">Dúvidas frequentes</a></li>
              <li><a href="#comecar" className="hover:text-foreground">Entrar</a></li>
              <li><a href="#comecar" className="hover:text-foreground">Criar conta</a></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-medium tracking-[0.2em] text-gold uppercase">
              Legal
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Termos de uso</a></li>
              <li><a href="#" className="hover:text-foreground">Privacidade</a></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-6xl border-t border-border/60 pt-6 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Nomad. Todos os direitos reservados.
        </div>
      </footer>
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
