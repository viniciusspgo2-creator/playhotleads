// src/core/crypto.ts
// AES-256-GCM pra credenciais em repouso (regra nº 3: API keys e proxy
// NUNCA em texto puro no banco). Chave derivada de segredo do env; em dev,
// gerada uma única vez e persistida em .phl-key (fora do git).

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const KEY_FILE = join(process.cwd(), '.phl-key')

let cachedKey: Buffer | null = null

function getKey(): Buffer {
  if (cachedKey) return cachedKey

  const secret = process.env.PHL_ENC_KEY

  if (secret && secret.length >= 16) {
    cachedKey = scryptSync(secret, 'play-hot-leads.v1', 32)
    return cachedKey
  }

  // Produção (Vercel): filesystem é efêmero/somente-leitura e cada invocação
  // pode cair numa instância diferente — uma chave gerada em arquivo tornaria
  // as credenciais e sessões ilegíveis. Exige o segredo explicitamente.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('PHL_ENC_KEY ausente ou curta (mín. 16 caracteres) — defina nas Environment Variables da Vercel')
  }

  // Dev fallback: chave persistida em arquivo (criada na primeira execução)
  if (existsSync(KEY_FILE)) {
    cachedKey = Buffer.from(readFileSync(KEY_FILE, 'utf8').trim(), 'base64')
    if (cachedKey.length === 32) return cachedKey
  }

  cachedKey = randomBytes(32)
  writeFileSync(KEY_FILE, cachedKey.toString('base64'), { mode: 0o600 })
  return cachedKey
}

/** Cifra qualquer JSON-serializável → "iv.tag.ct" em base64. */
export function encryptJson(value: unknown): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv)
  const plain = Buffer.from(JSON.stringify(value), 'utf8')
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join('.')
}

/** Decifra "iv.tag.ct". Retorna fallback se payload vazio/corrompido. */
export function decryptJson<T>(payload: string, fallback: T): T {
  if (!payload) return fallback
  try {
    const [ivB64, tagB64, ctB64] = payload.split('.')
    if (!ivB64 || !tagB64 || !ctB64) return fallback
    const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivB64, 'base64'))
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
    const plain = Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()])
    return JSON.parse(plain.toString('utf8')) as T
  } catch {
    return fallback
  }
}

/** Máscara pra UI: nunca devolve o segredo, só o rabo. */
export function maskSecret(secret: string | undefined): string | null {
  if (!secret) return null
  const tail = secret.slice(-4)
  return `•••••${tail}`
}

/** Segredo de assinatura de sessão (JWT HS256) — deriva da mesma chave mestra. */
export function sessionSecret(): string {
  return getKey().toString('base64')
}
