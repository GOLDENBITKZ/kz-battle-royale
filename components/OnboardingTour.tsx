'use client'
import { useState } from 'react'
import type { FactionId } from '@/lib/config'
import { FACTIONS } from '@/lib/config'

const LS_KEY = 'kz_onboarding_done'
export function shouldShowOnboarding() {
  try { return !localStorage.getItem(LS_KEY) } catch { return false }
}

const STEPS = [
  { icon: '🗺️', title: 'Карта Казахстана', text: 'Перед тобой живая карта с 10 городами. Каждый город принадлежит фракции и имеет запас HP.' },
  { icon: '👆', title: 'Выбери цель', text: 'Тапни на вражеский город — он станет твоей целью. Двойной тап = мгновенная атака!' },
  { icon: '👊', title: 'Атакуй!', text: 'Жми большую кнопку АТАКА как можно быстрее. Каждые 3 секунды урон отправляется на сервер.' },
  { icon: '⚡', title: 'Комбо-удары', text: 'Клики без паузы дают комбо-множитель! ×10 = Ярость, ×30 = режим Шыңғыса!' },
  { icon: '🛡️', title: 'Способности', text: 'Каждая фракция имеет уникальные способности. Разблокируй их с уровнями и трать XP.' },
  { icon: '📜', title: 'Ежедневные квесты', text: 'Выполняй квесты каждый день — бонус XP и поддержание серии гарантированы!' },
]

export default function OnboardingTour({ faction, onComplete }: { faction: FactionId; onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const fc = FACTIONS[faction]

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else {
      try { localStorage.setItem(LS_KEY, '1') } catch {}
      onComplete()
    }
  }

  const s = STEPS[step]

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4">
      <div
        className="w-full max-w-sm bg-panel border-2 p-5 space-y-4"
        style={{ borderColor: fc.color }}
      >
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-300"
                style={{ width: i === step ? 16 : 6, backgroundColor: i <= step ? fc.color : '#374151' }}
              />
            ))}
          </div>
          <button onClick={onComplete} className="font-pixel text-[5px] text-gray-700">ПРОПУСТИТЬ</button>
        </div>

        <div className="text-center">
          <p className="text-4xl mb-2">{s.icon}</p>
          <p className="font-pixel text-[9px] mb-2" style={{ color: fc.color }}>{s.title}</p>
          <p className="font-pixel text-[6px] text-gray-400 leading-relaxed">{s.text}</p>
        </div>

        <button
          onClick={next}
          className="w-full py-3 font-pixel text-[8px] text-black transition-opacity hover:opacity-90"
          style={{ backgroundColor: fc.color }}
        >
          {step === STEPS.length - 1 ? 'В БОЙ! ⚔' : 'ДАЛЕЕ →'}
        </button>
      </div>
    </div>
  )
}
