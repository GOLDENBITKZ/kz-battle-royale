import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const TOKEN   = process.env.TELEGRAM_BOT_TOKEN
const ADMIN_ID = process.env.TELEGRAM_ADMIN_CHAT_ID

async function send(chatId: number | string, text: string) {
  if (!TOKEN) return
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

const FACTION_EMOJI: Record<string, string> = {
  south: '🟡', east: '🔴', center: '🔵', west: '🟢', north: '🟣',
}

export async function POST(req: NextRequest) {
  if (!TOKEN) return NextResponse.json({ ok: false })

  const upd = await req.json().catch(() => null)
  const msg = upd?.message
  if (!msg?.text) return NextResponse.json({ ok: true })

  const chatId  = msg.chat.id
  const isAdmin = String(chatId) === String(ADMIN_ID)
  const cmd     = msg.text.split(' ')[0].toLowerCase()

  if (cmd === '/start') {
    await send(chatId,
      `🎮 <b>KZ Battle Royale — Admin Bot</b>\n\n` +
      (isAdmin
        ? `Команды:\n/stats — статистика игры\n/users — последние игроки\n/subs — активные подписки\n/top — топ-10 игроков\n/cities — карта городов`
        : `Это приватный бот для администраторов.`
      )
    )
    return NextResponse.json({ ok: true })
  }

  if (!isAdmin) {
    await send(chatId, '⛔ Доступ запрещён.')
    return NextResponse.json({ ok: true })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    await send(chatId, '⚠️ SUPABASE_SERVICE_ROLE_KEY не задан. Команды /users /subs /top недоступны.')
    return NextResponse.json({ ok: true })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey
  )

  // anon client for public tables (city_state)
  const pub = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  if (cmd === '/stats') {
    const [{ count: total }, { count: subs }, { data: cities }] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gt('paid_until', new Date().toISOString()),
      pub.from('city_state').select('city_id, owner_faction, hp, max_hp'),
    ])

    const byFaction: Record<string, string[]> = {}
    for (const c of (cities ?? [])) {
      const f = c.owner_faction
      if (!byFaction[f]) byFaction[f] = []
      byFaction[f].push(c.city_id)
    }
    const cityLines = Object.entries(byFaction)
      .map(([f, cs]) => `  ${FACTION_EMOJI[f] ?? '⬜'} ${f}: ${cs.join(', ')}`)
      .join('\n')

    await send(chatId,
      `📊 <b>Статистика KZ Battle</b>\n\n` +
      `👥 Всего игроков: <b>${total}</b>\n` +
      `💳 Активных подписок: <b>${subs}</b>\n\n` +
      `🗺 <b>Города:</b>\n${cityLines}`
    )

  } else if (cmd === '/users') {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, phone, faction, level, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    const lines = (data ?? []).map((u, i) =>
      `${i + 1}. <b>${u.display_name ?? '—'}</b> | ${u.phone ?? '—'} | Lv${u.level} | ${FACTION_EMOJI[u.faction] ?? '?'} ${u.faction ?? '—'}`
    ).join('\n')

    await send(chatId, `👥 <b>Последние 10 игроков:</b>\n\n${lines || 'Нет данных'}`)

  } else if (cmd === '/subs') {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, phone, paid_until, faction')
      .gt('paid_until', new Date().toISOString())
      .order('paid_until', { ascending: false })
      .limit(25)

    const lines = (data ?? []).map(u => {
      const days = Math.ceil((new Date(u.paid_until).getTime() - Date.now()) / 86_400_000)
      return `• <b>${u.display_name ?? '—'}</b> | ${u.phone ?? '—'} | <i>${days} дн.</i>`
    }).join('\n')

    await send(chatId, `💳 <b>Активные подписки (${data?.length ?? 0}):</b>\n\n${lines || 'Нет активных'}`)

  } else if (cmd === '/top') {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, faction, level, xp, total_damage, cities_captured')
      .order('xp', { ascending: false })
      .limit(10)

    const lines = (data ?? []).map((u, i) =>
      `${i + 1}. ${FACTION_EMOJI[u.faction] ?? '?'} <b>${u.display_name ?? '—'}</b> | Lv${u.level} | ${u.xp} XP | 💥${u.total_damage ?? 0} | 🏙${u.cities_captured ?? 0}`
    ).join('\n')

    await send(chatId, `🏆 <b>Топ-10 игроков:</b>\n\n${lines}`)

  } else if (cmd === '/cities') {
    const { data } = await pub
      .from('city_state')
      .select('city_id, owner_faction, hp, max_hp, total_attacks')

    const lines = (data ?? []).map(c =>
      `${FACTION_EMOJI[c.owner_faction] ?? '?'} <b>${c.city_id}</b> [${c.hp}/${c.max_hp} HP] — ${c.total_attacks ?? 0} атак`
    ).join('\n')

    await send(chatId, `🗺 <b>Состояние городов:</b>\n\n${lines}`)
  }

  return NextResponse.json({ ok: true })
}
