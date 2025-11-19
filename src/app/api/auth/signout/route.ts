import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const response = NextResponse.json({ ok: true })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll().map((c) => ({ name: c.name, value: c.value }))
          },
          setAll(cookiesToSet) {
            for (const c of cookiesToSet) {
              response.cookies.set({ name: c.name, value: c.value, ...(c.options ?? {}) })
            }
          },
        },
      }
    )

    // Sign out server-side (clears cookies)
    await supabase.auth.signOut()

    return response
  } catch (err: any) {
    console.error('Sign out error:', err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}