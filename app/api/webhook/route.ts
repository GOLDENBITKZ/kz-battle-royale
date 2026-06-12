import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const secret = process.env.KASPI_WEBHOOK_SECRET
  if (secret) {
    const sig = req.headers.get('x-kaspi-signature')
    if (sig !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { txn_id: string; amount: number; phone: string; comment?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Bad JSON' }, { status: 400 }) }

  const { txn_id, amount, phone } = body
  if (!txn_id || !amount || !phone) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Create admin client inside handler (not at module level)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('id').eq('phone', phone).single()

  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { error } = await supabaseAdmin.rpc('extend_subscription', {
    p_user_id:      profile.id,
    p_kaspi_txn_id: txn_id,
    p_amount_tenge: Math.round(amount),
  })

  if (error) {
    console.error('extend_subscription error:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  // Telegram notification
  const tgToken  = process.env.TELEGRAM_BOT_TOKEN
  const tgChatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (tgToken && tgChatId) {
    const days = Math.round(amount / 100) * 30
    fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: tgChatId,
        text: `💳 <b>Новая оплата!</b>\n\nТелефон: <code>${phone}</code>\nСумма: <b>${amount} ₸</b>\nПодписка: +${days} дней\nTxn: <code>${txn_id}</code>`,
        parse_mode: 'HTML',
      }),
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
