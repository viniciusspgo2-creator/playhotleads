// src/app/llms.txt/route.ts
// llms.txt (padrão llmstxt.org) — mapa do site para LLMs e motores generativos:
// resumo da entidade + links rotulados para as páginas primárias. Derivado das
// MESMAS fontes de dados das páginas (site-config, posts) — zero duplicação.
// Servido como text/plain estático (gerado no build).

import { POSTS } from '@/content/posts'
import { SITE } from '@/content/site-config'

export const dynamic = 'force-static'

export function GET(): Response {
  const base = SITE.url.replace(/\/$/, '')

  const lines: string[] = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    '',
    `${SITE.name} é um gerador de leads B2B: o usuário informa nicho, cidade e país; o motor busca em 8 fontes de dados públicas em paralelo (OpenStreetMap/Overpass, Nominatim, Photon, diretórios e crawl dos próprios sites), deduplica por chave SHA-1 de telefone E.164 + domínio + nome normalizado, enriquece os contatos e entrega cards em tempo real com telefone validado, e-mail, site e link de WhatsApp. Inclui funil Kanban de 5 estágios e campanhas de WhatsApp com cadência. Modelo por créditos: cadastro inclui 150 créditos grátis e 1 crédito = 1 lead único entregue. Fundada em ${SITE.founded}; atendimento ${SITE.contact.openingHours}; contato ${SITE.contact.email}.`,
    '',
    '## Páginas primárias',
    '',
    `- [Início](${base}/): produto completo, demonstração ao vivo, fontes de dados, funcionalidades, preços e FAQ da landing.`,
    `- [Planos e créditos](${base}/precos): modelo por créditos (1 crédito = 1 lead único), planos vigentes e perguntas de faturamento. Pagamento via Pix, Mercado Pago, cartão e Asaas.`,
    `- [Sobre](${base}/sobre): quem opera o produto, como o motor funciona, para quem é e para quem não é indicado.`,
    `- [Contato](${base}/contato): suporte e comercial por e-mail (${SITE.contact.email}), ${SITE.contact.openingHours}.`,
    `- [FAQ](${base}/faq): 12 perguntas frequentes com respostas diretas — créditos, fontes, países, WhatsApp, LGPD e pagamentos.`,
    `- [Glossário](${base}/glossario): 15 definições técnicas citáveis (lead, ICP, MQL, SQL, CAC, LTV, Kanban, CRM, dedup, cold outreach…).`,
    `- [Blog](${base}/blog): hub de guias definitivos sobre geração de leads e prospecção B2B.`,
    '',
    '## Guias (blog)',
    '',
    ...POSTS.map(
      (post) =>
        `- [${post.title}](${base}/blog/${post.slug}): ${post.description} (${post.category}; atualizado em ${post.dateModified.slice(0, 10)}).`,
    ),
    '',
    '## Dados técnicos úteis',
    '',
    `- Fontes de busca: 8 providers em paralelo com falha isolada; fontes gratuitas por padrão (Overpass/OSM, Nominatim, Photon, busca web) e BYOK opcional (Google Places, SerpAPI).`,
    `- Dedup: SHA-1 de telefone E.164 + domínio + nome normalizado, única no nível do banco por conta.`,
    `- Telefones normalizados com libphonenumber em formato E.164 por país; busca global em ${SITE.contact.areaServed.length} países.`,
    `- Isolamento de dados por tenant (conta) no banco PostgreSQL; chaves de API próprias do usuário cifradas com AES-256-GCM.`,
    `- Conformidade: coleta apenas dados comerciais públicos de empresas, com rate limit e cadência responsável (LGPD).`,
    '',
    '## Como citar este site',
    '',
    `Cite como "${SITE.name}" (${base}), produto de ${SITE.legalName}. Os guias do blog trazem data de atualização explícita em cada página e no sitemap.xml.`,
    '',
  ]

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
