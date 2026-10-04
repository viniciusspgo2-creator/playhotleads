// src/app/api/settings/route.ts
// GET: settings com segredos mascarados (nunca devolve o valor real).
// PUT: salva toggles/modos/keys/proxy — segredos cifrados com AES-256-GCM.
// Campos de chave enviados vazios preservam o segredo existente (UX).

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { authErrorResponse, requireUser } from '@/lib/auth'
import { loadSettings, saveSettings, providerConfigList, maskProxy } from '@/core/settings'
import type { ProviderId } from '@/core/types'

export const dynamic = 'force-dynamic'

const PutSchema = z.object({
  enabled: z.record(z.string(), z.boolean()).optional(),
  modes: z.record(z.string(), z.enum(['demo', 'live'])).optional(),
  apiKeys: z
    .object({
      google_places: z.string().max(200).optional(),
      serpapi: z.string().max(200).optional(),
    })
    .optional(),
  proxy: z
    .object({
      provider: z.string().trim().min(1).max(60),
      host: z.string().trim().min(1).max(120),
      port: z.number().int().min(1).max(65535),
      username: z.string().max(120).optional(),
      password: z.string().max(200).optional(),
    })
    .nullable()
    .optional(),
  language: z.enum(['pt', 'en', 'es']).optional(),
})

export async function GET(request: Request) {
  try {
    const user = await requireUser(request)
    const settings = await loadSettings(user.tenantId)

    return NextResponse.json({
      providers: providerConfigList(settings),
      proxy: maskProxy(settings.proxy),
      language: settings.language,
    })
  } catch (err) {
    const auth = authErrorResponse(err)
    return auth
      ? NextResponse.json(auth.body, { status: auth.status })
      : NextResponse.json({ error: 'erro inesperado' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser(request)
    const json: unknown = await request.json()
    const parsed = PutSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'payload inválido' }, { status: 400 })
    }

    const data = parsed.data

    const saved = await saveSettings(user.tenantId, {
    enabled: data.enabled as Partial<Record<ProviderId, boolean>> | undefined,
    modes: data.modes as Partial<Record<ProviderId, 'demo' | 'live'>> | undefined,
    apiKeys: data.apiKeys,
    proxy:
      data.proxy === undefined
        ? undefined
        : data.proxy === null
          ? null
          : {
              provider: data.proxy.provider,
              host: data.proxy.host,
              port: data.proxy.port,
              username: data.proxy.username,
              password: data.proxy.password || undefined,
            },
    language: data.language,
  })

  return NextResponse.json({
    providers: providerConfigList(saved),
    proxy: maskProxy(saved.proxy),
    language: saved.language,
  })
  } catch (err) {
    const auth = authErrorResponse(err)
    return auth
      ? NextResponse.json(auth.body, { status: auth.status })
      : NextResponse.json({ error: 'erro inesperado' }, { status: 500 })
  }
}
