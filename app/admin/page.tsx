'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { supabase, UserProfile, KeyRecord } from '@/lib/supabase'
import AppShell from '@/components/AppShell'
import Topbar from '@/components/Topbar'
import AdminClient from './AdminClient'

export default function AdminPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()

  const [profiles, setProfiles]   = useState<UserProfile[]>([])
  const [statsMap, setStatsMap]   = useState<Record<string, { total: number; active: number }>>({})
  const [dataLoading, setDataLoading] = useState(true)

  // Auth guard — client side, no server redirect flash
  useEffect(() => {
    if (loading) return
    if (!profile) { router.replace('/login'); return }
    if (profile.role !== 'admin') { router.replace('/dashboard'); return }
  }, [loading, profile, router])

  // Fetch data once we know user is admin
  useEffect(() => {
    if (!profile || profile.role !== 'admin') return

    const fetchData = async () => {
      setDataLoading(true)

      const [profilesRes, recordsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: true }),
        supabase.from('key_records').select('engineer_id, date_in'),
      ])

      setProfiles((profilesRes.data ?? []) as UserProfile[])

      const map: Record<string, { total: number; active: number }> = {}
      ;((recordsRes.data ?? []) as Pick<KeyRecord, 'engineer_id' | 'date_in'>[]).forEach(r => {
        if (!r.engineer_id) return
        if (!map[r.engineer_id]) map[r.engineer_id] = { total: 0, active: 0 }
        map[r.engineer_id].total++
        if (!r.date_in) map[r.engineer_id].active++
      })
      setStatsMap(map)
      setDataLoading(false)
    }

    fetchData()
  }, [profile])

  // Show nothing while loading auth (AppShell handles the spinner)
  if (loading || !profile || profile.role !== 'admin') return null

  return (
    <AppShell>
      <Topbar title="Admin Panel" sub="User management & system settings" />
      <div style={{ padding: '24px 28px', flex: 1 }}>
        {dataLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>Loading users…</div>
          </div>
        ) : (
          <AdminClient
            profiles={profiles}
            statsMap={statsMap}
            currentUserId={profile.id}
            onRefresh={async () => {
              const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
              setProfiles((data ?? []) as UserProfile[])
            }}
          />
        )}
      </div>
    </AppShell>
  )
}
