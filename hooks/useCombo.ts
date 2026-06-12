'use client'
import { useRef, useState, useCallback, useEffect } from 'react'
import { playComboBreak, playComboMilestone } from '@/lib/sound'

export interface ComboState {
  count:   number
  xpBonus: number
  tier:    number   // 0-4
}

const TIMEOUT_MS = 2000
const TIER_THRESHOLDS = [0, 5, 10, 20, 30]

function getTier(count: number): number {
  let t = 0
  TIER_THRESHOLDS.forEach((th, i) => { if (count >= th) t = i })
  return t
}

function getXpBonus(count: number): number {
  if (count >= 30) return 5
  if (count >= 20) return 4
  if (count >= 10) return 3
  if (count >= 5)  return 2
  return 1
}

export function useCombo() {
  const [combo, setCombo] = useState<ComboState>({ count: 0, xpBonus: 1, tier: 0 })
  const [maxCombo, setMaxCombo] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevTier = useRef(0)

  const resetCombo = useCallback(() => {
    setCombo(c => {
      if (c.count > 2) playComboBreak()
      return { count: 0, xpBonus: 1, tier: 0 }
    })
    prevTier.current = 0
  }, [])

  const registerHit = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(resetCombo, TIMEOUT_MS)

    setCombo(c => {
      const count   = c.count + 1
      const tier    = getTier(count)
      const xpBonus = getXpBonus(count)
      if (tier > prevTier.current) {
        prevTier.current = tier
        playComboMilestone(tier)
      }
      return { count, xpBonus, tier }
    })
    setMaxCombo(m => {
      const next = combo.count + 1
      return next > m ? next : m
    })
  }, [combo.count, resetCombo])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  return { combo, maxCombo, registerHit }
}
