'use client'
import { useEffect, useState } from 'react'
import { supabase, KeyRecord } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { formatDuration, parseDT } from '@/lib/utils'
import AppShell from '@/components/AppShell'
import Topbar from '@/components/Topbar'
import EngineersClient from './EngineersClient'

type EngRow = { name: string; total: number; active: number; activeSites: string[]; lastDate: string; avgDuration: string }

export default function EngineersPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [engineers, setEngineers] = useState<EngRow[]>([])
  const [loading, setLoading]     = useState(true)

  // Engineers cannot view the Engineers page at all
  useEffect(() => {
    if (authLoading) return
    if (profile?.role === 'engineer') {
      router.replace('/profile') // redirect to their own QR profile
    }
  }, [profile, authLoading, router])

  useEffect(() => {
    if (!profile || profile.role === 'engineer') return

    supabase.from('key_records').select('*').order('date_out', { ascending: false })
      .then(({ data }) => {
        const records = (data ?? []) as KeyRecord[]
        const engMap = new Map<string, { total: number; active: number; lastDate: string; durations: number[]; activeSites: string[] }>()

        records.forEach(r => {
          if (!engMap.has(r.engineer_name)) engMap.set(r.engineer_name, { total: 0, active: 0, lastDate: '', durations: [], activeSites: [] })
          const e = engMap.get(r.engineer_name)!
          e.total++
          if (!r.date_in) { e.active++; e.activeSites.push(r.site_id) }
          if (r.date_in && r.time_in) {
            const ms = parseDT(r.date_in, r.time_in).getTime() - parseDT(r.date_out, r.time_out).getTime()
            if (ms > 0) e.durations.push(ms)
          }
          if (!e.lastDate || r.date_out > e.lastDate) e.lastDate = r.date_out
        })

        setEngineers(
          Array.from(engMap.entries()).map(([name, e]) => ({
            name, total: e.total, active: e.active, activeSites: e.activeSites, lastDate: e.lastDate,
            avgDuration: e.durations.length ? formatDuration(e.durations.reduce((a, b) => a + b, 0) / e.durations.length) : '—',
          })).sort((a, b) => b.total - a.total)
        )
        setLoading(false)
      })
  }, [profile])

  if (profile?.role === 'engineer') return null

  return (
    <AppShell>
      <Topbar title="Engineers" sub={`${engineers.length} field engineers`} />
      <div style={{ padding: 'clamp(12px, 4vw, 24px) clamp(12px, 4vw, 28px)', flex: 1 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>Loading…</div>
          </div>
        ) : (
          <EngineersClient engineers={engineers} />
        )}
      </div>
    </AppShell>
  )
}
