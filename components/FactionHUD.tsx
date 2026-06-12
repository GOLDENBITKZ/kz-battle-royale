'use client'
import { FACTIONS, CITIES, type FactionId, type CityId } from '@/lib/config'

interface Props {
  scores:      Record<FactionId, number>
  userFaction: FactionId
  userCityId:  CityId
  clickStatus: string
  targetCity:  CityId | null
  onAttackClick: () => void
}

export default function FactionHUD({ scores, userFaction, userCityId, clickStatus, targetCity, onAttackClick }: Props) {
  const sorted = Object.entries(scores)
    .map(([id, score]) => ({ id: id as FactionId, score, cfg: FACTIONS[id as FactionId] }))
    .sort((a, b) => b.score - a.score)

  const myRank = sorted.findIndex(s => s.id === userFaction) + 1

  return (
    <div className="p-3 space-y-3">
      {/* Faction scores */}
      <div>
        <p className="font-pixel text-[6px] text-gray-600 mb-2">ТЕКУЩИЙ СЧЁТ</p>
        {sorted.map((item, rank) => (
          <div key={item.id} className="flex items-center gap-2 mb-1.5">
            <span className="font-pixel text-[6px] text-gray-600 w-3">{rank + 1}</span>
            <div className="flex-1 h-4 bg-gray-900 relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 transition-all duration-500"
                style={{
                  width: `${sorted[0].score > 0 ? (item.score / sorted[0].score) * 100 : 0}%`,
                  backgroundColor: item.cfg.color,
                  opacity: item.id === userFaction ? 1 : 0.5,
                }}
              />
              <span className="absolute inset-0 flex items-center px-1">
                <span className="font-pixel text-[6px] text-white">
                  {item.cfg.nameRu.split(' ')[0]}
                  {item.id === userFaction ? ' ← ВЫ' : ''}
                </span>
              </span>
            </div>
            <span className="font-pixel text-[6px] w-10 text-right" style={{ color: item.cfg.color }}>
              {item.score >= 1000 ? `${(item.score/1000).toFixed(1)}k` : item.score}
            </span>
          </div>
        ))}
      </div>

      {/* Your city info */}
      <div className="bg-dark border border-border rounded p-2">
        <p className="font-pixel text-[5px] text-gray-600 mb-1">ВАШ ГОРОД</p>
        <p className="font-pixel text-[8px]" style={{ color: FACTIONS[userFaction].color }}>
          {CITIES[userCityId].nameRu}
        </p>
        <p className="font-pixel text-[5px] text-gray-500 mt-0.5">Ранг #{myRank} среди фракций</p>
      </div>

      {/* Target info */}
      {targetCity && (
        <div className="bg-red-950/30 border border-red-900/50 rounded p-2">
          <p className="font-pixel text-[5px] text-red-600 mb-1">ЦЕЛЬ АТАКИ</p>
          <p className="font-pixel text-[8px] text-red-400">{CITIES[targetCity].nameRu}</p>
          <p className="font-pixel text-[5px] text-gray-600 mt-0.5">
            Фракция: {FACTIONS[CITIES[targetCity].faction].nameRu}
          </p>
        </div>
      )}
    </div>
  )
}
