import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY

  // city_state and game_events are public (RLS USING true) → use anon key
  const db = createClient(url, anon)

  const [citiesRes, eventRes] = await Promise.all([
    db.from('city_state').select('city_id, hp, max_hp, owner_faction, total_attacks'),
    db.from('game_events').select('message, created_at').eq('type', 'commentary')
       .order('created_at', { ascending: false }).limit(1).single(),
  ])

  // Active players query needs service role (profiles RLS is per-user)
  let activePlayers = 0
  if (service) {
    const admin = createClient(url, service)
    const { count } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gt('last_active', new Date(Date.now() - 5 * 60_000).toISOString())
    activePlayers = count ?? 0
  }

  return NextResponse.json({
    cities:        citiesRes.data,
    event:         eventRes.data,
    activePlayers,
    debug: {
      hasCities:  !!citiesRes.data,
      hasService: !!service,
      hasGroq:    !!process.env.GROQ_API_KEY,
      hasTg:      !!process.env.TELEGRAM_BOT_TOKEN,
    },
  })
}
