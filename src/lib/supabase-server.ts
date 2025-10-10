import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Return all request cookies in the shape expected by @supabase/ssr
        getAll() {
          return cookieStore.getAll().map((c) => ({ name: c.name, value: c.value }))
        },
        // Try to set all cookies; in server components this may throw so we silently ignore
        setAll(cookies) {
          for (const c of cookies) {
            try {
              cookieStore.set({ name: c.name, value: c.value, ...(c.options ?? {}) })
            } catch {
              // Ignore: cannot set cookies from certain server component contexts
            }
          }
        },
      },
    }
  )
}