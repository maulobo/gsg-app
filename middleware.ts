import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {

  
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Auth condition
  const isAuthPage = req.nextUrl.pathname.startsWith('/signin') || req.nextUrl.pathname.startsWith('/signup')
  const isProtectedRoute = !req.nextUrl.pathname.startsWith('/signin') && 
                          !req.nextUrl.pathname.startsWith('/signup') && 
                          !req.nextUrl.pathname.startsWith('/auth/callback') &&
                          req.nextUrl.pathname !== '/reset-password'

  if (isAuthPage && session) {
    // User is authenticated, redirect to dashboard
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (isProtectedRoute && !session) {
    // User is not authenticated, redirect to sign in
    return NextResponse.redirect(new URL('/signin', req.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|logo.svg).*)'],
}