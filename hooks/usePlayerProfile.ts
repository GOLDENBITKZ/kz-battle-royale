'use client'
import { useState, useCallback, useRef } from 'react'
import { getXpProgress } from '@/lib/levels'
import { playLevelUp } from '@/lib/sound'

interface ProfileInit {
  xp: number; level: number; streak: number; totalClicks: number
}

export function usePlayerProfile(userId: string, init: ProfileInit) {
  const [xp,          setXp]          = useState(init.xp)
  const [level,       setLevel]       = useState(init.level)
  const [streak,      setStreak]      = useState(init.streak)
  const [totalClicks, setTotalClicks] = useState(init.totalClicks)
  const [levelUpAnim, setLevelUpAnim] = useState(false)
  const pendingXp = useRef(0)
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const addXP = useCallback((amount: number) => {
    pendingXp.current += amount
    if (flushTimer.current) return
    flushTimer.current = setTimeout(async () => {
      const batch = pendingXp.current
      pendingXp.current = 0
      flushTimer.current = null

      setXp(prev => {
        const next = prev + batch
        // local level check
        const progress = getXpProgress(next)
        if (progress.level > level) {
          setLevel(progress.level)
          setLevelUpAnim(true)
          playLevelUp()
          setTimeout(() => setLevelUpAnim(false), 3000)
        }
        return next
      })
    }, 1000)
  }, [level])

  const addClick = useCallback(() => {
    setTotalClicks(t => t + 1)
  }, [])

  const xpProgress = getXpProgress(xp)

  return {
    profile: { xp, level, streak, totalClicks },
    xpProgress,
    levelUpAnim,
    addXP,
    addClick,
  }
}
