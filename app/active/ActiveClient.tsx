'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRecord } from '@/lib/supabase'
import { formatDuration, parseDT } from '@/lib/utils'
import Avatar from '@/components/Avatar'
import Badge from '@/components/Badge'
import CheckinModal from '@/components/CheckinModal'
import QRScanModal from '@/components/QRScanModal'

export default function ActiveClient({ records }: { records: KeyRecord[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [checkinRecord, setCheckinRecord] = useState<KeyRecord | null>(null)
  const [showQRScan, setShowQRScan] = useState(false)
  const [qrTargetRecord, setQrTargetRecord] = useState<KeyRecord | null>(null)

  const filtered = records.filter(r =>
    r.site_id.toLowerCase().includes(search.toLowerCase()) ||
    r.engineer_name.toLowerCase().includes(search.toLowerCase()) ||
    (r.engineer_company ?? '').toLowerCase().includes(search.toLowerCase())
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
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Info banner */}
        <div style={{ padding: '9px 18px', background: 'rgba(45,212,170,0.05)', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🔒</span>
          <span>
            <strong style={{ color: 'var(--teal)' }}>Scan QR Code</strong> — verifies the engineer via a live rotating QR badge (expires every 5 min, screenshots rejected).
            &nbsp;<strong style={{ color: 'var(--text)' }}>Manual</strong> — direct return without QR verification.
          </span>
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
                <th style={th}>Duration</th>
                <th style={th}>Status</th>
                <th style={th}>Notes</th>
                <th style={th}>Return</th>
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
                    <td style={{ ...td, fontSize: 12, color: 'var(--text2)' }}>{r.engineer_company || '—'}</td>
                    <td style={{ ...td, color: 'var(--text2)' }}>{r.date_out}</td>
                    <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.time_out}</td>
                    <td style={{ ...td, color: overdue ? 'var(--amber)' : 'var(--text2)', fontWeight: overdue ? 500 : 400 }}>
                      {formatDuration(ms)}
                    </td>
                    <td style={td}>
                      <Badge variant={overdue ? 'overdue' : 'out'}>{overdue ? 'Overdue' : 'Out'}</Badge>
                    </td>
                    <td style={{ ...td, color: 'var(--text3)', fontSize: 12, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.notes || '—'}
                    </td>

                    {/* Return column — both buttons side by side */}
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {/* Scan QR Code */}
                        <button
                          onClick={() => { setQrTargetRecord(r); setShowQRScan(true) }}
                          title="Verify engineer via QR badge and return key"
                          style={{
                            padding: '5px 10px', borderRadius: 'var(--radius)',
                            background: 'var(--teal-bg)',
                            border: '1px solid rgba(45,212,170,0.35)',
                            color: 'var(--teal)', fontSize: 11, fontWeight: 600,
                            cursor: 'pointer', whiteSpace: 'nowrap',
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}
                        >
                          📷 Scan QR
                        </button>

                        {/* Manual */}
                        <button
                          onClick={() => setCheckinRecord(r)}
                          title="Manually log return without QR verification"
                          style={{
                            padding: '5px 10px', borderRadius: 'var(--radius)',
                            background: 'transparent',
                            border: '1px solid var(--border2)',
                            color: 'var(--text3)', fontSize: 11, fontWeight: 500,
                            cursor: 'pointer', whiteSpace: 'nowrap',
                          }}
                        >
                          Manual
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual check-in modal */}
      {checkinRecord && (
        <CheckinModal
          record={checkinRecord}
          onClose={() => setCheckinRecord(null)}
          onSuccess={() => { setCheckinRecord(null); router.refresh() }}
        />
      )}

      {/* QR scan modal — pre-filtered to the row's engineer if launched from row */}
      {showQRScan && (
        <QRScanModal
          activeRecords={qrTargetRecord ? records.filter(r => r.engineer_name === qrTargetRecord.engineer_name) : records}
          onClose={() => { setShowQRScan(false); setQrTargetRecord(null) }}
          onSuccess={() => { setShowQRScan(false); setQrTargetRecord(null); router.refresh() }}
        />
      )}
    </>
  )
}
