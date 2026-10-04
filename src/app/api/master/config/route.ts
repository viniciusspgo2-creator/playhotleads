// src/app/api/master/config/route.ts
// GET: config global do SaaS + segredos de gateway mascarados (nunca
// trafega o valor real). PUT: patch parcial de config e/ou segredos —
// string vazia em segredo apaga a credencial; campo ausente preserva.

import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getAppConfig,
  getAppSecrets,
  maskSecrets,
  updateAppConfig,
  updateAppSecrets,
} from '@/core/appconfig'
import { authErrorResponse, requireMaster } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const ConfigSchema = z.object({
  brandName: z.string().trim().min(2).max(40).optional(),
  defaultFreeCredits: z.number().int().min(0).max(100_000).optional(),
  creditMode: z.enum(['per_lead', 'per_search']).optional(),
  costPerSearch: z.number().int().min(1).max(1000).optional(),
  maxLeadsPerSearch: z.number().int().min(10).max(1000).optional(),
  allowedLimits: z.array(z.number().int().min(5).max(1000)).max(6).optional(),
  signupEnabled: z.boolean().optional(),
  maintenance: z.boolean().optional(),
  publicUrl: z.string().max(200).optional(),
  mercadopagoEnabled: z.boolean().optional(),
  asaasEnabled: z.boolean().optional(),
  asaasSandbox: z.boolean().optional(),
})

const SecretsSchema = z.object({
  mercadopagoToken: z.string().max(300).optional(),
  asaasApiKey: z.string().max(300).optional(),
})

const BodySchema = z.object({
  config: ConfigSchema.optional(),
  secrets: SecretsSchema.optional(),
})

async function readState() {
  const [config, secrets] = await Promise.all([getAppConfig(), getAppSecrets()])
  return { config, secrets: maskSecrets(secrets) }
}

export async function GET(request: Request) {
  try {
    await requireMaster(request)
    return NextResponse.json(await readState())
  } catch (err) {
    const auth = authErrorResponse(err)
    return auth
      ? NextResponse.json(auth.body, { status: auth.status })
      : NextResponse.json({ error: 'erro inesperado' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    await requireMaster(request)

    const json: unknown = await request.json()
    const parsed = BodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'configuração inválida' }, { status: 400 })
    }

    if (parsed.data.config) await updateAppConfig(parsed.data.config)
    if (parsed.data.secrets) await updateAppSecrets(parsed.data.secrets)

    return NextResponse.json(await readState())
  } catch (err) {
    const auth = authErrorResponse(err)
    return auth
      ? NextResponse.json(auth.body, { status: auth.status })
      : NextResponse.json({ error: 'erro inesperado' }, { status: 500 })
  }
}
