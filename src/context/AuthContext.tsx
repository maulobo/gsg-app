'use client'

import { supabase } from '@/lib/supabase'
import { User, Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  refreshSession: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email || 'No session')
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.email || 'No session')
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const refreshSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
    } catch (err) {
      console.error('Refresh session error:', err)
    }
  }

  const signOut = async () => {
    try {
      console.log('Starting sign out...')
      
      // Sign out on client with local scope (doesn't require session to be in storage)
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      if (error) {
        console.error('Supabase signOut error:', error)
        // Continue anyway - the session might already be gone
      } else {
        console.log('Supabase signOut successful')
      }
      
      // Clear server cookies
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      })
      
      if (!response.ok) {
        console.error('Server signout failed:', await response.text())
      } else {
        console.log('Server signout successful')
      }
      
      // Ensure client state is cleared
      setUser(null)
      setSession(null)
    } catch (err) {
      console.error('Sign out error:', err)
      // Even if there's an error, clear the client state
      setUser(null)
      setSession(null)
    }
  }

  const value = {
    user,
    session,
    loading,
    signOut,
    refreshSession,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}