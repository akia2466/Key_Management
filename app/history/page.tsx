'use client'
import { useEffect, useState } from 'react'
import { supabase, KeyRecord } from '@/lib/supabase'
import AppShell from '@/components/AppShell'
import Topbar from '@/components/Topbar'
import HistoryClient from './HistoryClient'

export default function HistoryPage() {
  const [records, setRecords] = useState<KeyRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('key_records')
      .select('*')
      .order('date_out', { ascending: false })
      .order('time_out', { ascending: false })
      .then(({ data }) => {
        setRecords((data ?? []) as KeyRecord[])
        setLoading(false)
      })
  }, [])

  return (
    <AppShell>
      <Topbar title="Log History" sub={`${records.length} total records`} />
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
