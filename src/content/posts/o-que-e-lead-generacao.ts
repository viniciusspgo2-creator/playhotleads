// src/content/posts/o-que-e-lead-generacao.ts
import type { BlogPost } from '@/content/types'

export const POST: BlogPost = {
  slug: 'o-que-e-lead-generacao',
  title: 'O que é lead generation: guia definitivo com exemplos',
  description:
    'Definição direta de lead generation, a diferença entre lead, prospect, MQL e SQL, o processo passo a passo e como aplicar em negócios locais brasileiros.',
  keywords: [
    'o que é lead',
    'lead generation',
    'geração de leads',
    'diferença lead e prospect',
    'mql sql diferença',
  ],
  category: 'Prospecção',
  tags: ['fundamentos', 'lead generation', 'funil', 'definições'],
  authorId: 'rafael-nogueira',
  datePublished: '2026-07-01T09:00:00-03:00',
  dateModified: '2026-09-15T09:00:00-03:00',
  readingMinutes: 8,
  blocks: [
    {
      type: 'takeaways',
      items: [
        'Lead generation é o processo de transformar desconhecidos em contatos interessados — e interessados em conversas de vendas.',
        'Lead ≠ prospect: todo prospect já foi lead, mas nem todo lead tem perfil para comprar.',
        'MQL e SQL existem para evitar que vendedor gaste tempo com quem não está pronto.',
        'Para negócios locais, geração de leads é lista de empresas da região com contato válido — não formulário genérico de site.',
        'Sem dedup e enriquecimento, a lista cresce e a qualidade cai: mais leads não é o objetivo, mais conversas é.',
      ],
    },
    {
      type: 'bluf',
      text: 'Lead generation (geração de leads) é o conjunto de práticas que identifica, coleta e qualifica contatos de potenciais clientes para o funil de vendas. Um lead é qualquer negócio ou pessoa que tem o perfil de comprar e cujo contato você possui; geração de leads é o processo que produz essa lista de forma repetível — por conteúdo, indicação ou prospecção ativa com dados públicos.',
    },
    {
      type: 'h2',
      text: 'O que é um lead? (definição clara)',
    },
    {
      type: 'p',
      text: '**Um lead é um contato identificado de um potencial cliente** — para uma pizzaria, o organizador de eventos corporativos da região; para uma agência, o dentista da cidade ao lado que tem site mas sem agenda cheia. O lead tem dois atributos mínimos: **perfil** (se encaixa no que você vende) e **contato** (um meio real de conversar).',
    },
    {
      type: 'p',
      text: 'Essa definição tem uma consequência prática: um nome numa planilha sem telefone nem e-mail não é lead — é linha solta. E um contato do nicho errado também não é lead seu: é lead de outro vendedor. **Perfil + contato** é o teste que qualquer lista precisa passar.',
    },
    {
      type: 'h2',
      text: 'Lead × prospect × MQL × SQL: qual a diferença?',
    },
    {
      type: 'p',
      text: 'Os termos convivem e se confundem — e essa confusão custa tempo de vendedor. A tabela abaixo consolida o vocabulário padrão de funil:',
    },
    {
      type: 'table',
      caption: 'Vocabulário do funil: quem é quem',
      headers: ['Termo', 'Definição', 'Exemplo no nicho local'],
      rows: [
        ['Lead', 'Contato com perfil e meio de contato', 'Telefone comercial da academia nova do bairro'],
        ['Prospect', 'Lead que foi qualificado e tem fit real com a oferta', 'Academia sem sistema de agendamento, com 3 unidades'],
        ['MQL (Marketing Qualified Lead)', 'Lead que demonstrou interesse por ação (baixou, se inscreveu, clicou)', 'Dentista que baixou seu e-book de captação de pacientes'],
        ['SQL (Sales Qualified Lead)', 'MQL validado por vendas: pronto para conversa comercial', 'Dentista que respondeu o WhatsApp e pediu orçamento'],
        ['Oportunidade', 'SQL com necessidade, prazo e orçamento em discussão', 'Proposta enviada para 2 unidades da rede'],
      ],
    },
    {
      type: 'p',
      text: 'A ordem importa: **lead → prospect → MQL → SQL → oportunidade**. Ferramentas não criam esses estágios — disciplina de Kanban cria. É por isso que o Play Hot Leads nasce com estágios (Novo, Contatado, Negociação, Ganho, Perdido) em vez de campos soltos.',
    },
    {
      type: 'h2',
      text: 'Como funciona o processo de lead generation na prática',
    },
    {
      type: 'ol',
      items: [
        '**Defina o ICP (perfil de cliente ideal):** segmento, porte, cidade, sinal de dor. Sem ICP, toda lista parece boa.',
        '**Escolha a fonte de coleta:** conteúdo (inbound), indicação ou prospecção ativa com dados públicos (outbound). Para negócios locais, a terceira é a mais rápida de iniciar.',
        '**Colete e normaliz:** telefones no formato internacional (E.164), nomes padronizados, sites validados.',
        '**Deduplique:** o mesmo negócio chega por Google Places, Yelp e OSM — deve virar um card, não três.',
        '**Enriqueça:** e-mail institucional, WhatsApp e redes sociais vêm do site da própria empresa (crawl).',
        '**Qualifique e aborde:** priorize por sinal de contato, registre cada toque no funil e meça resposta por nicho/cidade.',
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'O erro nº 1 de quem começa',
      text: 'Buscar volume antes de definir ICP. 500 leads “talvez” geram menos conversa que 60 leads “é exatamente meu cliente”. Primeiro o perfil, depois a escala.',
    },
    {
      type: 'h2',
      text: 'Lead generation para negócios locais: o que muda',
    },
    {
      type: 'p',
      text: 'No B2B de mercado amplo, lead gen costuma significar conteúdo + formulário. No **mercado local brasileiro**, o jogo é outro: seus clientes (dentistas, pizzarias, imobiliárias) não preenchem formulário de site — eles têm telefone, WhatsApp e Instagram. A geração de leads local se apoia em:',
    },
    {
      type: 'ul',
      items: [
        '**Cadastros públicos de negócios** (Google Places, OpenStreetMap, diretórios) — a fonte natural de contatos comerciais.',
        '**Site e redes da própria empresa** — onde moram WhatsApp, e-mail institucional e Instagram (enriquecimento por crawl).',
        '**Localização como variável de segmentação** — bairro e região metropolitana definem o raio comercial tanto quanto o nicho.',
        '**Velocidade de contato** — lead local esfria em dias; a busca multi-fonte entrega a lista em segundos, e a abordagem acontece no mesmo dia.',
      ],
    },
    {
      type: 'h2',
      text: 'Quanto custa um lead? (resposta honesta)',
    },
    {
      type: 'p',
      text: 'Depende de três variáveis: **fonte** (dados públicos são praticamente gratuitos; mídia paga custa por clique), **qualificação** (lista bruta custa menos e converte menos; lead qualificado custa mais e converte muito mais) e **tempo do time** (coletar manualmente é caro em hora humana, não em dinheiro de ferramenta). A métrica que importa no fim é o **CAC** — custo de aquisição por cliente fechado — e não o custo por linha da lista.',
    },
    {
      type: 'p',
      text: 'No modelo de créditos do Play Hot Leads a matemática fica explícita: **1 crédito = 1 lead único entregue**, e novos cadastros começam com 150 créditos grátis. Se 60 leads geram 1 cliente, você sabe exatamente qual CAC esperar antes da primeira mensagem.',
    },
    {
      type: 'h2',
      text: 'Perguntas frequentes sobre lead generation',
    },
    {
      type: 'faq',
      items: [
        {
          q: 'Lead generation é o mesmo que prospecção?',
          a: 'Prospecção é uma das formas de gerar leads (a ativa, com busca e abordagem). Lead generation é o guarda-chuva: inclui também inbound, indicação e parcerias.',
        },
        {
          q: 'Todo lead é um cliente em potencial?',
          a: 'Todo lead deve TER o perfil de cliente — não necessariamente a intenção agora. A qualificação (prospect → MQL → SQL) existe justamente para descobrir quem tem intenção e momento.',
        },
        {
          q: 'Qual a diferença entre MQL e SQL?',
          a: 'MQL demonstrou interesse por ação de marketing (baixou material, se inscreveu); SQL foi validado por vendas como pronto para conversa comercial. O MQL vira SQL na transferência entre marketing e vendas.',
        },
        {
          q: 'Quantos leads eu preciso por mês?',
          a: 'Trabalhe de trás para frente: meta de clientes ÷ taxa de fechamento = conversas necessárias; conversas ÷ taxa de resposta = leads necessários. Com 1 cliente a cada 60 leads e meta de 3 clientes, a conta exige ~180 leads/mês.',
        },
        {
          q: 'Comprar leads é ilegal no Brasil?',
          a: 'Comprar listas de origem desconhecida é arriscado (origem dos dados, consentimento e LGPD). Coletar dados comerciais públicos de empresas, com finalidade legítima e cadência responsável, é o caminho usado por prospecção séria — veja nosso guia de LGPD.',
        },
      ],
    },
    {
      type: 'links',
      title: 'Aplique agora',
      items: [
        {
          label: 'Prospecção B2B por nicho e localização: o método em 5 passos',
          href: '/blog/prospeccao-por-nicho-e-localizacao',
          description: 'O método completo para gerar a lista certa na cidade certa.',
        },
        {
          label: 'Glossário de vendas e prospecção',
          href: '/glossario',
          description: 'ICP, MQL, SQL, CAC, LTV e 10+ termos definidos de forma citável.',
        },
        {
          label: 'Kanban de vendas: como organizar leads e vender mais',
          href: '/blog/kanban-de-vendas-como-organizar-leads',
          description: 'Onde cada lead mora depois de entrar na base.',
        },
        {
          label: 'FAQ do Play Hot Leads',
          href: '/faq',
          description: 'Créditos, fontes, países e formas de pagamento.',
        },
      ],
    },
    {
      type: 'summary',
      items: [
        'Lead = perfil + contato; lead generation = processo repetível que produz essa lista.',
        'Funil: lead → prospect → MQL → SQL → oportunidade — disciplina de estágios é o que gera dados.',
        'No mercado local, os contatos vivem em cadastros públicos e no site das empresas.',
        'Dedup e enriquecimento são o que separam lista de leads de lista de nomes.',
        '1 crédito = 1 lead único no Play Hot Leads, com 150 créditos grátis no cadastro.',
      ],
    },
  ],
  related: [
    'prospeccao-por-nicho-e-localizacao',
    'kanban-de-vendas-como-organizar-leads',
    'como-encontrar-leads-no-whatsapp',
  ],
}
