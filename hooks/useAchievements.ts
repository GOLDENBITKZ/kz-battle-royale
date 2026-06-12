'use client'
import { useState, useCallback, useRef } from 'react'
import { ACHIEVEMENTS, type Achievement, type AchievementStats } from '@/lib/achievements'

const LS_KEY = 'kz_battle_ach'

function loadEarned(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(LS_KEY) ?? '[]')) }
  catch { return new Set() }
}

export function useAchievements(userId: string) {
  const [earned,  setEarned]  = useState<Set<string>>(() => loadEarned())
  const [toasts,  setToasts]  = useState<Achievement[]>([])
  const toastQueue = useRef<Achievement[]>([])

  const checkAll = useCallback((stats: AchievementStats) => {
    const newOnes: Achievement[] = []
    for (const ach of ACHIEVEMENTS) {
      if (!earned.has(ach.id) && ach.check(stats)) newOnes.push(ach)
    }
    if (newOnes.length === 0) return

    setEarned(prev => {
      const next = new Set(prev)
      newOnes.forEach(a => next.add(a.id))
      try { localStorage.setItem(LS_KEY, JSON.stringify([...next])) } catch {}
      return next
    })

    // Queue toasts with 2s gap
    newOnes.forEach((ach, i) => {
      setTimeout(() => setToasts(t => [...t, ach]), i * 2200)
    })
  }, [earned])

  const dismissToast = useCallback((id: string) => {
    setToasts(t => t.filter(a => a.id !== id))
  }, [])

  return { earned, toasts, checkAll, dismissToast }
}
