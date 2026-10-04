// src/components/seo/json-ld.tsx
// Injeta JSON-LD server-side. O escape de "<" evita injeção de tag no payload.

export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[]
}) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
