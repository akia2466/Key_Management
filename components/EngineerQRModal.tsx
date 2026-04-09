'use client'
import { useEffect, useState, useCallback } from 'react'
import { buildQRPayload, secondsUntilNextWindow, WINDOW_MINUTES } from '@/lib/qrWindow'

type Props = {
  engineerName: string
  onClose: () => void
}

export default function EngineerQRModal({ engineerName, onClose }: Props) {
  const [dataUrl, setDataUrl] = useState<string>('')
  const [secsLeft, setSecsLeft] = useState(secondsUntilNextWindow())
  const [windowNum, setWindowNum] = useState(0) // increments to force QR re-render

  const initials = engineerName
    .split(/[\s.()]+/).filter(Boolean).slice(0, 2)
    .map(w => w[0].toUpperCase()).join('')

  // Regenerate QR image whenever window changes
  const generateQR = useCallback(async () => {
    const QRCode = (await import('qrcode')).default
    const payload = buildQRPayload(engineerName)
    const url = await QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      color: { dark: '#e8eaf0', light: '#1e2333' },
      errorCorrectionLevel: 'H',
    })
    setDataUrl(url)
  }, [engineerName])

  // Initial generation
  useEffect(() => { generateQR() }, [generateQR, windowNum])

  // Countdown timer — ticks every second, triggers regen at 0
  useEffect(() => {
    const interval = setInterval(() => {
      const s = secondsUntilNextWindow()
      setSecsLeft(s)
      // When a new window starts, bump windowNum to trigger QR regen
      if (s >= WINDOW_MINUTES * 60 - 1) {
        setWindowNum(n => n + 1)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Colour shifts as expiry approaches
  const urgency = secsLeft <= 30 ? 'var(--red)' : secsLeft <= 60 ? 'var(--amber)' : 'var(--teal)'
  const pct = (secsLeft / (WINDOW_MINUTES * 60)) * 100

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-lg)', padding: 32, width: 380, maxWidth: '95vw', textAlign: 'center' }} className="fade-in">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, textAlign: 'left' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>Engineer QR Badge</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
              Rotating code · refreshes every {WINDOW_MINUTES} minutes
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 22, lineHeight: 1, cursor: 'pointer' }}>×</button>
        </div>

        {/* Security badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'rgba(45,212,170,0.1)', border: '1px solid rgba(45,212,170,0.25)', fontSize: 11, color: 'var(--teal)', marginBottom: 18 }}>
          🔒 Time-locked · expires with countdown below
        </div>

        {/* QR Code */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`QR badge for ${engineerName}`}
              style={{ width: 220, height: 220, borderRadius: 12, border: `2px solid ${urgency}`, display: 'block', transition: 'border-color 0.5s' }}
            />
          ) : (
            <div style={{ width: 220, height: 220, borderRadius: 12, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>
              Generating…
            </div>
          )}
          {/* Initials overlay */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 46, height: 46, borderRadius: '50%',
            background: 'var(--bg2)', border: `3px solid ${urgency}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: urgency, transition: 'all 0.5s',
          }}>
            {initials}
          </div>
        </div>

        {/* Engineer name */}
        <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)', marginBottom: 2 }}>{engineerName}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 20, fontFamily: 'var(--font-mono)' }}>NOC Field Engineer</div>

        {/* Countdown + progress bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>Code expires in</span>
            <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: urgency, transition: 'color 0.5s' }}>
              {String(Math.floor(secsLeft / 60)).padStart(2, '0')}:{String(secsLeft % 60).padStart(2, '0')}
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              width: `${pct}%`,
              background: urgency,
              transition: 'width 1s linear, background 0.5s',
            }} />
          </div>
          {secsLeft <= 30 && (
            <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 6, fontWeight: 500 }}>
              ⚠ Code about to refresh — a new one will appear automatically
            </div>
          )}
        </div>

        {/* Security explanation */}
        <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '12px 14px', fontSize: 12, color: 'var(--text2)', textAlign: 'left', marginBottom: 20, lineHeight: 1.8 }}>
          <div style={{ fontWeight: 500, color: 'var(--amber)', marginBottom: 4 }}>🔐 How security works</div>
          <div>① This code changes every {WINDOW_MINUTES} minutes — screenshots expire quickly</div>
          <div>② The NOC scanner verifies the time-window embedded in the code</div>
          <div>③ Old or duplicate images will be rejected automatically</div>
          <div>④ Keep this screen open and present it live when returning keys</div>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          style={{ width: '100%', padding: '10px 0', borderRadius: 'var(--radius)', background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
