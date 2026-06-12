'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase-client'

const KASPI_PHONE = '77001234567'  // замени на реальный номер получателя
const AMOUNT      = 100

export default function PaymentPage() {
  const router  = useRouter()
  const supabase = getSupabase()

  const [userId,    setUserId]    = useState<string | null>(null)
  const [userPhone, setUserPhone] = useState<string>('')
  const [checking,  setChecking]  = useState(false)
  const [paid,      setPaid]      = useState(false)
  const [copied,    setCopied]    = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then((result: any) => {
      const session = result?.data?.session
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)
      // phone is stored on auth.users in E.164 (+77001234567)
      const raw: string = session.user.phone ?? ''
      // Display as 8 777 123 45 67 (Kaspi style)
      setUserPhone(raw)
    })
  }, [router, supabase])

  // Poll subscription status every 5s
  useEffect(() => {
    if (!userId) return
    const t = setInterval(async () => {
      const { data } = await supabase
        .from('profiles').select('paid_until').eq('id', userId).single()
      if (data?.paid_until && new Date(data.paid_until) > new Date()) {
        setPaid(true); clearInterval(t)
        setTimeout(() => router.push('/game'), 1500)
      }
    }, 5000)
    return () => clearInterval(t)
  }, [userId, router, supabase])

  function copyPhone() {
    if (!userPhone) return
    navigator.clipboard.writeText(userPhone).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  // Format phone for display: +77771234567 → +7 777 123 45 67
  function displayPhone(e164: string) {
    const d = e164.replace(/\D/g, '')
    if (d.length === 11 && (d[0] === '7' || d[0] === '8')) {
      return `+7 ${d.slice(1,4)} ${d.slice(4,7)} ${d.slice(7,9)} ${d.slice(9,11)}`
    }
    return e164
  }

  const kaspiUrl = `https://kaspi.kz/pay/transfer?number=${KASPI_PHONE}&amount=${AMOUNT}`

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center">
          <h1 className="font-pixel text-[10px] text-white">ОПЛАТА</h1>
          <p className="font-pixel text-[6px] text-gray-600 mt-1">100₸ / месяц</p>
        </div>

        {paid ? (
          <div className="text-center space-y-2">
            <p className="text-4xl">✅</p>
            <p className="font-pixel text-[8px] text-green-400">ОПЛАТА ПРИНЯТА!</p>
            <p className="font-pixel text-[5px] text-gray-500">Переходим в игру...</p>
          </div>
        ) : (
          <>
            {/* Step 1 */}
            <div className="bg-panel border border-border p-4 space-y-3">
              <p className="font-pixel text-[6px] text-gray-500">ШАГ 1 · ПЕРЕВЕДИ 100₸ ЧЕРЕЗ KASPI</p>
              <div className="flex items-center justify-between">
                <p className="font-pixel text-[7px] text-white">
                  {displayPhone('+7' + KASPI_PHONE.replace(/^\+?7?/, ''))}
                </p>
                <span className="font-pixel text-[9px] text-yellow-400 font-bold">100 ₸</span>
              </div>
              <a
                href={kaspiUrl}
                target="_blank" rel="noopener noreferrer"
                className="block w-full py-3 text-center font-pixel text-[8px] text-black bg-yellow-500 hover:bg-yellow-400 transition-colors"
              >
                ОТКРЫТЬ KASPI →
              </a>
            </div>

            {/* Step 2 — critical: phone in comment */}
            <div className="bg-panel border-2 border-yellow-500/40 p-4 space-y-3">
              <p className="font-pixel text-[6px] text-yellow-500">ШАГ 2 · УКАЖИ СВОЙ НОМЕР В КОММЕНТАРИИ</p>
              <p className="font-pixel text-[5px] text-gray-500 leading-relaxed">
                В поле «Комментарий» к переводу вставь свой номер телефона.
                Без него мы не сможем активировать подписку автоматически.
              </p>
              {userPhone && (
                <button
                  onClick={copyPhone}
                  className="w-full flex items-center justify-between bg-dark border border-border px-3 py-2 hover:border-yellow-500/50 transition-colors"
                >
                  <span className="font-pixel text-[8px] text-white">{displayPhone(userPhone)}</span>
                  <span className="font-pixel text-[5px] text-yellow-500">
                    {copied ? 'СКОПИРОВАНО ✓' : 'КОПИРОВАТЬ'}
                  </span>
                </button>
              )}
            </div>

            {/* Manual check */}
            <button
              onClick={async () => {
                if (!userId || checking) return
                setChecking(true)
                const { data } = await supabase
                  .from('profiles').select('paid_until').eq('id', userId).single()
                if (data?.paid_until && new Date(data.paid_until) > new Date()) {
                  setPaid(true); router.push('/game')
                } else {
                  alert('Оплата ещё не поступила. Проверь комментарий к переводу и подожди 30 секунд.')
                }
                setChecking(false)
              }}
              disabled={checking}
              className="w-full py-2 font-pixel text-[6px] text-gray-500 border border-border hover:border-gray-600 disabled:opacity-50"
            >
              {checking ? 'ПРОВЕРЯЕМ...' : 'Я ОПЛАТИЛ — ПРОВЕРИТЬ ВРУЧНУЮ'}
            </button>

            <p className="font-pixel text-[4px] text-gray-700 text-center">
              Подписка активируется автоматически в течение 30 секунд после получения платежа.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
