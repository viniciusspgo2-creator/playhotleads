// src/content/faq-landing.ts
// FAQ da landing page — fonte de dados SERVER-SAFE (sem 'use client').
// Motivo: exportações de módulos 'use client' viram client references quando
// importadas por server components — o JSON-LD da home precisa do array REAL.
// O componente (Accordion) vive em components/landing/faq.tsx e consome este
// módulo; o JSON-LD da home também. Fonte única de verdade.

import type { FaqItem } from '@/content/types'

export const LANDING_FAQ: FaqItem[] = [
  {
    q: 'Buscar dados públicos na web é legal?',
    a: 'Depende de como é feito. O Play Hot Leads trabalha com dados públicos de negócios (nome, telefone comercial, site, avaliação), respeita rate limits por fonte, usa cadência humana e backoff — nunca dados pessoais sensíveis. Ainda assim, termos de uso de cada fonte variam por país: recomendamos revisar o uso do seu nicho. Fontes oficiais com API (Google Places, SerpAPI) são o caminho mais seguro e vêm ligadas por padrão.',
  },
  {
    q: 'Preciso das minhas próprias chaves de API?',
    a: 'Não obrigatoriamente — o plano gerenciado já inclui as fontes oficiais. Mas você pode (e recomendamos) conectar as suas chaves do Google Places e da SerpAPI: você controla o custo direto na sua conta e os dados são cobrados no seu contrato. As chaves ficam criptografadas com AES-256 e nunca saem do seu tenant.',
  },
  {
    q: 'Como a deduplicação funciona na prática?',
    a: 'Cada lead gera uma dedup_key: hash de telefone (E.164) + domínio do site + nome normalizado. Se o mesmo negócio vier do Google Places e do Yelp, os cards se fundem e o lead ganha o badge “2 fontes”. A constraint UNIQUE no banco garante que duplicado não entra — nem por race condition de dois providers chegando junto.',
  },
  {
    q: 'Os dados dos meus leads ficam isolados de outros clientes?',
    a: 'Sim. O banco é multi-tenant com Row Level Security no PostgreSQL: toda query roda com o seu tenant_id injetado no nível do banco, não só na aplicação. Nenhum cliente enxerga — ou consegue consultar — leads de outro, nem por bug de aplicação.',
  },
  {
    q: 'Quais países a busca cobre?',
    a: 'A busca é global. Cada país ativa o conjunto certo de fontes e idioma: no Brasil, Google Places + Yelp BR + Yellow Pages; nos EUA, as versões americanas; e assim por diante. As fontes oficiais (Places/SerpAPI) cobrem praticamente todo o mundo.',
  },
  {
    q: 'O disparo de WhatsApp usa a API oficial?',
    a: 'As campanhas usam a WhatsApp Business API oficial ( Cloud API), com opt-out em todo template e controle de cadência pra proteger o número do seu negócio. Disparos ficam no plano Pro e Scale, com taxa de resposta acompanhada por campanha.',
  },
]
