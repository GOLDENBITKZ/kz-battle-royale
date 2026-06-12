import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  // regen_city_hp is SECURITY DEFINER — can call with anon key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { error } = await supabase.rpc('regen_city_hp')
  return NextResponse.json({ ok: !error, error: error?.message })
}
