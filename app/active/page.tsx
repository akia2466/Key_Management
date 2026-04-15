'use client'
import { useEffect, useState } from 'react'
import { supabase, KeyRecord, UserProfile } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import AppShell from '@/components/AppShell'
import Topbar from '@/components/Topbar'
import ActiveClient from './ActiveClient'

export default function ActivePage() {
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
            .is('date_in', null)
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

  return (
    <AppShell>
      <Topbar
        title="Active Keys"
        sub={isEngineer
          ? `Your ${records.length} key${records.length !== 1 ? 's' : ''} currently out`
          : `${records.length} key${records.length !== 1 ? 's' : ''} currently out in the field`}
      />
      <div style={{ padding: 'clamp(12px, 4vw, 24px) clamp(12px, 4vw, 28px)', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>Loading…</div>
          </div>
        ) : (
          <ActiveClient records={records} />
        )}
      </div>
    </AppShell>
  )
}
