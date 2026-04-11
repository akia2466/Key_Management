'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { validateQRPayload, secondsUntilNextWindow, WINDOW_MINUTES } from '@/lib/qrWindow'

// Step 1: Fill Site ID + Reason
// Step 2: Engineer scans their QR → name, date, time auto-captured
// Step 3: Success

type Step = 'form' | 'scanning' | 'confirmed' | 'success'

const REASONS = [
  'Corrective Maintenance',
  'Preventive Maintenance',
]

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  background: 'var(--bg)', border: '1px solid var(--border2)',
  borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 13, outline: 'none',
}
const lbl: React.CSSProperties = {
  fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6,
}

export default function CheckoutModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [step, setStep] = useState<Step>('form')

  // Step 1 — only these two fields filled by user
  const [siteId, setSiteId]   = useState('')
  const [reason, setReason]   = useState(REASONS[0])
  const [formError, setFormError] = useState('')

  // Step 2 — captured automatically from QR scan
  const [engineerName, setEngineerName]   = useState('')
  const [engineerId, setEngineerId]       = useState<string | null>(null)
  const [capturedDate, setCapturedDate]   = useState('')
  const [capturedTime, setCapturedTime]   = useState('')

  // QR scanner state
  const [scanError, setScanError]         = useState('')
  const [scannerReady, setScannerReady]   = useState(false)
  const scannerStopRef = useRef<(() => Promise<void>) | null>(null)

  // Saving
  const [saving, setSaving] = useState(false)

  // ── Step indicator progress ──────────────────────────────
  const steps = [
    { n: 1, label: 'Site & Reason' },
    { n: 2, label: 'Engineer Scans QR' },
    { n: 3, label: 'Done' },
  ]
  const currentStep = step === 'form' ? 1 : step === 'scanning' || step === 'confirmed' ? 2 : 3

  // ── Start QR scanner when entering scanning step ─────────
  useEffect(() => {
    if (step !== 'scanning') return
    let cancelled = false

    const start = async () => {
      setScanError('')
      setScannerReady(false)
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        const qr = new Html5Qrcode('checkout-scanner')
        scannerStopRef.current = () => qr.stop().catch(() => {})

        await qr.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          async (text) => {
            if (cancelled) return
            const result = validateQRPayload(text)

            if (!result.valid) {
              setScanError(result.reason ?? 'Invalid QR code.')
              return
            }

            // QR is valid — capture everything from it
            await qr.stop().catch(() => {})
            if (cancelled) return

            const now = new Date()
            const dateStr = now.toISOString().slice(0, 10)
            const timeStr = now.toTimeString().slice(0, 5)

            setEngineerName(result.name!)
            setCapturedDate(dateStr)
            setCapturedTime(timeStr)

            // Look up engineer's profile ID
            const { data: profileData } = await supabase
              .from('profiles')
              .select('id')
              .eq('full_name', result.name!)
              .single()
            setEngineerId(profileData?.id ?? null)

            setStep('confirmed')
          },
          () => {} // ignore per-frame decode errors
        )
        if (!cancelled) setScannerReady(true)
      } catch (e: unknown) {
        if (!cancelled) setScanError('Camera unavailable: ' + (e instanceof Error ? e.message : String(e)))
      }
    }

    start()
    return () => {
      cancelled = true
      scannerStopRef.current?.()
    }
  }, [step])

  // ── Save to Supabase ─────────────────────────────────────
  const saveRecord = async () => {
    setSaving(true)
    const { error } = await supabase.from('key_records').insert([{
      site_id:               siteId.toUpperCase().trim(),
      engineer_name:         engineerName,
      engineer_id:           engineerId,
      checkout_confirmed_by: engineerId,   // engineer's own QR confirmed the checkout
      date_out:              capturedDate,
      time_out:              capturedTime,
      notes:                 reason,
    }])
    setSaving(false)
    if (error) { setScanError('Save failed: ' + error.message); setStep('scanning'); return }
    setStep('success')
    setTimeout(() => onSuccess(), 2000)
  }

  // ── Go to scanner ────────────────────────────────────────
  const goToScan = () => {
    if (!siteId.trim()) { setFormError('Site ID is required.'); return }
    setFormError('')
    setStep('scanning')
  }

  // ── Reset scanner and go back ─────────────────────────────
  const goBack = () => {
    scannerStopRef.current?.()
    setScanError('')
    setScannerReady(false)
    setStep('form')
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => e.target === e.currentTarget && step === 'form' && onClose()}
    >
      <div
        style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-lg)', padding: 28, width: 460, maxWidth: '95vw' }}
        className="fade-in"
      >

        {/* ── Step progress bar ── */}
        {step !== 'success' && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
            {steps.map((s, i) => {
              const done   = currentStep > s.n
              const active = currentStep === s.n
              return (
                <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, flexShrink: 0,
                      background: done ? 'var(--teal)' : active ? 'var(--amber)' : 'var(--bg3)',
                      color: done || active ? '#0f1117' : 'var(--text3)',
                      border: done || active ? 'none' : '1px solid var(--border)',
                      transition: 'all 0.3s',
                    }}>
                      {done ? '✓' : s.n}
                    </div>
                    <span style={{
                      fontSize: 11, whiteSpace: 'nowrap',
                      color: active ? 'var(--amber)' : done ? 'var(--teal)' : 'var(--text3)',
                      fontWeight: active ? 600 : 400,
                    }}>
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ flex: 1, height: 1, margin: '0 8px', background: done ? 'var(--teal)' : 'var(--border)', transition: 'background 0.3s' }} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════
            STEP 1 — Site ID + Reason
        ══════════════════════════════════════════ */}
        {step === 'form' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>Check Out Key</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
                  Fill in the site details — the engineer will scan their QR next
                </div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 22, lineHeight: 1, cursor: 'pointer' }}>×</button>
            </div>

            {/* Site ID */}
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Site ID *</label>
              <input
                style={inp}
                placeholder="e.g. P0132"
                value={siteId}
                onChange={e => setSiteId(e.target.value)}
                autoFocus
              />
            </div>

            {/* Reason */}
            <div style={{ marginBottom: 24 }}>
              <label style={lbl}>Reason *</label>
              <select
                style={{ ...inp, cursor: 'pointer' }}
                value={reason}
                onChange={e => setReason(e.target.value)}
              >
                {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Info box */}
            <div style={{
              padding: '12px 14px', background: 'rgba(245,166,35,0.07)',
              border: '1px solid rgba(245,166,35,0.2)', borderRadius: 'var(--radius)',
              fontSize: 12, color: 'var(--text2)', marginBottom: 22, lineHeight: 1.8,
            }}>
              <div style={{ fontWeight: 600, color: 'var(--amber)', marginBottom: 4 }}>What happens next</div>
              <div>① The engineer opens their <strong style={{ color: 'var(--text)' }}>QR Badge</strong> on their phone</div>
              <div>② They scan it using the camera on the next screen</div>
              <div>③ Their name, date &amp; time are <strong style={{ color: 'var(--teal)' }}>captured automatically</strong></div>
            </div>

            {formError && (
              <div style={{ padding: '8px 12px', background: 'var(--red-bg)', border: '1px solid rgba(242,100,100,0.3)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--red)', marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 'var(--radius)', background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={goToScan} style={{ padding: '9px 24px', borderRadius: 'var(--radius)', background: 'var(--amber)', border: 'none', color: '#0f1117', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Next: Scan QR →
              </button>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════
            STEP 2 — Engineer scans their QR
        ══════════════════════════════════════════ */}
        {step === 'scanning' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>Engineer: Scan Your QR Badge</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
                Point the camera at the engineer&apos;s live QR code
              </div>
            </div>

            {/* Site summary */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
              <div style={{ flex: 1, padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius)', fontSize: 12 }}>
                <div style={{ color: 'var(--text3)', marginBottom: 3 }}>Site ID</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--amber)', fontSize: 14 }}>{siteId.toUpperCase()}</div>
              </div>
              <div style={{ flex: 1, padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius)', fontSize: 12 }}>
                <div style={{ color: 'var(--text3)', marginBottom: 3 }}>Reason</div>
                <div style={{ fontWeight: 500, color: 'var(--text)', fontSize: 12 }}>{reason}</div>
              </div>
            </div>

            {/* Camera viewfinder */}
            <div
              id="checkout-scanner"
              style={{ width: '100%', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--bg3)', minHeight: 280, position: 'relative' }}
            />

            {!scannerReady && !scanError && (
              <div style={{ textAlign: 'center', padding: '10px 0', fontSize: 12, color: 'var(--text3)' }}>
                Starting camera…
              </div>
            )}

            {scannerReady && !scanError && (
              <div style={{ textAlign: 'center', marginTop: 10, padding: '8px 12px', background: 'rgba(45,212,170,0.07)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--teal)' }}>
                🔒 Only live QR codes accepted — expired screenshots will be rejected
              </div>
            )}

            {scanError && (
              <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--red-bg)', border: '1px solid rgba(242,100,100,0.3)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--red)' }}>
                {scanError}
                {scanError.includes('expired') && (
                  <div style={{ marginTop: 6, color: 'var(--text2)' }}>
                    Ask the engineer to open their <strong>My QR Badge</strong> page to get a fresh code.
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <button onClick={goBack} style={{ padding: '9px 18px', borderRadius: 'var(--radius)', background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>
                ← Back
              </button>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════
            STEP 2b — QR confirmed, show summary before saving
        ══════════════════════════════════════════ */}
        {step === 'confirmed' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>Confirm Key Checkout</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
                QR verified — review details and confirm
              </div>
            </div>

            {/* Verified engineer */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', background: 'var(--bg3)',
              border: '1px solid rgba(45,212,170,0.35)', borderRadius: 'var(--radius)',
              marginBottom: 16,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                background: 'var(--teal-bg)', border: '2px solid var(--teal)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, color: 'var(--teal)',
              }}>
                {engineerName.split(/[\s.()]+/).filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join('')}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{engineerName}</div>
                <div style={{ fontSize: 12, color: 'var(--teal)', marginTop: 2 }}>✓ Identity verified via live QR</div>
              </div>
            </div>

            {/* Summary grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Site ID',    value: siteId.toUpperCase(),            mono: true,  accent: 'var(--amber)' },
                { label: 'Reason',     value: reason,                          mono: false, accent: 'var(--text)' },
                { label: 'Date Out',   value: capturedDate,                    mono: true,  accent: 'var(--text)' },
                { label: 'Time Out',   value: capturedTime,                    mono: true,  accent: 'var(--teal)' },
              ].map(item => (
                <div key={item.label} style={{ padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{item.label}</div>
                  <div style={{
                    fontSize: 14, fontWeight: 600, color: item.accent,
                    fontFamily: item.mono ? 'var(--font-mono)' : 'var(--font-sans)',
                  }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {scanError && (
              <div style={{ padding: '8px 12px', background: 'var(--red-bg)', border: '1px solid rgba(242,100,100,0.3)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--red)', marginBottom: 14 }}>
                {scanError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setScanError(''); setStep('scanning') }}
                style={{ flex: 1, padding: '10px 0', borderRadius: 'var(--radius)', background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}
              >
                ← Re-scan
              </button>
              <button
                onClick={saveRecord}
                disabled={saving}
                style={{ flex: 2, padding: '10px 0', borderRadius: 'var(--radius)', background: 'var(--teal)', border: 'none', color: '#0f1117', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving…' : '✓ Confirm Check-Out'}
              </button>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════
            STEP 3 — Success
        ══════════════════════════════════════════ */}
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
