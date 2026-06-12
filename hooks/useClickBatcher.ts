'use client'
import { useRef, useEffect, useCallback, useState } from 'react'
import type { CityId } from '@/lib/config'
import { MAX_CLICKS_PER_BATCH, BATCH_INTERVAL_MS } from '@/lib/config'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!

type Status = 'idle' | 'sending' | 'banned' | 'error'

interface Props {
  userId: string
  cityId: CityId
  accessToken: string
  onBanned?: () => void
  onError?: (e: Error) => void
}

async function hmacSign(secret: string, message: string): Promise<string> {
  const enc  = new TextEncoder()
  const key  = await crypto.subtle.importKey(
    'raw', enc.encode(secret.slice(0, 32).padEnd(32, '0')),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig  = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2,'0')).join('')
}

export function useClickBatcher({ userId, cityId, accessToken, onBanned, onError }: Props) {
  const buffer    = useRef<Map<CityId, number>>(new Map())
  const [status, setStatus] = useState<Status>('idle')

  const flush = useCallback(async () => {
    if (status === 'banned') return
    if (buffer.current.size === 0) return

    // Find top target
    let topTarget: CityId | null = null, topCount = 0
    buffer.current.forEach((count, city) => { if (count > topCount) { topCount = count; topTarget = city } })
    if (!topTarget) return

    const clickCount = Math.min(topCount, MAX_CLICKS_PER_BATCH)
    buffer.current.clear()

    const timestamp = Date.now()
    const nonce     = crypto.randomUUID()
    const message   = `${userId}:${cityId}:${topTarget}:${clickCount}:${timestamp}:${nonce}`
    const sig       = await hmacSign(accessToken, message)

    setStatus('sending')
    try {
      const res = await fetch(`${BACKEND}/clicks`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ userId, cityId, targetCityId: topTarget, clickCount, timestamp, nonce, sig }),
      })
      const data = await res.json()
      if (data.banned) { setStatus('banned'); onBanned?.() }
      else setStatus('idle')
    } catch (e) {
      setStatus('error')
      onError?.(e as Error)
    }
  }, [userId, cityId, accessToken, status, onBanned, onError])

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
