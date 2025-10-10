import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const response = NextResponse.redirect(`${origin}/`)
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll().map((c) => ({ name: c.name, value: c.value }))
          },
          setAll(cookiesToSet) {
            for (const c of cookiesToSet) {
              response.cookies.set({ name: c.name, value: c.value, ...(c.options ?? {}) })
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return response
    }
  }

  // If there's an error, redirect to sign-in page with error message
  return NextResponse.redirect(`${origin}/signin?error=auth_error`)
}
