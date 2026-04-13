'use client'
import { useState } from 'react'
import { supabase, KeyRecord } from '@/lib/supabase'

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  background: 'var(--bg)', border: '1px solid var(--border2)',
  borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 13, outline: 'none',
}
const lbl: React.CSSProperties = { fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 5 }

export default function CheckinModal({ record, onClose, onSuccess }: { record: KeyRecord; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    date_in: new Date().toISOString().slice(0, 10),
    time_in: new Date().toTimeString().slice(0, 5),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setLoading(true); setError('')
    const { error: err } = await supabase.from('key_records').update({
      date_in: form.date_in,
      time_in: form.time_in,
    }).eq('id', record.id)
    setLoading(false)
    if (err) { setError(err.message); return }
    onSuccess()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-lg)', padding: 28, width: '95vw', maxWidth: 400 }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>Return Key</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
              Site <span style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>{record.site_id}</span> · {record.engineer_name}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 20, lineHeight: 1, padding: 4 }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={lbl}>Date In</label>
            <input style={inp} type="date" value={form.date_in} onChange={e => setForm(f => ({ ...f, date_in: e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>Time In</label>
            <input style={inp} type="time" value={form.time_in} onChange={e => setForm(f => ({ ...f, time_in: e.target.value }))} />
          </div>
        </div>

        {error && <div style={{ padding: '8px 12px', background: 'var(--red-bg)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--red)', marginBottom: 14 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 'var(--radius)', background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: 13 }}>Cancel</button>
          <button onClick={submit} disabled={loading} style={{ padding: '8px 20px', borderRadius: 'var(--radius)', background: 'var(--teal)', border: 'none', color: '#0f1117', fontWeight: 600, fontSize: 13, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Saving...' : 'Confirm Return ↩'}
          </button>
        </div>
      </div>
    </div>
  )
}
