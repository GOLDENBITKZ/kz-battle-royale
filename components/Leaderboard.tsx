'use client'
import { useState, useEffect } from 'react'

interface LeaderEntry {
  rank:         number
  userId:       string
  displayName:  string
  faction:      string
  totalClicks:  number
  level:        number
}

export default function Leaderboard({ currentUserId }: { currentUserId: string }) {
  const [data, setData]     = useState<LeaderEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!
    fetch(`${BACKEND}/leaderboard`)
      .then(r => r.json())
      .then(d => setData(d.leaders ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-4 font-pixel text-[6px] text-gray-600">Загрузка...</div>

  const FACTION_COLORS: Record<string, string> = {
    south: '#F59E0B', east: '#EF4444', center: '#3B82F6', west: '#10B981', north: '#8B5CF6',
  }

  return (
    <div className="p-2">
      <p className="font-pixel text-[6px] text-gray-600 mb-2">ТОП ИГРОКИ</p>
      {data.map(entry => (
        <div
          key={entry.userId}
          className="flex items-center gap-2 py-1.5 border-b border-border"
          style={{ opacity: entry.userId === currentUserId ? 1 : 0.8 }}
        >
          <span className="font-pixel text-[6px] text-gray-600 w-4">{entry.rank}</span>
          <div
            className="w-1.5 h-1.5 rounded-sm"
            style={{ backgroundColor: FACTION_COLORS[entry.faction] ?? '#6B7280' }}
          />
          <span
            className="font-pixel text-[6px] flex-1 truncate"
            style={{ color: entry.userId === currentUserId ? '#FFD700' : '#F9FAFB' }}
          >
            {entry.displayName}
          </span>
          <span className="font-pixel text-[5px] text-gray-500">Lv{entry.level}</span>
          <span className="font-pixel text-[6px] text-gray-400">
            {entry.totalClicks >= 1000 ? `${(entry.totalClicks/1000).toFixed(1)}k` : entry.totalClicks}
          </span>
        </div>
      ))}
      {data.length === 0 && (
        <p className="font-pixel text-[5px] text-gray-700 text-center py-4">Ещё нет данных</p>
      )}
    </div>
  )
}
