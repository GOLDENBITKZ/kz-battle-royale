'use client'
import { getLevelConfig } from '@/lib/levels'

interface Profile {
  xp: number; level: number; streak: number; totalClicks: number
}
interface XpProgress {
  pct: number; current: number; needed: number; level: number
}

export default function PlayerProfile({
  profile, xpProgress, levelUpAnim,
}: {
  profile: Profile; xpProgress: XpProgress; levelUpAnim: boolean
}) {
  const lvl = getLevelConfig(profile.level)

  return (
    <div className="p-3 space-y-3">
      {/* Level badge */}
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 flex items-center justify-center border-2 text-2xl ${levelUpAnim ? 'animate-bounce' : ''}`}
          style={{ borderColor: lvl.color }}
        >
          {lvl.icon}
        </div>
        <div>
          <p className="font-pixel text-[8px]" style={{ color: lvl.color }}>{lvl.title}</p>
          <p className="font-pixel text-[5px] text-gray-500">{lvl.titleKz}</p>
          <p className="font-pixel text-[5px] text-gray-600">Уровень {profile.level}</p>
        </div>
      </div>

      {/* XP bar */}
      <div>
        <div className="flex justify-between mb-0.5">
          <span className="font-pixel text-[5px] text-gray-600">XP</span>
          <span className="font-pixel text-[5px] text-gray-600">
            {xpProgress.current} / {xpProgress.needed}
          </span>
        </div>
        <div className="h-2 bg-gray-900">
          <div
            className="h-2 transition-all duration-500"
            style={{ width: `${xpProgress.pct}%`, backgroundColor: lvl.color }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Кликов', value: profile.totalClicks >= 1000 ? `${(profile.totalClicks/1000).toFixed(1)}k` : profile.totalClicks },
          { label: 'Серия',  value: `${profile.streak}д` },
          { label: 'XP',     value: profile.xp >= 1000 ? `${(profile.xp/1000).toFixed(1)}k` : profile.xp },
        ].map(s => (
          <div key={s.label} className="bg-dark border border-border rounded p-1.5 text-center">
            <p className="font-pixel text-[8px] text-white">{s.value}</p>
            <p className="font-pixel text-[4px] text-gray-600">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
