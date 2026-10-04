// src/content/posts/prospeccao-por-nicho-e-localizacao.ts
import type { BlogPost } from '@/content/types'

export const POST: BlogPost = {
  slug: 'prospeccao-por-nicho-e-localizacao',
  title: 'Prospecção B2B por nicho e localização: o método',
  description:
    'O método de prospecção que cruza nicho + cidade para gerar listas de leads altamente relevantes: expansão de região, multi-fonte, dedup e priorização de contatos.',
  keywords: [
    'prospecção b2b',
    'prospecção por nicho',
    'gerar leads por cidade',
    'lista de empresas locais',
    'método de prospecção',
  ],
  category: 'Prospecção',
  tags: ['prospecção ativa', 'nicho', 'localização', 'leads locais', 'método'],
  authorId: 'rafael-nogueira',
  datePublished: '2026-06-05T09:00:00-03:00',
  dateModified: '2026-09-25T09:00:00-03:00',
  readingMinutes: 10,
  featured: true,
  blocks: [
    {
      type: 'takeaways',
      items: [
        'Prospecção por nicho + localização troca volume bruto por relevância: cada contato sabe por que você está falando com ele.',
        'Uma cidade só é um mercado quando expandida: bairros e região metropolitana multiplicam a base sem perder o perfil.',
        'Nenhuma fonte sozinha cobre tudo — a busca paralela em múltiplas fontes públicas é o que revela o mercado real.',
        'Dedup é a etapa que separa lista profissional de lista amadora: mesmo negócio, uma única linha.',
        'O critério de priorização não é o nome da empresa, é o sinal de contato: telefone comercial, site, WhatsApp e e-mail ativos.',
      ],
    },
    {
      type: 'bluf',
      text: 'Prospecção por nicho e localização é o método que define a lista antes de abrir qualquer canal de contato: você escolhe um segmento (ex.: clínicas odontológicas) e uma área (ex.: Curitiba e região), coleta todas as empresas desse segmento naquela área a partir de fontes públicas, deduplica o resultado e só então aborda — com uma mensagem que faz sentido para aquele negócio naquela cidade. É o oposto de comprar uma lista genérica de “empresários”.',
    },
    {
      type: 'h2',
      text: 'Por que nicho + localização vencem listas genéricas',
    },
    {
      type: 'p',
      text: 'Uma lista genérica responde à pergunta errada (“quem tem e-mail?”) em vez da certa (“quem vende o que eu resolvo, perto de mim?”). Quando a prospecção parte de nicho + localização, três coisas mudam de imediato:',
    },
    {
      type: 'ul',
      items: [
        '**A mensagem fica específica.** “Ajudo academias em Campinas a preencher horários vazios” converge — “tenho uma solução incrível” diverge.',
        '**A taxa de resposta sobe sem aumentar o volume.** Você fala com 80 empresas certas em vez de 800 erradas.',
        '**O funil fica mensurável.** Nicho e cidade são variáveis: dá para comparar resposta de “dentistas em Curitiba” contra “dentistas em Florianópolis” e decidir onde investir.',
      ],
    },
    {
      type: 'table',
      caption: 'Lista comprada vs. base gerada por nicho e localização',
      headers: ['Critério', 'Lista comprada', 'Base por nicho + localização'],
      rows: [
        ['Segmentação', 'Genérica (“empresários BR”)', 'Exata: nicho × cidade × região'],
        ['Atualização', 'Congelada na compra', 'Coletada agora, de fontes públicas'],
        ['Duplicidade', 'Alta (revenda reciclada)', 'Zero, com dedup automático'],
        ['Contexto do lead', 'Só contato', 'Telefone, site, e-mail, redes, avaliação'],
        ['Risco LGPD', 'Origem desconhecida', 'Dados públicos de negócios + cadência responsável'],
        ['Custo marginal', 'Paga-se a cada nova lista', 'Busca nova = pool novo, em segundos'],
      ],
    },
    {
      type: 'h2',
      text: 'O método: nicho → localização → fontes → dedup → contato',
    },
    {
      type: 'steps',
      title: 'Os 5 passos do método',
      steps: [
        {
          name: '1. Escolha o nicho pela dor, não pela categoria',
          text: '“Clínica odontológica” é categoria. “Clínicas que não têm agenda cheia” é dor. O nicho define a mensagem: quanto mais específico o problema que você resolve, mais curta fica a abordagem.',
        },
        {
          name: '2. Defina a localização em três camadas',
          text: 'Cidade-centro, bairros e região metropolitana. O Play Hot Leads expande a cidade automaticamente (geocoding + cidades da região) para que uma busca em “Curitiba” alcance São José dos Pinhais e Pinhais também.',
        },
        {
          name: '3. Colete de várias fontes em paralelo',
          text: 'Google Places, OpenStreetMap (Overpass), Nominatim, Photon, Yelp, Yellow Pages e o site de cada empresa. Fontes distintas têm buracos distintos — a interseção é o mercado real.',
        },
        {
          name: '4. Deduplique no nível de banco de dados',
          text: 'O mesmo negócio aparece em 3–4 fontes. O Play Hot Leads gera uma dedup_key por lead — hash SHA-1 de telefone (E.164) + domínio do site + nome normalizado — e o banco rejeita duplicados, fundindo as fontes num card só com badge “2 fontes ✓”.',
        },
        {
          name: '5. Priorize por sinal de contato e aborde',
          text: 'Primeiro quem tem WhatsApp ou e-mail institucional (enriquecimento por crawl), depois o resto. Cada lead entra no Kanban como “Novo” e sai do estágio no primeiro toque.',
        },
      ],
    },
    {
      type: 'h2',
      text: 'Como expandir uma cidade sem perder o perfil do nicho',
    },
    {
      type: 'p',
      text: 'A expansão geográfica é o multiplicador silencioso do método. Duas técnicas produzem quase toda a cobertura:',
    },
    {
      type: 'ol',
      items: [
        '**Expansão por região metropolitana:** cidades vizinhas compartilham o mesmo perfil econômico. Um dermatologista em Pinhais atende o mesmo público que um em Curitiba — a busca deve alcançar os dois.',
        '**Expansão por sinônimos de nicho:** “clínica odontológica”, “dentista”, “ortodontista” e “consultório odontológico” são negócios distintos nos cadastros públicos. Uma busca madura roda os sinônimos — o Play Hot Leads faz isso com expansão assistida por IA, com fallback estático.',
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      title: 'Regra prática de cobertura',
      text: 'Se a busca num nicho/cidade devolveu menos de 30 leads únicos, o problema não é o nicho — é a cobertura. Expanda a região ou os sinônimos antes de mudar de segmento.',
    },
    {
      type: 'h2',
      text: 'O que fazer nos primeiros 10 minutos com a lista',
    },
    {
      type: 'ul',
      items: [
        '**Filtre por sinal de contato:** quem tem site ativo e telefone comercial validado (E.164) entra primeiro na fila.',
        '**Separe um lote pequeno e real:** 20 leads abordados bem valem mais que 200 esquentados errado.',
        '**Registre o estágio no Kanban desde o primeiro toque** — sem isso, nenhum número do funil significa nada na próxima semana.',
        '**Compare nichos por semana:** a busca guarda nicho, cidade, total encontrado e duplicados — os dados para decidir o próximo mercado já estão aí.',
      ],
    },
    {
      type: 'h2',
      text: 'Perguntas frequentes sobre prospecção por nicho e localização',
    },
    {
      type: 'faq',
      items: [
        {
          q: 'Quantos leads uma cidade de médio porte entrega?',
          a: 'Depende do nicho e da cobertura das fontes. Numa busca real de “pet shop em Curitiba” com as fontes gratuitas, o Play Hot Leads entregou mais de 70 leads únicos — com dedup cross-search, buscas repetidas na mesma cidade apenas somam contatos novos.',
        },
        {
          q: 'Vale a pena prospectar nichos muito pequenos?',
          a: 'Vale, com expansão. Nicho estreito em área ampla (região metropolitana inteira) costuma render menos volume com taxa de resposta mais alta — o funil fecha em menos passos.',
        },
        {
          q: 'Preciso de ferramenta para aplicar o método?',
          a: 'Não obrigatoriamente — dá para fazer manualmente com mapas, diretórios e planilha. A ferramenta existe para eliminar o trabalho mecânico: paralelizar fontes, deduplicar, normalizar telefones e organizar o funil.',
        },
        {
          q: 'Como o método respeita a LGPD?',
          a: 'Trabalhando apenas com dados comerciais públicos de negócios (nome da empresa, telefone comercial, site, e-mail institucional), com cadência razoável e opt-out — nunca dados pessoais sensíveis. Veja o guia de LGPD e prospecção para o checklist completo.',
        },
      ],
    },
    {
      type: 'links',
      title: 'Aprofunde no método',
      items: [
        {
          label: 'Como encontrar leads no WhatsApp: guia completo',
          href: '/blog/como-encontrar-leads-no-whatsapp',
          description: 'Do número válido à primeira mensagem sem bloqueio.',
        },
        {
          label: 'Fontes de dados para encontrar leads locais em 2026',
          href: '/blog/fontes-de-dados-para-encontrar-leads-locais',
          description: 'O comparativo completo das fontes públicas do método.',
        },
        {
          label: 'O que é lead generation: guia definitivo',
          href: '/blog/o-que-e-lead-generacao',
          description: 'Os fundamentos por trás do método, com vocabulário do funil.',
        },
        {
          label: 'Glossário de prospecção',
          href: '/glossario',
          description: 'ICP, MQL, dedup, enriquecimento e mais — definições diretas.',
        },
        {
          label: 'Planos e créditos do Play Hot Leads',
          href: '/precos',
          description: '150 créditos grátis no cadastro — 1 crédito = 1 lead único.',
        },
      ],
    },
    {
      type: 'summary',
      items: [
        'Nicho + localização definem a mensagem e a taxa de resposta antes do primeiro toque.',
        'Expanda cidade em região metropolitana e nicho em sinônimos — cobertura é tudo.',
        'Multi-fonte em paralelo revela o mercado; dedup por E.164/domínio/nome o limpa.',
        'Priorize por sinal de contato (WhatsApp, e-mail, site ativo) e registre no Kanban.',
        'Os dados da própria busca (nichos, totais, duplicados) dizem onde prospectar em seguida.',
      ],
    },
  ],
  related: [
    'como-encontrar-leads-no-whatsapp',
    'fontes-de-dados-para-encontrar-leads-locais',
    'o-que-e-lead-generacao',
  ],
}
