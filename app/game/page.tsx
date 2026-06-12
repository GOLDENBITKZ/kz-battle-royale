import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import GameClient from './GameClient'
import type { FactionId } from '@/lib/config'

export const dynamic = 'force-dynamic'

export default async function GamePage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('faction, city, display_name, paid_until, xp, level, streak_days, total_clicks, referral_code')
    .eq('id', session.user.id)
    .single()

  if (!profile?.faction || !profile?.city) redirect('/onboarding')
  if (!profile.paid_until || new Date(profile.paid_until) < new Date()) redirect('/payment')

  return (
    <GameClient
      userId={session.user.id}
      faction={profile.faction as FactionId}
      cityId={profile.city}
      displayName={profile.display_name ?? session.user.phone ?? 'Батыр'}
      accessToken={session.access_token}
      initialXP={profile.xp ?? 0}
      initialLevel={profile.level ?? 1}
      initialStreak={profile.streak_days ?? 1}
      totalClicks={profile.total_clicks ?? 0}
      referralCode={profile.referral_code ?? undefined}
    />
  )
}
