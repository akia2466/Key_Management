import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserProfile = {
  id: string              // matches auth.users.id
  email: string
  full_name: string
  role: 'noc' | 'engineer'
  created_at: string
}

export type KeyRecord = {
  id: number
  site_id: string
  engineer_name: string
  engineer_id: string | null        // auth user id of engineer
  checkout_confirmed_by: string | null  // engineer user id who QR-confirmed checkout
  checkin_confirmed_by: string | null   // engineer user id who QR-confirmed return
  date_out: string
  time_out: string
  date_in: string | null
  time_in: string | null
  notes: string | null
  created_at: string
}
