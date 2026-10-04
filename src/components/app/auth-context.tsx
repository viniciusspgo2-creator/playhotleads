'use client'

// src/components/app/auth-context.tsx
// Sessão SaaS do usuário (JWT): expõe { user, loading } e as ações
// login/register/logout/refresh. O token é persistido pelo tenant-client
// (localStorage + header x-session-token em toda chamada) e o cookie
// httpOnly segue como canal primário quando o navegador o aceita — a dupla
// fonte cobre previews em iframe cross-site, onde cookies de terceiros são
// bloqueados. Deve ser montado DENTRO de <LanguageProvider> (usa useI18n
// para o fallback das mensagens de erro).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { apiFetch, clearSessionToken, saveSessionToken } from '@/lib/tenant-client'
import type { UserDTO } from '@/core/types'
import { useI18n } from './i18n'

export interface AuthActionResult {
  ok: boolean
  error?: string
}

interface AuthContextValue {
  user: UserDTO | null
  loading: boolean
  refresh: () => Promise<void>
  login: (email: string, password: string) => Promise<AuthActionResult>
  register: (name: string, email: string, password: string) => Promise<AuthActionResult>
  logout: () => Promise<void>
}

interface AuthPayload {
  token?: string
  user?: UserDTO
  error?: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Lê /api/auth/me — devolve o usuário ou null (401/erro de rede). */
async function fetchMe(): Promise<UserDTO | null> {
  try {
    const res = await apiFetch('/api/auth/me')
    if (res.status === 401) return null
    if (!res.ok) return null
    const data = (await res.json()) as { user?: UserDTO }
    return data.user ?? null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  const [user, setUser] = useState<UserDTO | null>(null)
  const [loading, setLoading] = useState(true)

  // Sessão inicial: diferido via setTimeout 0 para não disparar setState
  // de forma síncrona no corpo do effect (cascata de render / lint).
  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchMe().then((me) => {
        setUser(me)
        setLoading(false)
      })
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const refresh = useCallback(async () => {
    setUser(await fetchMe())
  }, [])

  const login = useCallback(
    async (email: string, password: string): Promise<AuthActionResult> => {
      try {
        const res = await apiFetch('/api/auth/login', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const data = (await res.json().catch(() => ({}))) as AuthPayload
        if (!res.ok || !data.token || !data.user) {
          return { ok: false, error: data.error ?? t('common.error') }
        }
        saveSessionToken(data.token)
        setUser(data.user)
        return { ok: true }
      } catch {
        return { ok: false, error: t('common.error') }
      }
    },
    [t],
  )

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<AuthActionResult> => {
      try {
        const res = await apiFetch('/api/auth/register', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        })
        const data = (await res.json().catch(() => ({}))) as AuthPayload
        if (!res.ok || !data.token || !data.user) {
          return { ok: false, error: data.error ?? t('common.error') }
        }
        saveSessionToken(data.token)
        setUser(data.user)
        return { ok: true }
      } catch {
        return { ok: false, error: t('common.error') }
      }
    },
    [t],
  )

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // rede falhou — o estado local é limpo do mesmo jeito
    }
    clearSessionToken()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, refresh, login, register, logout }),
    [user, loading, refresh, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth fora do AuthProvider')
  return ctx
}
