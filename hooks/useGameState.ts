'use client'
import { useEffect, useRef, useState } from 'react'
import { getSupabase } from '@/lib/supabase-client'
import type { FactionId, CityId } from '@/lib/config'
import type { GameStateUpdate } from '@/components/GameMap'

export function useGameState(
  onCapture?: (cityId: CityId, newOwner: FactionId, prevOwner: FactionId) => void
) {
  const [update,  setUpdate]  = useState<GameStateUpdate | null>(null)
  const [scores,  setScores]  = useState<Record<FactionId, number>>({ south: 0, east: 0, center: 0, west: 0, north: 0 })
  const [live,    setLive]    = useState<'connecting' | 'live' | 'offline'>('connecting')
  const [cityHps, setCityHps] = useState<Record<CityId, { hp: number; maxHp: number; owner: FactionId }>>({} as any)
  const rowsRef   = useRef<Map<string, any>>(new Map())
  const ownersRef = useRef<Map<CityId, FactionId>>(new Map())

  useEffect(() => {
    if (typeof window === 'undefined') return
    const supabase = getSupabase()

    function buildUpdate(): GameStateUpdate {
      return {
        cities: [...rowsRef.current.values()].map(r => ({
          cityId: r.city_id as string,
          owner:  r.owner_faction as string,
          hp:     r.hp as number,
          maxHp:  r.max_hp as number,
          score:  r.total_attacks as number ?? 0,
        })),
      }
    }

    function buildScores(): Record<FactionId, number> {
      const s: Record<FactionId, number> = { south: 0, east: 0, center: 0, west: 0, north: 0 }
      rowsRef.current.forEach(r => {
        const f = r.owner_faction as FactionId
        s[f] = (s[f] ?? 0) + 1
      })
      return s
    }

    function buildHps(): Record<CityId, { hp: number; maxHp: number; owner: FactionId }> {
      const h: any = {}
      rowsRef.current.forEach(r => {
        h[r.city_id as CityId] = { hp: r.hp, maxHp: r.max_hp, owner: r.owner_faction }
      })
      return h
    }

    function applyRow(row: any) {
      const cityId  = row.city_id as CityId
      const newOwner = row.owner_faction as FactionId
      const prevOwner = ownersRef.current.get(cityId)
      rowsRef.current.set(cityId, row)

      if (prevOwner && prevOwner !== newOwner) {
        onCapture?.(cityId, newOwner, prevOwner)
      }
      ownersRef.current.set(cityId, newOwner)
    }

    // Initial load
    supabase.from('city_state').select('*').then((res: any) => {
      const data = res?.data
      if (data) {
        for (const row of data) applyRow(row)
        setUpdate(buildUpdate())
        setScores(buildScores())
        setCityHps(buildHps())
        setLive('live')
      }
    })

    // Realtime subscription
    const channel = supabase
      .channel('city_state_rt')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'city_state' }, (payload: any) => {
        applyRow(payload.new)
        setUpdate(buildUpdate())
        setScores(buildScores())
        setCityHps(buildHps())
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') setLive('live')
        else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setLive('offline')
      })

    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { update, scores, live, cityHps }
}
