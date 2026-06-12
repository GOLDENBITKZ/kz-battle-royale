'use client'
import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { GameMapHandle } from '@/components/GameMap'
import { useClickBatcher }   from '@/hooks/useClickBatcher'
import { useCombo }          from '@/hooks/useCombo'
import { useAbilities }      from '@/hooks/useAbilities'
import { useAchievements }   from '@/hooks/useAchievements'
import { useDailyQuests }    from '@/hooks/useDailyQuests'
import { usePlayerProfile }  from '@/hooks/usePlayerProfile'
import { useSpecialEvents }  from '@/hooks/useSpecialEvents'
import { useGameState }      from '@/hooks/useGameState'
import { FACTIONS, CITIES, type FactionId, type CityId } from '@/lib/config'
import { getLevelConfig }    from '@/lib/levels'
import { initAudio, playClick, playCapture, playCityLost, playLevelUp, playComboMilestone } from '@/lib/sound'
import AchievementToast      from '@/components/AchievementToast'
import AbilityBar            from '@/components/AbilityBar'
import DailyQuests           from '@/components/DailyQuests'
import Leaderboard           from '@/components/Leaderboard'
import { getSupabase }       from '@/lib/supabase-client'

const GameMap = dynamic(() => import('@/components/GameMap'), { ssr: false })

interface Props {
  userId: string; faction: FactionId; cityId: string; displayName: string
  accessToken: string; initialXP: number; initialLevel: number
  initialStreak: number; totalClicks: number; referralCode?: string
}

type Tab = 'battle' | 'quests' | 'rank' | 'clan' | 'me'

interface FloatNum { id: string; val: string; x: number; crit: boolean }

