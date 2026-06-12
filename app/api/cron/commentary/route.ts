import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const FACTION_RU: Record<string, string> = {
  south: 'Южная Орда', east: 'Восточная Орда', center: 'Центральная Орда',
  west: 'Западная Орда', north: 'Северная Орда',
}
const CITY_RU: Record<string, string> = {
  almaty: 'Алматы', shymkent: 'Шымкент', astana: 'Астана', karaganda: 'Қарағанды',
  aktau: 'Ақтау', atyrau: 'Атырау', aktobe: 'Ақтөбе', kostanay: 'Қостанай',
  pavlodar: 'Павлодар', taraz: 'Тараз',
}

export async function GET() {
  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) return NextResponse.json({ skipped: 'no GROQ_API_KEY' })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: cities } = await supabase
    .from('city_state')
    .select('city_id, hp, max_hp, owner_faction, total_attacks')

  if (!cities) return NextResponse.json({ error: 'no data' })

  // Find the most contested city
  const hottest = [...cities].sort((a, b) => b.total_attacks - a.total_attacks)[0]
  const underSiege = cities.filter(c => c.hp < c.max_hp * 0.3).map(c => CITY_RU[c.city_id] ?? c.city_id)

  // Faction scores
  const scores: Record<string, number> = {}
  for (const c of cities) scores[c.owner_faction] = (scores[c.owner_faction] ?? 0) + 1
  const leader = Object.entries(scores).sort(([,a],[,b]) => b - a)[0]

  const context = [
    `Лидер войны: ${FACTION_RU[leader[0]]} (${leader[1]}/10 городов)`,
    `Самый горячий бой: ${CITY_RU[hottest?.city_id] ?? '?'} (${hottest?.total_attacks} атак)`,
    underSiege.length ? `Города под осадой: ${underSiege.join(', ')}` : 'Все города держат оборону',
  ].join('. ')

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      max_tokens: 100,
      temperature: 0.9,
      messages: [
        {
          role: 'system',
          content: 'Ты ведущий казахстанского батл-рояля. Пишешь боевые сводки (2 предложения максимум) на русском. Стиль: эпичный, с казахским колоритом, иногда с юмором. Упоминай конкретные фракции и города.',
        },
        { role: 'user', content: `Сводка с полей: ${context}` },
      ],
    }),
  })

  if (!groqRes.ok) return NextResponse.json({ error: 'groq error' })
  const groqData = await groqRes.json()
  const commentary = groqData.choices?.[0]?.message?.content?.trim() ?? ''

  if (commentary) {
    await supabase.from('game_events').upsert(
      { id: 'ai_commentary', type: 'commentary', message: commentary, data: {}, created_at: new Date().toISOString() },
      { onConflict: 'id' }
    )
  }

  return NextResponse.json({ ok: true, commentary })
}
