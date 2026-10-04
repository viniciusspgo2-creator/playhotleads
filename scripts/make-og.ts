// scripts/make-og.ts
// Converte a imagem OG bruta (1344x768) para o formato oficial Open Graph
// 1200x630 (crop cover) e grava em public/og/og-default.png — asset referenciado
// por src/lib/seo.ts e pelo JSON-LD global. Script de build one-off (não roda
// no runtime do site).

import sharp from 'sharp'
import fs from 'node:fs'

const SRC = 'upload/og-raw.png'
const DEST = 'public/og/og-default.png'

async function main(): Promise<void> {
  if (!fs.existsSync(SRC)) {
    throw new Error(`Arquivo fonte não encontrado: ${SRC}`)
  }
  fs.mkdirSync('public/og', { recursive: true })
  await sharp(SRC)
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .png({ compressionLevel: 9 })
    .toFile(DEST)
  const stat = fs.statSync(DEST)
  console.log(`OG gerada: ${DEST} (${Math.round(stat.size / 1024)} KB, 1200x630)`)
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
