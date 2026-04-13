'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { validateQRPayload, secondsUntilNextWindow, WINDOW_MINUTES } from '@/lib/qrWindow'

type Step = 'form' | 'scanning' | 'confirmed' | 'success'

const REASONS = ['Corrective Maintenance', 'Preventive Maintenance']

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  background: 'var(--bg)', border: '1px solid var(--border2)',
  borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 13, outline: 'none',
}
const lbl: React.CSSProperties = { fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }

export default function CheckoutModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep]           = useState<Step>('form')
  const [siteId, setSiteId]       = useState('')
  const [reason, setReason]       = useState(REASONS[0])
  const [formError, setFormError] = useState('')

  // Captured from QR
  const [engineerName, setEngineerName]   = useState('')
  const [engineerId, setEngineerId]       = useState<string | null>(null)
  const [capturedDate, setCapturedDate]   = useState('')
  const [capturedTime, setCapturedTime]   = useState('')

  const [scanError, setScanError]   = useState('')
  const [scannerReady, setScannerReady] = useState(false)
  const [saving, setSaving]         = useState(false)

  // Keep a ref to the Html5Qrcode instance — never stored in state
  const qrInstanceRef   = useRef<{ stop: () => Promise<void> } | null>(null)
  const scannerMounted  = useRef(false)
  const stepRef         = useRef<Step>('form')

  // Always keep stepRef in sync so callbacks can read the current step
  useEffect(() => { stepRef.current = step }, [step])

  // ── Safely stop the scanner ──────────────────────────────
  const stopScanner = useCallback(async () => {
    if (qrInstanceRef.current) {
      try { await qrInstanceRef.current.stop() } catch { /* already stopped */ }
      qrInstanceRef.current = null
    }
  }, [])

  // ── Start scanner when step becomes 'scanning' ───────────
  useEffect(() => {
    if (step !== 'scanning') return

    let active = true
    setScanError('')
    setScannerReady(false)

    const startScanner = async () => {
      // Small delay to ensure the DOM element is rendered
      await new Promise(r => setTimeout(r, 150))
      if (!active) return

      const el = document.getElementById('checkout-scanner-view')
      if (!el) { setScanError('Camera container not found. Please try again.'); return }

      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (!active) return

        const qr = new Html5Qrcode('checkout-scanner-view')
        qrInstanceRef.current = qr

        await qr.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          async (text) => {
            // Only process if we are still on scanning step
            if (stepRef.current !== 'scanning') return

            const result = validateQRPayload(text)
            if (!result.valid) {
              setScanError(result.reason ?? 'Invalid QR code.')
              return
            }

            // Valid — stop scanner first, then update state
            await stopScanner()
            if (!active) return

            const now = new Date()
            const dateStr = now.toISOString().slice(0, 10)
            const timeStr = now.toTimeString().slice(0, 5)

            setEngineerName(result.name!)
            setCapturedDate(dateStr)
            setCapturedTime(timeStr)

            // Look up profile ID
            const { data } = await supabase
              .from('profiles').select('id').eq('full_name', result.name!).single()
            setEngineerId(data?.id ?? null)

            setStep('confirmed')
          },
          () => {} // ignore per-frame errors
        )

        if (active) setScannerReady(true)
      } catch (e: unknown) {
        if (active) setScanError('Camera unavailable: ' + (e instanceof Error ? e.message : String(e)))
      }
    }

    startScanner()

    return () => {
      active = false
      stopScanner()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // ── Cleanup on unmount ───────────────────────────────────
  useEffect(() => {
    return () => { stopScanner() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Save record ──────────────────────────────────────────
  const saveRecord = async () => {
    setSaving(true)
    const { error } = await supabase.from('key_records').insert([{
      site_id:               siteId.toUpperCase().trim(),
      engineer_name:         engineerName,
      engineer_id:           engineerId,
      checkout_confirmed_by: engineerId,
      date_out:              capturedDate,
      time_out:              capturedTime,
      notes:                 reason,
    }])
    setSaving(false)
    if (error) { setScanError('Save failed: ' + error.message); return }
    setStep('success')
    setTimeout(() => onSuccess(), 2000)
  }

  const goToScan = () => {
    if (!siteId.trim()) { setFormError('Site ID is required.'); return }
    setFormError('')
    setScanError('')
    setStep('scanning')
  }

  const goBack = async () => {
    await stopScanner()
    setScanError('')
    setScannerReady(false)
    setEngineerName('')
    setEngineerId(null)
    setStep('form')
  }

  const goRescan = async () => {
    await stopScanner()
    setScanError('')
    setScannerReady(false)
    setEngineerName('')
    setEngineerId(null)
    // Brief pause then restart
    setTimeout(() => setStep('scanning'), 50)
  }

  // Step indicator
  const STEPS = [
    { n: 1, label: 'Site & Reason' },
    { n: 2, label: 'Engineer Scans QR' },
    { n: 3, label: 'Done' },
  ]
  const currentStep = step === 'form' ? 1 : step === 'scanning' || step === 'confirmed' ? 2 : 3

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => { if (e.target === e.currentTarget && step === 'form') onClose() }}
    >
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-lg)', padding: 28, width: 460, maxWidth: '95vw' }} className="fade-in">

        {/* Step bar */}
        {step !== 'success' && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
            {STEPS.map((s, i) => {
              const done   = currentStep > s.n
              const active = currentStep === s.n
              return (
                <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: done ? 'var(--teal)' : active ? 'var(--amber)' : 'var(--bg3)', color: done || active ? '#0f1117' : 'var(--text3)', border: done || active ? 'none' : '1px solid var(--border)', transition: 'all 0.3s' }}>
                      {done ? '✓' : s.n}
                    </div>
                    <span style={{ fontSize: 11, whiteSpace: 'nowrap', color: active ? 'var(--amber)' : done ? 'var(--teal)' : 'var(--text3)', fontWeight: active ? 600 : 400 }}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, margin: '0 8px', background: done ? 'var(--teal)' : 'var(--border)', transition: 'background 0.3s' }} />}
                </div>
              )
            })}
          </div>
        )}

        {/* ── STEP 1: FORM ── */}
        {step === 'form' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>Check Out Key</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>Fill in site details — engineer scans QR next</div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 22, lineHeight: 1, cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Site ID *</label>
              <input style={inp} placeholder="e.g. P0132" value={siteId} onChange={e => setSiteId(e.target.value)} autoFocus />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={lbl}>Reason *</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={reason} onChange={e => setReason(e.target.value)}>
                {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div style={{ padding: '12px 14px', background: 'rgba(245,166,35,0.07)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--text2)', marginBottom: 22, lineHeight: 1.8 }}>
              <div style={{ fontWeight: 600, color: 'var(--amber)', marginBottom: 4 }}>What happens next</div>
              <div>① The engineer opens their <strong style={{ color: 'var(--text)' }}>QR Badge</strong> on their phone</div>
              <div>② Camera scans it — name, date &amp; time captured <strong style={{ color: 'var(--teal)' }}>automatically</strong></div>
            </div>

            {formError && <div style={{ padding: '8px 12px', background: 'var(--red-bg)', border: '1px solid rgba(242,100,100,0.3)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--red)', marginBottom: 16 }}>{formError}</div>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 'var(--radius)', background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={goToScan} style={{ padding: '9px 24px', borderRadius: 'var(--radius)', background: 'var(--amber)', border: 'none', color: '#0f1117', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Next: Scan QR →</button>
            </div>
          </>
        )}

        {/* ── STEP 2: SCANNING ── */}
        {step === 'scanning' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>Engineer: Scan Your QR Badge</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>Point the camera at the engineer&apos;s live QR code</div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>Site ID</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--amber)', fontSize: 14 }}>{siteId.toUpperCase()}</div>
              </div>
              <div style={{ flex: 1, padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>Reason</div>
                <div style={{ fontWeight: 500, color: 'var(--text)', fontSize: 12 }}>{reason}</div>
              </div>
            </div>

            {/* Camera container — always rendered while step=scanning, never removed mid-scan */}
            <div id="checkout-scanner-view" style={{ width: '100%', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--bg3)', minHeight: 280 }} />

            {!scannerReady && !scanError && (
              <div style={{ textAlign: 'center', padding: '10px 0', fontSize: 12, color: 'var(--text3)' }}>Starting camera…</div>
            )}

            {scannerReady && !scanError && (
              <div style={{ textAlign: 'center', marginTop: 10, padding: '8px 12px', background: 'rgba(45,212,170,0.07)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--teal)' }}>
                🔒 Only live QR codes accepted — expired screenshots rejected
              </div>
            )}

            {scanError && (
              <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--red-bg)', border: '1px solid rgba(242,100,100,0.3)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--red)' }}>
                {scanError}
                {scanError.includes('expired') && <div style={{ marginTop: 6, color: 'var(--text2)' }}>Ask engineer to open <strong>My QR Badge</strong> for a fresh code.</div>}
              </div>
            )}

            <div style={{ marginTop: 14 }}>
              <button onClick={goBack} style={{ padding: '9px 18px', borderRadius: 'var(--radius)', background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>← Back</button>
            </div>
          </>
        )}

        {/* ── STEP 2b: CONFIRMED ── */}
        {step === 'confirmed' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>Confirm Key Checkout</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>QR verified — review details and confirm</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg3)', border: '1px solid rgba(45,212,170,0.35)', borderRadius: 'var(--radius)', marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, background: 'var(--teal-bg)', border: '2px solid var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'var(--teal)' }}>
                {engineerName.split(/[\s.()]+/).filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join('')}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{engineerName}</div>
                <div style={{ fontSize: 12, color: 'var(--teal)', marginTop: 2 }}>✓ Identity verified via live QR</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Site ID',  value: siteId.toUpperCase(), mono: true,  accent: 'var(--amber)' },
                { label: 'Reason',   value: reason,               mono: false, accent: 'var(--text)' },
                { label: 'Date Out', value: capturedDate,          mono: true,  accent: 'var(--text)' },
                { label: 'Time Out', value: capturedTime,          mono: true,  accent: 'var(--teal)' },
              ].map(item => (
                <div key={item.label} style={{ padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: item.accent, fontFamily: item.mono ? 'var(--font-mono)' : 'var(--font-sans)' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {scanError && <div style={{ padding: '8px 12px', background: 'var(--red-bg)', border: '1px solid rgba(242,100,100,0.3)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--red)', marginBottom: 14 }}>{scanError}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={goRescan} style={{ flex: 1, padding: '10px 0', borderRadius: 'var(--radius)', background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>← Re-scan</button>
              <button onClick={saveRecord} disabled={saving} style={{ flex: 2, padding: '10px 0', borderRadius: 'var(--radius)', background: 'var(--teal)', border: 'none', color: '#0f1117', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : '✓ Confirm Check-Out'}
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3: SUCCESS ── */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 18 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--teal)', marginBottom: 10 }}>Key Checked Out</div>
            <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 2 }}>
              <div>Site <span style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{siteId.toUpperCase()}</span></div>
              <div>Engineer: <strong style={{ color: 'var(--text)' }}>{engineerName}</strong></div>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text3)', fontSize: 12 }}>{capturedDate} · {capturedTime}</div>
            </div>
            <div style={{ marginTop: 14, fontSize: 12, color: 'var(--teal)', background: 'var(--teal-bg)', display: 'inline-block', padding: '4px 14px', borderRadius: 20 }}>
              QR-confirmed · {reason}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
