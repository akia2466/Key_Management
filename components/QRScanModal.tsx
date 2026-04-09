'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase, KeyRecord } from '@/lib/supabase'
import { formatDuration, parseDT } from '@/lib/utils'
import { validateQRPayload } from '@/lib/qrWindow'

type ScanState = 'scanning' | 'found' | 'expired' | 'error' | 'success'

type Props = {
  activeRecords: KeyRecord[]
  onClose: () => void
  onSuccess: () => void
}

export default function QRScanModal({ activeRecords, onClose, onSuccess }: Props) {
  const [state, setState] = useState<ScanState>('scanning')
  const [engineerName, setEngineerName] = useState('')
  const [engineerKeys, setEngineerKeys] = useState<KeyRecord[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [dateIn] = useState(new Date().toISOString().slice(0, 10))
  const [timeIn] = useState(new Date().toTimeString().slice(0, 5))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [camError, setCamError] = useState('')
  const [expiredReason, setExpiredReason] = useState('')
  const scannerStopRef = useRef<() => Promise<void>>()

  useEffect(() => {
    let cancelled = false
    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        const qr = new Html5Qrcode('qr-reader-modal')
        scannerStopRef.current = () => qr.stop()

        await qr.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (text) => {
            if (cancelled) return
            const result = validateQRPayload(text)
            if (result.valid && result.name) {
              qr.stop().catch(() => {})
              const name = result.name
              setEngineerName(name)
              const keys = activeRecords.filter(
                r => r.engineer_name.toLowerCase() === name.toLowerCase()
              )
              setEngineerKeys(keys)
              setSelectedIds(new Set(keys.map(r => r.id)))
              setState('found')
            } else if (result.reason?.includes('expired')) {
              qr.stop().catch(() => {})
              setExpiredReason(result.reason ?? '')
              setState('expired')
            } else if (result.reason) {
              // non-NOC QR — just show brief message, keep scanning
              setCamError(result.reason)
            }
          },
          () => {}
        )
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        setCamError('Camera unavailable: ' + msg)
        setState('error')
      }
    }
    startScanner()
    return () => {
      cancelled = true
      scannerStopRef.current?.().catch(() => {})
    }
  }, [activeRecords])

  const toggleKey = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const confirmReturn = async () => {
    if (selectedIds.size === 0) { setError('Select at least one key to return.'); return }
    setSaving(true); setError('')
    const results = await Promise.all(
      Array.from(selectedIds).map(id =>
        supabase.from('key_records').update({ date_in: dateIn, time_in: timeIn }).eq('id', id)
      )
    )
    setSaving(false)
    if (results.some(r => r.error)) { setError('Some updates failed. Please try again.'); return }
    setState('success')
    setTimeout(() => onSuccess(), 1800)
  }

  const now = Date.now()

  const td: React.CSSProperties = { padding: '11px 16px', verticalAlign: 'middle', fontSize: 13 }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-lg)', padding: 28, width: 500, maxWidth: '95vw' }} className="fade-in">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>
              {state === 'scanning' && '📷 Scan Engineer QR Badge'}
              {state === 'found'   && '✅ Engineer Verified'}
              {state === 'expired' && '⏱ QR Code Expired'}
              {state === 'error'   && '⚠ Camera Error'}
              {state === 'success' && '🎉 Keys Returned'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
              {state === 'scanning' && 'Point camera at the engineer\'s live QR badge'}
              {state === 'found'    && 'Confirm keys to return'}
              {state === 'expired'  && 'Engineer must refresh their QR code'}
              {state === 'error'    && 'Could not access camera'}
              {state === 'success'  && 'Records updated in Supabase'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 22, lineHeight: 1, cursor: 'pointer' }}>×</button>
        </div>

        {/* SCANNING */}
        {state === 'scanning' && (
          <>
            <div id="qr-reader-modal" style={{ width: '100%', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--bg3)', minHeight: 280 }} />
            {camError && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--red-bg)', border: '1px solid rgba(242,100,100,0.3)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--red)' }}>
                {camError}
              </div>
            )}
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(45,212,170,0.06)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 8 }}>
              <span>🔒</span>
              <span>Only <strong style={{ color: 'var(--teal)' }}>live, unexpired</strong> QR codes are accepted. Screenshots and saved images older than 5 minutes will be rejected.</span>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
              No QR code?{' '}
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--amber)', cursor: 'pointer', fontSize: 12 }}>Use manual return →</button>
            </div>
          </>
        )}

        {/* EXPIRED */}
        {state === 'expired' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⏱</div>
            <div style={{ fontWeight: 600, color: 'var(--amber)', fontSize: 15, marginBottom: 8 }}>QR Code Expired</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>{expiredReason}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 24, lineHeight: 1.7 }}>
              The engineer should open the <strong style={{ color: 'var(--text)' }}>Engineers</strong> page in the NOC app,<br />
              click their <strong style={{ color: 'var(--amber)' }}>QR Code</strong> button, and show the live code on-screen.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setCamError(''); setState('scanning') }}
                style={{ flex: 1, padding: '9px 0', borderRadius: 'var(--radius)', background: 'var(--teal)', border: 'none', color: '#0f1117', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Try Again
              </button>
              <button onClick={onClose}
                style={{ flex: 1, padding: '9px 0', borderRadius: 'var(--radius)', background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>
                Manual Return
              </button>
            </div>
          </div>
        )}

        {/* FOUND */}
        {state === 'found' && (
          <>
            {/* Identity card */}
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, border: '1px solid rgba(45,212,170,0.3)' }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--teal-bg)', border: '2px solid var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'var(--teal)', flexShrink: 0 }}>
                {engineerName.split(/[\s.()]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{engineerName}</div>
                <div style={{ fontSize: 12, color: 'var(--teal)', marginTop: 2 }}>✓ Identity verified · live QR (not a screenshot)</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{dateIn} · {timeIn}</div>
              </div>
            </div>

            {/* Keys list */}
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 8 }}>
              Select keys to return ({engineerKeys.length} found for this engineer):
            </div>

            {engineerKeys.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 13, background: 'var(--bg3)', borderRadius: 'var(--radius)', marginBottom: 16 }}>
                No active keys found for {engineerName}
              </div>
            ) : (
              <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {engineerKeys.map(r => {
                  const ms = now - parseDT(r.date_out, r.time_out).getTime()
                  const overdue = ms > 8 * 3600000
                  const selected = selectedIds.has(r.id)
                  return (
                    <div key={r.id} onClick={() => toggleKey(r.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 'var(--radius)', border: `1px solid ${selected ? 'rgba(45,212,170,0.4)' : 'var(--border)'}`, background: selected ? 'rgba(45,212,170,0.06)' : 'var(--bg3)', cursor: 'pointer', transition: 'all 0.15s' }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, border: `2px solid ${selected ? 'var(--teal)' : 'var(--border2)'}`, background: selected ? 'var(--teal)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#0f1117' }}>
                        {selected && '✓'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--amber)', background: 'var(--amber-bg)', padding: '1px 7px', borderRadius: 12 }}>{r.site_id}</span>
                          {overdue && <span style={{ fontSize: 10, color: 'var(--amber)', background: 'var(--amber-bg)', padding: '1px 6px', borderRadius: 10 }}>Overdue</span>}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
                          Out since {r.date_out} {r.time_out} · <span style={{ color: overdue ? 'var(--amber)' : 'var(--text2)' }}>{formatDuration(ms)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Timestamp */}
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 12, color: 'var(--text2)', marginBottom: 14, display: 'flex', gap: 20 }}>
              <div><span style={{ color: 'var(--text3)' }}>Date In: </span><strong style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{dateIn}</strong></div>
              <div><span style={{ color: 'var(--text3)' }}>Time In: </span><strong style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{timeIn}</strong></div>
            </div>

            {error && <div style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--red-bg)', border: '1px solid rgba(242,100,100,0.3)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--red)' }}>{error}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '9px 0', borderRadius: 'var(--radius)', background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmReturn} disabled={saving || selectedIds.size === 0}
                style={{ flex: 2, padding: '9px 0', borderRadius: 'var(--radius)', background: 'var(--teal)', border: 'none', color: '#0f1117', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: (saving || selectedIds.size === 0) ? 0.6 : 1 }}>
                {saving ? 'Saving…' : `Confirm Return (${selectedIds.size} key${selectedIds.size !== 1 ? 's' : ''})`}
              </button>
            </div>
          </>
        )}

        {/* ERROR */}
        {state === 'error' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📵</div>
            <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>{camError}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20 }}>Ensure camera permission is granted and the site is on HTTPS.</div>
            <button onClick={onClose} style={{ padding: '9px 24px', borderRadius: 'var(--radius)', background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>
              Close — use manual return
            </button>
          </div>
        )}

        {/* SUCCESS */}
        {state === 'success' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>✅</div>
            <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--teal)', marginBottom: 6 }}>Keys Returned Successfully</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>
              {selectedIds.size} key{selectedIds.size !== 1 ? 's' : ''} logged back to NOC at {timeIn}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
