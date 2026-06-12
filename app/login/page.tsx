'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase-client'

function formatPhone(raw: string): string {
  // Normalise to E.164 +7XXXXXXXXXX
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('8') && digits.length === 11) return '+7' + digits.slice(1)
  if (digits.startsWith('7') && digits.length === 11) return '+' + digits
  if (digits.length === 10) return '+7' + digits
  return '+' + digits
}

function LoginForm() {
  const router  = useRouter()
  const params  = useSearchParams()
  const refCode = params.get('ref')

  const [phone,   setPhone]   = useState('+7')
  const [pass,    setPass]    = useState('')
  const [mode,    setMode]    = useState<'login' | 'register'>('login')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = getSupabase()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const e164 = formatPhone(phone)

      if (mode === 'register') {
        const { error: err } = await supabase.auth.signUp({ phone: e164, password: pass })
        if (err) throw err
        // After signUp, sign in immediately (phone confirm disabled in Supabase settings)
        const { error: err2 } = await supabase.auth.signInWithPassword({ phone: e164, password: pass })
        if (err2) throw err2
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ phone: e164, password: pass })
        if (err) throw err
      }

      if (refCode) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await supabase.rpc('register_referral', {
            p_referee_id: session.user.id,
            p_ref_code:   refCode,
          })
        }
      }

      // Check if onboarding done
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase
          .from('profiles').select('faction').eq('id', session.user.id).single()
        router.push(profile?.faction ? '/game' : '/onboarding')
      }
    } catch (e: any) {
      setError(e.message ?? 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="font-pixel text-[8px] text-gray-600">КАЗАХСТАН</p>
          <h1 className="font-pixel text-[14px] text-white leading-tight">BATTLE ROYALE</h1>
          <p className="font-pixel text-[6px] text-yellow-500 mt-1">Великий Клик</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="font-pixel text-[6px] text-gray-500">НОМЕР ТЕЛЕФОНА</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full mt-1 bg-panel border border-border px-3 py-2 font-pixel text-[8px] text-white focus:outline-none focus:border-gray-500"
              placeholder="+7 777 123 45 67"
              autoComplete="tel"
              inputMode="tel"
              required
            />
          </div>
          <div>
            <label className="font-pixel text-[6px] text-gray-500">ПАРОЛЬ</label>
            <input
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              className="w-full mt-1 bg-panel border border-border px-3 py-2 font-pixel text-[8px] text-white focus:outline-none focus:border-gray-500"
              placeholder="••••••••"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              minLength={6}
              required
            />
          </div>

          {mode === 'register' && (
            <p className="font-pixel text-[5px] text-gray-600 leading-relaxed">
              Этот номер используется для оплаты через Kaspi.<br />
              Укажи тот же номер, с которого будешь платить.
            </p>
          )}

          {error && <p className="font-pixel text-[6px] text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-pixel text-[8px] text-black bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 transition-colors"
          >
            {loading ? '...' : mode === 'register' ? 'ЗАРЕГИСТРИРОВАТЬСЯ' : 'ВОЙТИ'}
          </button>
        </form>

        <button
          onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError('') }}
          className="w-full font-pixel text-[6px] text-gray-600 hover:text-gray-400"
        >
          {mode === 'login' ? 'Нет аккаунта? Регистрация →' : '← Уже есть аккаунт? Войти'}
        </button>

        {refCode && (
          <p className="font-pixel text-[5px] text-green-600 text-center">
            Реферальный код: {refCode}
          </p>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="font-pixel text-[6px] text-gray-600">Загрузка...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
