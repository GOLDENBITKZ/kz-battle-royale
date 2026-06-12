'use client'
import type { AbilityState } from '@/hooks/useAbilities'

interface Props {
  states:     AbilityState[]
  activating: string | null
  userXP:     number
  userLevel:  number
  onActivate: (id: string) => void
}

export default function AbilityBar({ states, activating, userXP, userLevel, onActivate }: Props) {
  if (states.length === 0) return null

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto scrollbar-none">
      {states.map(ab => {
        const locked    = ab.unlockLevel > userLevel
        const noxp      = userXP < ab.xpCost
        const onCD      = ab.cooldownRemaining > 0
        const disabled  = locked || noxp || onCD || activating !== null
        const pct       = onCD ? (ab.cooldownRemaining / ab.cooldown) * 100 : 0

        return (
          <button
            key={ab.id}
            onClick={() => !disabled && onActivate(ab.id)}
            disabled={disabled}
            title={ab.description}
            className="relative flex-shrink-0 w-12 h-12 border flex flex-col items-center justify-center transition-all"
            style={{
              borderColor:      ab.isActive ? '#FFD700' : disabled ? '#374151' : '#4B5563',
              backgroundColor:  ab.isActive ? '#78350F' : '#111118',
              opacity:          disabled && !onCD ? 0.4 : 1,
              boxShadow:        ab.isActive ? '0 0 10px #F59E0B88' : 'none',
            }}
          >
            {/* Cooldown overlay */}
            {onCD && (
              <div
                className="absolute inset-0 bg-black/60"
                style={{ clipPath: `inset(${100 - pct}% 0 0 0)` }}
              />
            )}
            <span className="text-lg z-10">{ab.icon}</span>
            {onCD && (
              <span className="font-pixel text-[5px] text-gray-400 z-10">
                {ab.cooldownRemaining}s
              </span>
            )}
            {locked && <span className="font-pixel text-[4px] text-gray-600">L{ab.unlockLevel}</span>}
            {!locked && !onCD && (
              <span className="font-pixel text-[4px] text-yellow-600">{ab.xpCost}XP</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
