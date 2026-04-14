import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const globalForSupabase = globalThis as unknown as { _supabase?: SupabaseClient }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<any> =
  globalForSupabase._supabase ?? createClient(supabaseUrl, supabaseAnonKey)

if (process.env.NODE_ENV !== 'production') globalForSupabase._supabase = supabase

// admin    — full system access, user management
// supervisor — same as noc but distinct role label
// noc      — manage key log, check-out/in, view all
// engineer — field staff, see own records only
export type Role = 'admin' | 'supervisor' | 'noc' | 'engineer'

export type UserProfile = {
  id: string
  email: string
  full_name: string
  role: Role
  company: string        // e.g. "Vodafone PNG", "Digicel", "contractor name"
  is_active: boolean
  created_at: string
}

export type KeyRecord = {
  id: number
  site_id: string
  engineer_name: string
  engineer_company: string | null   // captured at checkout time
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
