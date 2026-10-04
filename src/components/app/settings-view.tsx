'use client'

// src/components/app/settings-view.tsx
// Painel de toggles: fontes (on/off + modo demo/live), chaves BYOK e proxy
// — tudo salvo criptografado (AES-256-GCM) via /api/settings.

import { useCallback, useEffect, useState } from 'react'
import {
  Settings2,
  KeyRound,
  AlertTriangle,
  Lock,
  Server,
  Globe,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/tenant-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useI18n, type Language } from './i18n'
import type { ProviderId, RunMode } from '@/core/types'

interface ProviderConfigDTO {
  id: ProviderId
  label: string
  mode: 'api' | 'scrape' | 'enrich'
  runModes: RunMode[]
  requiresProxy: boolean
  requiresApiKey: boolean
  countries: string[] | 'global'
  costPerRequest?: number
  note?: string
  enabled: boolean
  runMode: RunMode
  keySet: boolean
  keyHint: string | null
}

interface ProxyMasked {
  provider: string
  host: string
  port: number
  username: string | null
  passwordSet: boolean
}

export function SettingsView() {
  const { t, language, setLanguage } = useI18n()
  const [providers, setProviders] = useState<ProviderConfigDTO[]>([])
  const [proxy, setProxy] = useState<ProxyMasked | null>(null)
  const [keys, setKeys] = useState({ google_places: '', serpapi: '' })
  const [proxyForm, setProxyForm] = useState({
    provider: '',
    host: '',
    port: '8080',
    username: '',
    password: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/api/settings')
      if (!res.ok) return
      const data = (await res.json()) as { providers: ProviderConfigDTO[]; proxy: ProxyMasked | null; language: string }
      setProviders(data.providers)
      setProxy(data.proxy)
    } catch {
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  const save = useCallback(
    async (patch?: {
      enabled?: Record<ProviderId, boolean>
      modes?: Record<ProviderId, RunMode>
      proxy?: unknown
      language?: Language
    }) => {
      setSaving(true)
      try {
        const body: Record<string, unknown> = { ...patch }
        const google = keys.google_places.trim()
        const serp = keys.serpapi.trim()
        if (google || serp) {
          const apiKeysPatch: Record<string, string> = {}
          if (google) apiKeysPatch.google_places = google
          if (serp) apiKeysPatch.serpapi = serp
          body.apiKeys = apiKeysPatch
        }
        if (patch?.proxy === undefined && proxyForm.host.trim()) {
          body.proxy = {
            provider: proxyForm.provider.trim() || 'custom',
            host: proxyForm.host.trim(),
            port: Number(proxyForm.port) || 8080,
            username: proxyForm.username.trim() || undefined,
            password: proxyForm.password.trim() || undefined,
          }
        }
        if (patch?.language) body.language = patch.language

        const res = await apiFetch('/api/settings', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('falha ao salvar')
        const data = (await res.json()) as { providers: ProviderConfigDTO[]; proxy: ProxyMasked | null }
        setProviders(data.providers)
        setProxy(data.proxy)
        setKeys({ google_places: '', serpapi: '' })
        toast.success(t('settings.saved'))
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err))
      } finally {
        setSaving(false)
      }
    },
    [keys, proxyForm, t],
  )

  const toggleProvider = (id: ProviderId, enabled: boolean) => {
    setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, enabled } : p)))
    void save({ enabled: { [id]: enabled } as Record<ProviderId, boolean> })
  }

  const changeMode = (id: ProviderId, runMode: RunMode) => {
    setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, runMode } : p)))
    void save({ modes: { [id]: runMode } as Record<ProviderId, RunMode> })
  }

  const clearProxy = async () => {
    setProxyForm({ provider: '', host: '', port: '8080', username: '', password: '' })
    await save({ proxy: null })
  }

  if (loading) {
    return <div className="grid h-64 place-items-center text-zinc-500">{t('common.loading')}…</div>
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-2">
        <Settings2 className="size-5 text-primary" aria-hidden="true" />
        <h1 className="text-lg font-bold text-zinc-900">{t('settings.title')}</h1>
      </div>
      <p className="mb-5 text-[13.5px] text-zinc-500">{t('settings.subtitle')}</p>

      {/* Providers */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm" aria-label={t('settings.providers')}>
        <h2 className="text-[14px] font-bold text-zinc-900">{t('settings.providers')}</h2>
        <ul className="mt-2 divide-y divide-zinc-100">
          {providers.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-semibold text-zinc-800">{p.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                      p.mode === 'api' ? 'bg-sky-50 text-sky-600' : p.mode === 'enrich' ? 'bg-fuchsia-50 text-fuchsia-600' : 'bg-zinc-100 text-zinc-500'
                    }`}
                  >
                    {p.mode}
                  </span>
                  {p.requiresApiKey && (
                    <span className="flex items-center gap-0.5 text-[11px] font-medium text-amber-600">
                      <KeyRound className="size-3" aria-hidden="true" />
                      {p.keySet ? t('settings.keySet') : 'BYOK'}
                    </span>
                  )}
                  {p.requiresProxy && (
                    <span className="flex items-center gap-0.5 text-[11px] font-medium text-amber-600" title="recomendado com proxy">
                      <AlertTriangle className="size-3" aria-hidden="true" />
                      proxy
                    </span>
                  )}
                  {p.costPerRequest !== undefined && (
                    <span className="text-[11px] text-zinc-400">~${p.costPerRequest}/req</span>
                  )}
                </div>
                {p.note && <p className="mt-0.5 text-[12px] text-zinc-500">{p.note}</p>}
              </div>

              {p.runModes.includes('live') && p.runModes.includes('demo') && (
                <Select value={p.runMode} onValueChange={(v) => changeMode(p.id, v as RunMode)}>
                  <SelectTrigger aria-label={t('settings.mode')} className="h-8 w-[104px] rounded-lg text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demo">{t('settings.mode.demo')}</SelectItem>
                    <SelectItem value="live">{t('settings.mode.live')}</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Switch checked={p.enabled} onCheckedChange={(checked) => toggleProvider(p.id, checked)} aria-label={`Ativar ${p.label}`} />
            </li>
          ))}
        </ul>
      </section>

      {/* API keys */}
      <section className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm" aria-label="API keys">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-[14px] font-bold text-zinc-900">
            <KeyRound className="size-4 text-zinc-500" aria-hidden="true" />
            API keys (BYOK)
          </h2>
          <span className="flex items-center gap-1 text-[11.5px] font-medium text-emerald-600">
            <Lock className="size-3" aria-hidden="true" />
            AES-256-GCM
          </span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-zinc-700">Google Places</span>
            <Input
              type="password"
              value={keys.google_places}
              onChange={(e) => setKeys((prev) => ({ ...prev, google_places: e.target.value }))}
              placeholder={providers.find((p) => p.id === 'google-places')?.keyHint ?? t('settings.key.ph')}
              className="h-9 rounded-lg text-[13px]"
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-zinc-700">SerpAPI</span>
            <Input
              type="password"
              value={keys.serpapi}
              onChange={(e) => setKeys((prev) => ({ ...prev, serpapi: e.target.value }))}
              placeholder={providers.find((p) => p.id === 'serpapi')?.keyHint ?? t('settings.key.ph')}
              className="h-9 rounded-lg text-[13px]"
              autoComplete="off"
            />
          </label>
        </div>
      </section>

      {/* Proxy */}
      <section className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm" aria-label={t('settings.proxy')}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-[14px] font-bold text-zinc-900">
            <Server className="size-4 text-zinc-500" aria-hidden="true" />
            {t('settings.proxy')}
          </h2>
          {proxy && <Badge variant="outline" className="rounded-full bg-emerald-50 text-[11px] font-semibold text-emerald-600">ativo</Badge>}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-zinc-700">{t('settings.proxy.provider')}</span>
            <Input
              value={proxyForm.provider}
              onChange={(e) => setProxyForm((prev) => ({ ...prev, provider: e.target.value }))}
              placeholder={proxy?.provider ?? 'BrightData'}
              className="h-9 rounded-lg text-[13px]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-zinc-700">{t('settings.proxy.host')}</span>
            <Input
              value={proxyForm.host}
              onChange={(e) => setProxyForm((prev) => ({ ...prev, host: e.target.value }))}
              placeholder={proxy?.host ?? 'br.proxy.io'}
              className="h-9 rounded-lg text-[13px]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-zinc-700">{t('settings.proxy.port')}</span>
            <Input
              type="number"
              value={proxyForm.port}
              onChange={(e) => setProxyForm((prev) => ({ ...prev, port: e.target.value }))}
              placeholder={proxy ? String(proxy.port) : '8080'}
              className="h-9 rounded-lg text-[13px]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-zinc-700">{t('settings.proxy.user')}</span>
            <Input
              value={proxyForm.username}
              onChange={(e) => setProxyForm((prev) => ({ ...prev, username: e.target.value }))}
              placeholder={proxy?.username ?? '—'}
              className="h-9 rounded-lg text-[13px]"
              autoComplete="off"
            />
          </label>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-zinc-700">{t('settings.proxy.pass')}</span>
            <Input
              type="password"
              value={proxyForm.password}
              onChange={(e) => setProxyForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder={proxy?.passwordSet ? '••••••' : '—'}
              className="h-9 rounded-lg text-[13px]"
              autoComplete="new-password"
            />
          </label>
          {proxy && (
            <Button variant="outline" onClick={() => void clearProxy()} className="h-9 rounded-lg px-4 text-[13px]">
              {t('settings.proxy.clear')}
            </Button>
          )}
        </div>
      </section>

      {/* Idioma + salvar */}
      <section className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm" aria-label={t('settings.language')}>
        <div className="flex flex-wrap items-center gap-3">
          <Globe className="size-4 text-zinc-500" aria-hidden="true" />
          <span className="text-[14px] font-semibold text-zinc-800">{t('settings.language')}</span>
          <Select value={language} onValueChange={(v) => { setLanguage(v as Language); void save({ language: v as Language }) }}>
            <SelectTrigger className="ml-auto h-9 w-32 rounded-lg text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt">Português (BR)</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <p className="mt-4 text-[12px] leading-relaxed text-zinc-500">{t('settings.securityNote')}</p>

      <Button onClick={() => void save()} disabled={saving} className="mt-4 h-10 rounded-xl px-8 font-semibold shadow-lg shadow-orange-600/25">
        {saving ? (
          <>
            <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden="true" />
            {t('settings.saving')}
          </>
        ) : (
          t('settings.save')
        )}
      </Button>
    </div>
  )
}
