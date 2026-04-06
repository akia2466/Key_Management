import { supabase, KeyRecord } from '@/lib/supabase'
import AppShell from '@/components/AppShell'
import Topbar from '@/components/Topbar'
import SitesClient from './SitesClient'

export const revalidate = 0

export default async function SitesPage() {
  const { data } = await supabase
    .from('key_records')
    .select('*')
    .order('date_out', { ascending: false })

  const records = (data ?? []) as KeyRecord[]

  // Aggregate per site
  const siteMap = new Map<string, { records: KeyRecord[]; active: KeyRecord | null; lastDate: string; totalVisits: number }>()
  records.forEach(r => {
    if (!siteMap.has(r.site_id)) siteMap.set(r.site_id, { records: [], active: null, lastDate: '', totalVisits: 0 })
    const s = siteMap.get(r.site_id)!
    s.records.push(r)
    s.totalVisits++
    if (!r.date_in) s.active = r
    if (!s.lastDate || r.date_out > s.lastDate) s.lastDate = r.date_out
  })

  const sites = Array.from(siteMap.entries()).map(([id, s]) => ({
    id, active: s.active, lastDate: s.lastDate, totalVisits: s.totalVisits,
  })).sort((a, b) => b.lastDate.localeCompare(a.lastDate))

  return (
    <AppShell>
      <Topbar title="Sites" sub={`${sites.length} registered basestations`} />
      <div style={{ padding: '24px 28px', flex: 1 }}>
        <SitesClient sites={sites} />
      </div>
    </AppShell>
  )
}
