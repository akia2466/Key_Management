'use client'
import { KeyRecord } from '@/lib/supabase'
import { formatDuration, parseDT, isOverdue } from '@/lib/utils'
import Avatar from '@/components/Avatar'
import Badge from '@/components/Badge'

export default function DashboardClient({ records }: { records: KeyRecord[] }) {
  // Recent activity — last 12 events (check-ins and check-outs)
  const events: Array<{ ts: Date; type: 'in' | 'out'; record: KeyRecord }> = []
  records.forEach(r => {
    events.push({ ts: parseDT(r.date_out, r.time_out), type: 'out', record: r })
    if (r.date_in && r.time_in) events.push({ ts: parseDT(r.date_in, r.time_in), type: 'in', record: r })
  })
  events.sort((a, b) => b.ts.getTime() - a.ts.getTime())
  const recent = events.slice(0, 12)

  // Engineer leaderboard
  const engCount: Record<string, number> = {}
  records.forEach(r => { engCount[r.engineer_name] = (engCount[r.engineer_name] || 0) + 1 })
  const topEng = Object.entries(engCount).sort((a, b) => b[1] - a[1]).slice(0, 7)
  const maxCount = topEng[0]?.[1] || 1

  // Active keys summary
  const active = records.filter(r => !r.date_in)

  const sectionStyle: React.CSSProperties = {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', overflow: 'hidden',
  }
  const sectionHead: React.CSSProperties = {
    padding: '14px 18px', borderBottom: '1px solid var(--border)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

      {/* Recent Activity */}
      <div style={sectionStyle}>
        <div style={sectionHead}>
          <div style={{ fontWeight: 500, fontSize: 13 }}>Recent Activity</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Last {recent.length} movements</div>
        </div>
        <div>
          {recent.map((ev, i) => (
            <div key={i} style={{
              display: 'flex', gap: 12, padding: '10px 18px',
              borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none',
              alignItems: 'flex-start',
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50', marginTop: 5, flexShrink: 0,
                background: ev.type === 'in' ? 'var(--teal)' : 'var(--red)',
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Badge variant="site">{ev.record.site_id}</Badge>
                  <span style={{ color: 'var(--text2)' }}>{ev.record.engineer_name}</span>
                  <span style={{ color: 'var(--text3)' }}>{ev.type === 'in' ? 'returned key' : 'checked out key'}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
                  {ev.ts.toLocaleDateString('en-AU')} {ev.ts.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {recent.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No activity yet</div>}
        </div>
      </div>

      {/* Right column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Engineer chart */}
        <div style={sectionStyle}>
          <div style={sectionHead}>
            <div style={{ fontWeight: 500, fontSize: 13 }}>Top Engineers</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>By total checkouts</div>
          </div>
          <div style={{ padding: '14px 18px' }}>
            {topEng.map(([name, count], i) => {
              const colors = ['var(--blue)', 'var(--teal)', 'var(--amber)', 'var(--red)', 'var(--green)', 'var(--blue)', 'var(--teal)']
              const pct = Math.round((count / maxCount) * 100)
              return (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Avatar name={name} size={24} />
                  <div style={{ fontSize: 12, color: 'var(--text2)', width: 90, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                  <div style={{ flex: 1, height: 16, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: colors[i % colors.length], borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', width: 20, textAlign: 'right' }}>{count}</div>
                </div>
              )
            })}
            {topEng.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, padding: 16 }}>No data</div>}
          </div>
        </div>

        {/* Currently out */}
        <div style={sectionStyle}>
          <div style={sectionHead}>
            <div style={{ fontWeight: 500, fontSize: 13 }}>Currently Out</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{active.length} key{active.length !== 1 ? 's' : ''} in field</div>
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {active.slice(0, 8).map((r, i) => {
              const ms = Date.now() - parseDT(r.date_out, r.time_out).getTime()
              const overdue = ms > 8 * 3600000
              return (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px',
                  borderBottom: i < active.length - 1 ? '1px solid var(--border)' : 'none',
                  background: overdue ? 'rgba(245,166,35,0.04)' : 'transparent',
                }}>
                  <Badge variant="site">{r.site_id}</Badge>
                  <span style={{ fontSize: 12, color: 'var(--text2)', flex: 1 }}>{r.engineer_name}</span>
                  <span style={{ fontSize: 11, color: overdue ? 'var(--amber)' : 'var(--text3)', fontWeight: overdue ? 500 : 400 }}>{formatDuration(ms)}</span>
                </div>
              )
            })}
            {active.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>All keys returned ✓</div>}
            {active.length > 8 && <div style={{ padding: '8px 18px', fontSize: 11, color: 'var(--text3)' }}>+{active.length - 8} more — see Active Keys tab</div>}
          </div>
        </div>

      </div>
    </div>
  )
}
