'use client'
import type { ComboState } from '@/hooks/useCombo'

const TIER_COLORS = ['#6B7280', '#F59E0B', '#EF4444', '#8B5CF6', '#FFD700']
const TIER_LABELS = ['', 'ГОРЯЧО', 'МОЩНО', 'ЯРОСТЬ', '⚡ШЫҢҒЫС⚡']

export default function ComboMeter({ combo }: { combo: ComboState }) {
  if (combo.count < 3) return null
  const color = TIER_COLORS[combo.tier]
  return (
    <div
      className="flex flex-col items-center pointer-events-none"
      style={{ filter: `drop-shadow(0 0 8px ${color})` }}
    >
      <p className="font-pixel text-[7px]" style={{ color }}>
        {TIER_LABELS[combo.tier] || 'КОМБО'}
      </p>
      <p className="font-pixel text-[18px] leading-none" style={{ color }}>
        ×{combo.count}
      </p>
      {combo.xpBonus > 1 && (
        <p className="font-pixel text-[5px] text-yellow-500">+{combo.xpBonus} XP/клик</p>
      )}
    </div>
  )
}
