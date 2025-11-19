import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { type NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { access_token, refresh_token } = body || {}

    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: 'Missing tokens' }, { status: 400 })
    }

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

    // Set the session server-side so middleware/readers will see it
    await supabase.auth.setSession({
      access_token,
      refresh_token,
    })

    return response
  } catch (err: any) {
    console.error('Set session error:', err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
