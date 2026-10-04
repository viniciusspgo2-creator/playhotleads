// src/core/rate-limit.ts
// Cadência humana por fonte (regra nº 4): token bucket com delay mínimo
// + jitter aleatório. Um limiter global por provider evita rajadas quando
// várias buscas rodam em paralelo.

import type { ProviderId, RateLimiter } from './types'
import { humanDelay } from './normalize'

interface LimiterConfig {
  /** delay mínimo entre requests da mesma fonte */
  baseMs: number
  /** jitter (±) aplicado em cima do base */
  jitterMs: number
}

const CONFIGS: Record<ProviderId, LimiterConfig> = {
  overpass: { baseMs: 1500, jitterMs: 600 },
  nominatim: { baseMs: 1200, jitterMs: 350 },
  photon: { baseMs: 800, jitterMs: 300 },
  websearch: { baseMs: 450, jitterMs: 250 },
  'google-places': { baseMs: 150, jitterMs: 90 },
  'maps-scraper': { baseMs: 1100, jitterMs: 600 },
  yelp: { baseMs: 900, jitterMs: 500 },
  yellowpages: { baseMs: 1000, jitterMs: 550 },
  serpapi: { baseMs: 200, jitterMs: 120 },
  'website-crawler': { baseMs: 500, jitterMs: 300 },
}

class HumanRateLimiter implements RateLimiter {
  private nextSlotAt = 0

  constructor(private readonly config: LimiterConfig) {}

  async take(): Promise<void> {
    const now = Date.now()
    const startAt = Math.max(now, this.nextSlotAt)
    const wait = startAt - now
    this.nextSlotAt = startAt + humanDelay(this.config.baseMs, this.config.jitterMs)
    if (wait > 0) await new Promise<void>((r) => setTimeout(r, wait))
  }
}

const globalForLimiter = globalThis as unknown as {
  __phlLimiters?: Map<ProviderId, HumanRateLimiter>
}

function limiterMap(): Map<ProviderId, HumanRateLimiter> {
  if (!globalForLimiter.__phlLimiters) {
    globalForLimiter.__phlLimiters = new Map()
  }
  return globalForLimiter.__phlLimiters
}

/** Limiter compartilhado por fonte — respeita rate limit global do tenant. */
export function getRateLimiter(id: ProviderId): RateLimiter {
  const map = limiterMap()
  const existing = map.get(id)
  if (existing) return existing
  const created = new HumanRateLimiter(CONFIGS[id])
  map.set(id, created)
  return created
}