export default function GameClient({
  userId, faction, cityId, displayName,
  accessToken, initialXP, initialLevel, initialStreak, totalClicks: initClicks,
  referralCode,
}: Props) {
  const mapRef = useRef<GameMapHandle>(null)
  const fc     = FACTIONS[faction]

  /* ── state ── */
  const [selectedTarget, setSelectedTarget] = useState<CityId | null>(null)
  const [tab,   setTab]   = useState<Tab>('battle')
  const [sheet, setSheet] = useState(false)
  const [flash, setFlash] = useState(false)
  const [critFlash, setCritFlash] = useState(false)
  const [floats, setFloats]       = useState<FloatNum[]>([])
  const [commentary, setCommentary] = useState('')
  const [activePlayers, setActivePlayers] = useState(0)
  const [clanData, setClanData]   = useState<any>(null)
  const [clanLoading, setClanLoading] = useState(false)
  const [clanName, setClanName]   = useState('')
  const [clanTag, setClanTag]     = useState('')
  const [clanEmoji, setClanEmoji] = useState('⚔️')

  /* ── hooks ── */
  const { profile, xpProgress, levelUpAnim, addXP, addClick }
    = usePlayerProfile(userId, { xp: initialXP, level: initialLevel, streak: initialStreak, totalClicks: initClicks })
  const { event: activeEvent, xpMultiplier } = useSpecialEvents()
  const { combo, maxCombo, registerHit }     = useCombo()
  const { states: abilityStates, activating, activateAbility } = useAbilities(
    faction, userId, accessToken, profile.xp, profile.level, addXP
  )
  const { earned: _earned, toasts: achToasts, checkAll: checkAchs, dismissToast } = useAchievements(userId)
  const { quests, progress, trackEvent } = useDailyQuests(userId, faction)

  const onCapture = useCallback((cId: CityId, newOwner: FactionId, prevOwner: FactionId) => {
    mapRef.current?.flashCapture(cId, newOwner)
    if (newOwner === faction) {
      playCapture(); addXP(150); trackEvent('capture', 1)
      spawnFloat('+150 XP 🏙', false)
      navigator.vibrate?.([50, 20, 80, 20, 80])
    } else if (prevOwner === faction) {
      playCityLost()
      navigator.vibrate?.([80, 30, 80])
    }
  }, [faction, addXP, trackEvent])

  const { update, scores, live, cityHps } = useGameState(onCapture)

  const { registerClick, status: clickStatus } = useClickBatcher({
    userId, accessToken,
    onBanned:  () => setSelectedTarget(null),
    onCapture: (cId) => { addXP(150); trackEvent('capture', 1) },
    onXP:      (xp) => addXP(xp),
  })

  /* ── apply map updates ── */
  useEffect(() => {
    if (update) mapRef.current?.applyUpdate(update)
  }, [update])

  /* ── load commentary & active players ── */
  useEffect(() => {
    fetch('/api/state').then(r => r.json()).then(d => {
      if (d.event?.message) setCommentary(d.event.message)
      if (d.activePlayers)  setActivePlayers(d.activePlayers)
    }).catch(() => {})
    const t = setInterval(() => {
      fetch('/api/state').then(r => r.json()).then(d => {
        if (d.event?.message) setCommentary(d.event.message)
        if (d.activePlayers)  setActivePlayers(d.activePlayers)
      }).catch(() => {})
    }, 30_000)
    return () => clearInterval(t)
  }, [])

  /* ── load clan data ── */
  useEffect(() => {
    const supabase = getSupabase()
    supabase
      .from('profiles')
      .select('clan_id, clans(id, name, tag, emoji, faction, member_count, total_damage)')
      .eq('id', userId)
      .single()
      .then((res: any) => {
        if (res?.data?.clan_id) setClanData(res.data.clans)
      })
  }, [userId])

  /* ── level-up sound ── */
  useEffect(() => { if (levelUpAnim) playLevelUp() }, [levelUpAnim])

  /* ── floating numbers ── */
  function spawnFloat(val: string, crit: boolean) {
    const id = Math.random().toString(36).slice(2)
    const x  = 20 + Math.random() * 60
    setFloats(p => [...p.slice(-10), { id, val, x, crit }])
    setTimeout(() => setFloats(p => p.filter(f => f.id !== id)), 850)
  }

  /* ── attack handler ── */
  const handleAttack = useCallback(() => {
    if (!selectedTarget || clickStatus === 'banned') return
    initAudio()

    const isCrit = Math.random() < 0.05
    const dmg    = Math.round((1 + Math.floor(initialLevel / 5)) * combo.xpBonus * (isCrit ? 3 : 1))
    const xpGain = Math.round(combo.xpBonus * xpMultiplier * (isCrit ? 2 : 1))

    registerClick(selectedTarget)
    registerHit()
    addClick()
    playClick(combo.count)
    trackEvent('click', 1)

    setFlash(true)
    setTimeout(() => setFlash(false), 80)

    spawnFloat(isCrit ? `💥 КРИТ ×3!` : `−${dmg}`, isCrit)

    if (isCrit) {
      setCritFlash(true)
      setTimeout(() => setCritFlash(false), 400)
      navigator.vibrate?.([25, 10, 25, 10, 40])
    } else if (combo.count >= 6) {
      navigator.vibrate?.([15, 5, 15])
    } else {
      navigator.vibrate?.(8)
    }

    if (xpGain > 1) {
      addXP(xpGain - 1)
      spawnFloat(`+${xpGain} XP`, false)
    }

    if (combo.count === 5 || combo.count === 10 || combo.count === 20) {
      playComboMilestone(combo.count >= 10 ? 2 : 1)
    }

    checkAchs({
      totalClicks: profile.totalClicks + 1, citiesCaptured: 0,
      maxCombo: Math.max(maxCombo, combo.count), streak: profile.streak,
      abilitiesUsed: 0,
      questsDone: [...progress.values()].filter(p => p.completed).length,
      referrals: 0, level: profile.level, faction, dailyClicks: 1, daysActive: profile.streak,
    })
  }, [
    selectedTarget, clickStatus, registerClick, registerHit, addClick, addXP,
    combo, xpMultiplier, trackEvent, checkAchs, profile, maxCombo, progress, faction, initialLevel,
  ])

  /* ── map click ── */
  const handleCityClick = useCallback((id: CityId) => {
    const owner = cityHps[id]?.owner ?? CITIES[id].faction
    if (id === cityId || owner === faction) { playClick(1); return }
    setSelectedTarget(id); playClick(2)
  }, [cityId, faction, cityHps])

  const handleDblTap = useCallback((id: CityId) => {
    const owner = cityHps[id]?.owner ?? CITIES[id].faction
    if (id === cityId || owner === faction) return
    setSelectedTarget(id)
    setTimeout(handleAttack, 50)
  }, [cityId, faction, cityHps, handleAttack])

  /* ── keyboard ── */
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.code === 'Space' && selectedTarget && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault(); handleAttack()
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [selectedTarget, handleAttack])

  /* ── clan actions ── */
  async function createClan() {
    if (!clanName.trim() || !clanTag.trim()) return
    setClanLoading(true)
    const supabase = getSupabase()
    const { data } = await supabase.rpc('create_clan', {
      p_user_id:     userId,
      p_name:        clanName.trim(),
      p_tag:         clanTag.trim(),
      p_emoji:       clanEmoji,
      p_description: '',
    })
    setClanLoading(false)
    if ((data as any)?.ok) window.location.reload()
    else alert((data as any)?.error ?? 'Ошибка')
  }

  async function leaveClan() {
    if (!confirm('Покинуть клан?')) return
    const supabase = getSupabase()
    await supabase.rpc('leave_clan', { p_user_id: userId })
    setClanData(null)
    window.location.reload()
  }

  /* ── computed ── */
  const lvl          = getLevelConfig(profile.level)
  const target       = selectedTarget ? CITIES[selectedTarget] : null
  const targetHp     = selectedTarget ? cityHps[selectedTarget] : null
  const targetHpPct  = targetHp ? Math.round((targetHp.hp / targetHp.maxHp) * 100) : 100
  const baseDamage   = 1 + Math.floor(initialLevel / 5)
  const effectiveDmg = Math.round(baseDamage * combo.xpBonus)

  const sortedFactions = useMemo(() =>
    (Object.entries(scores) as [FactionId, number][]).sort(([,a],[,b]) => b - a),
    [scores]
  )

  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/login?ref=${referralCode ?? displayName.slice(0,6).toUpperCase()}`

  /* ── render ── */
  return (
    <div
      className={`fixed inset-0 bg-dark flex flex-col overflow-hidden select-none ${critFlash ? 'animate-crit-shake' : ''}`}
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <AchievementToast achievements={achToasts} onDismiss={dismissToast} />

      {/* Level-up overlay */}
      {levelUpAnim && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-black/60 animate-fade-in">
          <div className="text-center animate-level-burst">
            <p style={{ fontSize: 72, filter: `drop-shadow(0 0 20px ${lvl.color})` }}>{lvl.icon}</p>
            <p className="font-pixel text-[10px] mt-2" style={{ color: lvl.color, textShadow: `0 0 20px ${lvl.color}` }}>
              УРОВЕНЬ {profile.level}!
            </p>
            <p className="font-pixel text-[7px] text-white mt-1">{lvl.title}</p>
          </div>
        </div>
      )}

      {/* ── TOP BAR ── */}
      <div className="flex-shrink-0 z-10" style={{ background: '#0D0D15' }}>
        {/* Row 1: faction + XP + status */}
        <div className="flex items-center px-3 pt-2 pb-1 gap-2">
          {/* Faction badge */}
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm border"
            style={{ borderColor: `${fc.color}50`, background: `${fc.color}14` }}
          >
            <span className="text-sm">{lvl.icon}</span>
            <span className="font-pixel text-[6px]" style={{ color: fc.color }}>{fc.nameRu.split(' ')[0]}</span>
            <span className="font-pixel text-[5px] text-gray-600">Lv{profile.level}</span>
          </div>

          {/* XP bar */}
          <div className="flex-1 relative">
            <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${xpProgress.pct}%`, background: `linear-gradient(90deg, ${fc.color}88, ${fc.color})` }}
              />
            </div>
            <p className="font-pixel text-[4px] text-gray-700 absolute right-0 -top-3">
              {xpProgress.current}/{xpProgress.needed} XP
            </p>
          </div>

          {/* Status cluster */}
          <div className="flex items-center gap-2">
            {profile.streak > 0 && (
              <span className="font-pixel text-[6px] text-orange-400">🔥{profile.streak}</span>
            )}
            <span
              className={`font-pixel text-[5px] flex items-center gap-0.5 ${
                live === 'live' ? 'text-green-400' : live === 'offline' ? 'text-red-400' : 'text-yellow-400'
              }`}
            >
              <span className={live === 'live' ? 'animate-online-dot' : ''}>●</span>
              {activePlayers > 0 && <span className="text-gray-600">{activePlayers}</span>}
            </span>
          </div>
        </div>

        {/* Commentary ticker */}
        {commentary && (
          <div className="overflow-hidden border-t border-gray-900/80 py-1 px-3">
            <p
              className="font-pixel text-[5px] text-gray-500 whitespace-nowrap animate-ticker-scroll"
              style={{ display: 'inline-block' }}
            >
              📡&nbsp;{commentary}
            </p>
          </div>
        )}
      </div>

      {/* ── MAP ── */}
      <div className={`relative flex-1 min-h-0 overflow-hidden transition-all duration-75 ${flash ? 'brightness-125' : ''}`}>
        <GameMap
          ref={mapRef}
          userFaction={faction}
          userCityId={cityId as CityId}
          onCityClick={handleCityClick}
          onCityDblTap={handleDblTap}
          selectedTarget={selectedTarget}
        />

        {/* Combo overlay */}
        {combo.count >= 2 && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none">
            <div
              className="px-3 py-1 border font-pixel text-[8px] animate-combo-pop"
              style={{
                color:           combo.count >= 10 ? '#FF4444' : combo.count >= 5 ? '#FFD700' : '#22C55E',
                borderColor:     combo.count >= 10 ? '#FF444460' : combo.count >= 5 ? '#FFD70060' : '#22C55E60',
                backgroundColor: combo.count >= 10 ? '#FF444415' : combo.count >= 5 ? '#FFD70015' : '#22C55E15',
                textShadow:      `0 0 10px currentColor`,
              }}
            >
              ×{combo.xpBonus.toFixed(1)} КОМБО
            </div>
          </div>
        )}

        {/* Floating damage/XP numbers */}
        {floats.map(f => (
          <div
            key={f.id}
            className="absolute pointer-events-none font-pixel animate-dmg-float"
            style={{
              left:       `${f.x}%`,
              bottom:     '35%',
              fontSize:   f.crit ? '12px' : '9px',
              color:      f.crit ? '#FF4444' : fc.color,
              textShadow: `0 0 12px currentColor`,
              whiteSpace: 'nowrap',
            }}
          >
            {f.val}
          </div>
        ))}

        {/* Target info overlay */}
        {selectedTarget && targetHp && (
          <div
            className="absolute top-2 right-2 border px-2 py-1.5 min-w-[110px]"
            style={{ background: '#0D0D15E0', borderColor: `${fc.color}40` }}
          >
            <p className="font-pixel text-[5px] text-gray-600">ЦЕЛЬ</p>
            <p className="font-pixel text-[7px] text-white">{CITIES[selectedTarget].nameRu}</p>
            <div className="mt-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${targetHpPct}%`,
                  background: targetHpPct > 50 ? '#22C55E' : targetHpPct > 25 ? '#F59E0B' : '#EF4444',
                }}
              />
            </div>
            <p className="font-pixel text-[4px] text-gray-600 mt-0.5">{targetHp.hp}/{targetHp.maxHp} HP</p>
          </div>
        )}
      </div>

      {/* ── ATTACK ZONE ── */}
      <div className="flex-shrink-0" style={{ background: '#0D0D15', borderTop: `1px solid #1E1E2E` }}>
        <AbilityBar
          states={abilityStates} activating={activating}
          userXP={profile.xp} userLevel={profile.level}
          onActivate={(id) => { activateAbility(id); trackEvent('ability_use', 1) }}
        />

        <button
          onPointerDown={handleAttack}
          disabled={!selectedTarget || clickStatus === 'banned'}
          className="w-full relative overflow-hidden transition-all"
          style={{
            height: 72,
            background: !selectedTarget
              ? '#0D0D15'
              : flash
                ? `linear-gradient(135deg, ${fc.color}50, ${fc.color}30)`
                : `linear-gradient(135deg, ${fc.color}20, ${fc.color}10)`,
            borderTop: `1px solid ${selectedTarget ? fc.color + '50' : '#1E1E2E'}`,
            boxShadow: flash && selectedTarget ? `0 0 40px ${fc.color}60, inset 0 0 40px ${fc.color}20` : 'none',
          }}
        >
          {!selectedTarget ? (
            <p className="font-pixel text-[7px] text-gray-700 text-center">← Выбери вражеский город на карте</p>
          ) : clickStatus === 'banned' ? (
            <p className="font-pixel text-[7px] text-red-500 text-center">🚫 БАН · Слишком быстро</p>
          ) : (
            <div className="flex items-center justify-between px-4">
              <div className="text-left">
                <p className="font-pixel text-[6px] text-gray-500">АТАКОВАТЬ</p>
                <p className="font-pixel text-[10px]" style={{ color: fc.color }}>
                  {CITIES[selectedTarget].nameRu.toUpperCase()}
                </p>
                <p className="font-pixel text-[5px] text-gray-600">
                  урон ~{effectiveDmg} · крит 5%
                </p>
              </div>
              <div className="text-right">
                <p
                  className="font-pixel"
                  style={{
                    fontSize:   combo.count >= 5 ? '32px' : '26px',
                    filter:     `drop-shadow(0 0 8px ${fc.color})`,
                    color:      fc.color,
                    lineHeight: 1,
                  }}
                >
                  👊
                </p>
                {combo.count >= 2 && (
                  <p className="font-pixel text-[5px]" style={{ color: combo.count >= 10 ? '#FF4444' : '#FFD700' }}>
                    ×{combo.xpBonus.toFixed(1)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Flash ripple */}
          {flash && selectedTarget && (
            <span
              className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at center, ${fc.color}30 0%, transparent 70%)` }}
            />
          )}
        </button>
      </div>

      {/* ── BOTTOM TABS ── */}
      <div
        className="flex-shrink-0 flex"
        style={{ background: '#0D0D15', borderTop: '1px solid #1E1E2E' }}
      >
        {([
          { id: 'battle' as Tab, icon: '⚔',  label: 'БОЙ'    },
          { id: 'quests' as Tab, icon: '📜',  label: 'ЗАДАЧИ' },
          { id: 'rank'   as Tab, icon: '🏆',  label: 'ТОП'    },
          { id: 'clan'   as Tab, icon: '🛡',  label: 'КЛАН'   },
          { id: 'me'     as Tab, icon: '👤',  label: 'Я'      },
        ]).map(t => {
          const active = sheet && tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSheet(prev => tab === t.id ? !prev : true) }}
              className="flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors"
              style={{ color: active ? fc.color : '#4B5563' }}
            >
              <span className="text-base leading-none">{t.icon}</span>
              <span className="font-pixel text-[4px]">{t.label}</span>
              {active && <span className="w-4 h-0.5 rounded-full" style={{ background: fc.color }} />}
            </button>
          )
        })}
      </div>

      {/* ── BOTTOM SHEET ── */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 transition-transform duration-300 ease-out"
        style={{
          background:        '#0D0D15',
          borderTop:         `2px solid ${fc.color}40`,
          maxHeight:         '72vh',
          overflowY:         'auto',
          transform:         sheet ? 'translateY(0)' : 'translateY(100%)',
          paddingBottom:     'calc(env(safe-area-inset-bottom) + 4.5rem)',
          boxShadow:         `0 -8px 40px ${fc.color}20`,
        }}
      >
        {/* Drag handle */}
        <div className="sticky top-0 flex justify-center py-2 cursor-pointer z-10" onClick={() => setSheet(false)}
          style={{ background: '#0D0D15', borderBottom: '1px solid #1E1E2E' }}>
          <div className="w-10 h-1 bg-gray-800 rounded-full" />
        </div>

        {/* ── БОЙ tab ── */}
        {tab === 'battle' && (
          <div className="p-4 space-y-4">
            {/* War progress */}
            <div>
              <p className="font-pixel text-[6px] text-gray-600 mb-3">ВОЙНА ОРД — {Object.values(scores).reduce((a,b) => a+b, 0)} городов</p>
              <div className="space-y-2">
                {sortedFactions.map(([fId, count], i) => {
                  const f   = FACTIONS[fId]
                  const pct = Math.round((count / 10) * 100)
                  const isMe = fId === faction
                  return (
                    <div key={fId} className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {i === 0 && <span className="font-pixel text-[5px] text-yellow-400">👑</span>}
                          <span className="font-pixel text-[6px]" style={{ color: f.color }}>
                            {isMe ? `▶ ${f.nameRu}` : f.nameRu}
                          </span>
                        </div>
                        <span className="font-pixel text-[6px]" style={{ color: f.color }}>
                          {count}/10
                        </span>
                      </div>
                      <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800/50">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: isMe
                              ? `linear-gradient(90deg, ${f.color}aa, ${f.color})`
                              : `${f.color}70`,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* My contribution */}
            <div
              className="border p-3 space-y-1"
              style={{ borderColor: `${fc.color}30`, background: `${fc.color}08` }}
            >
              <p className="font-pixel text-[5px] text-gray-600">МОЙ ВКЛАД</p>
              <div className="flex gap-4">
                <div>
                  <p className="font-pixel text-[8px]" style={{ color: fc.color }}>{profile.totalClicks}</p>
                  <p className="font-pixel text-[4px] text-gray-600">кликов</p>
                </div>
                <div>
                  <p className="font-pixel text-[8px] text-white">{profile.xp}</p>
                  <p className="font-pixel text-[4px] text-gray-600">XP</p>
                </div>
                <div>
                  <p className="font-pixel text-[8px] text-yellow-400">{profile.level}</p>
                  <p className="font-pixel text-[4px] text-gray-600">уровень</p>
                </div>
              </div>
            </div>

            {activeEvent && (
              <div className="border border-yellow-900/50 bg-yellow-950/20 p-3">
                <p className="font-pixel text-[5px] text-yellow-600">АКТИВНОЕ СОБЫТИЕ</p>
                <p className="font-pixel text-[7px] text-yellow-400 mt-0.5">{activeEvent.title}</p>
                <p className="font-pixel text-[5px] text-gray-500">{activeEvent.description} · ×{xpMultiplier} XP</p>
              </div>
            )}
          </div>
        )}

        {/* ── КВЕСТЫ tab ── */}
        {tab === 'quests' && <DailyQuests quests={quests} progress={progress} loading={false} />}

        {/* ── ТОП tab ── */}
        {tab === 'rank' && <Leaderboard currentUserId={userId} />}

        {/* ── КЛАН tab ── */}
        {tab === 'clan' && (
          <div className="p-4 space-y-4">
            {clanData ? (
              <>
                {/* Clan header */}
                <div
                  className="border p-4 text-center space-y-1"
                  style={{ borderColor: `${fc.color}40`, background: `${fc.color}0A` }}
                >
                  <p style={{ fontSize: 36 }}>{clanData.emoji}</p>
                  <p className="font-pixel text-[6px] text-gray-500">[{clanData.tag}]</p>
                  <p className="font-pixel text-[10px]" style={{ color: fc.color }}>{clanData.name}</p>
                  <p className="font-pixel text-[5px] text-gray-600">{clanData.member_count} участников</p>
                </div>

                {/* Invite */}
                <button
                  onClick={() => {
                    const link = `${window.location.origin}/clans?join=${clanData.id}`
                    navigator.share?.({ title: clanData.name, url: link }).catch(() => navigator.clipboard?.writeText(link))
                  }}
                  className="w-full py-2 font-pixel text-[6px] border"
                  style={{ borderColor: `${fc.color}40`, color: fc.color }}
                >
                  📤 ПРИГЛАСИТЬ В КЛАН
                </button>

                <button
                  onClick={() => window.location.href = '/clans'}
                  className="w-full py-2 font-pixel text-[6px] text-gray-600 border border-gray-800"
                >
                  Управление кланом →
                </button>

                <button
                  onClick={leaveClan}
                  className="w-full py-2 font-pixel text-[5px] text-red-900 border border-red-950"
                >
                  Покинуть клан
                </button>
              </>
            ) : (
              <>
                <div className="text-center py-4">
                  <p className="text-4xl">🛡</p>
                  <p className="font-pixel text-[7px] text-white mt-2">У тебя нет клана</p>
                  <p className="font-pixel text-[5px] text-gray-600 mt-1">Создай или вступи в клан своей фракции</p>
                </div>

                <div className="space-y-2">
                  <p className="font-pixel text-[5px] text-gray-600">СОЗДАТЬ КЛАН</p>
                  <input
                    type="text" placeholder="Название клана" maxLength={24}
                    value={clanName} onChange={e => setClanName(e.target.value)}
                    className="w-full bg-dark border border-border px-3 py-2 font-pixel text-[7px] text-white focus:outline-none focus:border-gray-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text" placeholder="ТЕГ" maxLength={5}
                      value={clanTag} onChange={e => setClanTag(e.target.value.toUpperCase())}
                      className="w-24 bg-dark border border-border px-2 py-2 font-pixel text-[7px] text-white focus:outline-none focus:border-gray-500 uppercase"
                    />
                    <select
                      value={clanEmoji} onChange={e => setClanEmoji(e.target.value)}
                      className="flex-1 bg-dark border border-border px-2 py-2 font-pixel text-[7px] text-white focus:outline-none"
                    >
                      {['⚔️','🛡','🗡','🏹','🪃','🔥','⚡','💀','🦅','🐺','🐉','🦁'].map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={createClan}
                    disabled={clanLoading || !clanName.trim() || !clanTag.trim()}
                    className="w-full py-3 font-pixel text-[7px] text-black disabled:opacity-50"
                    style={{ background: fc.color }}
                  >
                    {clanLoading ? '...' : 'СОЗДАТЬ'}
                  </button>
                </div>

                <button
                  onClick={() => window.location.href = '/clans'}
                  className="w-full py-2 font-pixel text-[6px] text-gray-600 border border-gray-800"
                >
                  Просмотр кланов →
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Я tab ── */}
        {tab === 'me' && (
          <div className="p-4 space-y-4">
            {/* Profile card */}
            <div
              className="border p-4"
              style={{ borderColor: `${fc.color}30`, background: `${fc.color}08` }}
            >
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 40, filter: `drop-shadow(0 0 10px ${lvl.color})` }}>{lvl.icon}</span>
                <div>
                  <p className="font-pixel text-[8px] text-white">{displayName}</p>
                  <p className="font-pixel text-[6px]" style={{ color: fc.color }}>{fc.nameRu}</p>
                  <p className="font-pixel text-[5px] text-gray-500">{lvl.title} · Lv{profile.level}</p>
                </div>
              </div>
              <div className="mt-3 h-2 bg-gray-900 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${xpProgress.pct}%`, background: `linear-gradient(90deg, ${lvl.color}88, ${lvl.color})` }}
                />
              </div>
              <p className="font-pixel text-[4px] text-gray-600 mt-0.5 text-right">
                {profile.xp} / {xpProgress.needed} XP
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'КЛИКОВ', val: profile.totalClicks, color: fc.color },
                { label: 'СТРИК',  val: `🔥${profile.streak}`, color: '#F97316' },
                { label: 'КОМБО',  val: `×${maxCombo}`,         color: '#FFD700' },
              ].map(s => (
                <div key={s.label} className="border border-gray-800 bg-panel p-2 text-center">
                  <p className="font-pixel text-[9px]" style={{ color: s.color }}>{s.val}</p>
                  <p className="font-pixel text-[4px] text-gray-600">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Referral */}
            <div className="border border-gray-800 p-3 space-y-2">
              <p className="font-pixel text-[5px] text-gray-600">ПРИГЛАСИ ДРУГА — ПОЛУЧИ +3 ДНЯ</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-dark border border-border px-2 py-1.5">
                  <p className="font-pixel text-[7px] text-yellow-400 tracking-widest">{referralCode ?? displayName.slice(0,6).toUpperCase()}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.share?.({ title: 'KZ Battle Royale', url: inviteUrl })
                      .catch(() => navigator.clipboard?.writeText(inviteUrl))
                  }}
                  className="px-3 font-pixel text-[6px] border"
                  style={{ borderColor: `${fc.color}50`, color: fc.color }}
                >
                  SHARE
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
