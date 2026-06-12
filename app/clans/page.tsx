'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase-client'
import { FACTIONS, type FactionId } from '@/lib/config'

interface Clan {
  id: string; name: string; tag: string; emoji: string; faction: string
  member_count: number; total_damage: number; created_at: string
}

export default function ClansPage() {
  const router   = useRouter()
  const supabase = getSupabase()

  const [loading,   setLoading]   = useState(true)
  const [faction,   setFaction]   = useState<FactionId | null>(null)
  const [myClanId,  setMyClanId]  = useState<string | null>(null)
  const [clans,     setClans]     = useState<Clan[]>([])
  const [userId,    setUserId]    = useState('')
  const [joining,   setJoining]   = useState<string | null>(null)
  const [joinUrl,   setJoinUrl]   = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async (res: any) => {
      const session = res?.data?.session
      if (!session) { router.push('/login'); return }

      const uid = session.user.id
      setUserId(uid)

      const { data: profile } = await supabase
        .from('profiles')
        .select('faction, clan_id')
        .eq('id', uid)
        .single()

      if (!profile?.faction) { router.push('/onboarding'); return }
      setFaction(profile.faction as FactionId)
      setMyClanId(profile.clan_id)

      const { data: clanList } = await supabase
        .from('clans')
        .select('id, name, tag, emoji, faction, member_count, total_damage, created_at')
        .eq('faction', profile.faction)
        .order('total_damage', { ascending: false })

      setClans(clanList ?? [])
      setLoading(false)

      // Auto-join from URL?
      const urlParams = new URLSearchParams(window.location.search)
      const joinId = urlParams.get('join')
      if (joinId && !profile.clan_id) setJoinUrl(joinId)
    })
  }, [router, supabase])

  async function joinClan(clanId: string) {
    setJoining(clanId)
    const { data } = await supabase.rpc('join_clan', { p_user_id: userId, p_clan_id: clanId })
    setJoining(null)
    if ((data as any)?.ok) {
      setMyClanId(clanId)
      router.push('/game')
    } else alert((data as any)?.error ?? 'Ошибка')
  }

  async function leaveClan() {
    if (!confirm('Покинуть клан?')) return
    await supabase.rpc('leave_clan', { p_user_id: userId })
    setMyClanId(null)
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="font-pixel text-[6px] text-gray-600 animate-pulse">Загрузка кланов...</p>
      </div>
    )
  }

  const fc = faction ? FACTIONS[faction] : null

  return (
    <div className="min-h-screen bg-dark" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{ background: '#0D0D15', borderBottom: `1px solid ${fc?.color ?? '#1E1E2E'}40` }}
      >
        <button onClick={() => router.push('/game')}
          className="font-pixel text-[6px] text-gray-600 hover:text-gray-400">
          ← НАЗАД
        </button>
        <h1 className="font-pixel text-[9px]" style={{ color: fc?.color }}>КЛАНЫ</h1>
        {faction && (
          <span className="font-pixel text-[5px] text-gray-600">{fc?.nameRu}</span>
        )}
      </div>

      <div className="p-4 space-y-4 max-w-sm mx-auto">
        {/* Auto-join prompt */}
        {joinUrl && !myClanId && (
          <div className="border border-yellow-700/50 bg-yellow-950/20 p-4 space-y-2">
            <p className="font-pixel text-[6px] text-yellow-400">Тебя пригласили в клан</p>
            <button
              onClick={() => joinClan(joinUrl)}
              disabled={joining === joinUrl}
              className="w-full py-2 font-pixel text-[7px] text-black bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50"
            >
              {joining === joinUrl ? '...' : 'ПРИНЯТЬ ПРИГЛАШЕНИЕ'}
            </button>
          </div>
        )}

        {/* My clan status */}
        {myClanId && (
          <div
            className="border p-3 flex items-center justify-between"
            style={{ borderColor: `${fc?.color ?? '#666'}40`, background: `${fc?.color ?? '#666'}0A` }}
          >
            <div>
              <p className="font-pixel text-[5px] text-gray-600">ТЫ В КЛАНЕ</p>
              <p className="font-pixel text-[7px]" style={{ color: fc?.color }}>
                {clans.find(c => c.id === myClanId)?.name ?? '...'}
              </p>
            </div>
            <button
              onClick={leaveClan}
              className="font-pixel text-[5px] text-red-900 border border-red-950 px-2 py-1"
            >
              ВЫЙТИ
            </button>
          </div>
        )}

        {/* Clan list */}
        <div className="space-y-2">
          <p className="font-pixel text-[5px] text-gray-600">
            КЛАНЫ {fc?.nameRu.toUpperCase()} ({clans.length})
          </p>
          {clans.length === 0 && (
            <p className="font-pixel text-[6px] text-gray-700 text-center py-8">
              Кланов ещё нет. Создай первый!
            </p>
          )}
          {clans.map(clan => {
            const isMine = clan.id === myClanId
            return (
              <div
                key={clan.id}
                className="border p-3 flex items-center gap-3"
                style={{
                  borderColor: isMine ? `${fc?.color}60` : '#1E1E2E',
                  background:  isMine ? `${fc?.color}0A` : '#111118',
                }}
              >
                <span style={{ fontSize: 28 }}>{clan.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-pixel text-[5px] text-gray-600">[{clan.tag}]</span>
                    <span className="font-pixel text-[8px] text-white truncate">{clan.name}</span>
                    {isMine && <span className="font-pixel text-[4px]" style={{ color: fc?.color }}>● ТЫ</span>}
                  </div>
                  <div className="flex gap-3 mt-0.5">
                    <span className="font-pixel text-[4px] text-gray-600">👥 {clan.member_count}</span>
                    <span className="font-pixel text-[4px] text-gray-600">💥 {(clan.total_damage ?? 0).toLocaleString()}</span>
                  </div>
                </div>
                {!myClanId && (
                  <button
                    onClick={() => joinClan(clan.id)}
                    disabled={!!joining}
                    className="font-pixel text-[6px] px-3 py-1.5 border disabled:opacity-50"
                    style={{ borderColor: `${fc?.color}50`, color: fc?.color }}
                  >
                    {joining === clan.id ? '...' : 'ВСТУПИТЬ'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
