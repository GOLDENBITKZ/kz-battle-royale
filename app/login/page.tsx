'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase-client'

function LoginForm() {
  const router  = useRouter()
  const params  = useSearchParams()
  const refCode = params.get('ref')

  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [mode,    setMode]    = useState<'login'|'register'>('login')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)

  const supabase = getSupabase()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (mode === 'register') {
        const { error: err } = await supabase.auth.signUp({
          email,
          password: pass,
          options: { emailRedirectTo: `${window.location.origin}/onboarding` },
        })
        if (err) throw err
        setSent(true)
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password: pass })
        if (err) throw err

        if (refCode) {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            await supabase.rpc('register_referral', {
              p_referee_id: session.user.id,
              p_ref_code:   refCode,
            })
          }
        }
        router.push('/game')
      }
    } catch (e: any) {
      setError(e.message ?? 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <p className="text-4xl">📧</p>
          <p className="font-pixel text-[9px] text-yellow-400">ПИСЬМО ОТПРАВЛЕНО!</p>
          <p className="font-pixel text-[6px] text-gray-500">
            Проверь {email} — нажми ссылку для подтверждения, затем войди.
          </p>
          <button
            onClick={() => setSent(false)}
            className="font-pixel text-[6px] text-gray-600 hover:text-gray-400"
          >
            ← Назад к входу
          </button>
        </div>
      </div>
    )
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
            <label className="font-pixel text-[6px] text-gray-500">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full mt-1 bg-panel border border-border px-3 py-2 font-pixel text-[8px] text-white focus:outline-none focus:border-gray-500"
              placeholder="batyr@gmail.com"
              autoComplete="email"
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
            Реферальный код: {refCode} (+3 дня при регистрации)
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
