// src/content/posts/como-encontrar-leads-no-whatsapp.ts
import type { BlogPost } from '@/content/types'

export const POST: BlogPost = {
  slug: 'como-encontrar-leads-no-whatsapp',
  title: 'Como encontrar leads no WhatsApp: guia completo',
  description:
    'Passo a passo para encontrar leads com WhatsApp válido por nicho e cidade: fontes de dados públicos, validação de número e primeira abordagem que não gera bloqueio.',
  keywords: [
    'leads whatsapp',
    'encontrar números de whatsapp',
    'prospecção whatsapp',
    'lista de contatos whatsapp',
    'whatsapp business prospecção',
  ],
  category: 'Prospecção',
  tags: ['whatsapp', 'prospecção ativa', 'leads locais', 'primeira abordagem'],
  authorId: 'rafael-nogueira',
  datePublished: '2026-06-20T09:00:00-03:00',
  dateModified: '2026-09-20T09:00:00-03:00',
  readingMinutes: 9,
  blocks: [
    {
      type: 'takeaways',
      items: [
        'WhatsApp é o canal com maior taxa de resposta no Brasil: a primeira abordagem chega onde e-mail cai em spam.',
        'Números de WhatsApp de negócios existem em fontes públicas: sites, diretórios e cadastros de mapa.',
        'Número válido é diferente de número com WhatsApp ativo — valide antes de disparar.',
        'Dedupe a base antes de abordar: contato repetido é o caminho mais rápido para bloqueio.',
        'A primeira mensagem deve fazer uma pergunta de interesse, não vender no primeiro toque.',
      ],
    },
    {
      type: 'bluf',
      text: 'Para encontrar leads no WhatsApp, você precisa de três coisas: uma base de contatos com números móveis do seu nicho e cidade, validação de que cada número tem WhatsApp ativo e um fluxo de abordagem com cadência respeitosa. Este guia mostra como montar as três usando apenas dados públicos — sem comprar listas de origem desconhecida.',
    },
    {
      type: 'h2',
      text: 'Por que WhatsApp ainda domina a prospecção no Brasil',
    },
    {
      type: 'p',
      text: 'O WhatsApp é o canal padrão de comunicação comercial no Brasil: pequenos negócios usam o número do WhatsApp como telefone oficial de atendimento, e o cliente espera resposta em minutos, não em dias. Para quem prospecta, isso significa que **a mesma lista que serviria para um telemarketing funciona melhor como base de WhatsApp** — desde que os números sejam móveis e estejam realmente no aplicativo.',
    },
    {
      type: 'p',
      text: 'O gargalo nunca foi enviar a mensagem — foi conseguir uma **base limpa**: número certo, do nicho certo, na cidade certa, sem duplicados. Listas compradas resolvem volume e falham nos quatro critérios ao mesmo tempo.',
    },
    {
      type: 'h2',
      text: 'Onde encontrar números de WhatsApp de negócios (fontes públicas)',
    },
    {
      type: 'p',
      text: 'Negócios locais publicam o próprio contato o tempo todo. As fontes abaixo concentram números comerciais públicos — e todas são usadas pelo Play Hot Leads em uma única busca:',
    },
    {
      type: 'table',
      caption: 'Fontes públicas de contatos de negócios e o que entregam',
      headers: ['Fonte', 'O que entrega', 'WhatsApp direto?', 'Custo'],
      rows: [
        ['Google Places / Maps', 'Telefone comercial, site, endereço e horário', 'Indireto (o telefone costuma ser o WhatsApp do estabelecimento)', 'Gratuito via busca; API oficial é paga por chamada'],
        ['Overpass / OpenStreetMap', 'Milhares de POIs por categoria e área, com telefone quando cadastrado', 'Indireto', 'Gratuito'],
        ['Yelp e Yellow Pages', 'Diretórios com telefone e site', 'Indireto', 'Gratuito (scraping responsável)'],
        ['Site da própria empresa', 'Página de contato com WhatsApp, e-mail e redes sociais', 'Sim (wa.me ou botão flutuante)', 'Gratuito (crawl)'],
        ['Instagram / Facebook do negócio', 'Link de WhatsApp na bio', 'Sim', 'Gratuito (crawl)'],
      ],
    },
    {
      type: 'p',
      text: 'O padrão que funciona é **agregar todas as fontes e cruzar**: o Google Places acha a pizzaria, o crawl do site dela encontra o botão de WhatsApp e o Instagram. Um lead multi-fonte com telefone E.164 validado vale mais que 50 nomes soltos de uma planilha.',
    },
    {
      type: 'h2',
      text: 'Como validar se o número tem WhatsApp ativo',
    },
    {
      type: 'ol',
      items: [
        '**Normalize o número para o formato internacional (E.164)** — no Brasil, +55 + DDD + número. A biblioteca libphonenumber (usada pelo Play Hot Leads) resolve isso automaticamente por país.',
        '**Use o wa.me para conferir** — o link https://wa.me/55DDDNÚMERO abre a conversa se o número estiver no WhatsApp. Manualmente funciona para conferir alguns; em escala, ferramentas que geram o link por lead economizam horas.',
        '**Descarte móvel fixo** — libphonenumber informa se o número é móvel ou fixo. Fixos raramente têm WhatsApp.',
        '**Marque o lead como “tem WhatsApp” no seu CRM** — o Play Hot Leads já sinaliza isso no card, e as campanhas só abordam quem está sinalizado.',
      ],
    },
    {
      type: 'h2',
      text: 'A primeira abordagem: como não ser bloqueado na primeira mensagem',
    },
    {
      type: 'p',
      text: 'Bloqueio não vem do volume — vem da mensagem. Três regras resolvem 90% dos casos:',
    },
    {
      type: 'ul',
      items: [
        '**Se identifique no primeiro toque.** Nome + empresa + motivo curto da abordagem. Mensagem sem remetente parece golpe.',
        '**Faça uma pergunta de interesse, não um pitch.** “Posso te enviar uma previsão de quantos clientes vocês poderiam atender por mês?” abre conversa; parágrafo de 10 linhas com tabela de preços fecha.',
        '**Respeite o opt-out imediatamente.** “Se preferir não receber mensagens, me avisa” — e nunca mais manda. Cadência razoável é o que mantém o número vivo no longo prazo.',
      ],
    },
    {
      type: 'steps',
      title: 'Fluxo completo para gerar leads de WhatsApp hoje',
      steps: [
        {
          name: 'Defina nicho e cidade',
          text: '“Clínicas odontológicas em Curitiba” é uma busca. “Dentistas” é um desejo. Nicho estreito + localização clara = taxa de resposta maior.',
        },
        {
          name: 'Rode a busca multi-fonte',
          text: 'No Play Hot Leads, a busca dispara todas as fontes em paralelo e deduplica automaticamente — 1 crédito por lead único entregue, com novos cadastros recebendo 150 créditos grátis.',
        },
        {
          name: 'Filtre quem tem WhatsApp',
          text: 'Cards com selo de WhatsApp vêm do crawl dos sites e da normalização E.164. Ordene por esses leads primeiro.',
        },
        {
          name: 'Organize o funil no Kanban',
          text: 'Mova os leads abordados de “Novo” para “Contatado” e acompanhe respostas. O Kanban do Play Hot Leads persiste cada movimento.',
        },
        {
          name: 'Dispare a campanha com cadência',
          text: 'Use template com variáveis ({{empresa}}, {{cidade}}), uma pergunta no final e opt-out. Acompanhe enviados, entregues e respostas por campanha.',
        },
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Comece pelo público que já se declarou',
      text: 'Negócios que publicam botão de WhatsApp no site já usam o canal comercialmente — a taxa de resposta dessa fatia é sistematicamente maior. O crawl do Play Hot Leads prioriza exatamente esses leads.',
    },
    {
      type: 'h2',
      text: 'Erros que queimam o número (e como evitar)',
    },
    {
      type: 'table',
      caption: 'Erros comuns de prospecção via WhatsApp e a correção',
      headers: ['Erro', 'Consequência', 'Correção'],
      rows: [
        ['Comprar lista pronta', 'Números errados, duplicados, fora do nicho — e denúncia de spam', 'Gerar a base de fontes públicas, por nicho e cidade'],
        ['Enviar pitch no primeiro toque', 'Bloqueio e possível banimento do número', 'Pergunta de interesse + identificação clara'],
        ['Não deduplicar a base', 'Mesmo contato recebe 2–3 mensagens', 'Dedup automático por telefone (E.164), domínio e nome'],
        ['Disparar tudo de uma vez', 'Padrão de automação → risco de ban', 'Cadência humana espaçada por envio'],
        ['Ignorar opt-out', 'Denúncia + reputação do número destruída', 'Opt-out claro em todo template e registro dos excluídos'],
      ],
    },
    {
      type: 'h2',
      text: 'Perguntas frequentes sobre leads de WhatsApp',
    },
    {
      type: 'faq',
      items: [
        {
          q: 'Comprar lista de WhatsApp funciona?',
          a: 'Raramente. Listas prontas não são segmentadas por nicho/cidade atual, misturam números desativados e violam boas práticas de origem de dados. Gerar a própria base de fontes públicas custa menos e converte mais.',
        },
        {
          q: 'Preciso da API oficial do WhatsApp Business para prospectar?',
          a: 'Não para começar. O Play Hot Leads gera links wa.me reais por lead para abordagem manual ou campanha com cadência, e a integração com a API oficial (Cloud API) entra quando o volume justifica.',
        },
        {
          q: 'Como sei que o número é do negócio e não de um morador?',
          a: 'Cruzamento de fontes: telefone vindo do cadastro de mapa/diretório + site institucional é comercial. A normalização E.164 garante que o DDD está correto para a cidade buscada.',
        },
        {
          q: 'Quantas mensagens posso enviar por dia?',
          a: 'Não existe número mágico — o que existe é cadência razoável e opt-out. Comece com volume que consiga acompanhar as respostas (dezenas, não milhares) e escale conforme a taxa de resposta.',
        },
        {
          q: 'O Play Hot Leads garante que todo lead tem WhatsApp?',
          a: 'Não — nenhum dado público garante isso. O que ele faz é sinalizar leads com WhatsApp detectado no crawl (wa.me, botões de contato) e normalizar todos os números para E.164, elevando muito a proporção de contatos aproveitáveis.',
        },
      ],
    },
    {
      type: 'links',
      title: 'Continue por aqui',
      items: [
        {
          label: 'Prospecção B2B por nicho e localização: o método em 5 passos',
          href: '/blog/prospeccao-por-nicho-e-localizacao',
          description: 'O método completo que define a busca antes de qualquer mensagem.',
        },
        {
          label: 'Fontes de dados para encontrar leads locais em 2026',
          href: '/blog/fontes-de-dados-para-encontrar-leads-locais',
          description: 'Comparativo honesto de Google Places, OpenStreetMap, diretórios e crawl.',
        },
        {
          label: 'Kanban de vendas: como organizar leads e vender mais',
          href: '/blog/kanban-de-vendas-como-organizar-leads',
          description: 'Como não perder o lead depois que ele entra na base.',
        },
        {
          label: 'Glossário de vendas e prospecção',
          href: '/glossario',
          description: 'Definições diretas dos termos usados neste guia.',
        },
        {
          label: 'Abrir o app e rodar a primeira busca',
          href: '/#demo',
          description: 'Veja as fontes trabalhando em paralelo, ao vivo.',
        },
      ],
    },
    {
      type: 'summary',
      items: [
        'Base limpa vence volume: fontes públicas + dedup por E.164/domínio/nome.',
        'Valide WhatsApp antes de abordar (wa.me + libphonenumber).',
        'Primeira mensagem: identificação + pergunta de interesse + opt-out.',
        'Cadência respeitosa preserva o número; disparo em massa o destrói.',
        'O Play Hot Leads automatiza as etapas 1–3 e o Kanban organiza o resto.',
      ],
    },
  ],
  related: [
    'prospeccao-por-nicho-e-localizacao',
    'fontes-de-dados-para-encontrar-leads-locais',
    'kanban-de-vendas-como-organizar-leads',
  ],
}
