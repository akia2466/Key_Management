import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton pattern — prevents "Multiple GoTrueClient instances" warning
const globalForSupabase = globalThis as unknown as { _supabase?: ReturnType<typeof createClient> }

export const supabase =
  globalForSupabase._supabase ??
  createClient(supabaseUrl, supabaseAnonKey)

if (process.env.NODE_ENV !== 'production') {
  globalForSupabase._supabase = supabase
}

export type Role = 'admin' | 'noc' | 'engineer'

export type UserProfile = {
  id: string
  email: string
  full_name: string
  role: Role
  is_active: boolean
  created_at: string
}

export type KeyRecord = {
  id: number
  site_id: string
  engineer_name: string
  engineer_id: string | null
  checkout_confirmed_by: string | null
  checkin_confirmed_by: string | null
  date_out: string
  time_out: string
  date_in: string | null
  time_in: string | null
  notes: string | null
  created_at: string
}
