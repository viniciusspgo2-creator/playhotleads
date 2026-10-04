// src/lib/db.ts
// Cliente Prisma singleton. O banco é SEMPRE PostgreSQL (Neon na Vercel,
// embedded no dev local). O sandbox exporta DATABASE_URL legado (file:) no
// shell — env do processo vence o .env, então aqui garantimos a URL Postgres:
//   1) DATABASE_URL do ambiente se já for postgres (Vercel/Neon)
//   2) fallback do PostgreSQL embedded local (mini-services/pg-local, 5433)

import { PrismaClient } from '@prisma/client'

const rawUrl = process.env.DATABASE_URL ?? ''
const isPostgres =
  rawUrl.startsWith('postgresql://') || rawUrl.startsWith('postgres://')

if (!isPostgres && process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
  // em produção NUNCA cai no localhost silenciosamente — erro claro
  throw new Error('DATABASE_URL ausente ou não é PostgreSQL — configure a connection string do Neon na Vercel')
}

if (!isPostgres) {
  process.env.DATABASE_URL =
    'postgresql://postgres:postgres@localhost:5433/phl?schema=public&sslmode=disable'
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
