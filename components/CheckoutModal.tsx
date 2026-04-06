'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  background: 'var(--bg)', border: '1px solid var(--border2)',
  borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 13,
  outline: 'none',
}
const lbl: React.CSSProperties = { fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 5 }

export default function CheckoutModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    site_id: '', engineer_name: '',
    date_out: new Date().toISOString().slice(0, 10),
    time_out: new Date().toTimeString().slice(0, 5),
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.site_id.trim() || !form.engineer_name.trim()) { setError('Site ID and Engineer Name are required.'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.from('key_records').insert([{
      site_id: form.site_id.toUpperCase().trim(),
      engineer_name: form.engineer_name.trim(),
      date_out: form.date_out,
      time_out: form.time_out,
      notes: form.notes || null,
    }])
    setLoading(false)
    if (err) { setError(err.message); return }
    onSuccess()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-lg)', padding: 28, width: 440, maxWidth: '95vw' }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>Check Out Key</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>Log a key leaving the NOC</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 20, lineHeight: 1, padding: 4 }}>×</button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Site ID *</label>
          <input style={inp} placeholder="e.g. P0132" value={form.site_id} onChange={e => set('site_id', e.target.value)} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Engineer Name *</label>
          <input style={inp} placeholder="Full name" value={form.engineer_name} onChange={e => set('engineer_name', e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={lbl}>Date Out</label>
            <input style={inp} type="date" value={form.date_out} onChange={e => set('date_out', e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Time Out</label>
            <input style={inp} type="time" value={form.time_out} onChange={e => set('time_out', e.target.value)} />
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={lbl}>Notes (optional)</label>
          <input style={inp} placeholder="Any remarks..." value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        {error && <div style={{ padding: '8px 12px', background: 'var(--red-bg)', border: '1px solid rgba(242,100,100,0.3)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--red)', marginBottom: 14 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 'var(--radius)', background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: 13 }}>Cancel</button>
          <button onClick={submit} disabled={loading} style={{ padding: '8px 20px', borderRadius: 'var(--radius)', background: 'var(--amber)', border: 'none', color: '#0f1117', fontWeight: 600, fontSize: 13, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Saving...' : 'Log Check-Out'}
          </button>
        </div>
      </div>
    </div>
  )
}
