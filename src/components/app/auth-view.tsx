'use client'

// src/components/app/auth-view.tsx
// Porta de entrada SaaS: card centralizado com login/registro. Em caso de
// sucesso o AuthGate troca automaticamente para o shell — nada a fazer aqui.
// Erros aparecem como toast (sonner) e texto inline no formulário.

import { useState } from 'react'
import { Flame, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from './auth-context'
import { useI18n } from './i18n'

type Mode = 'login' | 'register'

export function AuthView() {
  const { t } = useI18n()
  const { login, register } = useAuth()

  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isRegister = mode === 'register'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)

    const result = isRegister
      ? await register(name.trim(), email.trim(), password)
      : await login(email.trim(), password)

    setBusy(false)
    if (!result.ok) {
      const message = result.error ?? t('common.error')
      setError(message)
      toast.error(message)
      return
    }
    // sucesso: o AuthGate renderiza o shell automaticamente
  }

  return (
    <div className="grid min-h-screen place-items-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          {/* Marca */}
          <div className="flex flex-col items-center text-center">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-orange-600/25">
              <Flame className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-[15px] font-bold tracking-tight text-zinc-900">
              Play<span className="text-primary"> Hot Leads</span>
            </p>
            <h1 className="mt-2 text-lg font-bold text-zinc-900">{t('auth.title')}</h1>
            <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">{t('auth.subtitle')}</p>
          </div>

          {/* Tabs: Entrar / Criar conta */}
          <div
            className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1"
            role="tablist"
            aria-label={t('auth.title')}
          >
            <button
              type="button"
              role="tab"
              aria-selected={!isRegister}
              onClick={() => setMode('login')}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-all ${
                !isRegister ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {t('auth.tab.login')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isRegister}
              onClick={() => setMode('register')}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-all ${
                isRegister ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {t('auth.tab.register')}
            </button>
          </div>

          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              void handleSubmit(e)
            }}
          >
            {isRegister && (
              <div className="space-y-1">
                <Label htmlFor="auth-name">{t('auth.name')}</Label>
                <Input
                  id="auth-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                  minLength={2}
                  placeholder="Maria Silva"
                  className="h-10 rounded-xl"
                />
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="auth-email">{t('auth.email')}</Label>
              <Input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                placeholder="email@empresa.com"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="auth-password">{t('auth.password')}</Label>
              <Input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
                minLength={isRegister ? 8 : undefined}
                className="h-10 rounded-xl"
              />
              {isRegister && (
                <p className="text-[11.5px] text-zinc-500">{t('auth.password.hint')}</p>
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-[12.5px] font-medium text-red-600"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={busy}
              className="h-10 w-full rounded-xl font-semibold shadow-lg shadow-orange-600/25"
            >
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {isRegister ? t('auth.register.submit') : t('auth.login.submit')}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(isRegister ? 'login' : 'register')
              setError(null)
            }}
            className="mt-3 w-full text-center text-[12.5px] font-medium text-zinc-500 transition-colors hover:text-primary"
          >
            {isRegister ? t('auth.register.switch') : t('auth.login.switch')}
          </button>
        </div>

        <p className="mt-4 text-center">
          <a
            href="#"
            className="text-[12.5px] font-medium text-zinc-500 transition-colors hover:text-zinc-800"
          >
            {t('auth.back')}
          </a>
        </p>
      </div>
    </div>
  )
}
