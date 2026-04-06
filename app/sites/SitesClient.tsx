'use client'
import { useState } from 'react'
import Badge from '@/components/Badge'
import { KeyRecord } from '@/lib/supabase'

type SiteRow = { id: string; active: KeyRecord | null; lastDate: string; totalVisits: number }

export default function SitesClient({ sites }: { sites: SiteRow[] }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'out' | 'available'>('all')

  const filtered = sites.filter(s => {
    const matchSearch = !search || s.id.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'out' ? !!s.active : !s.active)
    return matchSearch && matchFilter
  })

  const th: React.CSSProperties = {
    padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 500,
    color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.4px',
    borderBottom: '1px solid var(--border)', background: 'var(--bg3)',
  }
  const td: React.CSSProperties = { padding: '11px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, verticalAlign: 'middle' }
  const inp: React.CSSProperties = { padding: '7px 10px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 12, outline: 'none' }

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search site ID..." style={{ ...inp, width: 200 }} />
        <select value={filter} onChange={e => setFilter(e.target.value as 'all' | 'out' | 'available')} style={inp}>
          <option value="all">All sites</option>
          <option value="out">Key out</option>
          <option value="available">Available</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>{filtered.length} site{filtered.length !== 1 ? 's' : ''}</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Site ID</th>
              <th style={th}>Key Status</th>
              <th style={th}>Current Holder</th>
              <th style={th}>Checked Out</th>
              <th style={th}>Last Activity</th>
              <th style={th}>Total Visits</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: 'var(--text3)', padding: 40 }}>No sites found</td></tr>
            )}
            {filtered.map(s => (
              <tr key={s.id}>
                <td style={td}><Badge variant="site">{s.id}</Badge></td>
                <td style={td}><Badge variant={s.active ? 'out' : 'in'}>{s.active ? 'Out' : 'Available'}</Badge></td>
                <td style={{ ...td, color: s.active ? 'var(--text)' : 'var(--text3)' }}>{s.active ? s.active.engineer_name : '—'}</td>
                <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text2)' }}>
                  {s.active ? `${s.active.date_out} ${s.active.time_out}` : '—'}
                </td>
                <td style={{ ...td, color: 'var(--text2)' }}>{s.lastDate || '—'}</td>
                <td style={{ ...td, color: 'var(--text2)' }}>{s.totalVisits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
