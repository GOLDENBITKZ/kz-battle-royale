'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FACTIONS, CITIES, type FactionId, type CityId } from '@/lib/config'
import { getSupabase } from '@/lib/supabase-client'

export default function OnboardingPage() {
  const router   = useRouter()
  const [faction, setFaction] = useState<FactionId | null>(null)
  const [city,    setCity]    = useState<CityId | null>(null)
  const [name,    setName]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [step,    setStep]    = useState<'faction' | 'city' | 'name'>('faction')

  const supabase = getSupabase()

  async function submit() {
    if (!faction || !city || !name.trim()) return
    setLoading(true); setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Не авторизован')
      const { error: err } = await supabase
        .from('profiles')
        .update({ faction, city, display_name: name.trim() })
        .eq('id', session.user.id)
      if (err) throw err
      router.push('/payment')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const factionCities = faction ? FACTIONS[faction].cities : []

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="font-pixel text-[10px] text-white">ВЫБОР ОРДЫ</h1>
          <p className="font-pixel text-[5px] text-gray-600 mt-1">
            Шаг {step === 'faction' ? 1 : step === 'city' ? 2 : 3} из 3
          </p>
        </div>

        {step === 'faction' && (
          <div className="space-y-2">
            <p className="font-pixel text-[6px] text-gray-500">ВЫБЕРИ ФРАКЦИЮ</p>
            {Object.entries(FACTIONS).map(([id, fc]) => (
              <button
                key={id}
                onClick={() => { setFaction(id as FactionId); setCity(null); setStep('city') }}
                className="w-full py-3 px-4 border font-pixel text-[7px] text-left transition-all hover:opacity-80"
                style={{ borderColor: fc.color, color: fc.color, backgroundColor: `${fc.color}11` }}
              >
                <span className="block text-[9px]">{fc.nameRu}</span>
                <span className="block text-[5px] text-gray-500 mt-0.5">{fc.nameKz} · {fc.cities.map(c => CITIES[c].nameRu).join(', ')}</span>
              </button>
            ))}
          </div>
        )}

        {step === 'city' && faction && (
          <div className="space-y-2">
            <p className="font-pixel text-[6px] text-gray-500">ВЫБЕРИ СТАРТОВЫЙ ГОРОД</p>
            {factionCities.map(cId => {
              const cfg = CITIES[cId]
              return (
                <button
                  key={cId}
                  onClick={() => { setCity(cId); setStep('name') }}
                  className="w-full py-3 px-4 border border-border font-pixel text-[7px] text-white text-left hover:border-gray-500 transition-all"
                >
                  <span className="block">{cfg.nameRu}</span>
                  <span className="block text-[5px] text-gray-600 mt-0.5">{cfg.nameKz}</span>
                </button>
              )
            })}
            <button onClick={() => setStep('faction')} className="font-pixel text-[5px] text-gray-700 hover:text-gray-500">
              ← Назад
            </button>
          </div>
        )}

        {step === 'name' && (
          <div className="space-y-3">
            <p className="font-pixel text-[6px] text-gray-500">КАК ТЕБЯ ЗОВУТ, БАТЫР?</p>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-panel border border-border px-3 py-2 font-pixel text-[8px] text-white focus:outline-none focus:border-gray-500"
              placeholder="Твоё имя..."
              maxLength={20}
              autoFocus
            />
            {error && <p className="font-pixel text-[5px] text-red-500">{error}</p>}
            <button
              onClick={submit} disabled={!name.trim() || loading}
              className="w-full py-3 font-pixel text-[8px] text-black disabled:opacity-50"
              style={{ backgroundColor: faction ? FACTIONS[faction].color : '#F59E0B' }}
            >
              {loading ? '...' : 'В БОЙ! ⚔'}
            </button>
            <button onClick={() => setStep('city')} className="font-pixel text-[5px] text-gray-700 hover:text-gray-500">
              ← Назад
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
