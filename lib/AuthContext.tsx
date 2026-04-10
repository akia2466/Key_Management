'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase, UserProfile } from './supabase'
import type { Session } from '@supabase/supabase-js'

type AuthCtx = {
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx>({ session: null, profile: null, loading: true, signOut: async () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    const p = data as UserProfile | null
    // Block deactivated users
    if (p && !p.is_active) {
      await supabase.auth.signOut()
      setProfile(null)
      setSession(null)
      window.location.href = '/login?reason=deactivated'
      return
    }
    setProfile(p)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) loadProfile(session.user.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) loadProfile(session.user.id)
      else setProfile(null)
    })
    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return <Ctx.Provider value={{ session, profile, loading, signOut }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
