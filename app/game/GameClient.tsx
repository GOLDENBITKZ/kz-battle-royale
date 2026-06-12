'use client'
import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { GameMapHandle, GameStateUpdate } from '@/components/GameMap'
import NewsTicker from '@/components/NewsTicker'
import ComboMeter from '@/components/ComboMeter'
import AbilityBar from '@/components/AbilityBar'
import AchievementToast from '@/components/AchievementToast'
import EventBanner from '@/components/EventBanner'
import OnboardingTour, { shouldShowOnboarding } from '@/components/OnboardingTour'
import PlayerProfile from '@/components/PlayerProfile'
import DailyQuests from '@/components/DailyQuests'
import Leaderboard from '@/components/Leaderboard'
import FactionHUD from '@/components/FactionHUD'

import { useClickBatcher } from '@/hooks/useClickBatcher'
import { useCombo } from '@/hooks/useCombo'
import { useAbilities } from '@/hooks/useAbilities'
import { useAchievements } from '@/hooks/useAchievements'
import { useDailyQuests } from '@/hooks/useDailyQuests'
import { usePlayerProfile } from '@/hooks/usePlayerProfile'
import { useSpecialEvents } from '@/hooks/useSpecialEvents'

import { FACTIONS, CITIES, type FactionId, type CityId } from '@/lib/config'
import { getLevelConfig } from '@/lib/levels'
import { initAudio } from '@/lib/sound'
import { CITY_TRAITS, getTimeBonus } from '@/lib/city-traits'
import { playClick, playCapture, playCityLost } from '@/lib/sound'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!

// GameMap is canvas-heavy — load client-only
const GameMap = dynamic(() => import('@/components/GameMap'), { ssr: false })

interface Props {
  userId: string; faction: FactionId; cityId: string; displayName: string
  accessToken: string; initialXP: number; initialLevel: number
  initialStreak: number; totalClicks: number
}

type BottomTab = 'battle' | 'quests' | 'rank' | 'me'

