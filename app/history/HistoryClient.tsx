'use client'
import { useState, useMemo } from 'react'
import { KeyRecord } from '@/lib/supabase'
import { formatDuration, parseDT } from '@/lib/utils'
import Avatar from '@/components/Avatar'
import Badge from '@/components/Badge'

export default function HistoryClient({ records }: { records: KeyRecord[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'out' | 'returned'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filtered = useMemo(() => records.filter(r => {
    const matchSearch = !search ||
      r.site_id.toLowerCase().includes(search.toLowerCase()) ||
      r.engineer_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.engineer_company ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || (statusFilter === 'out' ? !r.date_in : !!r.date_in)
    const matchFrom = !dateFrom || r.date_out >= dateFrom
    const matchTo = !dateTo || r.date_out <= dateTo
    return matchSearch && matchStatus && matchFrom && matchTo
  }), [records, search, statusFilter, dateFrom, dateTo])

  const th: React.CSSProperties = {
    padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 500,
    color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.4px',
    borderBottom: '1px solid var(--border)', background: 'var(--bg3)', whiteSpace: 'nowrap',
  }
  const td: React.CSSProperties = {
    padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, verticalAlign: 'middle',
  }
  const inp: React.CSSProperties = {
    padding: '7px 10px', background: 'var(--bg)', border: '1px solid var(--border2)',
    borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 12, outline: 'none',
  }

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {/* Filters */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search site or engineer..." style={{ ...inp, width: 220 }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as 'all' | 'out' | 'returned')} style={{ ...inp }}>
          <option value="all">All status</option>
          <option value="out">Out</option>
          <option value="returned">Returned</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>From</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inp} />
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>To</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inp} />
        </div>
        {(search || statusFilter !== 'all' || dateFrom || dateTo) && (
          <button onClick={() => { setSearch(''); setStatusFilter('all'); setDateFrom(''); setDateTo('') }}
            style={{ ...inp, cursor: 'pointer', color: 'var(--amber)', borderColor: 'rgba(245,166,35,0.3)' }}>
            Clear filters
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Site ID</th>
              <th style={th}>Engineer</th>
              <th style={th}>Company</th>
              <th style={th}>Date Out</th>
              <th style={th}>Time Out</th>
              <th style={th}>Date In</th>
              <th style={th}>Time In</th>
              <th style={th}>Duration</th>
              <th style={th}>Status</th>
              <th style={th}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ ...td, textAlign: 'center', color: 'var(--text3)', padding: 40 }}>No records match your filters</td></tr>
            )}
            {filtered.map(r => {
              let dur = '—'
              if (r.date_in && r.time_in) {
                const ms = parseDT(r.date_in, r.time_in).getTime() - parseDT(r.date_out, r.time_out).getTime()
                dur = formatDuration(ms)
              }
              return (
                <tr key={r.id}>
                  <td style={td}><Badge variant="site">{r.site_id}</Badge></td>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={r.engineer_name} size={24} />
                      {r.engineer_name}
                    </div>
                  </td>
                  <td style={{ ...td, fontSize: 12, color: 'var(--text2)' }}>{r.engineer_company || '—'}</td>
                  <td style={{ ...td, color: 'var(--text2)' }}>{r.date_out}</td>
                  <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.time_out}</td>
                  <td style={{ ...td, color: 'var(--text2)' }}>{r.date_in || '—'}</td>
                  <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.time_in || '—'}</td>
                  <td style={{ ...td, color: 'var(--text2)' }}>{dur}</td>
                  <td style={td}><Badge variant={r.date_in ? 'in' : 'out'}>{r.date_in ? 'Returned' : 'Out'}</Badge></td>
                  <td style={{ ...td, color: 'var(--text3)', fontSize: 12 }}>{r.notes || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
