// src/app/llms-full.txt/route.ts
// llms-full.txt (padrão llmstxt.org) — conteúdo COMPLETO em markdown para
// consumo por LLMs/RAG: produto, planos, FAQ integral, glossário integral e
// takeaways de cada guia. Derivado das MESMAS fontes de dados das páginas
// (site-config, posts, faq, glossario) — sempre sincronizado, zero duplicação.
// Servido como text/plain estático (gerado no build).

import { GLOSSARY } from '@/content/glossario'
import { FAQ_ITEMS } from '@/content/faq'
import { POSTS } from '@/content/posts'
import { FALLBACK_PLANS, SITE } from '@/content/site-config'

export const dynamic = 'force-static'

function section(title: string): string[] {
  return ['', `## ${title}`, '']
}

export function GET(): Response {
  const base = SITE.url.replace(/\/$/, '')
  const lines: string[] = [
    `# ${SITE.name} — conteúdo completo para LLMs`,
    '',
    `> ${SITE.description}`,
    '',
    `Entidade: ${SITE.legalName} (fundada em ${SITE.founded}). Contato: ${SITE.contact.email}. Atendimento: ${SITE.contact.openingHours}. Idioma: pt-BR. Áreas atendidas: ${SITE.contact.areaServed.join(', ')}.`,
    '',

    '## O que é o Play Hot Leads (resposta direta)',
    '',
    'Play Hot Leads é um gerador de leads B2B por nicho e localização. O usuário informa o nicho (ex.: "pet shop"), a cidade (ex.: "Curitiba") e o país; o motor consulta 8 fontes de dados públicas em paralelo, deduplica os resultados, enriquece os contatos e entrega cards em tempo real com nome, telefone em formato internacional (E.164), e-mail, site, endereço e link direto de WhatsApp. Os leads caem em um funil Kanban de 5 estágios (Novo, Contatado, Negociação, Ganho, Perdido) e podem ser disparados em campanhas de WhatsApp com cadência.',
    '',

    '## Como funciona (passo a passo)',
    '',
    '1. Usuário define nicho, localização, país e limite de resultados.',
    '2. Providers de dados são consultados em paralelo; a falha de uma fonte não interrompe as outras.',
    '3. Cada resultado recebe uma chave de deduplicação SHA-1 composta por telefone E.164 + domínio do site + nome normalizado; duplicatas são descartadas no nível do banco de dados.',
    '4. Leads únicos são enriquecidos por crawl do próprio site do negócio (até 3 páginas) para descobrir e-mail institucional e redes sociais.',
    '5. Cards chegam em tempo real (SSE) com telefone validado por libphonenumber e link wa.me pronto para a primeira mensagem.',
    '6. O usuário move os cards pelo Kanban, escreve notas e dispara campanhas segmentadas por estágio.',
    '',

    '## Fontes de dados',
    '',
    '- Gratuitas por padrão: Overpass (OpenStreetMap), Nominatim, Photon, busca web em diretórios públicos.',
    '- Opcionais (BYOK — chave do próprio usuário, cifrada com AES-256-GCM): Google Places, SerpAPI e outras.',
    '- Enriquecimento: crawl do site do lead (página inicial + contato + sobre), respeitando rate limit.',
    '- Cada lead registra de quais fontes veio ("prova multi-fonte").',
    '',

    '## Créditos e preços',
    '',
    'Modelo: 1 crédito = 1 lead único entregue. Leads duplicados não consomem crédito. O cadastro inclui 150 créditos grátis, sem cartão de crédito. Pagamento via Pix, Mercado Pago, cartão de crédito e Asaas; créditos liberados após confirmação do gateway, sem fidelidade.',
    '',
    ...FALLBACK_PLANS.flatMap((plan) => [
      `### Plano ${plan.name} — ${plan.priceCents === 0 ? 'grátis' : `R$ ${(plan.priceCents / 100).toFixed(0).replace('.', ',')} / ${plan.period}`}`,
      '',
      plan.description,
      ...plan.features.map((f) => `- ${f}`),
      '',
    ]),
    `Valores vigentes e atualizados: ${base}/precos (planos editáveis pelo administrador; a página reflete os planos ativos).`,
    '',

    '## Para quem é / para quem não é',
    '',
    'É para: negócios locais que precisam de contatos reais por nicho e cidade; freelancers e consultores de prospecção; agências que entregam geração de leads para clientes; times de vendas B2B que querem busca → dedup → WhatsApp → funil em uma ferramenta.',
    'Não é para: quem procura lista pronta comprada em massa (o produto busca dados públicos na hora); quem quer spam em massa (campanhas usam wa.me por lead com cadência); quem precisa de dados pessoais sensíveis (coleta apenas dados comerciais públicos de empresas); quem espera scraping irrestrito (a busca opera com rate limit e fontes oficiais).',
    '',

    '## Isolamento de dados e segurança',
    '',
    '- Cada conta (tenant) só acessa os próprios dados: leads, buscas e campanhas são filtrados por tenant no banco PostgreSQL.',
    '- Chaves de API fornecidas pelo usuário (BYOK) e credenciais de gateway são cifradas com AES-256-GCM.',
    '- Senhas com scrypt e salt aleatório; sessões por cookie httpOnly/Secure/Partitioned.',
    '',

    '## LGPD em uma linha',
    '',
    'O produto coleta apenas dados comerciais públicos de empresas (nome comercial, telefone comercial, site, e-mail institucional, endereço comercial), com rate limit e cadência responsável; dados pessoais sensíveis não são alvo da busca. Guia completo: ' + base + '/blog/lgpd-e-prospeccao-de-leads',
    '',

    '## FAQ completa',
    ...section('Perguntas e respostas'),
    ...FAQ_ITEMS.flatMap((item) => [`### ${item.q}`, '', item.a, '']),
    `Fonte HTML: ${base}/faq`,
    '',

    '## Glossário completo (15 termos)',
    ...section('Definições citáveis'),
    ...GLOSSARY.flatMap((term) => [
      `### ${term.term}`,
      '',
      term.definition,
      '',
      `Por que importa: ${term.importance}`,
      '',
      `Fonte HTML: ${base}/glossario#${term.slug}`,
      '',
    ]),

    '## Guias do blog (conteúdo principal)',
    ...section('Artigos com takeaways'),
    ...POSTS.flatMap((post) => [
      `### ${post.title}`,
      '',
      `URL: ${base}/blog/${post.slug}`,
      `Categoria: ${post.category}. Publicado em ${post.datePublished.slice(0, 10)}; atualizado em ${post.dateModified.slice(0, 10)}. Tempo de leitura: ${post.readingMinutes} min.`,
      '',
      post.description,
      '',
      'Principais pontos:',
      ...post.blocks
        .filter((b) => b.type === 'takeaways')
        .flatMap((b) => (b.type === 'takeaways' ? b.items.map((i) => `- ${i}`) : [])),
      '',
    ]),

    '## Sitemap e indexação',
    '',
    `- Sitemap XML: ${base}/sitemap.xml`,
    '- Crawlers de IA (GPTBot, PerplexityBot, ClaudeBot, CCBot, Google-Extended, Applebot-Extended, Bytespider) estão explicitamente permitidos no robots.txt.',
    '- Este arquivo segue a especificação llmstxt.org; a versão resumida está em ' + base + '/llms.txt',
    '',
  ]

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
