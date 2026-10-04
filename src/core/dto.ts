// src/core/dto.ts
// Serialização Lead (Prisma → JSON-safe). Fonte única de verdade da forma
// trafegada na API/SSE — UI e backend compartilham o tipo.

import type { Lead, Plan, User } from '@prisma/client'
import type { KanbanStage, LeadDTO, PlanDTO, ProviderId, UserDTO } from './types'
import { KANBAN_STAGES } from './types'

function parseStringArray(json: string): string[] {
  try {
    const parsed: unknown = JSON.parse(json)
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : []
  } catch {
    return []
  }
}

export function toPlanDTO(plan: Plan): PlanDTO {
  return {
    id: plan.id,
    name: plan.name,
    priceCents: plan.priceCents,
    credits: plan.credits,
    features: parseStringArray(plan.features),
    active: plan.active,
    highlight: plan.highlight,
    sortOrder: plan.sortOrder,
  }
}

export function toUserDTO(user: User & { plan?: { name: string } | null }): UserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserDTO['role'],
    status: user.status as UserDTO['status'],
    credits: user.credits,
    planId: user.planId,
    planName: user.plan?.name ?? null,
    tenantId: user.tenantId,
    createdAt: user.createdAt.toISOString(),
  }
}

export function toLeadDTO(lead: Lead): LeadDTO {
  let sources: ProviderId[] = []
  try {
    const parsed: unknown = JSON.parse(lead.sources)
    if (Array.isArray(parsed)) {
      sources = parsed.filter((s): s is ProviderId => typeof s === 'string')
    }
  } catch {
    sources = []
  }

  let socials: LeadDTO['socials'] = {}
  try {
    const parsed: unknown = JSON.parse(lead.socials)
    if (parsed && typeof parsed === 'object') socials = parsed as LeadDTO['socials']
  } catch {
    socials = {}
  }

  const stage = KANBAN_STAGES.includes(lead.kanbanStage as KanbanStage)
    ? (lead.kanbanStage as KanbanStage)
    : 'new'

  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    phoneE164: lead.phoneE164,
    whatsapp: lead.whatsapp,
    email: lead.email,
    website: lead.website,
    mapsUrl: lead.mapsUrl,
    address: lead.address,
    country: lead.country,
    socials,
    rating: lead.rating,
    sources,
    dedupKey: lead.dedupKey,
    kanbanStage: stage,
    contactStatus: lead.contactStatus,
    note: lead.note,
    createdAt: lead.createdAt.toISOString(),
  }
}
