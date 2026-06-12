'use client'
import type { Quest, QuestProgress } from '@/hooks/useDailyQuests'

interface Props {
  quests:   Quest[]
  progress: Map<string, QuestProgress>
  loading:  boolean
}

export default function DailyQuests({ quests, progress, loading }: Props) {
  if (loading) return <div className="p-4 font-pixel text-[6px] text-gray-600">Загрузка...</div>

  return (
    <div className="p-3 space-y-2">
      <p className="font-pixel text-[6px] text-gray-600">ЕЖЕДНЕВНЫЕ КВЕСТЫ</p>
      {quests.map(q => {
        const p = progress.get(q.id) ?? { current: 0, completed: false }
        const pct = Math.min((p.current / q.target) * 100, 100)
        return (
          <div
            key={q.id}
            className="bg-dark border rounded p-2"
            style={{ borderColor: p.completed ? '#10B981' : '#1E1E2E' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-pixel text-[7px]" style={{ color: p.completed ? '#10B981' : '#F9FAFB' }}>
                  {p.completed ? '✓ ' : ''}{q.title}
                </p>
                <p className="font-pixel text-[5px] text-gray-500 mt-0.5">{q.description}</p>
              </div>
              <span className="font-pixel text-[5px] text-yellow-500 ml-2">+{q.xpReward}XP</span>
            </div>
            <div className="mt-1.5 h-1.5 bg-gray-900">
              <div
                className="h-1.5 transition-all duration-300"
                style={{ width: `${pct}%`, backgroundColor: p.completed ? '#10B981' : '#F59E0B' }}
              />
            </div>
            <p className="font-pixel text-[4px] text-gray-700 mt-0.5 text-right">
              {Math.min(p.current, q.target)}/{q.target}
            </p>
          </div>
        )
      })}
    </div>
  )
}
