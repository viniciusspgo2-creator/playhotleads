'use client'

// src/components/analytics.tsx
// Google Tag Manager + GA4 (carregam SOMENTE quando os IDs existem em env,
// então o site fica limpo em dev/demo). Eventos preparados p/ campanhas:
//   - cliques em [data-cta] (delegação global — CTAs só recebem o atributo)
//   - profundidade de scroll (25/50/75/100)
//   - outbound clicks
// trackEvent() empurra no dataLayer (GTM) e no gtag (GA4).

import { useEffect } from 'react'
import Script from 'next/script'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    __phlAnalytics?: boolean
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID

/** Evento de conversão/interação — reutilizável por qualquer client component. */
export function trackEvent(
  name: string,
  params: Record<string, string | number> = {},
): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push({ event: name, ...params })
  window.gtag?.('event', name, params)
}

export function Analytics() {
  // Instala os listeners UMA vez, em effect (nunca no render — regra de
  // imutabilidade do React) e de forma idempotente entre StrictMode/dev.
  useEffect(() => {
    if (!window.__phlAnalytics) {
      window.__phlAnalytics = true
      installTracking()
    }
  }, [])

  return (
    <>
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}

      {GTM_ID && (
        <Script id="gtm-init" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `}
        </Script>
      )}
    </>
  )
}

/** Delegação global: CTA clicks, scroll depth e outbound — zero acoplamento. */
function installTracking(): void {
  const send = (name: string, params: Record<string, string | number>) => {
    window.dataLayer = window.dataLayer ?? []
    window.dataLayer.push({ event: name, ...params })
    window.gtag?.('event', name, params)
  }

  // Cliques em CTAs: qualquer elemento com data-cta (hero, navbar, pricing…)
  document.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement | null)?.closest('[data-cta]')
    if (target) {
      send('cta_click', {
        cta_id: target.getAttribute('data-cta') ?? 'unknown',
        page: window.location.hash || window.location.pathname || '/',
      })
    }
    // Links externos
    const anchor = (event.target as HTMLElement | null)?.closest('a')
    if (anchor) {
      const href = anchor.getAttribute('href') ?? ''
      if (href.startsWith('https://') && !href.includes(window.location.hostname)) {
        send('outbound_click', { destination: href.slice(0, 120) })
      }
    }
  })

  // Profundidade de scroll (marcos 25/50/75/100)
  const milestones = [25, 50, 75, 100]
  const fired = new Set<number>()
  const onScroll = () => {
    const doc = document.documentElement
    const max = doc.scrollHeight - window.innerHeight
    if (max <= 0) return
    const pct = Math.round((window.scrollY / max) * 100)
    for (const m of milestones) {
      if (pct >= m && !fired.has(m)) {
        fired.add(m)
        send('scroll_depth', { percent: m, page: window.location.pathname || '/' })
      }
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true })
}
