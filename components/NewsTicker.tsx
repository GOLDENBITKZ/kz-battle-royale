'use client'
import { useState, useEffect } from 'react'

const FALLBACK = [
  'Южная Орда атакует Тараз! 🔥',
  'Астана держит оборону уже 3 часа!',
  'Ақтау захвачен Западной Ордой!',
  'Рекорд: 500 кликов за 1 минуту!',
  'Специальное событие начнётся через 30 минут!',
]

export default function NewsTicker({ backendUrl }: { backendUrl: string }) {
  const [messages, setMessages] = useState<string[]>(FALLBACK)
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    let es: EventSource
    try {
      es = new EventSource(`${backendUrl}/events`)
      es.addEventListener('log', (e) => {
        const d = JSON.parse(e.data)
        if (d.message) setMessages(prev => [d.message, ...prev.slice(0, 9)])
      })
    } catch {}
    const t = setInterval(() => setIdx(i => (i + 1) % messages.length), 4000)
    return () => { es?.close(); clearInterval(t) }
  }, [backendUrl, messages.length])

  return (
    <div className="flex items-center gap-2 px-3 py-0.5 bg-dark border-t border-border flex-shrink-0 overflow-hidden">
      <span className="font-pixel text-[5px] text-red-500 flex-shrink-0">📡 LIVE</span>
      <p className="font-pixel text-[5px] text-gray-500 truncate">{messages[idx]}</p>
    </div>
  )
}
