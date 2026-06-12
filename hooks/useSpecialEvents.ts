'use client'
import { useState, useEffect } from 'react'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!

export interface SpecialEvent {
  id:          string
  title:       string
  description: string
  xpMult:      number
  dmgMult:     number
  endsAt:      number  // unix ms
}

export function useSpecialEvents() {
  const [event, setEvent] = useState<SpecialEvent | null>(null)

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res  = await fetch(`${BACKEND}/events/current`)
        if (!res.ok) return
        const data = await res.json()
        setEvent(data.event ?? null)
      } catch {}
    }
    fetchEvent()
    const t = setInterval(fetchEvent, 60_000)
    return () => clearInterval(t)
  }, [])

  return {
    event,
    xpMultiplier:  event?.xpMult  ?? 1,
    dmgMultiplier: event?.dmgMult ?? 1,
  }
}
