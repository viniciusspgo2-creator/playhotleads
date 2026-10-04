'use client'

// src/components/app/view-manager.tsx
// "Roteador" da rota única: #/app mostra o dashboard, #/master mostra o
// painel administrativo, sem hash mostra a landing. Client-side, sem trocar
// de página — preserva o estado da landing, do app (streams SSE) e do painel
// master ao alternar. O painel master é montado oculto e só "acorda" (checa
// sessão/carrega dados) quando o hash #/master fica ativo.

import { useEffect, useState } from 'react'
import { MasterView } from '@/components/master/master-view'

type ViewName = 'landing' | 'app' | 'master'

export function ViewManager() {
  const [view, setView] = useState<ViewName>('landing')

  useEffect(() => {
    const apply = () => {
      const hash = window.location.hash
      const next: ViewName = hash === '#/app' ? 'app' : hash === '#/master' ? 'master' : 'landing'
      setView(next)
      const landing = document.getElementById('view-landing')
      const app = document.getElementById('view-app')
      const master = document.getElementById('view-master')
      if (landing) landing.style.display = next === 'landing' ? '' : 'none'
      if (app) app.style.display = next === 'app' ? '' : 'none'
      if (master) master.style.display = next === 'master' ? '' : 'none'
      window.scrollTo({ top: 0 })
    }

    apply()
    window.addEventListener('hashchange', apply)
    return () => window.removeEventListener('hashchange', apply)
  }, [])

  return (
    <div id="view-master" style={{ display: 'none' }}>
      <MasterView visible={view === 'master'} />
    </div>
  )
}

/** Navega pro app (usado pelos CTAs da landing). */
export function goApp(): void {
  window.location.hash = '#/app'
}
