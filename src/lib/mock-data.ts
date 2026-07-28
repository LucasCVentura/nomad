export type ContentItem = {
  slug: string;
  title: string;
  category: string;
  format: string;
  pages: number;
  price: number;
  description: string;
  purchased?: boolean;
  progress?: number;
};

export const categories = [
  "Todos",
  "Facial",
  "Skincare",
  "Procedimentos",
  "Fundamentos",
] as const;

export const catalog: ContentItem[] = [
  {
    slug: "harmonizacao-facial-na-pratica",
    title: "Harmonização Facial na Prática",
    category: "Facial",
    format: "PDF",
    pages: 84,
    price: 79.9,
    description:
      "Guia completo de avaliação facial, planejamento e técnicas de harmonização usadas no dia a dia da clínica.",
    purchased: true,
    progress: 62,
  },
  {
    slug: "fundamentos-de-peeling-quimico",
    title: "Fundamentos de Peeling Químico",
    category: "Skincare",
    format: "PDF",
    pages: 52,
    price: 49.9,
    description:
      "Classificação dos peelings, indicações por tipo de pele e protocolos passo a passo.",
    purchased: true,
    progress: 100,
  },
  {
    slug: "protocolos-de-microagulhamento",
    title: "Protocolos de Microagulhamento",
    category: "Procedimentos",
    format: "PDF",
    pages: 63,
    price: 59.9,
    description:
      "Indicações, contraindicações e sequenciamento de microagulhamento associado a ativos.",
    purchased: true,
    progress: 18,
  },
  {
    slug: "anatomia-aplicada-a-estetica",
    title: "Anatomia Aplicada à Estética",
    category: "Fundamentos",
    format: "PDF",
    pages: 120,
    price: 89.9,
    description:
      "Anatomia facial e corporal essencial pra quem atua com procedimentos estéticos.",
  },
  {
    slug: "skincare-baseado-em-evidencia",
    title: "Skincare Baseado em Evidência",
    category: "Skincare",
    format: "PDF",
    pages: 71,
    price: 54.9,
    description:
      "Ativos, concentrações e combinações com respaldo científico pra prescrição de home care.",
  },
  {
    slug: "avaliacao-corporal-completa",
    title: "Avaliação Corporal Completa",
    category: "Fundamentos",
    format: "PDF",
    pages: 58,
    price: 44.9,
    description:
      "Roteiro de anamnese e avaliação corporal pra montar planos de tratamento consistentes.",
  },
  {
    slug: "protocolos-de-limpeza-de-pele",
    title: "Protocolos de Limpeza de Pele",
    category: "Facial",
    format: "PDF",
    pages: 39,
    price: 34.9,
    description:
      "Passo a passo de limpeza de pele por biotipo, com indicação de produtos por etapa.",
  },
  {
    slug: "bioestimuladores-de-colageno",
    title: "Bioestimuladores de Colágeno",
    category: "Procedimentos",
    format: "PDF",
    pages: 67,
    price: 69.9,
    description:
      "Mecanismo de ação, indicações e cuidados pós-procedimento com bioestimuladores.",
  },
];

export const purchasedContent = catalog.filter((item) => item.purchased);
