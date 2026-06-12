'use client'
import { useEffect } from 'react'
import type { Achievement } from '@/lib/achievements'

interface Props {
  achievements: Achievement[]
  onDismiss:    (id: string) => void
}

export default function AchievementToast({ achievements, onDismiss }: Props) {
  const ach = achievements[0]
  useEffect(() => {
    if (!ach) return
    const t = setTimeout(() => onDismiss(ach.id), 3500)
    return () => clearTimeout(t)
  }, [ach, onDismiss])

  if (!ach) return null

  return (
    <div
      className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-panel border border-yellow-600/50 px-4 py-2 flex items-center gap-3 animate-bounce"
      style={{ boxShadow: '0 0 20px #F59E0B44' }}
    >
      <span className="text-2xl">{ach.icon}</span>
      <div>
        <p className="font-pixel text-[6px] text-yellow-500">ДОСТИЖЕНИЕ!</p>
        <p className="font-pixel text-[8px] text-white">{ach.nameRu}</p>
        <p className="font-pixel text-[5px] text-gray-500">{ach.description}</p>
      </div>
    </div>
  )
}
