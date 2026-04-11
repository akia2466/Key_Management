'use client'
import { useEffect, useState } from 'react'
import { supabase, KeyRecord } from '@/lib/supabase'
import AppShell from '@/components/AppShell'
import Topbar from '@/components/Topbar'
import ActiveClient from './ActiveClient'

export default function ActivePage() {
  const [records, setRecords] = useState<KeyRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('key_records')
      .select('*')
      .is('date_in', null)
      .order('date_out', { ascending: false })
      .order('time_out', { ascending: false })
      .then(({ data }) => {
        setRecords((data ?? []) as KeyRecord[])
        setLoading(false)
      })
  }, [])

  return (
    <AppShell>
      <Topbar title="Active Keys" sub={`${records.length} key${records.length !== 1 ? 's' : ''} currently out in the field`} />
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
