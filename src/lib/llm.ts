// src/lib/llm.ts
// Cliente LLM mínimo (Google Gemini via REST) — substitui o z-ai-web-dev-sdk,
// que só funciona dentro do ambiente do Z.AI (depende de .z-ai-config).
//
// Env: GEMINI_API_KEY (obrigatória p/ IA) · GEMINI_MODEL (opcional).
// Sem a chave, llmComplete lança LlmUnavailableError e quem chama cai no
// fallback (o produto nunca bloqueia por causa da IA).

const DEFAULT_MODEL = 'gemini-2.5-flash'

export class LlmUnavailableError extends Error {
  constructor(message = 'GEMINI_API_KEY não configurada') {
    super(message)
    this.name = 'LlmUnavailableError'
  }
}

export interface LlmRequest {
  system: string
  user: string
  /** pede resposta em JSON puro */
  json?: boolean
  timeoutMs?: number
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[]
  error?: { message?: string }
}

export async function llmComplete(req: LlmRequest): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new LlmUnavailableError()

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: req.system }] },
        contents: [{ role: 'user', parts: [{ text: req.user }] }],
        generationConfig: {
          temperature: 0.7,
          // sem "thinking": respostas curtas e rápidas
          thinkingConfig: { thinkingBudget: 0 },
          ...(req.json ? { responseMimeType: 'application/json' } : {}),
        },
      }),
      signal: AbortSignal.timeout(req.timeoutMs ?? 14_000),
    },
  )

  const data = (await res.json().catch(() => ({}))) as GeminiResponse
  if (!res.ok) throw new Error(data.error?.message ?? `Gemini HTTP ${res.status}`)
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
  if (!text) throw new Error('resposta vazia do LLM')
  return text
}
