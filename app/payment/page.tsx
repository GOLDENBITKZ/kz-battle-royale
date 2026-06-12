'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase-client'

// Единая ссылка оплаты — замени на реальный номер получателя
const KASPI_LINK = 'https://kaspi.kz/pay/transfer?number=77001234567&amount=100'

export default function PaymentPage() {
  const router   = useRouter()
  const supabase = getSupabase()

  const [userId,    setUserId]    = useState<string | null>(null)
  const [userPhone, setUserPhone] = useState('')
  const [checking,  setChecking]  = useState(false)
  const [paid,      setPaid]      = useState(false)
  const [copied,    setCopied]    = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then((result: any) => {
      const session = result?.data?.session
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)
      setUserPhone(session.user.phone ?? '')
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

  function displayPhone(e164: string) {
    const d = e164.replace(/\D/g, '')
    if (d.length === 11) return `+7 ${d.slice(1,4)} ${d.slice(4,7)} ${d.slice(7,9)} ${d.slice(9,11)}`
    return e164
  }

  function copyPhone() {
    navigator.clipboard.writeText(userPhone).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500)
    })
  }

  if (paid) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-5xl">✅</p>
          <p className="font-pixel text-[9px] text-green-400">ОПЛАТА ПРИНЯТА!</p>
          <p className="font-pixel text-[5px] text-gray-500">Переходим в игру...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-4 gap-5">
      <div className="text-center">
        <h1 className="font-pixel text-[11px] text-white">ПОДПИСКА</h1>
        <p className="font-pixel text-[6px] text-yellow-500 mt-1">100 ₸ / месяц</p>
      </div>

      {/* Instruction card */}
      <div className="w-full max-w-sm bg-panel border border-border p-5 space-y-4">

        {/* Step 1 */}
        <div className="space-y-2">
          <p className="font-pixel text-[5px] text-gray-600">ШАГ 1</p>
          <p className="font-pixel text-[7px] text-white leading-relaxed">
            Скопируй свой номер телефона
          </p>
          {userPhone ? (
            <button
              onClick={copyPhone}
              className="w-full flex items-center justify-between bg-dark border border-yellow-500/50 px-4 py-3 hover:border-yellow-400 transition-colors active:scale-95"
            >
              <span className="font-pixel text-[9px] text-yellow-400">{displayPhone(userPhone)}</span>
              <span className="font-pixel text-[5px] text-gray-500">
                {copied ? '✓ СКОПИРОВАНО' : 'КОПИРОВАТЬ'}
              </span>
            </button>
          ) : (
            <div className="h-10 bg-dark border border-border animate-pulse" />
          )}
        </div>

        <div className="h-px bg-border" />

        {/* Step 2 */}
        <div className="space-y-2">
          <p className="font-pixel text-[5px] text-gray-600">ШАГ 2</p>
          <p className="font-pixel text-[7px] text-white leading-relaxed">
            Оплати 100₸ и вставь номер в поле <span className="text-yellow-500">«Комментарий»</span>
          </p>
          <a
            href={KASPI_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-4 text-center font-pixel text-[9px] text-black bg-yellow-500 hover:bg-yellow-400 transition-colors active:scale-95"
          >
            ОПЛАТИТЬ ЧЕРЕЗ KASPI →
          </a>
          <p className="font-pixel text-[4px] text-gray-600 text-center">
            Подписка активируется автоматически в течение 30 секунд
          </p>
        </div>
      </div>

      <button
        onClick={async () => {
          if (!userId || checking) return
          setChecking(true)
          const { data } = await supabase
            .from('profiles').select('paid_until').eq('id', userId).single()
          if (data?.paid_until && new Date(data.paid_until) > new Date()) {
            setPaid(true); router.push('/game')
          } else {
            alert('Оплата ещё не поступила. Убедись, что указал номер в комментарии.')
          }
          setChecking(false)
        }}
        disabled={checking}
        className="font-pixel text-[5px] text-gray-700 hover:text-gray-500 disabled:opacity-50"
      >
        {checking ? 'проверяем...' : 'уже оплатил — проверить вручную'}
      </button>
    </div>
  )
}
