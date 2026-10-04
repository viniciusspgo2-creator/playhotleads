// src/content/glossario.ts
// Glossário institucional (DefinedTerm JSON-LD na página /glossario).
// Definições objetivas e citáveis (estilo dicionário técnico) + "por que importa"
// com exemplos de negócios locais brasileiros. A ordem e os slugs são FIXOS:
// relatedTerms e artigos do blog referenciam esses slugs exatamente.

import type { GlossaryTerm } from '@/content/types'

export const GLOSSARY: GlossaryTerm[] = [
  {
    slug: 'lead',
    term: 'Lead',
    definition:
      'Um lead é um contato de potencial cliente que pode ser trabalhado por vendas — em B2B local, tipicamente um negócio (clínica, loja, escritório) com pelo menos um canal de contato válido, como telefone, WhatsApp ou e-mail.',
    importance:
      'Sem lead não existe funil: é a matéria-prima de toda prospecção. Uma imobiliária que mapeia donos de imóveis com telefone e WhatsApp organiza o dia em blocos de contato em vez de caçar dados soltos. No Play Hot Leads, nicho + cidade viram uma lista de leads em segundos, com dedup automático para o mesmo negócio não entrar duas vezes — e cada lead único entregue custa 1 crédito, começando com 150 grátis no cadastro.',
    relatedTerms: ['prospeccao-ativa', 'lead-generation', 'funil-de-vendas'],
  },
  {
    slug: 'prospeccao-ativa',
    term: 'Prospecção Ativa',
    definition:
      'Prospecção ativa é o processo de buscar clientes de forma deliberada: o vendedor define o público, levanta os contatos e toma a iniciativa do primeiro contato, em vez de esperar o cliente chegar por anúncio ou indicação.',
    importance:
      'Para quem vende para outros negócios, é o canal mais previsível de preencher o funil. Uma academia que oferece plano corporativo define "empresas com 20+ funcionários na região", gera a lista e trabalha por cadência: WhatsApp, ligação, e-mail. O Play Hot Leads automatiza a etapa mais demorada — a levantada de contatos — para o vendedor gastar o tempo no contato em si.',
    relatedTerms: ['lead-generation', 'cold-outreach', 'lead'],
  },
  {
    slug: 'lead-generation',
    term: 'Lead Generation (Geração de Leads)',
    definition:
      'Lead generation é o conjunto de canais e processos que gera contatos de potenciais clientes — de formulários e anúncios (captação) à extração de dados públicos de negócios em mapas, diretórios e sites.',
    importance:
      'O canal certo depende de quem compra: uma pizzaria captura leads finais com promoção local, enquanto um fornecedor de equipamentos odontológicos extrai contatos de clínicas por nicho e cidade. Para B2B local, dados públicos são os mais rápidos e permitem validar telefone, e-mail e site antes do primeiro contato. Fontes diferentes costumam encontrar o mesmo negócio, e o dedup automático evita que a lista fique inflada com duplicados.',
    relatedTerms: ['lead', 'prospeccao-ativa', 'enriquecimento-de-dados'],
  },
  {
    slug: 'icp',
    term: 'ICP (Perfil de Cliente Ideal)',
    definition:
      'ICP (Ideal Customer Profile) é a descrição objetiva do cliente que mais se beneficia do que você vende e compensa mais servir — definido por nicho, porte, localização e capacidade de pagamento.',
    importance:
      'Com o ICP definido, a lista de prospecção para de ser genérica: uma imobiliária comercial que atua com pontos para franquias prospecta apenas redes com mais de uma unidade, e não "todo mundo com CNPJ". Buscar sem critério gasta créditos com contato que nunca compraria — no Play Hot Leads, cada lead único entregue custa 1 crédito. Definir ICP antes de buscar é o filtro mais barato do processo.',
    relatedTerms: ['lead-generation', 'lead-scoring', 'funil-de-vendas'],
  },
  {
    slug: 'mql',
    term: 'MQL (Lead Qualificado por Marketing)',
    definition:
      'MQL (Marketing Qualified Lead) é o lead que demonstrou interesse compatível com a oferta — respondeu uma campanha, pediu valores, baixou material — e que o marketing considera pronto para a fila de vendas.',
    importance:
      'O MQL separa curiosos de interessados e evita que o vendedor gaste tempo com quem não vai responder. Uma academia que dispara campanha de plano corporativo para RHs considera MQL quem responde pedindo condições. Leads extraídos por prospecção ativa só se tornam MQL depois de reagir ao primeiro contato — antes disso são apenas "contato novo".',
    relatedTerms: ['sql', 'lead-scoring', 'funil-de-vendas'],
  },
  {
    slug: 'sql',
    term: 'SQL (Lead Qualificado por Vendas)',
    definition:
      'SQL (Sales Qualified Lead) é o lead validado pelo time de vendas: tem o problema que o produto resolve, acesso ao decisor e orçamento e prazo compatíveis. É o estágio imediatamente anterior à proposta.',
    importance:
      'O critério de SQL precisa ser objetivo para o time não interpretar de formas diferentes. Na pizzaria que vende rodízio para eventos corporativos, SQL é quem pede orçamento com data e número de convidados. Definir bem essa fronteira evita os dois erros comuns: proposta para quem não decide e follow-up infinito com quem nunca compraria — no Kanban, é a mudança de coluna que formaliza a transição.',
    relatedTerms: ['mql', 'funil-de-vendas', 'kanban'],
  },
  {
    slug: 'lead-scoring',
    term: 'Lead Scoring',
    definition:
      'Lead scoring é a atribuição de notas aos leads conforme critérios predefinidos — perfil (nicho, porte, região), completude do contato e sinais de interesse — para definir quem recebe atenção primeiro.',
    importance:
      'Com centenas de contatos, ordenar vale mais que listar: uma imobiliária com 300 lojistas na base ataca primeiro quem tem site próprio e WhatsApp comercial, sinais de negócio ativo. O scoring pode ser simples — regras fixas somando pontos — e mesmo assim muda a taxa de resposta do time. Dados já coletados na extração (site, e-mail, número confirmado em mais de uma fonte) servem de critério direto.',
    relatedTerms: ['icp', 'mql', 'enriquecimento-de-dados'],
  },
  {
    slug: 'funil-de-vendas',
    term: 'Funil de Vendas',
    definition:
      'Funil de vendas é a sequência de etapas pelas quais um lead passa até virar cliente — tipicamente contato novo, qualificação, proposta, negociação e fechamento — com critérios de saída definidos para cada etapa.',
    importance:
      'Funil transforma vendas em processo medível: se a pizzaria de eventos corporativos fecha 1 em cada 8 propostas, dá para calcular quantos leads novos o mês exige. Etapas claras também mostram onde o processo trava — leads acumulados em "proposta" apontam problema de oferta, não de volume. Representações visuais como o Kanban tornam o funil operável no dia a dia.',
    relatedTerms: ['kanban', 'crm', 'taxa-de-conversao'],
  },
  {
    slug: 'kanban',
    term: 'Kanban',
    definition:
      'Kanban é um método visual de gestão em colunas — uma por etapa do processo — em que cada trabalho é um card movido da esquerda para a direita conforme avança. Em vendas, cada card é um lead em uma etapa do funil.',
    importance:
      'Para times pequenos, é o CRM mais simples que existe: a academia de bairro arrasta o card do RH de "contatado" para "visita agendada" sem planilha nenhuma. O quadro expõe gargalos na hora — coluna inchada é etapa com problema. No Play Hot Leads, todo lead extraído já nasce como card no Kanban, com drag-and-drop e nota por lead, sem configuração prévia.',
    relatedTerms: ['funil-de-vendas', 'crm', 'lead'],
  },
  {
    slug: 'crm',
    term: 'CRM',
    definition:
      'CRM (Customer Relationship Management) é o sistema que centraliza contatos, histórico de interações e estágio de cada lead e cliente em uma base única, acessível a todo o time.',
    importance:
      'Sem CRM, o histórico fica no celular de cada vendedor — e sai junto quando a pessoa vai embora. Uma imobiliária com três corretores precisa responder em um lugar só: quem já foi contatado, o que foi dito e o que vem a seguir. Para negócios locais, um CRM enxuto com quadro Kanban e notas por lead já cobre a maior parte da necessidade, sem implantação de meses.',
    relatedTerms: ['kanban', 'funil-de-vendas', 'lead'],
  },
  {
    slug: 'taxa-de-conversao',
    term: 'Taxa de Conversão',
    definition:
      'Taxa de conversão é a proporção de leads que passa de uma etapa do funil para a próxima — conversões divididas pelo total de leads que entraram na etapa anterior. Existe uma taxa por etapa, não uma única.',
    importance:
      'É o número que indica onde melhorar primeiro: 200 leads e 4 reuniões (2%) apontam problema de lista ou abordagem; 20 reuniões e 1 venda (5%) apontam problema de proposta. Uma academia que sabe que 10% dos leads corporativos agendam visita consegue prever resultado com base no volume prospectado. Comparar a taxa por fonte também orienta onde investir créditos.',
    relatedTerms: ['funil-de-vendas', 'cac', 'ltv'],
  },
  {
    slug: 'cac',
    term: 'CAC (Custo de Aquisição de Cliente)',
    definition:
      'CAC (Custo de Aquisição de Cliente) é o total investido para conquistar clientes — mídia, ferramentas e mão de obra de prospecção — dividido pelo número de clientes conquistados no período.',
    importance:
      'O CAC transforma a decisão de investimento em conta, não em sensação: se um convênio empresarial rende R$ 2.400 por ano à clínica dentária, pagar R$ 800 para conquistar o cliente é viável; R$ 3.000, não. Na prospecção ativa o custo é previsível — assinatura da ferramenta mais as horas do vendedor. Reduzir CAC passa por lista mais alinhada ao ICP e por taxa de resposta melhor.',
    relatedTerms: ['ltv', 'icp', 'taxa-de-conversao'],
  },
  {
    slug: 'ltv',
    term: 'LTV (Lifetime Value)',
    definition:
      'LTV (Lifetime Value) é a receita total que um cliente gera durante todo o relacionamento com a empresa — soma de compras e recorrência, idealmente líquida dos custos de atendimento.',
    importance:
      'O LTV define quanto faz sentido gastar para conquistar: a regra prática é LTV de pelo menos 3× o CAC. Para a pizzaria, um contrato de almoço corporativo semanal vale muito mais que o pedido avulso — e isso muda a oferta e o follow-up. Negócios de recorrência (academia, convênio, assinatura) têm LTV alto e, por isso, aguentam ciclos de venda mais longos.',
    relatedTerms: ['cac', 'taxa-de-conversao', 'funil-de-vendas'],
  },
  {
    slug: 'cold-outreach',
    term: 'Cold Outreach',
    definition:
      'Cold outreach é o primeiro contato com um lead que ainda não conhece a empresa — por WhatsApp, ligação, e-mail ou rede social — sem qualquer relação prévia. É a porta de entrada da prospecção ativa.',
    importance:
      'Funciona quando é específico e respeita cadência: mensagem curta citando o negócio pelo nome, proposta de valor clara e poucos toques bem espaçados — não dez mensagens em três dias. O WhatsApp é o canal dominante no Brasil para negócios locais, então lista com número válido muda a taxa de resposta de forma direta. No Play Hot Leads, cada lead traz o link wa.me pronto e as campanhas controlam a cadência.',
    relatedTerms: ['prospeccao-ativa', 'lead', 'enriquecimento-de-dados'],
  },
  {
    slug: 'enriquecimento-de-dados',
    term: 'Enriquecimento de Dados',
    definition:
      'Enriquecimento de dados é o processo de completar e atualizar o registro de um lead com informações de outras fontes — e-mail, site, redes sociais, endereço — depois que o registro básico já existe.',
    importance:
      'Um lead só com nome e telefone limita o contato; com e-mail e site, abre-se a página, entende-se o negócio e personaliza-se a abordagem. A administradora que vai receber a oferta de gestão de aluguéis da imobiliária é melhor abordada quando o vendedor já viu quantas unidades ela administra. No Play Hot Leads, o enriquecimento roda por crawl do próprio site da empresa, automático após o dedup — e o lead único entregue continua custando 1 crédito.',
    relatedTerms: ['lead-generation', 'lead-scoring', 'cold-outreach'],
  },
]
