'use client'
import { useEffect, useState } from 'react'
import { supabase, KeyRecord } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import AppShell from '@/components/AppShell'
import Topbar from '@/components/Topbar'
import HistoryClient from './HistoryClient'

export default function HistoryPage() {
  const { profile } = useAuth()
  const [records, setRecords] = useState<KeyRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    const isEngineer = profile.role === 'engineer'

    let query = supabase
      .from('key_records')
      .select('*')
      .order('date_out', { ascending: false })
      .order('time_out', { ascending: false })

    if (isEngineer) query = query.eq('engineer_name', profile.full_name)

    query.then(({ data }) => {
      setRecords((data ?? []) as KeyRecord[])
      setLoading(false)
    })
  }, [profile])

  const isEngineer = profile?.role === 'engineer'

  return (
    <AppShell>
      <Topbar
        title="Log History"
        sub={isEngineer ? `Your ${records.length} key records` : `${records.length} total records`}
      />
      <div style={{ padding: '24px 28px', flex: 1 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>Loading…</div>
          </div>
        ) : (
          <HistoryClient records={records} />
        )}
      </div>
    </AppShell>
  )
}