export default function GameClient({
  userId, faction, cityId, displayName,
  accessToken, initialXP, initialLevel, initialStreak, totalClicks: initClicks,
}: Props) {
  const mapRef = useRef<GameMapHandle>(null)

  const [selectedTarget, setSelectedTarget] = useState<CityId | null>(null)
  const [scores, setScores] = useState<Record<FactionId, number>>({ south: 0, east: 0, center: 0, west: 0, north: 0 })
  const [live, setLive]         = useState<'connecting' | 'live' | 'offline'>('connecting')
  const [bottomTab, setBottomTab] = useState<BottomTab>('battle')
  const [hudOpen, setHudOpen]   = useState(false)
  const [showOnboard, setShowOnboard] = useState(false)
  const [attackFlash, setAttackFlash] = useState(false)
  const [xpPopup, setXpPopup]   = useState<string | null>(null)
  const cityOwners = useRef<Map<CityId, FactionId>>(new Map())

  const { profile, xpProgress, levelUpAnim, addXP, addClick } = usePlayerProfile(userId, {
    xp: initialXP, level: initialLevel, streak: initialStreak, totalClicks: initClicks,
  })
  const { event: activeEvent, xpMultiplier } = useSpecialEvents()
  const { combo, maxCombo, registerHit }     = useCombo()
  const { states: abilityStates, activating, activateAbility } = useAbilities(
    faction, userId, accessToken, profile.xp, profile.level, (d) => addXP(d)
  )
  const { earned, toasts: achToasts, checkAll: checkAchs, dismissToast } = useAchievements(userId)
  const { quests, progress, trackEvent } = useDailyQuests(userId, faction)
  const { registerClick, status: clickStatus } = useClickBatcher({
    userId, cityId: cityId as CityId, accessToken,
    onBanned: () => setSelectedTarget(null),
    onError: () => {},
  })

  const targetTrait = useMemo(() =>
    selectedTarget ? CITY_TRAITS[selectedTarget] : null, [selectedTarget])

  // ── Attack ──
  const handleAttack = useCallback(() => {
    if (!selectedTarget || clickStatus === 'banned') return
    initAudio()

    setAttackFlash(true)
    setTimeout(() => setAttackFlash(false), 80)

    registerClick(selectedTarget)
    registerHit()
    addClick()
    playClick(combo.count)
    trackEvent('click', 1)

    const xpGain = Math.round(combo.xpBonus * xpMultiplier)
    if (xpGain > 1) {
      addXP(xpGain - 1)
      setXpPopup(`+${xpGain} XP`)
      setTimeout(() => setXpPopup(null), 900)
    }
    if (navigator.vibrate) navigator.vibrate(combo.count >= 6 ? [15, 5, 15] : 8)

    checkAchs({
      totalClicks: profile.totalClicks + 1, citiesCaptured: 0,
      maxCombo: Math.max(maxCombo, combo.count), streak: profile.streak,
      abilitiesUsed: 0, questsDone: [...progress.values()].filter(p => p.completed).length,
      referrals: 0, level: profile.level, faction, dailyClicks: 1, daysActive: profile.streak,
    })
  }, [
    selectedTarget, clickStatus, registerClick, registerHit, addClick,
    combo, xpMultiplier, addXP, trackEvent, checkAchs,
    profile, maxCombo, progress, faction,
  ])

  // ── Map events ──
  const handleCityClick = useCallback((id: CityId) => {
    if (id === cityId) { setSelectedTarget(null); return }
    const owner = cityOwners.current.get(id) ?? CITIES[id].faction
    if (owner === faction) { playClick(1); return }
    setSelectedTarget(id); playClick(2)
  }, [cityId, faction])

  const handleDblTap = useCallback((id: CityId) => {
    if (id === cityId || (cityOwners.current.get(id) ?? CITIES[id].faction) === faction) return
    setSelectedTarget(id)
    setTimeout(handleAttack, 50)
  }, [cityId, faction, handleAttack])

  // ── SSE ──
  useEffect(() => {
    let es: EventSource
    let retry: ReturnType<typeof setTimeout>

    function connect() {
      setLive('connecting')
      es = new EventSource(`${BACKEND}/events`)
      es.addEventListener('gamestate', (e) => {
        const update: GameStateUpdate = JSON.parse(e.data)
        mapRef.current?.applyUpdate(update)
        setLive('live')

        const newScores: Record<FactionId, number> = { south: 0, east: 0, center: 0, west: 0, north: 0 }
        for (const cs of update.cities) {
          const prev = cityOwners.current.get(cs.cityId as CityId)
          cityOwners.current.set(cs.cityId as CityId, cs.owner as FactionId)

          if (prev && prev !== cs.owner) {
            mapRef.current?.flashCapture(cs.cityId as CityId, cs.owner as FactionId)
            if (cs.owner === faction) {
              playCapture(); addXP(100); trackEvent('capture', 1)
              if (navigator.vibrate) navigator.vibrate([50, 20, 80, 20, 50])
            } else if (prev === faction) {
              playCityLost()
              if (navigator.vibrate) navigator.vibrate([80, 30, 80])
            }
          }
          newScores[cs.owner as FactionId] = (newScores[cs.owner as FactionId] ?? 0) + cs.score
        }
        setScores(newScores)
      })
      es.onerror = () => {
        setLive('offline'); es.close()
        retry = setTimeout(connect, 5000)
      }
    }
    connect()
    return () => { es?.close(); clearTimeout(retry) }
  }, [faction, addXP, trackEvent])

  // ── Keyboard ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && selectedTarget && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault(); handleAttack()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedTarget, handleAttack])

  useEffect(() => { if (shouldShowOnboarding()) setShowOnboard(true) }, [])

  const fc    = FACTIONS[faction]
  const lvl   = getLevelConfig(profile.level)
  const trait = CITY_TRAITS[cityId as CityId]
  const timeB = getTimeBonus(trait)

  return (
    <div className="fixed inset-0 bg-dark flex flex-col overflow-hidden select-none"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {showOnboard && <OnboardingTour faction={faction} onComplete={() => setShowOnboard(false)} />}
      <AchievementToast achievements={achToasts} onDismiss={dismissToast} />

      {/* Level-up overlay */}
      {levelUpAnim && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
          <div className="font-pixel text-center animate-bounce">
            <p style={{ fontSize: 64 }}>{lvl.icon}</p>
            <p className="text-xs mt-2" style={{ color: lvl.color }}>УРОВЕНЬ {profile.level}!</p>
            <p className="text-[10px] text-white">{lvl.title}</p>
          </div>
        </div>
      )}

      {/* ── STATUS BAR ── */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-panel border-b border-border gap-2 flex-shrink-0 z-10">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm">{lvl.icon}</span>
          <span className="font-pixel text-[6px] truncate" style={{ color: fc.color }}>{fc.nameRu}</span>
          <span className="font-pixel text-[5px] text-gray-600">Lv{profile.level}</span>
          {timeB > 1.0 && (
            <span className="font-pixel text-[5px] text-yellow-500 animate-pulse">×{timeB.toFixed(1)}⚡</span>
          )}
        </div>
        <div className="flex-1 mx-2 max-w-[120px]">
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-1.5 transition-all duration-300 rounded-full"
              style={{ width: `${xpProgress.pct}%`, backgroundColor: lvl.color }} />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-pixel text-[5px] text-orange-400">🔥{profile.streak}</span>
          <span className={`font-pixel text-[5px] ${
            live === 'live' ? 'text-green-400' : live === 'offline' ? 'text-red-400 animate-pulse' : 'text-yellow-400'
          }`}>{live === 'live' ? '●' : live === 'offline' ? '✖' : '○'}</span>
        </div>
      </div>

      <EventBanner event={activeEvent} />

      {/* ── MAP ── */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <GameMap
          ref={mapRef}
          userFaction={faction}
          userCityId={cityId as CityId}
          onCityClick={handleCityClick}
          onCityDblTap={handleDblTap}
          selectedTarget={selectedTarget}
        />
        <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none">
          <ComboMeter combo={combo} />
        </div>
        {xpPopup && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <p className="font-pixel text-[10px] text-yellow-400 animate-bounce"
              style={{ textShadow: '0 0 10px #F59E0B' }}>{xpPopup}</p>
          </div>
        )}
        {selectedTarget && (
          <div className="absolute top-2 right-2 bg-dark/90 border border-red-700/50 px-2 py-1 pointer-events-none">
            <p className="font-pixel text-[6px] text-red-400">ЦЕЛЬ:</p>
            <p className="font-pixel text-[7px] text-white">{CITIES[selectedTarget].nameRu}</p>
            {targetTrait && <p className="font-pixel text-[5px] text-gray-500 mt-0.5">{targetTrait.description}</p>}
          </div>
        )}
      </div>

      <NewsTicker backendUrl={BACKEND} />

      {/* ── ATTACK ZONE ── */}
      <div className="flex-shrink-0 bg-panel border-t border-border">
        <AbilityBar
          states={abilityStates} activating={activating}
          userXP={profile.xp} userLevel={profile.level}
          onActivate={(id) => { activateAbility(id); trackEvent('ability_use', 1) }}
        />
        <div className="flex items-stretch">
          {/* Faction mini-scores */}
          <div className="flex flex-col justify-around px-2 py-1 border-r border-border min-w-[70px]">
            {Object.entries(scores)
              .sort(([,a],[,b]) => b - a).slice(0,3)
              .map(([fId, score]) => (
                <div key={fId} className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5" style={{ backgroundColor: FACTIONS[fId as FactionId].color }} />
                  <span className="font-pixel text-[4px]" style={{ color: FACTIONS[fId as FactionId].color }}>
                    {score >= 1000 ? `${(score/1000).toFixed(1)}k` : score}
                  </span>
                </div>
              ))}
          </div>

          {/* ATTACK BUTTON */}
          <button
            onPointerDown={handleAttack}
            disabled={!selectedTarget || clickStatus === 'banned'}
            className={`flex-1 py-5 font-pixel text-[11px] relative overflow-hidden transition-all duration-75 ${
              attackFlash ? 'scale-95' : ''
            } ${
              !selectedTarget
                ? 'bg-gray-900 text-gray-700 border-t-0'
                : clickStatus === 'banned'
                ? 'bg-red-950 text-red-700'
                : 'text-red-400'
            }`}
            style={
              selectedTarget && clickStatus !== 'banned'
                ? { backgroundColor: attackFlash ? `${fc.color}33` : '#111118', boxShadow: attackFlash ? `0 0 25px ${fc.color}` : 'none' }
                : {}
            }
          >
            {clickStatus === 'banned'
              ? '🚫 AI-UYAT БАН'
              : !selectedTarget
              ? '← Выбери вражеский город'
              : `👊 АТАКА ${CITIES[selectedTarget]?.nameRu}`}
            {attackFlash && selectedTarget && (
              <span className="absolute inset-0 opacity-20" style={{ backgroundColor: fc.color }} />
            )}
          </button>
        </div>
      </div>

      {/* ── BOTTOM TAB BAR ── */}
      <div className="flex-shrink-0 flex border-t border-border bg-panel">
        {([
          { id: 'battle' as BottomTab, icon: '⚔',  label: 'БОЙ'    },
          { id: 'quests' as BottomTab, icon: '📜',  label: 'КВЕСТЫ' },
          { id: 'rank'   as BottomTab, icon: '🏆',  label: 'ТОП'    },
          { id: 'me'     as BottomTab, icon: '👤',  label: 'Я'      },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setBottomTab(tab.id)
              setHudOpen(prev => bottomTab === tab.id ? !prev : true)
            }}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
              hudOpen && bottomTab === tab.id ? 'text-white' : 'text-gray-600'
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span className="font-pixel text-[4px]">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── BOTTOM SHEET ── */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 bg-panel border-t-2 border-border transition-transform duration-300 ease-out`}
        style={{
          maxHeight: '72vh', overflowY: 'auto',
          transform: hudOpen ? 'translateY(0)' : 'translateY(100%)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div
          className="sticky top-0 flex justify-center py-2 bg-panel border-b border-border cursor-pointer z-10"
          onClick={() => setHudOpen(false)}
        >
          <div className="w-10 h-1 bg-gray-700 rounded-full" />
        </div>

        {bottomTab === 'battle' && (
          <FactionHUD scores={scores} userFaction={faction} userCityId={cityId as CityId}
            clickStatus={clickStatus} targetCity={selectedTarget} onAttackClick={handleAttack} />
        )}
        {bottomTab === 'quests' && <DailyQuests quests={quests} progress={progress} loading={false} />}
        {bottomTab === 'rank'   && <Leaderboard currentUserId={userId} />}
        {bottomTab === 'me'     && (
          <div className="p-3 space-y-3">
            <PlayerProfile profile={profile} xpProgress={xpProgress} levelUpAnim={levelUpAnim} />
            <div className="bg-dark border border-border p-3">
              <p className="font-pixel text-[6px] text-gray-500 mb-2">РЕФЕРАЛЬНЫЙ КОД</p>
              <div className="flex items-center gap-2">
                <p className="font-pixel text-[10px] text-yellow-400 tracking-widest">
                  {(profile as any).referralCode ?? displayName.slice(0,8).toUpperCase()}
                </p>
                <button
                  onClick={() => {
                    const code = displayName.slice(0,8).toUpperCase()
                    navigator.share?.({
                      title: 'KZ Battle Royale',
                      text: `Вступай! Мой код: ${code}`,
                      url: `${window.location.origin}?ref=${code}`,
                    }).catch(() => navigator.clipboard?.writeText(code))
                  }}
                  className="font-pixel text-[6px] text-blue-400 border border-blue-900 px-2 py-1"
                >
                  ПОДЕЛИТЬСЯ
                </button>
              </div>
              <p className="font-pixel text-[5px] text-gray-600 mt-2">Друг → ты +3 дня, он +3 дня</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
