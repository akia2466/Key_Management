'use client'
import { useEffect, useState } from 'react'
import { supabase, KeyRecord } from '@/lib/supabase'
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

    let query = supabase
      .from('key_records')
      .select('*')
      .is('date_in', null)
      .order('date_out', { ascending: false })
      .order('time_out', { ascending: false })

    // Engineers only see their own active keys
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
        title="Active Keys"
        sub={isEngineer
          ? `Your ${records.length} key${records.length !== 1 ? 's' : ''} currently out`
          : `${records.length} key${records.length !== 1 ? 's' : ''} currently out in the field`}
      />
      <div style={{ padding: '24px 28px', flex: 1 }}>
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
