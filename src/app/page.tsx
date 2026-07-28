import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  Users,
  Highlighter,
  ShoppingBag,
  MessageCircle,
  Star,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  FileText,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/mobile-nav";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
      "Um fórum no estilo Reddit pra trocar experiência com outras profissionais e tirar dúvidas dos conteúdos.",
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

const testimonials = [
  {
    name: "Camila R.",
    role: "Esteticista",
    quote:
      "Finalmente um lugar só pra estudar estética sem precisar salvar PDF espalhado em mil pastas.",
  },
  {
    name: "Juliana M.",
    role: "Biomédica esteta",
    quote:
      "A comunidade me ajudou a tirar uma dúvida de protocolo no mesmo dia. Muito melhor que grupo de WhatsApp.",
  },
  {
    name: "Patrícia A.",
    role: "Dermatofuncional",
    quote:
      "Poder anotar direto em cima do material mudou completamente a forma como eu reviso o conteúdo antes de atender.",
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

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <span className="font-heading text-xl tracking-tight text-foreground">
            Nomad<span className="text-rose">.</span>
          </span>
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
              render={<Link href="#comecar" />} nativeButton={false}
            >
              Entrar
            </Button>
            <Button
              size="sm"
              className="bg-rose text-rose-foreground hover:bg-rose/90"
              render={<Link href="#comecar" />} nativeButton={false}
            >
              Criar conta
            </Button>
          </div>
          <MobileNav />
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pb-24 pt-20 sm:pt-28">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-130 opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(60% 60% at 50% 0%, oklch(0.72 0.13 5 / 35%), transparent 70%)",
            }}
          />
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <Badge
              variant="secondary"
              className="mb-6 gap-1.5 border-none bg-gold/15 text-gold"
            >
              <Sparkles className="size-3.5" />
              Feito para profissionais da estética
            </Badge>
            <h1 className="font-heading text-4xl leading-tight text-foreground sm:text-6xl sm:leading-tight">
              Estude estética com quem já sabe{" "}
              <span className="text-rose">o caminho</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Materiais de estudo, um leitor com anotações e uma comunidade
              pra tirar dúvidas — tudo em um só lugar, feito pra quem vive de
              estética.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="bg-rose text-rose-foreground hover:bg-rose/90"
                render={<Link href="#comecar" />} nativeButton={false}
              >
                Criar conta grátis
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href="#conteudos" />} nativeButton={false}
              >
                Ver conteúdos
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-20 grid max-w-3xl grid-cols-3 gap-6 text-center">
            <div>
              <p className="font-heading text-3xl text-foreground">120+</p>
              <p className="mt-1 text-sm text-muted-foreground">materiais na loja</p>
            </div>
            <div>
              <p className="font-heading text-3xl text-foreground">4.9</p>
              <p className="mt-1 text-sm text-muted-foreground">
                avaliação média
              </p>
            </div>
            <div>
              <p className="font-heading text-3xl text-foreground">2.400+</p>
              <p className="mt-1 text-sm text-muted-foreground">
                profissionais estudando
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="recursos" className="px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-xl text-center">
              <h2 className="font-heading text-3xl text-foreground sm:text-4xl">
                Tudo o que você precisa pra estudar de verdade
              </h2>
              <p className="mt-4 text-muted-foreground">
                Sem PDF perdido, sem grupo de WhatsApp lotado. Uma plataforma
                só pra sua evolução profissional.
              </p>
            </div>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="border-border/60 bg-card/60"
                >
                  <CardHeader>
                    <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-rose/15 text-rose">
                      <feature.icon className="size-5" />
                    </div>
                    <CardTitle className="font-heading text-lg font-normal">
                      {feature.title}
                    </CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Catalog preview */}
        <section id="conteudos" className="px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-heading text-3xl text-foreground sm:text-4xl">
                  Conteúdos em destaque
                </h2>
                <p className="mt-3 max-w-md text-muted-foreground">
                  Uma amostra do que você encontra na loja, direto da nossa
                  área de estudos.
                </p>
              </div>
              <Button variant="outline" render={<Link href="#comecar" />} nativeButton={false}>
                Ver loja completa
                <ArrowRight className="size-4" />
              </Button>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {catalog.map((item) => (
                <Card
                  key={item.title}
                  className="group border-border/60 bg-card/60 transition-colors hover:border-rose/40"
                >
                  <CardHeader>
                    <div className="mb-3 flex aspect-3/4 items-center justify-center rounded-lg bg-linear-to-br from-gold/15 to-rose/15">
                      <FileText className="size-8 text-gold" />
                    </div>
                    <Badge variant="secondary" className="w-fit bg-muted text-muted-foreground">
                      {item.category}
                    </Badge>
                    <CardTitle className="font-heading text-base font-normal leading-snug">
                      {item.title}
                    </CardTitle>
                    <CardDescription>{item.format}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-xl text-center">
              <h2 className="font-heading text-3xl text-foreground sm:text-4xl">
                Como funciona
              </h2>
            </div>
            <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <div key={step.title} className="relative pl-14">
                  <span className="absolute left-0 top-0 flex size-10 items-center justify-center rounded-full border border-gold/40 font-heading text-lg text-gold">
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
        <section id="comunidade" className="px-6 py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
            <div>
              <Badge
                variant="secondary"
                className="mb-6 gap-1.5 border-none bg-rose/15 text-rose"
              >
                <Users className="size-3.5" />
                Comunidade
              </Badge>
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
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-gold" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <Card className="border-border/60 bg-card/60">
              <CardContent className="space-y-4 pt-6">
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
                    className="rounded-lg border border-border/60 bg-background/60 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="secondary" className="bg-muted text-xs text-muted-foreground">
                        {post.tag}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageCircle className="size-3.5" />
                        {post.replies}
                      </span>
                    </div>
                    <p className="mt-2.5 text-sm text-foreground">
                      {post.title}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-xl text-center">
              <h2 className="font-heading text-3xl text-foreground sm:text-4xl">
                Quem já estuda por aqui
              </h2>
            </div>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <Card
                  key={testimonial.name}
                  className="border-border/60 bg-card/60"
                >
                  <CardContent className="pt-6">
                    <Quote className="size-6 text-gold" />
                    <p className="mt-4 text-sm leading-relaxed text-foreground">
                      {testimonial.quote}
                    </p>
                    <Separator className="my-5" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {testimonial.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {testimonial.role}
                        </p>
                      </div>
                      <div className="flex gap-0.5 text-gold">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="size-3.5 fill-current" />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="duvidas" className="px-6 py-24">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <h2 className="font-heading text-3xl text-foreground sm:text-4xl">
                Perguntas frequentes
              </h2>
            </div>
            <Accordion defaultValue={[0]} className="mt-12">
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
          <div className="mx-auto max-w-3xl rounded-3xl border border-border/60 bg-linear-to-br from-rose/10 via-card to-gold/10 px-8 py-16 text-center">
            <BookOpen className="mx-auto size-8 text-rose" />
            <h2 className="mt-6 font-heading text-3xl text-foreground sm:text-4xl">
              Comece a estudar hoje
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              Crie sua conta gratuita, acesse a loja e faça parte da
              comunidade de profissionais de estética.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="bg-rose text-rose-foreground hover:bg-rose/90"
              >
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
      <footer className="border-t border-border/60 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <span className="font-heading text-base text-foreground">
            Nomad<span className="text-rose">.</span>
          </span>
          <p>&copy; {new Date().getFullYear()} Nomad. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
