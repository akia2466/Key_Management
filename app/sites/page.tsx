'use client'
import { useEffect, useState } from 'react'
import { supabase, KeyRecord } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import AppShell from '@/components/AppShell'
import Topbar from '@/components/Topbar'
import SitesClient from './SitesClient'

type SiteRow = { id: string; active: KeyRecord | null; lastDate: string; totalVisits: number }

export default function SitesPage() {
  const { profile } = useAuth()
  const [sites, setSites]     = useState<SiteRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    const isEngineer = profile.role === 'engineer' // non-privileged: only sees own data

    let query = supabase.from('key_records').select('*').order('date_out', { ascending: false })
    // Engineers only see their own; admin/supervisor/noc see all
    if (profile.role === 'engineer') query = query.eq('engineer_name', profile.full_name)

    query.then(({ data }) => {
      const records = (data ?? []) as KeyRecord[]
      const siteMap = new Map<string, { active: KeyRecord | null; lastDate: string; totalVisits: number }>()

      records.forEach(r => {
        if (!siteMap.has(r.site_id)) siteMap.set(r.site_id, { active: null, lastDate: '', totalVisits: 0 })
        const s = siteMap.get(r.site_id)!
        s.totalVisits++
        if (!r.date_in) s.active = r
        if (!s.lastDate || r.date_out > s.lastDate) s.lastDate = r.date_out
      })

      setSites(
        Array.from(siteMap.entries())
          .map(([id, s]) => ({ id, ...s }))
          .sort((a, b) => b.lastDate.localeCompare(a.lastDate))
      )
      setLoading(false)
    })
  }, [profile])

  const isEngineer = profile?.role === 'engineer'

  return (
    <AppShell>
      <Topbar
        title="Sites"
        sub={isEngineer ? `${sites.length} sites you have visited` : `${sites.length} registered basestations`}
      />
      <div style={{ padding: 'clamp(12px, 4vw, 24px) clamp(12px, 4vw, 28px)', flex: 1 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>Loading…</div>
          </div>
        ) : (
          <SitesClient sites={sites} />
        )}
      </div>
    </AppShell>
  )
}
