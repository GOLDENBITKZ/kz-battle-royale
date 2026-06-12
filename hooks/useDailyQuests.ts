'use client'
import { useState, useCallback, useEffect } from 'react'
import type { FactionId } from '@/lib/config'

const LS_KEY = 'kz_quest_progress'

export interface Quest {
  id:          string
  questId:     string
  title:       string
  description: string
  target:      number
  xpReward:    number
}

export interface QuestProgress {
  current:   number
  completed: boolean
}

const QUEST_POOL = [
  { questId: 'click_50',    title: '50 кликов',       description: 'Нанеси 50 ударов за день',   target: 50,  xpReward: 30 },
  { questId: 'click_200',   title: '200 кликов',      description: 'Нанеси 200 ударов за день',  target: 200, xpReward: 80 },
  { questId: 'click_500',   title: 'Батыр дня',       description: '500 кликов — истинный батыр',target: 500, xpReward: 150 },
  { questId: 'combo_10',    title: 'Комбо ×10',       description: 'Набери комбо 10 кликов',     target: 10,  xpReward: 50 },
  { questId: 'ability_use', title: 'Способность',     description: 'Используй способность фракции', target: 1, xpReward: 40 },
  { questId: 'capture',     title: 'Захват!',         description: 'Помоги захватить вражеский город', target: 1, xpReward: 200 },
]

function getDailyQuests(faction: FactionId): Quest[] {
  const seed = parseInt(new Date().toISOString().slice(0,10).replace(/-/g,''))
  const shuffled = [...QUEST_POOL].sort((a, b) => {
    const ha = ((seed * a.questId.length * 31) % 97)
    const hb = ((seed * b.questId.length * 31) % 97)
    return ha - hb
  })
  return shuffled.slice(0, 3).map((q, i) => ({ ...q, id: `${q.questId}_${i}` }))
}

function loadProgress(): Map<string, QuestProgress> {
  try {
    const raw  = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}')
    const date = raw.date
    if (date !== new Date().toISOString().slice(0,10)) return new Map()
    return new Map(Object.entries(raw.progress ?? {}))
  } catch { return new Map() }
}

function saveProgress(quests: Quest[], progress: Map<string, QuestProgress>) {
  try {
    const obj: Record<string, QuestProgress> = {}
    progress.forEach((v, k) => { obj[k] = v })
    localStorage.setItem(LS_KEY, JSON.stringify({ date: new Date().toISOString().slice(0,10), progress: obj }))
  } catch {}
}

export function useDailyQuests(userId: string, faction: FactionId) {
  const [quests]   = useState<Quest[]>(() => getDailyQuests(faction))
  const [progress, setProgress] = useState<Map<string, QuestProgress>>(() => loadProgress())

  const trackEvent = useCallback((eventType: string, amount: number) => {
    setProgress(prev => {
      const next = new Map(prev)
      for (const quest of quests) {
        if (quest.questId.startsWith(eventType)) {
          const cur = prev.get(quest.id) ?? { current: 0, completed: false }
          if (!cur.completed) {
            const newCur = cur.current + amount
            next.set(quest.id, { current: newCur, completed: newCur >= quest.target })
          }
        }
      }
      saveProgress(quests, next)
      return next
    })
  }, [quests])

  return { quests, progress, trackEvent }
}
