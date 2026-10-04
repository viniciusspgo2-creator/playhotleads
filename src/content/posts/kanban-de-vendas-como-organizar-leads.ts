// src/content/posts/kanban-de-vendas-como-organizar-leads.ts
import type { BlogPost } from '@/content/types'

export const POST: BlogPost = {
  slug: 'kanban-de-vendas-como-organizar-leads',
  title: 'Kanban de vendas: como organizar leads e vender mais',
  description:
    'Kanban de vendas com estágios claros, método pull e dedup automático: veja como organizar leads do Novo ao Ganho e vender mais com um quadro simples.',
  keywords: [
    'kanban de vendas',
    'funil de vendas kanban',
    'organizar leads',
    'pipeline de vendas',
    'gestão de leads',
  ],
  category: 'Gestão de leads',
  tags: ['kanban de vendas', 'funil de vendas', 'organizar leads', 'pipeline de vendas', 'gestão de leads'],
  authorId: 'rafael-nogueira',
  datePublished: '2026-07-18T09:00:00-03:00',
  dateModified: '2026-09-12T09:00:00-03:00',
  readingMinutes: 8,
  blocks: [
    {
      type: 'takeaways',
      items: [
        'Kanban de vendas é o funil visual: um card por lead, uma coluna por estágio — você gerencia o movimento, não a planilha.',
        'No método pull, o vendedor puxa o próximo card quando tem capacidade; limite por coluna expõe o gargalo.',
        'Cinco estágios resolvem quase todo caso: Novo, Contatado, Negociação, Ganho e Perdido — o padrão do Play Hot Leads.',
        'Pipeline sem fonte morre: busque por nicho + cidade, com dedup automático e telefone em E.164 pronto para WhatsApp.',
        'Planilha escala mal: sem dedup, sem estado do lead. Kanban leve resolve sem implantação de meses.',
      ],
    },
    {
      type: 'bluf',
      text:
        'Kanban de vendas é o funil de vendas operável: um quadro com colunas por estágio e um card por lead. Você arrasta o card de Novo para Contatado e depois para Negociação e vê onde cada negócio está travado — implantar leva uma tarde.',
    },
    {
      type: 'p',
      text:
        'Vender por WhatsApp perde mais clientes por desorganização do que por falta de contatos. O Kanban transforma lista em processo: quem está em cada fase e quem precisa de resposta hoje.',
    },
    { type: 'h2', text: 'O que é Kanban de vendas?' },
    {
      type: 'p',
      text:
        '**Kanban de vendas é um quadro visual em que cada lead é um card e cada coluna é um estágio do processo comercial.** Sem abrir planilha, o quadro mostra quantos leads são novos, quantos estão em negociação e quantos viraram venda. O nome vem do japonês ("cartão visual") e manteve a essência original: visualizar o fluxo e limitar o que fica parado.',
    },
    { type: 'h2', text: 'Como funciona o método pull no Kanban de vendas?' },
    {
      type: 'p',
      text:
        '**O método pull inverte a lógica do empurrão: o lead não avança por pressão de meta — o vendedor puxa o próximo card quando tem capacidade real de atender.** Cada coluna tem um limite de trabalho em andamento. Se Negociação está cheia, o gargalo fica visível e o time para de gerar lead novo.',
    },
    {
      type: 'p',
      text:
        'Para quem trabalha sozinho, a regra é a mesma em miniatura: só avance um card quando o anterior estiver resolvido — respondido, reagendado ou perdido com motivo.',
    },
    { type: 'h2', text: 'Quais estágios usar no Kanban de vendas?' },
    {
      type: 'p',
      text:
        'Comece com cinco estágios — os mesmos do Play Hot Leads (new, contacted, negotiation, won, lost): Novo, Contatado, Negociação, Ganho e Perdido. Mais que isso cria burocracia; menos esconde o gargalo.',
    },
    { type: 'h3', text: 'Novo' },
    {
      type: 'p',
      text:
        'Lead recém-chegado à base, sem contato. No Play Hot Leads, todo lead único de uma busca por nicho + cidade cai aqui. Regra: nenhum card dorme uma semana em Novo — contata ou arquiva.',
    },
    { type: 'h3', text: 'Contatado' },
    {
      type: 'p',
      text:
        'Você falou com o lead — WhatsApp, ligação ou e-mail — e aguarda resposta. Registrar data e canal do primeiro contato evita mensagem duplicada no mesmo dia.',
    },
    { type: 'h3', text: 'Negociação' },
    {
      type: 'p',
      text:
        'Existe conversa de compra real: preço, escopo, prazo. É a coluna que merece mais atenção e a primeira candidata a limite. Se cresce sem controle, o problema não é lead — é fechamento.',
    },
    { type: 'h3', text: 'Ganho' },
    {
      type: 'p',
      text:
        'Venda fechada. Registre o que funcionou: nicho, cidade e mensagem que converteram alimentam a próxima busca.',
    },
    { type: 'h3', text: 'Perdido' },
    {
      type: 'p',
      text:
        'Não comprou — preço, timing ou sem resposta. Perdido com motivo vale mais que Perdido em branco: busca inteira perdendo por preço diz algo sobre a oferta, não sobre a fonte.',
    },
    { type: 'h2', text: 'Como implantar o Kanban de vendas hoje: 5 passos' },
    {
      type: 'steps',
      title: 'Implantação em uma tarde',
      steps: [
        {
          name: 'Defina os cinco estágios',
          text:
            'Novo, Contatado, Negociação, Ganho e Perdido. Escreva em uma linha o critério de entrada e saída de cada coluna — sem critério, a coluna vira depósito.',
        },
        {
          name: 'Alimente o quadro com leads deduplicados',
          text:
            'Lista copiada de três fontes traz o mesmo negócio duas vezes. No Play Hot Leads, cada lead ganha uma chave SHA-1 do telefone em E.164, do domínio e do nome normalizado — o mesmo negócio vira um card só.',
        },
        {
          name: 'Fixe um limite por coluna',
          text:
            'Trabalha sozinho? Cinco cards em Negociação já é muito. O limite força o fechamento antes da caçada por lead novo.',
        },
        {
          name: 'Crie o ritual de arrastar',
          text:
            'O card muda no momento do contato: respondeu, arrastou. Nenhuma conversa fora do quadro e nenhum card sem próxima ação.',
        },
        {
          name: 'Revise o quadro uma vez por semana',
          text:
            'Cinco minutos: Novo acumulado é problema de prospecção; Negociação acumulada é problema de oferta ou follow-up. O quadro mostra qual atacar.',
        },
      ],
    },
    { type: 'h2', text: 'Qual a diferença entre planilha, CRM tradicional e Kanban leve?' },
    {
      type: 'p',
      text:
        'As três opções respondem à mesma pergunta — quem é meu lead e em que pé ele está — com custo e atrito diferentes. O quadro resume o que muda na prática:',
    },
    {
      type: 'table',
      caption: 'Planilha vs. CRM tradicional vs. Kanban leve',
      headers: ['Critério', 'Planilha', 'CRM tradicional', 'Kanban leve'],
      rows: [
        ['Tempo para começar', 'Minutos', 'Semanas (setup, campos, permissões)', 'Horas — colunas já prontas'],
        ['Deduplicação de leads', 'Manual (e raramente feita)', 'Configurável, depende de implementação', 'Automática na entrada do lead'],
        ['Visão do funil', 'Filtros e cores', 'Relatórios e dashboards', 'Cards arrastáveis entre colunas'],
        ['Risco de abandono', 'Alto — ninguém atualiza', 'Médio — depende de disciplina', 'Baixo — arrastar é mais fácil que preencher'],
        ['Custo para começar', 'Zero, mas o preço é retrabalho', 'Mensalidade + implantação', 'Grátis — 150 créditos no Play Hot Leads'],
      ],
    },
    {
      type: 'p',
      text:
        'A resposta honesta: para time complexo, com ciclo longo e relatório para diretoria, o CRM tradicional se justifica. Para negócio local que vende por WhatsApp, o Kanban leve cobre o essencial — prospectar, mover, fechar — sem implantação.',
    },
    {
      type: 'faq',
      items: [
        {
          q: 'Kanban de vendas funciona para quem vende sozinho?',
          a:
            'Funciona melhor justamente nesse caso. O dono acumula prospecção e venda; o quadro substitui a memória. Cinco colunas e o hábito de arrastar o card após cada contato bastam.',
        },
        {
          q: 'Qual a diferença entre funil de vendas e Kanban?',
          a:
            'O funil é o modelo; o Kanban é a implementação visual dele: cada lead vira um card que você move entre as etapas. É um funil operável — o gargalo fica visível e pode ser atacado no mesmo dia.',
        },
        {
          q: 'Quantos estágios devo usar?',
          a:
            'Cinco: Novo, Contatado, Negociação, Ganho e Perdido. Só adicione coluna quando uma etapa real ficar invisível — cada coluna extra custa disciplina de atualização.',
        },
        {
          q: 'Como alimentar o Kanban sem prospecção manual?',
          a:
            'Automatize a entrada. A busca por nicho + cidade no Play Hot Leads roda em 8 fontes, a dedup elimina repetidos e os leads únicos entram como Novo, com telefone em E.164. O cadastro grátis vem com 150 créditos — 1 por lead único.',
        },
      ],
    },
    {
      type: 'summary',
      items: [
        'Card por lead, coluna por estágio: o movimento do card é o processo.',
        'Método pull: avance com capacidade; limite por coluna expõe o gargalo.',
        'Cinco estágios padrão cobrem o ciclo de venda local.',
        'Dedup automático e telefone em E.164 na entrada poupam o trabalho que mata planilhas.',
      ],
    },
    {
      type: 'links',
      title: 'Continue por aqui',
      items: [
        {
          label: 'Prospecção por nicho e localização',
          href: '/blog/prospeccao-por-nicho-e-localizacao',
          description: 'O guia para montar listas segmentadas por nicho e cidade.',
        },
        {
          label: 'Como encontrar leads no WhatsApp',
          href: '/blog/como-encontrar-leads-no-whatsapp',
          description: 'Do telefone em E.164 à conversa: alimente a coluna Contatado.',
        },
        {
          label: 'O que é lead geração',
          href: '/blog/o-que-e-lead-generacao',
          description: 'Conceitos e fontes para quem está começando do zero.',
        },
        {
          label: 'Fontes de dados para encontrar leads locais',
          href: '/blog/fontes-de-dados-para-encontrar-leads-locais',
          description: 'Compare as fontes de busca e saiba quando usar cada uma.',
        },
        {
          label: 'Glossário de vendas e prospecção',
          href: '/glossario',
          description: 'WIP, dedup, E.164: termos usados aqui, definidos de forma direta.',
        },
        {
          label: 'Funcionalidades do Play Hot Leads',
          href: '/#funcionalidades',
          description: 'Kanban, dedup multi-fonte e busca global no mesmo fluxo.',
        },
      ],
    },
  ],
  related: [
    'fontes-de-dados-para-encontrar-leads-locais',
    'lgpd-e-prospeccao-de-leads',
    'prospeccao-por-nicho-e-localizacao',
    'como-encontrar-leads-no-whatsapp',
    'o-que-e-lead-generacao',
  ],
}
