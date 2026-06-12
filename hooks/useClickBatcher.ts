'use client'
import { useRef, useEffect, useCallback, useState } from 'react'
import type { CityId } from '@/lib/config'
import { MAX_CLICKS_PER_BATCH, BATCH_INTERVAL_MS } from '@/lib/config'

type Status = 'idle' | 'sending' | 'banned' | 'error'

interface Props {
  userId:      string
  accessToken: string
  onBanned?:   () => void
  onCapture?:  (cityId: CityId) => void
  onXP?:       (amount: number) => void
}

export function useClickBatcher({ userId, accessToken, onBanned, onCapture, onXP }: Props) {
  const buffer = useRef<Map<CityId, number>>(new Map())
  const [status, setStatus] = useState<Status>('idle')

  const flush = useCallback(async () => {
    if (status === 'banned' || buffer.current.size === 0) return

    // Pick city with most clicks
    let topCity: CityId | null = null, topCount = 0
    buffer.current.forEach((n, city) => { if (n > topCount) { topCount = n; topCity = city } })
    if (!topCity) return

    const clickCount = Math.min(topCount, MAX_CLICKS_PER_BATCH)
    buffer.current.clear()

    setStatus('sending')
    try {
      const res = await fetch('/api/clicks', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ targetCityId: topCity, clickCount }),
      })
      const data = await res.json()
      if (data.banned) { setStatus('banned'); onBanned?.() }
      else {
        setStatus('idle')
        if (data.captured) onCapture?.(topCity)
        if (data.xp)       onXP?.(data.xp)
      }
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }, [status, accessToken, onBanned, onCapture, onXP])

  useEffect(() => {
    const t = setInterval(flush, BATCH_INTERVAL_MS)
    return () => clearInterval(t)
  }, [flush])

  const registerClick = useCallback((targetCity: CityId) => {
    if (status === 'banned') return
    buffer.current.set(targetCity, (buffer.current.get(targetCity) ?? 0) + 1)
  }, [status])

  return { registerClick, status }
}
