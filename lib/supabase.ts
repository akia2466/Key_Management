import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service-role client — only used server-side for admin operations (invite/delete users)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseAnonKey, // falls back gracefully
  { auth: { autoRefreshToken: false, persistSession: false } }
)

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
