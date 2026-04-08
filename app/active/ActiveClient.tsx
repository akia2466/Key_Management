'use client'
import { useState } from 'react'
import { KeyRecord } from '@/lib/supabase'
import { formatDuration, parseDT } from '@/lib/utils'
import Avatar from '@/components/Avatar'
import Badge from '@/components/Badge'
import CheckinModal from '@/components/CheckinModal'
import QRScanModal from '@/components/QRScanModal'

export default function ActiveClient({ records }: { records: KeyRecord[] }) {
  const [search, setSearch] = useState('')
  const [checkinRecord, setCheckinRecord] = useState<KeyRecord | null>(null)
  const [showQRScan, setShowQRScan] = useState(false)

  const filtered = records.filter(r =>
    r.site_id.toLowerCase().includes(search.toLowerCase()) ||
    r.engineer_name.toLowerCase().includes(search.toLowerCase())
  )

  const now = Date.now()

  const th: React.CSSProperties = {
    padding: '10px 16px', textAlign: 'left', fontSize: 11,
    fontWeight: 500, color: 'var(--text3)', textTransform: 'uppercase',
    letterSpacing: '0.4px', borderBottom: '1px solid var(--border)',
    background: 'var(--bg3)', whiteSpace: 'nowrap',
  }
  const td: React.CSSProperties = {
    padding: '11px 16px', borderBottom: '1px solid var(--border)',
    verticalAlign: 'middle', fontSize: 13,
  }

  return (
    <>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search site ID or engineer..."
            style={{ padding: '7px 12px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 13, width: 240, outline: 'none' }}
          />

          {/* QR Scan button — primary action */}
          <button
            onClick={() => setShowQRScan(true)}
            style={{
              padding: '7px 16px', borderRadius: 'var(--radius)',
              background: 'var(--teal)', border: 'none',
              color: '#0f1117', fontWeight: 600, fontSize: 13,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
              transition: 'opacity 0.15s',
            }}
            onMouseOver={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseOut={e => (e.currentTarget.style.opacity = '1')}
          >
            📷 Scan to Return
          </button>

          <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 'auto' }}>
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* QR scan hint banner */}
        <div style={{ padding: '9px 18px', background: 'rgba(45,212,170,0.05)', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--teal)' }}>📷</span>
          <span>
            Engineers can scan their personal QR badge to auto-fill the return form — no typing needed.
            QR codes are generated from the <strong style={{ color: 'var(--text)' }}>Engineers</strong> page.
          </span>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Site ID</th>
                <th style={th}>Engineer</th>
                <th style={th}>Date Out</th>
                <th style={th}>Time Out</th>
                <th style={th}>Duration</th>
                <th style={th}>Status</th>
                <th style={th}>Notes</th>
                <th style={th}>Manual Return</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: 'var(--text3)', padding: 40 }}>
                  {search ? 'No matches found' : 'No keys currently checked out ✓'}
                </td></tr>
              )}
              {filtered.map(r => {
                const ms = now - parseDT(r.date_out, r.time_out).getTime()
                const overdue = ms > 8 * 3600000
                return (
                  <tr key={r.id} style={{ background: overdue ? 'rgba(245,166,35,0.04)' : 'transparent' }}>
                    <td style={td}><Badge variant="site">{r.site_id}</Badge></td>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={r.engineer_name} size={26} />
                        {r.engineer_name}
                      </div>
                    </td>
                    <td style={{ ...td, color: 'var(--text2)' }}>{r.date_out}</td>
                    <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.time_out}</td>
                    <td style={{ ...td, color: overdue ? 'var(--amber)' : 'var(--text2)', fontWeight: overdue ? 500 : 400 }}>
                      {formatDuration(ms)}
                    </td>
                    <td style={td}>
                      <Badge variant={overdue ? 'overdue' : 'out'}>{overdue ? 'Overdue' : 'Out'}</Badge>
                    </td>
                    <td style={{ ...td, color: 'var(--text3)', fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.notes || '—'}
                    </td>
                    <td style={td}>
                      <button
                        onClick={() => setCheckinRecord(r)}
                        style={{ padding: '5px 12px', borderRadius: 'var(--radius)', background: 'transparent', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                      >
                        Return ↩
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {checkinRecord && (
        <CheckinModal
          record={checkinRecord}
          onClose={() => setCheckinRecord(null)}
          onSuccess={() => { setCheckinRecord(null); window.location.reload() }}
        />
      )}

      {showQRScan && (
        <QRScanModal
          activeRecords={records}
          onClose={() => setShowQRScan(false)}
          onSuccess={() => { setShowQRScan(false); window.location.reload() }}
        />
      )}
    </>
  )
}
