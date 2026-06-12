'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase-client'

const KASPI_PHONE = '77001234567'  // замени на реальный
const AMOUNT      = 100

export default function PaymentPage() {
  const router   = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [paid, setPaid]         = useState(false)

  const supabase = getSupabase()

  useEffect(() => {
    supabase.auth.getSession().then((result: any) => {
      const session = result?.data?.session
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)
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

  const kaspiUrl = `https://kaspi.kz/pay/transfer?number=${KASPI_PHONE}&amount=${AMOUNT}`

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center">
          <h1 className="font-pixel text-[10px] text-white">ОПЛАТА</h1>
          <p className="font-pixel text-[6px] text-gray-600 mt-1">100₸/месяц</p>
        </div>

        {paid ? (
          <div className="text-center space-y-2">
            <p className="text-4xl">✅</p>
            <p className="font-pixel text-[8px] text-green-400">ОПЛАТА ПРИНЯТА!</p>
            <p className="font-pixel text-[5px] text-gray-500">Переходим в игру...</p>
          </div>
        ) : (
          <>
            {/* QR code area */}
            <div className="bg-panel border border-border p-4 text-center space-y-3">
              <p className="font-pixel text-[6px] text-gray-500">1. ПЕРЕВЕДИ 100₸ ЧЕРЕЗ KASPI</p>
              <div className="bg-white p-3 mx-auto w-32 h-32 flex items-center justify-center">
                {/* SVG QR placeholder — replace with real QR image */}
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <p className="text-[8px] text-gray-500 font-mono text-center">QR<br/>CODE<br/>{KASPI_PHONE}</p>
                </div>
              </div>
              <p className="font-pixel text-[7px] text-yellow-400">+7 {KASPI_PHONE.slice(1,4)} {KASPI_PHONE.slice(4,7)} {KASPI_PHONE.slice(7,9)} {KASPI_PHONE.slice(9)}</p>
              <p className="font-pixel text-[6px] text-white font-bold">{AMOUNT} ₸</p>
            </div>

            <a
              href={kaspiUrl}
              target="_blank" rel="noopener noreferrer"
              className="block w-full py-3 text-center font-pixel text-[8px] text-black bg-yellow-500 hover:bg-yellow-400 transition-colors"
            >
              ОТКРЫТЬ KASPI →
            </a>

            <div className="bg-panel border border-border p-3 space-y-1">
              <p className="font-pixel text-[6px] text-gray-500">2. ПОСЛЕ ОПЛАТЫ</p>
              <p className="font-pixel text-[5px] text-gray-600">
                Статус обновится автоматически в течение 30 секунд.
                В комментарии к переводу укажи: <span className="text-yellow-500">KZBATTLE</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <p className="font-pixel text-[4px] text-gray-700">ИЛИ</p>
              <div className="h-px flex-1 bg-border" />
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
                  alert('Оплата ещё не поступила. Попробуй через 30 секунд.')
                }
                setChecking(false)
              }}
              disabled={checking}
              className="w-full py-2 font-pixel text-[6px] text-gray-500 border border-border hover:border-gray-600 disabled:opacity-50"
            >
              {checking ? 'ПРОВЕРЯЕМ...' : 'Я ОПЛАТИЛ, ПРОВЕРИТЬ ВРУЧНУЮ'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
