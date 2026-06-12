import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const { targetCityId, clickCount } = await req.json()
    if (!targetCityId || !clickCount) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Validate token and get user
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    // Check subscription
    const { data: profile } = await supabase
      .from('profiles').select('paid_until').eq('id', user.id).single()
    if (!profile?.paid_until || new Date(profile.paid_until) <= new Date()) {
      return NextResponse.json({ error: 'subscription required', needsPayment: true }, { status: 402 })
    }

    const clicks = Math.min(Math.max(1, Math.floor(clickCount)), 500)

    const { data, error } = await supabase.rpc('process_click_batch', {
      p_user_id:    user.id,
      p_city_id:    targetCityId,
      p_click_count: clicks,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const result = data as { error?: string; banned?: boolean; damage?: number; captured?: boolean; xp?: number; cityHp?: number }
    if (result?.banned) return NextResponse.json({ banned: true }, { status: 429 })

    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
