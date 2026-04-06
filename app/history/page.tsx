import { supabase, KeyRecord } from '@/lib/supabase'
import AppShell from '@/components/AppShell'
import Topbar from '@/components/Topbar'
import HistoryClient from './HistoryClient'

export const revalidate = 0

export default async function HistoryPage() {
  const { data } = await supabase
    .from('key_records')
    .select('*')
    .order('date_out', { ascending: false })
    .order('time_out', { ascending: false })

  const records = (data ?? []) as KeyRecord[]

  return (
    <AppShell>
      <Topbar title="Log History" sub={`${records.length} total records`} />
      <div style={{ padding: '24px 28px', flex: 1 }}>
        <HistoryClient records={records} />
      </div>
    </AppShell>
  )
}
