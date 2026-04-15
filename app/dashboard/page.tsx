'use client'
import { useEffect, useState } from 'react'
import { supabase, KeyRecord, UserProfile } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import AppShell from '@/components/AppShell'
import Topbar from '@/components/Topbar'
import StatCard from '@/components/StatCard'
import DashboardClient from './DashboardClient'

export default function DashboardPage() {
  const { profile } = useAuth()
  const [records, setRecords] = useState<KeyRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    const isEngineer = profile.role === 'engineer'

    const fetchData = async () => {
      const [recordsRes, profilesRes] = await Promise.all([
        (() => {
          let q = supabase.from('key_records').select('*')
            .order('date_out', { ascending: false })
            .order('time_out', { ascending: false })
          if (isEngineer) q = q.eq('engineer_name', profile.full_name)
          return q
        })(),
        supabase.from('profiles').select('full_name, company'),
      ])

      const raw = (recordsRes.data ?? []) as KeyRecord[]
      const profiles = (profilesRes.data ?? []) as Pick<UserProfile, 'full_name' | 'company'>[]
      const companyByName: Record<string, string> = {}
      profiles.forEach(p => { if (p.company) companyByName[p.full_name] = p.company })
      const enriched = raw.map(r => ({
        ...r,
        engineer_company: r.engineer_company || companyByName[r.engineer_name] || null,
      }))
      setRecords(enriched)
      setLoading(false)
    }
    fetchData()
  }, [profile])

  const isEngineer = profile?.role === 'engineer'
  const today    = new Date().toISOString().slice(0, 10)
  const active   = records.filter(r => !r.date_in)
  const returned = records.filter(r => r.date_in === today)
  const overdue  = active.filter(r => Date.now() - new Date(`${r.date_out}T${r.time_out}`).getTime() > 8 * 3600000)
  const allSites = Array.from(new Set(records.map(r => r.site_id)))

  return (
    <AppShell>
      <Topbar
        title="Dashboard"
        sub={isEngineer ? `Welcome back, ${profile?.full_name}` : 'Network Operations Centre — Key Management'}
      />
      <div style={{ padding: 'clamp(12px, 4vw, 24px) clamp(12px, 4vw, 28px)', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>Loading…</div>
          </div>
        ) : (
          <>
            <div className="stats-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20, flexShrink: 0 }}>
              <StatCard label={isEngineer ? 'My Keys Out' : 'Keys Out'} value={active.length} sub={isEngineer ? 'Your keys in field' : 'Currently in the field'} accent="var(--red)" />
              <StatCard label="Returned Today" value={returned.length} sub="Back at NOC today" accent="var(--teal)" />
              <StatCard label="Overdue" value={overdue.length} sub="Out more than 8 hours" accent={overdue.length > 0 ? 'var(--amber)' : undefined} />
              <StatCard label={isEngineer ? 'My Sites' : 'Total Sites'} value={allSites.length} sub={isEngineer ? 'Sites you have visited' : 'Registered basestations'} />
            </div>

            {overdue.length > 0 && (
              <div style={{ padding: '12px 16px', marginBottom: 16, background: 'var(--amber-bg)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span>⚠</span>
                <strong>{overdue.length} key{overdue.length > 1 ? 's' : ''} overdue:</strong>
                {overdue.map(r => r.site_id).join(', ')} — out more than 8 hours
              </div>
            )}

            {/* DashboardClient fills remaining height */}
            <DashboardClient records={records} />
          </>
        )}
      </div>
    </AppShell>
  )
}
