// src/content/site-config.ts
// Fonte ÚNICA de verdade da entidade de marca (Organization schema, llms.txt,
// JSON-LD, rodapé, páginas institucionais). Editar aqui reflete em todo o site.
//
// ⚠️ EDITÁVEL PELO DONO: url, contato, redes sociais e autor estão com valores
// estruturais — trocar pelos dados definitivos antes do domínio final.

import type { Author } from './types'

const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')

export const SITE = {
  name: 'Play Hot Leads',
  legalName: 'Play Hot Leads Tecnologia',
  /** URL canônica base — configurar NEXT_PUBLIC_SITE_URL na Vercel com o domínio final */
  url: (envUrl && envUrl.length > 0 ? envUrl : 'https://playhotleads.vercel.app') as string,
  description:
    'Play Hot Leads transforma nicho + cidade em listas de leads com telefone, WhatsApp, e-mail e site em segundos: busca paralela em múltiplas fontes públicas, deduplicação automática, Kanban de vendas e campanhas de WhatsApp.',
  shortDescription:
    'Gerador de leads B2B: nicho + cidade viram contatos validados em segundos, com dedup automático e Kanban de vendas.',
  locale: 'pt-BR',
  ogLocale: 'pt_BR',
  /** código de região p/ geo.region meta */
  geoRegion: 'BR',
  geoPlacename: 'São Paulo, Brasil',
  founded: '2025',
  contact: {
    email: 'contato@playhotleads.com',
    /** opcional — preencher para LocalBusiness schema completo */
    phone: '',
    city: 'São Paulo',
    state: 'SP',
    country: 'BR',
    areaServed: ['Brasil', 'Portugal', 'Estados Unidos', 'Argentina', 'México', 'Espanha'],
    openingHours: 'Seg–Sex, 09:00–18:00 (BRT)',
  },
  socials: {
    instagram: '',
    linkedin: '',
    youtube: '',
    x: '',
  },
}

/** Fundador/autor editorial. ⚠️ Placeholder editável — trocar pelo nome real. */
export const AUTHORS: Author[] = [
  {
    id: 'rafael-nogueira',
    name: 'Rafael Nogueira',
    role: 'Especialista em Growth B2B e Prospecção',
    bio: 'Trabalha com geração e qualificação de leads B2B desde 2015, operando prospecção ativa para negócios locais — de clínicas a indústrias. Hoje lidera o produto Play Hot Leads, unindo fontes de dados públicas, deduplicação e funil de vendas Kanban em um único fluxo de trabalho.',
    credentials: [
      '10 anos operando prospecção B2B ativa no Brasil',
      'Autor dos guias de prospecção por nicho e localização do blog Play Hot Leads',
      'Especialista em dados públicos de negócios (Google Places, OSM, diretórios)',
    ],
    website: SITE.url,
  },
]

export function getAuthor(id: string): Author {
  return AUTHORS.find((a) => a.id === id) ?? AUTHORS[0]
}

/** Planos de referência p/ /precos quando o banco ainda está vazio (build). */
export interface PublicPlan {
  name: string
  priceCents: number
  period: 'mensal' | 'para sempre'
  description: string
  features: string[]
  highlight: boolean
}

/** Snapshot editorial dos planos — a versão viva (editável) vive no banco. */
export const FALLBACK_PLANS: PublicPlan[] = [
  {
    name: 'Starter',
    priceCents: 0,
    period: 'para sempre',
    description: 'Crie a conta e receba 150 créditos grátis — 1 crédito = 1 lead único entregue.',
    features: [
      '150 créditos grátis no cadastro',
      'Todas as fontes gratuitas (Overpass, Nominatim, Photon, Busca Web)',
      'Cards em tempo real (SSE)',
      'Dedup automático multi-fonte',
      'Kanban de vendas + busca global',
    ],
    highlight: false,
  },
  {
    name: 'Pro',
    priceCents: 9700,
    period: 'mensal',
    description: 'Para quem prospecta todos os dias e quer volume com qualidade.',
    features: [
      '5.000 créditos por mês',
      'Todas as fontes + BYOK (Google Places, SerpAPI)',
      'Enriquecimento por crawl do site',
      'Campanhas de WhatsApp com cadência',
      'Suporte prioritário',
    ],
    highlight: true,
  },
  {
    name: 'Business',
    priceCents: 29700,
    period: 'mensal',
    description: 'Para agências e times que prospectam em escala para vários clientes.',
    features: [
      'Créditos em volume com preço reduzido',
      'Proxy residencial gerenciado',
      'Painel master para gestão de equipe',
      'Relatórios e exportação',
      'Onboarding assistido',
    ],
    highlight: false,
  },
]
