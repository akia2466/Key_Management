'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { buildQRPayload, validateQRPayload, secondsUntilNextWindow, WINDOW_MINUTES } from '@/lib/qrWindow'
import { useAuth } from '@/lib/AuthContext'

type Step = 'form' | 'qr_display' | 'qr_scan' | 'success'

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  background: 'var(--bg)', border: '1px solid var(--border2)',
  borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 13, outline: 'none',
}
const lbl: React.CSSProperties = { fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 5 }

export default function CheckoutModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { profile } = useAuth()

  // STEP 1 — form state
  const [form, setForm] = useState({
    site_id: '',
    engineer_name: profile?.role === 'engineer' ? (profile?.full_name ?? '') : '',
    date_out: new Date().toISOString().slice(0, 10),
    time_out: new Date().toTimeString().slice(0, 5),
    notes: '',
  })
  const [formError, setFormError] = useState('')

  // Fetch engineers for dropdown (noc role sees all engineers)
  const [engineers, setEngineers] = useState<{ id: string; full_name: string }[]>([])
  const [selectedEngineerId, setSelectedEngineerId] = useState<string>(
    profile?.role === 'engineer' ? (profile?.id ?? '') : ''
  )

  useEffect(() => {
    supabase.from('profiles').select('id, full_name').eq('role', 'engineer').order('full_name')
      .then(({ data }) => { if (data) setEngineers(data) })
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  // STEP 2 — QR display (engineer shows their live QR)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [secsLeft, setSecsLeft] = useState(secondsUntilNextWindow())
  const [windowNum, setWindowNum] = useState(0)

  useEffect(() => {
    if (!form.engineer_name) return
    let cancelled = false
    ;(async () => {
      const QRCode = (await import('qrcode')).default
      const url = await QRCode.toDataURL(buildQRPayload(form.engineer_name), {
        width: 240, margin: 2,
        color: { dark: '#e8eaf0', light: '#1e2333' },
        errorCorrectionLevel: 'H',
      })
      if (!cancelled) setQrDataUrl(url)
    })()
    return () => { cancelled = true }
  }, [form.engineer_name, windowNum])

  useEffect(() => {
    const interval = setInterval(() => {
      const s = secondsUntilNextWindow()
      setSecsLeft(s)
      if (s >= WINDOW_MINUTES * 60 - 1) setWindowNum(n => n + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // STEP 3 — QR scan (NOC scans the engineer's QR to confirm)
  const [step, setStep] = useState<Step>('form')
  const [scanError, setScanError] = useState('')
  const scannerStopRef = useRef<() => Promise<void>>()

  const startScanner = async () => {
    setScanError('')
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const qr = new Html5Qrcode('checkout-qr-scanner')
      scannerStopRef.current = () => qr.stop()
      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 200, height: 200 } },
        async (text) => {
          const result = validateQRPayload(text)
          if (!result.valid) {
            setScanError(result.reason ?? 'Invalid QR code.')
            return
          }
          // Verify the scanned engineer matches the form
          if (result.name?.toLowerCase() !== form.engineer_name.toLowerCase()) {
            setScanError(`QR code belongs to "${result.name}" but form has "${form.engineer_name}". Wrong engineer.`)
            return
          }
          await qr.stop().catch(() => {})
          await saveRecord(result.name!)
        },
        () => {}
      )
    } catch (e: unknown) {
      setScanError('Camera unavailable: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  useEffect(() => {
    if (step === 'qr_scan') startScanner()
    return () => { scannerStopRef.current?.().catch(() => {}) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const [saving, setSaving] = useState(false)

  async function saveRecord(confirmedByName: string) {
    setSaving(true)
    // Resolve confirmedBy user id
    const { data: confirmerProfile } = await supabase
      .from('profiles').select('id').eq('full_name', confirmedByName).single()

    const { error } = await supabase.from('key_records').insert([{
      site_id: form.site_id.toUpperCase().trim(),
      engineer_name: form.engineer_name.trim(),
      engineer_id: selectedEngineerId || null,
      checkout_confirmed_by: confirmerProfile?.id ?? null,
      date_out: form.date_out,
      time_out: form.time_out,
      notes: form.notes || null,
    }])
    setSaving(false)
    if (error) { setScanError('Save failed: ' + error.message); return }
    setStep('success')
    setTimeout(() => onSuccess(), 2000)
  }

  const goToQRStep = () => {
    if (!form.site_id.trim()) { setFormError('Site ID is required.'); return }
    if (!form.engineer_name.trim()) { setFormError('Engineer name is required.'); return }
    setFormError('')
    // If engineer is filling their own form, go to display step so they show their QR to NOC
    // If NOC is filling, go to scan step so they scan the engineer's phone
    setStep(profile?.role === 'engineer' ? 'qr_display' : 'qr_display')
  }

  const urgency = secsLeft <= 30 ? 'var(--red)' : secsLeft <= 60 ? 'var(--amber)' : 'var(--teal)'
  const pct = (secsLeft / (WINDOW_MINUTES * 60)) * 100
  const initials = form.engineer_name.split(/[\s.()]+/).filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join('')

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => e.target === e.currentTarget && step === 'form' && onClose()}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-lg)', padding: 28, width: 460, maxWidth: '95vw' }} className="fade-in">

        {/* ─── STEP INDICATOR ─── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
          {[
            { n: 1, label: 'Fill Form', active: step === 'form' },
            { n: 2, label: 'Show QR', active: step === 'qr_display' },
            { n: 3, label: 'Scan & Confirm', active: step === 'qr_scan' },
            { n: 4, label: 'Done', active: step === 'success' },
          ].map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  background: s.active ? 'var(--amber)' : 'var(--bg3)',
                  color: s.active ? '#0f1117' : 'var(--text3)',
                  border: s.active ? 'none' : '1px solid var(--border)',
                }}>{s.n}</div>
                <span style={{ fontSize: 11, color: s.active ? 'var(--amber)' : 'var(--text3)', fontWeight: s.active ? 600 : 400, whiteSpace: 'nowrap' }}>{s.label}</span>
              </div>
              {i < 3 && <div style={{ flex: 1, height: 1, background: 'var(--border)', margin: '0 8px' }} />}
            </div>
          ))}
        </div>

        {/* ─── STEP 1: FORM ─── */}
        {step === 'form' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>Check Out Key</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>Step 1 of 3 — fill in the key details</div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Site ID *</label>
              <input style={inp} placeholder="e.g. P0132" value={form.site_id} onChange={e => set('site_id', e.target.value)} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Engineer *</label>
              {profile?.role === 'engineer' ? (
                <input style={{ ...inp, background: 'var(--bg3)', color: 'var(--text2)' }} value={form.engineer_name} readOnly />
              ) : (
                <select style={inp} value={selectedEngineerId}
                  onChange={e => {
                    const eng = engineers.find(en => en.id === e.target.value)
                    setSelectedEngineerId(e.target.value)
                    set('engineer_name', eng?.full_name ?? '')
                  }}>
                  <option value="">— Select engineer —</option>
                  {engineers.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                  <option value="__manual">Enter manually…</option>
                </select>
              )}
              {(selectedEngineerId === '__manual' || (profile?.role !== 'engineer' && !selectedEngineerId)) && (
                <input style={{ ...inp, marginTop: 8 }} placeholder="Engineer full name" value={form.engineer_name} onChange={e => set('engineer_name', e.target.value)} />
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div><label style={lbl}>Date Out</label><input style={inp} type="date" value={form.date_out} onChange={e => set('date_out', e.target.value)} /></div>
              <div><label style={lbl}>Time Out</label><input style={inp} type="time" value={form.time_out} onChange={e => set('time_out', e.target.value)} /></div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Notes (optional)</label>
              <input style={inp} placeholder="Any remarks…" value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>

            {formError && <div style={{ padding: '8px 12px', background: 'var(--red-bg)', border: '1px solid rgba(242,100,100,0.3)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--red)', marginBottom: 14 }}>{formError}</div>}

            <div style={{ padding: '10px 14px', background: 'rgba(245,166,35,0.06)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--text2)', marginBottom: 18, display: 'flex', gap: 8 }}>
              <span>🔒</span>
              <span>After clicking Next, the engineer will show their <strong style={{ color: 'var(--amber)' }}>live QR badge</strong> for scanning to confirm they received the key.</span>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 'var(--radius)', background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={goToQRStep} style={{ padding: '9px 22px', borderRadius: 'var(--radius)', background: 'var(--amber)', border: 'none', color: '#0f1117', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Next: Engineer QR →
              </button>
            </div>
          </>
        )}

        {/* ─── STEP 2: QR DISPLAY — Engineer shows their live QR ─── */}
        {step === 'qr_display' && (
          <>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>Engineer: Show Your QR Badge</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>Step 2 of 3 — hold this up for the NOC to scan</div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Engineer QR" style={{ width: 200, height: 200, borderRadius: 10, border: `2px solid ${urgency}`, display: 'block', transition: 'border-color 0.5s' }} />
                ) : (
                  <div style={{ width: 200, height: 200, borderRadius: 10, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>Generating…</div>
                )}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 40, height: 40, borderRadius: '50%', background: 'var(--bg2)', border: `3px solid ${urgency}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: urgency, transition: 'all 0.5s' }}>
                  {initials}
                </div>
              </div>

              <div style={{ marginTop: 12, fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{form.engineer_name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Site: <span style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>{form.site_id.toUpperCase()}</span></div>

              {/* Countdown */}
              <div style={{ margin: '14px auto 0', maxWidth: 220 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>Code expires in</span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: urgency, transition: 'color 0.5s' }}>
                    {String(Math.floor(secsLeft / 60)).padStart(2, '0')}:{String(secsLeft % 60).padStart(2, '0')}
                  </span>
                </div>
                <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: urgency, borderRadius: 2, transition: 'width 1s linear, background 0.5s' }} />
                </div>
              </div>
            </div>

            <div style={{ padding: '10px 14px', background: 'rgba(45,212,170,0.06)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--text2)', marginBottom: 18 }}>
              📷 <strong style={{ color: 'var(--text)' }}>NOC Analyst:</strong> Once the engineer is showing their QR code above, click &quot;Scan QR Code&quot; below and point the camera at their screen.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep('form')} style={{ flex: 1, padding: '9px 0', borderRadius: 'var(--radius)', background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>← Back</button>
              <button onClick={() => setStep('qr_scan')} style={{ flex: 2, padding: '9px 0', borderRadius: 'var(--radius)', background: 'var(--teal)', border: 'none', color: '#0f1117', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                📷 Scan QR Code
              </button>
            </div>
          </>
        )}

        {/* ─── STEP 3: SCAN — NOC scans the engineer's phone ─── */}
        {step === 'qr_scan' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>Scan Engineer&apos;s QR Badge</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>Step 3 of 3 — point camera at <strong style={{ color: 'var(--amber)' }}>{form.engineer_name}</strong>&apos;s screen</div>
            </div>

            <div id="checkout-qr-scanner" style={{ width: '100%', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--bg3)', minHeight: 260 }} />

            {saving && <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 13, color: 'var(--teal)' }}>✓ QR verified — saving record…</div>}
            {scanError && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--red-bg)', border: '1px solid rgba(242,100,100,0.3)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--red)' }}>
                {scanError}
                {scanError.includes('expired') && <div style={{ marginTop: 6, color: 'var(--text2)' }}>Ask the engineer to refresh their QR on the Engineers page.</div>}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => { scannerStopRef.current?.().catch(() => {}); setStep('qr_display') }}
                style={{ flex: 1, padding: '9px 0', borderRadius: 'var(--radius)', background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>← Back</button>
            </div>
          </>
        )}

        {/* ─── STEP 4: SUCCESS ─── */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--teal)', marginBottom: 8 }}>Key Checked Out</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
              Site <span style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>{form.site_id.toUpperCase()}</span> key issued to{' '}
              <strong style={{ color: 'var(--text)' }}>{form.engineer_name}</strong>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>
              QR-confirmed · {form.date_out} at {form.time_out}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
