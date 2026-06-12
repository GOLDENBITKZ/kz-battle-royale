'use client'
import { useState, useCallback } from 'react'
import type { FactionId } from '@/lib/config'
import { getAvailableAbilities, type AbilityConfig } from '@/lib/abilities'
import { playAbility } from '@/lib/sound'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!

export interface AbilityState extends AbilityConfig {
  cooldownRemaining: number
  isActive:          boolean
}

export function useAbilities(
  faction: FactionId,
  userId: string,
  accessToken: string,
  xp: number,
  level: number,
  onXpCost: (cost: number) => void,
) {
  const available = getAvailableAbilities(faction, level)
  const [cooldowns, setCooldowns] = useState<Map<string, number>>(new Map())
  const [actives,   setActives]   = useState<Set<string>>(new Set())
  const [activating, setActivating] = useState<string | null>(null)

  const activateAbility = useCallback(async (id: string) => {
    const ability = available.find(a => a.id === id)
    if (!ability || activating) return
    if (cooldowns.get(id) ?? 0 > 0) return
    if (xp < ability.xpCost) return

    setActivating(id)
    playAbility()

    try {
      const res = await fetch(`${BACKEND}/abilities/activate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ abilityId: id, userId }),
      })
      if (res.ok) {
        onXpCost(-ability.xpCost)
        setCooldowns(m => { const n = new Map(m); n.set(id, ability.cooldown); return n })
        if (ability.duration > 0) {
          setActives(s => { const n = new Set(s); n.add(id); return n })
          setTimeout(() => setActives(s => { const n = new Set(s); n.delete(id); return n }), ability.duration * 1000)
        }
        // Countdown
        let rem = ability.cooldown
        const tick = setInterval(() => {
          rem--
          setCooldowns(m => { const n = new Map(m); n.set(id, rem); return n })
          if (rem <= 0) { clearInterval(tick); setCooldowns(m => { const n = new Map(m); n.delete(id); return n }) }
        }, 1000)
      }
    } finally {
      setActivating(null)
    }
  }, [available, activating, cooldowns, xp, accessToken, userId, onXpCost])

  const states: AbilityState[] = available.map(a => ({
    ...a,
    cooldownRemaining: cooldowns.get(a.id) ?? 0,
    isActive: actives.has(a.id),
  }))

  return { states, activating, activateAbility }
}
