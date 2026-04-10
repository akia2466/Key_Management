import { supabase, UserProfile } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import Topbar from '@/components/Topbar'
import AdminClient from './AdminClient'

export const revalidate = 0

export default async function AdminPage() {
  // Server-side auth check — must be admin
  const cookieStore = cookies()
  const supabaseServer = supabase

  const { data: { session } } = await supabaseServer.auth.getSession()
  if (!session) redirect('/login')

  const { data: myProfile } = await supabaseServer
    .from('profiles').select('*').eq('id', session.user.id).single()

  if (!myProfile || myProfile.role !== 'admin') redirect('/dashboard')

  const { data: profiles } = await supabaseServer
    .from('profiles').select('*').order('created_at', { ascending: true })

  // Key stats per user
  const { data: records } = await supabaseServer
    .from('key_records').select('engineer_id, date_in')

  const statsMap: Record<string, { total: number; active: number }> = {}
  ;(records ?? []).forEach((r: { engineer_id: string | null; date_in: string | null }) => {
    if (!r.engineer_id) return
    if (!statsMap[r.engineer_id]) statsMap[r.engineer_id] = { total: 0, active: 0 }
    statsMap[r.engineer_id].total++
    if (!r.date_in) statsMap[r.engineer_id].active++
  })

  return (
    <AppShell>
      <Topbar title="Admin Panel" sub="User management & system settings" />
      <div style={{ padding: '24px 28px', flex: 1 }}>
        <AdminClient
          profiles={(profiles ?? []) as UserProfile[]}
          statsMap={statsMap}
          currentUserId={session.user.id}
        />
      </div>
    </AppShell>
  )
}
