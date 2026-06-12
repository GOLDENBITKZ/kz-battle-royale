import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function getSupabase() {
  if (typeof window === 'undefined') {
    // During SSR/build: return a no-op proxy so destructuring doesn't throw
    return {
      auth: {
        signUp: async () => ({ error: null }),
        signInWithPassword: async () => ({ error: null }),
        getSession: async () => ({ data: { session: null } }),
        signOut: async () => {},
      },
      from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }) }),
      rpc:  async () => ({ error: null }),
    } as any
  }
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}
