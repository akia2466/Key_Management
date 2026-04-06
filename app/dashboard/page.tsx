import { supabase, KeyRecord } from '@/lib/supabase'
import AppShell from '@/components/AppShell'
import Topbar from '@/components/Topbar'
import StatCard from '@/components/StatCard'
import DashboardClient from './DashboardClient'

export const revalidate = 0

async function getData() {
  const { data, error } = await supabase
    .from('key_records')
    .select('*')
    .order('date_out', { ascending: false })
    .order('time_out', { ascending: false })
  if (error) throw error
  return (data ?? []) as KeyRecord[]
}

export default async function DashboardPage() {
  const records = await getData()

  const today = new Date().toISOString().slice(0, 10)
  const active = records.filter(r => !r.date_in)
  const returnedToday = records.filter(r => r.date_in === today)
  const overdue = active.filter(r => {
    const ms = Date.now() - new Date(`${r.date_out}T${r.time_out}`).getTime()
    return ms > 8 * 3600000
  })
  const allSites = Array.from(new Set(records.map(r => r.site_id)))

  return (
    <AppShell>
      <Topbar title="Dashboard" sub="Network Operations Centre — Key Management" />
      <div style={{ padding: '24px 28px', flex: 1 }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          <StatCard label="Keys Out" value={active.length} sub="Currently in the field" accent="var(--red)" />
          <StatCard label="Returned Today" value={returnedToday.length} sub="Back at NOC today" accent="var(--teal)" />
          <StatCard label="Overdue" value={overdue.length} sub="Out more than 8 hours" accent={overdue.length > 0 ? 'var(--amber)' : undefined} />
          <StatCard label="Total Sites" value={allSites.length} sub="Registered basestations" />
        </div>

        {/* Overdue alert */}
        {overdue.length > 0 && (
          <div style={{
            padding: '12px 16px', marginBottom: 20,
            background: 'var(--amber-bg)', border: '1px solid rgba(245,166,35,0.3)',
            borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--amber)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span>⚠</span>
            <strong>{overdue.length} key{overdue.length > 1 ? 's' : ''} overdue:</strong>
            {overdue.map(r => r.site_id).join(', ')} — out more than 8 hours
          </div>
        )}

        <DashboardClient records={records} />
      </div>
    </AppShell>
  )
}
