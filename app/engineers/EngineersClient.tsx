'use client'
import { useState } from 'react'
import Avatar from '@/components/Avatar'
import Badge from '@/components/Badge'

type EngRow = { name: string; total: number; active: number; activeSites: string[]; lastDate: string; avgDuration: string }

export default function EngineersClient({ engineers }: { engineers: EngRow[] }) {
  const [search, setSearch] = useState('')

  const filtered = engineers.filter(e =>
    !search || e.name.toLowerCase().includes(search.toLowerCase())
  )

  const th: React.CSSProperties = {
    padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 500,
    color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.4px',
    borderBottom: '1px solid var(--border)', background: 'var(--bg3)',
  }
  const td: React.CSSProperties = { padding: '11px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, verticalAlign: 'middle' }

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search engineer..."
          style={{ padding: '7px 10px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 12, outline: 'none', width: 200 }}
        />
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>{filtered.length} engineer{filtered.length !== 1 ? 's' : ''}</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Engineer</th>
              <th style={th}>Total Checkouts</th>
              <th style={th}>Currently Holding</th>
              <th style={th}>Active Sites</th>
              <th style={th}>Last Active</th>
              <th style={th}>Avg Duration</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: 'var(--text3)', padding: 40 }}>No engineers found</td></tr>
            )}
            {filtered.map(e => (
              <tr key={e.name}>
                <td style={td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={e.name} size={32} />
                    <span style={{ fontWeight: 500 }}>{e.name}</span>
                  </div>
                </td>
                <td style={{ ...td, fontWeight: 600, color: 'var(--text)' }}>{e.total}</td>
                <td style={td}>
                  {e.active > 0
                    ? <Badge variant="out">{e.active} key{e.active > 1 ? 's' : ''}</Badge>
                    : <Badge variant="in">None</Badge>
                  }
                </td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {e.activeSites.length > 0
                      ? e.activeSites.map((s, i) => <Badge key={i} variant="site">{s}</Badge>)
                      : <span style={{ color: 'var(--text3)' }}>—</span>
                    }
                  </div>
                </td>
                <td style={{ ...td, color: 'var(--text2)' }}>{e.lastDate || '—'}</td>
                <td style={{ ...td, color: 'var(--text2)' }}>{e.avgDuration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
