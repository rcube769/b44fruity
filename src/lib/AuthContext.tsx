import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthContextType {
  user: SupabaseUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) return { error: error.message }

    // Ensure user profile exists
    if (data.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!profile) {
        await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email!,
          display_name: data.user.email?.split('@')[0] || 'User'
        })
      }
    }

    return {}
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) return { error: error.message }

    // Create user profile if session exists immediately (no email confirmation)
    if (data.user && data.session) {
      await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email!,
        display_name: data.user.email?.split('@')[0] || 'User'
      })
    }

    return {}
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
