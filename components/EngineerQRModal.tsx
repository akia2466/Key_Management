'use client'
import { useEffect, useRef, useState } from 'react'

type Props = {
  engineerName: string
  onClose: () => void
}

export default function EngineerQRModal({ engineerName, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dataUrl, setDataUrl] = useState<string>('')

  // QR payload — encodes engineer identity
  const payload = JSON.stringify({
    type: 'noc_engineer',
    name: engineerName,
    // stable hash so the same engineer always gets the same code
    id: `eng_${engineerName.toLowerCase().replace(/\s+/g, '_')}`,
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const QRCode = (await import('qrcode')).default
      const url = await QRCode.toDataURL(payload, {
        width: 280,
        margin: 2,
        color: { dark: '#e8eaf0', light: '#1e2333' },
        errorCorrectionLevel: 'H',
      })
      if (!cancelled) setDataUrl(url)
    })()
    return () => { cancelled = true }
  }, [payload])

  const download = () => {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `NOC-QR-${engineerName.replace(/\s+/g, '-')}.png`
    a.click()
  }

  const initials = engineerName.split(/[\s.]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-lg)', padding: 32, width: 360, maxWidth: '95vw', textAlign: 'center' }} className="fade-in">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, textAlign: 'left' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>Engineer QR Code</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>Show or scan this to return a key</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 22, lineHeight: 1, cursor: 'pointer' }}>×</button>
        </div>

        {/* QR + avatar */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`QR code for ${engineerName}`}
              style={{ width: 220, height: 220, borderRadius: 12, border: '1px solid var(--border2)', display: 'block' }}
            />
          ) : (
            <div style={{ width: 220, height: 220, borderRadius: 12, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>
              Generating…
            </div>
          )}
          {/* Centred logo overlay */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 44, height: 44, borderRadius: '50%',
            background: 'var(--bg2)', border: '2px solid var(--amber)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'var(--amber)',
          }}>
            {initials}
          </div>
        </div>

        {/* Name tag */}
        <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>{engineerName}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 24, fontFamily: 'var(--font-mono)' }}>
          NOC Field Engineer · Key Access ID
        </div>

        {/* Instructions */}
        <div style={{
          background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '12px 16px',
          fontSize: 12, color: 'var(--text2)', textAlign: 'left', marginBottom: 20, lineHeight: 1.7,
        }}>
          <div style={{ fontWeight: 500, color: 'var(--amber)', marginBottom: 6 }}>How to use</div>
          <div>① Download or screenshot this QR code</div>
          <div>② When returning a key, the NOC Analyst clicks <strong style={{ color: 'var(--text)' }}>Scan to Return</strong></div>
          <div>③ Hold your QR code up to the camera</div>
          <div>④ The return form auto-fills with your name &amp; timestamp</div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px 0', borderRadius: 'var(--radius)', background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>
            Close
          </button>
          <button
            onClick={download}
            disabled={!dataUrl}
            style={{ flex: 2, padding: '9px 0', borderRadius: 'var(--radius)', background: 'var(--amber)', border: 'none', color: '#0f1117', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: dataUrl ? 1 : 0.5 }}
          >
            ↓ Download QR Code
          </button>
        </div>
      </div>
    </div>
  )
}
