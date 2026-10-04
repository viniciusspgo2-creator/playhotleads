// mini-services/pg-local/index.ts
// PostgreSQL embedded para o DEV LOCAL do Play Hot Leads (o sandbox não tem
// postgres nativo nem sudo). Em produção (Vercel) o banco é o Neon PostgreSQL
// via DATABASE_URL — este serviço existe apenas para o ambiente local.
//
// Idempotente: se o cluster/database já existem, apenas sobe e mantém vivo.

import EmbeddedPostgres from 'embedded-postgres'

const PORT = 5433
const DB = 'phl'
const USER = 'postgres'
const PASSWORD = 'postgres'

async function main(): Promise<void> {
  const pg = new EmbeddedPostgres({
    databaseDir: `${import.meta.dir}/pgdata`,
    user: USER,
    password: PASSWORD,
    port: PORT,
    persistent: true,
  })

  try {
    await pg.initialise()
    console.log(`[pg-local] cluster inicializado em ${import.meta.dir}/pgdata`)
  } catch {
    console.log('[pg-local] cluster já inicializado — reaproveitando')
  }

  await pg.start()
  try {
    await pg.createDatabase(DB)
    console.log(`[pg-local] database "${DB}" criado`)
  } catch {
    console.log(`[pg-local] database "${DB}" já existe`)
  }

  console.log(
    `[pg-local] pronto: postgresql://${USER}:${PASSWORD}@localhost:${PORT}/${DB}`,
  )

  // mantém o processo vivo para o Prisma/Next conectarem
  await new Promise<void>(() => {
    setInterval(() => {}, 1 << 30)
  })
}

main().catch((err) => {
  console.error('[pg-local] falhou ao iniciar', err)
  process.exit(1)
})
