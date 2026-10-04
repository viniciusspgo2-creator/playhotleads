# Alterações para deploy na Vercel

## Passo a passo
1. Neon: crie o banco e copie a connection string.
2. **Antes do 1º deploy**, crie as tabelas (rode local, uma vez e a cada mudança de schema):
   `DATABASE_URL="<url do Neon sem -pooler>" npx prisma db push`
3. Vercel > Settings > Environment Variables (Production):
   `DATABASE_URL` (pooled), `NEXT_PUBLIC_SITE_URL`, `PHL_ENC_KEY` (`openssl rand -base64 32`),
   `PHL_MASTER_EMAIL`, `PHL_MASTER_PASSWORD`, e opcionais `GEMINI_API_KEY`, `BRAVE_SEARCH_API_KEY`, GA/GTM.
4. Deploy. Plano Hobby: maxDuration até 300s (Fluid Compute). Em Pro dá para aumentar
   `maxDuration` nas rotas e `SEARCH_BUDGET_MS` / `CAMPAIGN_BUDGET_MS`.

## O que mudou
- **Busca**: roda em `after()` dentro de `/api/search` (maxDuration 300), com orçamento de tempo (255s, entrega parcial).
  Progresso persistido na tabela nova `SearchEvent`; o SSE lê do banco (funciona entre instâncias) e reconecta sozinho.
  Cancelamento via banco. Busca "morta" é marcada como falha em vez de ficar `running`.
- **Campanhas**: `runCampaign` em `after()`, mensagens reivindicadas atomicamente, retomada automática pelo polling
  do `GET /api/campaigns` (campo novo `Campaign.updatedAt`).
- **IA**: `z-ai-web-dev-sdk` removido. Templates e expansão de nicho usam Gemini (`src/lib/llm.ts`, fallback estático sem chave).
  Fonte `websearch` usa Brave Search API (`BRAVE_SEARCH_API_KEY`); sem chave falha isolada.
- **Build**: `prisma generate && next build` (não mexe mais no banco). `postinstall` gera o client. `db:push` sem `--accept-data-loss`.
- **Segurança**: sem senha master padrão em produção; `PHL_ENC_KEY` obrigatória em produção; sem fallback silencioso p/ localhost;
  webhook Asaas confirma o pagamento na API da Asaas antes de liberar créditos.
- `middleware.ts` → `proxy.ts` (Next 16). `output: standalone` só fora da Vercel. `.vercelignore` exclui arquivos de dev.
- `bun.lock` regenerado.

## Não testado aqui
O sandbox bloqueou o download do engine do Prisma e do Google Fonts: `next build` e a execução real não rodaram.
`tsc` e `eslint` passam, exceto erros de tipos do Prisma que só existem porque o client não pôde ser gerado.
Rode `npm run build` local antes de subir.
