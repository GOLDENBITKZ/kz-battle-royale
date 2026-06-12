import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 5  // cache 5 seconds

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: cities }, { data: event }, { count: players }] = await Promise.all([
    supabase.from('city_state').select('city_id, hp, max_hp, owner_faction, total_attacks'),
    supabase.from('game_events').select('message, created_at').eq('type', 'commentary').order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).gt('last_active', new Date(Date.now() - 5 * 60_000).toISOString()),
  ])

  return NextResponse.json({ cities, event, activePlayers: players ?? 0 })
}
