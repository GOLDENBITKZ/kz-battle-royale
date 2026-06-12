'use client'
import { useState, useEffect } from 'react'
import type { SpecialEvent } from '@/hooks/useSpecialEvents'

export default function EventBanner({ event }: { event: SpecialEvent | null }) {
  const [show, setShow] = useState(true)

  useEffect(() => { if (event) setShow(true) }, [event])

  if (!event || !show) return null

  const remaining = Math.max(0, Math.floor((event.endsAt - Date.now()) / 1000))
  const mins = Math.floor(remaining / 60), secs = remaining % 60

  return (
    <div className="flex items-center justify-between px-3 py-1 bg-yellow-900/30 border-b border-yellow-600/30 flex-shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-sm animate-pulse">⚡</span>
        <div>
          <p className="font-pixel text-[6px] text-yellow-400">{event.title}</p>
          <p className="font-pixel text-[5px] text-gray-500">{event.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {event.xpMult > 1 && <span className="font-pixel text-[6px] text-yellow-400">XP ×{event.xpMult}</span>}
        {event.dmgMult > 1 && <span className="font-pixel text-[6px] text-red-400">DMG ×{event.dmgMult}</span>}
        <span className="font-pixel text-[5px] text-gray-600">{mins}:{secs.toString().padStart(2,'0')}</span>
        <button onClick={() => setShow(false)} className="font-pixel text-[6px] text-gray-700 hover:text-gray-400">✕</button>
      </div>
    </div>
  )
}
