// src/content/posts/fontes-de-dados-para-encontrar-leads-locais.ts
import type { BlogPost } from '@/content/types'

export const POST: BlogPost = {
  slug: 'fontes-de-dados-para-encontrar-leads-locais',
  title: 'Fontes de dados para encontrar leads locais em 2026',
  description:
    'Compare Google Places, Overpass/OSM, Nominatim, Photon e diretórios: custo, API key e melhor uso de cada fonte para montar sua lista de leads locais.',
  keywords: [
    'fontes de leads',
    'dados públicos de empresas',
    'google places api',
    'openstreetmap leads',
    'buscar telefones de empresas',
  ],
  category: 'Fontes de dados',
  tags: ['fontes de leads', 'dados públicos', 'google places', 'openstreetmap', 'geração de leads'],
  authorId: 'rafael-nogueira',
  datePublished: '2026-08-05T09:00:00-03:00',
  dateModified: '2026-09-28T09:00:00-03:00',
  readingMinutes: 9,
  featured: true,
  blocks: [
    {
      type: 'takeaways',
      items: [
        'Nenhuma fonte única cobre tudo: Places é preciso, OSM cobre nichos, diretórios reforçam telefone — combinar gera volume com qualidade.',
        'Cinco fontes gratuitas (Overpass/OpenStreetMap, Nominatim, Photon, diretórios e busca web) dispensam API key e cartão de crédito.',
        'Google Places entrega a maior precisão, mas é paga por chamada e exige API key própria (BYOK).',
        'Dedup por SHA-1 de telefone E.164 + domínio + nome normalizado impede o mesmo negócio duas vezes na lista.',
        'O e-mail institucional quase nunca vem de mapa: vem do crawl do site da empresa — enriquecimento, não descoberta.',
      ],
    },
    {
      type: 'bluf',
      text:
        'As fontes públicas que realmente têm negócios locais são seis: Google Places, Overpass/OpenStreetMap, Nominatim, Photon, diretórios (Yelp e Yellow Pages) e o site de cada empresa. Os mapas descobrem o negócio, os diretórios reforçam o telefone e o site entrega o e-mail. Combinadas em uma busca, cobrem o que nenhuma entrega sozinha.',
    },
    {
      type: 'p',
      text:
        'Procurar leads locais manualmente funciona até a vigésima linha do resultado de busca. Depois disso, o gargalo vira coleta: copiar nome, telefone, site e e-mail um por um. A saída é entender o que cada fonte tem de melhor e deixar uma ferramenta consultá-las em paralelo.',
    },
    { type: 'h2', text: 'Quais fontes públicas realmente têm negócios locais?' },
    {
      type: 'p',
      text:
        'Seis fontes valem seu tempo em 2026, e a diferença entre elas está no tipo de dado, no custo e na exigência de API key. A tabela compara exatamente as fontes que o Play Hot Leads consulta em uma busca:',
    },
    {
      type: 'table',
      caption: 'Fontes de dados para leads locais: comparação',
      headers: ['Fonte', 'Tipo de dado', 'Custo', 'Precisa de API key?', 'Melhor uso'],
      rows: [
        ['Google Places', 'API oficial de negócios', 'Paga por chamada', 'Sim', 'Precisão máxima de nome, telefone e endereço'],
        ['Overpass / OpenStreetMap', 'Dados colaborativos', 'Gratuito', 'Não', 'Cobertura de nichos locais e ruas'],
        ['Nominatim', 'Geocode + POIs do OSM', 'Gratuito', 'Não', 'Cidades pequenas e bairros'],
        ['Photon', 'Busca global de POIs', 'Gratuito', 'Não', 'Busca internacional sem credencial'],
        ['Yelp / Yellow Pages', 'Diretórios comerciais', 'Gratuito via scraping responsável', 'Não', 'Telefones comerciais por categoria'],
        ['Crawl do site', 'E-mails, redes e WhatsApp', 'Gratuito', 'Não', 'Enriquecimento do lead já encontrado'],
      ],
    },
    {
      type: 'p',
      text:
        'Três leituras rápidas da tabela: nenhuma fonte é gratuita e completa ao mesmo tempo; as gratuitas se complementam — o que falta no OSM costuma aparecer no diretório; e o e-mail institucional quase nunca vem de fonte de mapas, vem do site da empresa. Por isso o crawl é etapa de enriquecimento, não de descoberta.',
    },
    { type: 'h2', text: 'Como o Play Hot Leads combina todas em uma busca' },
    {
      type: 'p',
      text:
        '**O Play Hot Leads dispara as fontes em paralelo, não em fila.** Cada fonte que responde publica leads ao vivo na tela enquanto a busca roda, e uma fonte com erro ou fora do ar é isolada sem derrubar o resto. No fim, tudo converge para uma lista única com três filtros de qualidade:',
    },
    {
      type: 'ol',
      items: [
        'Normalização: todo telefone passa pelo libphonenumber e é salvo em E.164 (formato internacional +55…), pronto para WhatsApp e importação.',
        'Deduplicação: cada lead recebe uma chave SHA-1 calculada do telefone em E.164, do domínio do site e do nome normalizado — o mesmo negócio achado em duas fontes vira um card só, marcado com quantas fontes o confirmaram.',
        'Enriquecimento: para leads com site, o crawler visita a home e a página de contato (até 3 páginas) e extrai e-mails, redes sociais e links de WhatsApp.',
      ],
    },
    {
      type: 'p',
      text:
        'O resultado prático: uma busca por nicho + cidade devolve uma lista única — não seis listas — com telefone válido, site e, quando existe, e-mail institucional. A busca é global e roda em 8 países, com idioma e formato de telefone por região.',
    },
    { type: 'h2', text: 'Qual fonte usar para o seu caso?' },
    {
      type: 'p',
      text:
        'A escolha depende de orçamento, prazo e objetivo. Regra simples por situação:',
    },
    {
      type: 'ul',
      items: [
        'Precisa do dado mais confiável e tem orçamento: Google Places com sua própria key (BYOK) ligada nas configurações.',
        'Quer começar hoje, sem cartão: Overpass + Nominatim + Photon + diretórios — o combo gratuito que já vem ligado por padrão.',
        'Precisa de e-mail e WhatsApp, não só telefone: mantenha o crawl do site ativo e busque nichos com site próprio.',
        'Prospecta fora do Brasil: Photon e Nominatim cobrem o globo, e o telefone sai no formato do país.',
      ],
    },
    {
      type: 'p',
      text:
        'Uma observação honesta sobre volume: limite de busca não é qualidade. Configurar 300 leads por busca para um nicho pequeno enche o Kanban de cards que ninguém vai contatar — comece com limites menores, valide a taxa de resposta e escale o que converte.',
    },
    {
      type: 'faq',
      items: [
        {
          q: 'Preciso de API key do Google para achar leads?',
          a:
            'Não. O combo padrão do Play Hot Leads roda só com fontes gratuitas sem credencial: Overpass/OpenStreetMap, Nominatim, Photon, diretórios e busca web. A key do Google Places é opcional (BYOK) — vale quando você quer máxima precisão e tem volume de chamadas no orçamento.',
        },
        {
          q: 'Dados públicos são confiáveis o suficiente?',
          a:
            'Dependem da fonte e do nicho — e é por isso que ninguém deve confiar em uma só. A plataforma cruza as fontes na mesma busca, marca quantas confirmaram cada lead e normaliza o telefone por país antes de entregar. O que ainda faltar, o crawl tenta achar no site da empresa.',
        },
        {
          q: 'Dá para buscar leads fora do Brasil?',
          a:
            'Sim. A busca é global em 8 países, com regras de telefone, idioma e domínio por região. Uma busca por clínicas em Austin volta com números em formato +1 e conteúdo localizado — a mesma lógica serve para Portugal, México e Argentina.',
        },
        {
          q: 'Quanto custa para começar?',
          a:
            'R$ 0. O cadastro grátis vem com 150 créditos — 1 crédito por lead único entregue — e todas as fontes gratuitas ligadas. Você só paga quando precisa de mais volume, e a dedup garante que lead repetido não queima crédito.',
        },
      ],
    },
    {
      type: 'summary',
      items: [
        'Seis fontes valem uso em 2026; nenhuma cobre sozinha nome, telefone, site e e-mail de um nicho local.',
        'Sem API key: Overpass/OSM, Nominatim, Photon, diretórios e busca web — o combo gratuito padrão da plataforma.',
        'Busca paralela com erro isolado + dedup SHA-1 (E.164 + domínio + nome) = lista única, sem repetição.',
        'Crawl do site completa o que mapas não têm: e-mail institucional, redes sociais e WhatsApp.',
      ],
    },
    {
      type: 'links',
      title: 'Leia em seguida',
      items: [
        {
          label: 'Prospecção por nicho e localização',
          href: '/blog/prospeccao-por-nicho-e-localizacao',
          description: 'O método completo de prospecção ativa antes de escolher a fonte.',
        },
        {
          label: 'Kanban de vendas',
          href: '/blog/kanban-de-vendas-como-organizar-leads',
          description: 'Para onde vão os leads depois que a busca termina.',
        },
        {
          label: 'O que é lead geração',
          href: '/blog/o-que-e-lead-generacao',
          description: 'Base conceitual para quem está começando.',
        },
        {
          label: 'LGPD e prospecção de leads',
          href: '/blog/lgpd-e-prospeccao-de-leads',
          description: 'O que a lei diz sobre coletar dados públicos de empresas.',
        },
        {
          label: 'Glossário',
          href: '/glossario',
          description: 'Overpass, POI, E.164: termos técnicos explicados em uma frase.',
        },
        {
          label: 'Ver a demonstração',
          href: '/#demo',
          description: 'Veja a busca paralela e a deduplicação rodando ao vivo.',
        },
      ],
    },
  ],
  related: [
    'prospeccao-por-nicho-e-localizacao',
    'kanban-de-vendas-como-organizar-leads',
    'lgpd-e-prospeccao-de-leads',
    'o-que-e-lead-generacao',
    'como-encontrar-leads-no-whatsapp',
  ],
}
