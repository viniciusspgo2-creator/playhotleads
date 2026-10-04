// src/app/api/campaigns/draft/route.ts
// Gera templates de mensagem de WhatsApp com LLM (Gemini via src/lib/llm.ts —
// backend only). Retorna 2 opções com variáveis {{nome}}/{{empresa}}.

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authErrorResponse, requireUser } from '@/lib/auth'
import { llmComplete } from '@/lib/llm'

export const dynamic = 'force-dynamic'

const DraftSchema = z.object({
  niche: z.string().trim().min(2).max(80),
  location: z.string().trim().min(2).max(80),
  language: z.enum(['pt', 'en', 'es']).default('pt'),
})

const LANG_LABEL = { pt: 'português (BR)', en: 'English', es: 'español' } as const

export async function POST(request: Request) {
  try {
    await requireUser(request)
  } catch (err) {
    const auth = authErrorResponse(err)
    if (auth) return NextResponse.json(auth.body, { status: auth.status })
  }

  const json: unknown = await request.json()
  const parsed = DraftSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'payload inválido' }, { status: 400 })
  }
  const { niche, location, language } = parsed.data

  try {
    const raw = await llmComplete({
      json: true,
      system:
        'Você escreve templates curtos de primeira abordagem via WhatsApp para prospecção B2B. ' +
        'Regras: no máximo 45 palavras; tom humano, direto e respeitoso; uma pergunta de interesse no final; ' +
        'use as variáveis {{empresa}} (nome do negócio) e {{cidade}}; nada de emojis em excesso (no máximo 1); ' +
        'responda APENAS com um JSON válido no formato {"templates": ["...", "..."]} com exatamente 2 templates.',
      user:
        `Nicho: ${niche}. Cidade: ${location}. Idioma: ${LANG_LABEL[language]}. ` +
        'Gere 2 templates diferentes de primeira abordagem pra vender novos clientes pra esse nicho.',
    })
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('resposta sem JSON')
    const parsedOut = JSON.parse(jsonMatch[0]) as { templates?: unknown }
    const candidates = Array.isArray(parsedOut.templates) ? parsedOut.templates : []
    const templates = candidates
      .filter((t): t is string => typeof t === 'string' && t.length >= 10)
      .slice(0, 2)

    if (templates.length === 0) throw new Error('templates vazios')
    return NextResponse.json({ templates })
  } catch (err) {
    // fallback offline — o produto nunca bloqueia por causa da IA
    const fallback: Record<string, string[]> = {
      pt: [
        'Olá, {{empresa}}! Ajudamos negócios como o seu em {{cidade}} a lotar a agenda com novos clientes. Posso te enviar uma previsão gratuita?',
      ],
      en: [
        'Hi {{empresa}}! We help businesses like yours in {{cidade}} fill their schedule with new customers. Mind if I send you a free forecast?',
      ],
      es: [
        '¡Hola {{empresa}}! Ayudamos a negocios como el tuyo en {{cidade}} a llenar la agenda con nuevos clientes. ¿Te envío una previsión gratis?',
      ],
    }
    return NextResponse.json({
      templates: fallback[language] ?? fallback.pt,
      note: `gerado offline (IA indisponível: ${err instanceof Error ? err.message : 'erro'})`,
    })
  }
}
