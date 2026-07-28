const paragraphBank = [
  "Antes de iniciar qualquer procedimento, a avaliação detalhada da pele e das estruturas de suporte é o que garante um plano de tratamento seguro e previsível.",
  "É importante documentar o histórico da paciente, incluindo uso de medicamentos, procedimentos anteriores e expectativas em relação ao resultado final.",
  "A assimetria facial em algum grau está presente na maioria das pessoas — reconhecer isso durante a avaliação evita correções desnecessárias.",
  "O planejamento deve considerar as proporções do terço superior, médio e inferior da face, sempre em relação ao conjunto e não a pontos isolados.",
  "Fotografias padronizadas, em pelo menos três ângulos, ajudam a acompanhar a evolução e servem como registro técnico do caso.",
  "A escolha da técnica depende não só da queixa da paciente, mas também da anatomia individual e da resposta esperada do tecido.",
  "Contraindicações devem ser investigadas ativamente na anamnese, e não apenas perguntadas de forma genérica no formulário de triagem.",
  "O intervalo entre sessões varia de acordo com o objetivo do protocolo e com a capacidade de resposta e recuperação de cada paciente.",
  "Registrar reações adversas, mesmo leves, contribui para refinar o protocolo nas sessões seguintes e para a segurança de outras pacientes.",
  "A comunicação clara sobre o que é realista esperar do procedimento reduz frustrações e aumenta a adesão ao plano de tratamento.",
  "Cuidados pós-procedimento bem explicados, de preferência por escrito, diminuem a taxa de intercorrências e dúvidas no retorno.",
  "Reavaliar o caso a cada sessão, e não apenas seguir o planejamento inicial de forma rígida, é o que diferencia um atendimento consistente.",
  "A literatura mais recente reforça a importância de protocolos individualizados em vez de abordagens padronizadas para todos os casos.",
  "Manter um raciocínio clínico documentado facilita a continuidade do tratamento mesmo quando outro profissional precisa dar seguimento ao caso.",
];

export function getMockBody(title: string) {
  const sections = [
    "Avaliação inicial",
    "Planejamento do protocolo",
    "Execução e cuidados",
    "Acompanhamento e reavaliação",
  ];

  return sections.map((heading, sectionIndex) => ({
    heading: `${sectionIndex + 1}. ${heading}`,
    paragraphs: Array.from({ length: 3 }, (_, i) => {
      const bankIndex = (sectionIndex * 3 + i) % paragraphBank.length;
      return sectionIndex === 0 && i === 0
        ? `Este material aborda ${title.toLowerCase()} com foco prático para o dia a dia da clínica. ${paragraphBank[bankIndex]}`
        : paragraphBank[bankIndex];
    }),
  }));
}
