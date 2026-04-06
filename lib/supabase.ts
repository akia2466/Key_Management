import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type KeyRecord = {
  id: number
  site_id: string
  engineer_name: string
  date_out: string
  time_out: string
  date_in: string | null
  time_in: string | null
  notes: string | null
  created_at: string
}
