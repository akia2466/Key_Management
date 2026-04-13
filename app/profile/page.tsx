'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { buildQRPayload, secondsUntilNextWindow, WINDOW_MINUTES } from '@/lib/qrWindow'

export default function ProfilePage() {
  const { profile, loading, signOut } = useAuth()
  const router = useRouter()
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [secsLeft, setSecsLeft] = useState(secondsUntilNextWindow())
  const [windowNum, setWindowNum] = useState(0)

  useEffect(() => {
    if (!loading && !profile) router.replace('/login')
  }, [loading, profile, router])

  useEffect(() => {
    if (!profile) return
    let cancelled = false
    ;(async () => {
      const QRCode = (await import('qrcode')).default
      const url = await QRCode.toDataURL(buildQRPayload(profile.full_name), {
        width: 300, margin: 2,
        color: { dark: '#e8eaf0', light: '#1e2333' },
        errorCorrectionLevel: 'H',
      })
      if (!cancelled) setQrDataUrl(url)
    })()
    return () => { cancelled = true }
  }, [profile, windowNum])

  useEffect(() => {
    const interval = setInterval(() => {
      const s = secondsUntilNextWindow()
      setSecsLeft(s)
      if (s >= WINDOW_MINUTES * 60 - 1) setWindowNum(n => n + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading || !profile) return null

  const urgency = secsLeft <= 30 ? 'var(--red)' : secsLeft <= 60 ? 'var(--amber)' : 'var(--teal)'
  const pct = (secsLeft / (WINDOW_MINUTES * 60)) * 100
  const initials = profile.full_name.split(/[\s.()]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')

  return (
    <AppShell>
      <div style={{ padding: 'clamp(16px, 4vw, 32px) clamp(12px, 4vw, 28px)', flex: 1, display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>

        {/* Left: QR panel */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 32, textAlign: 'center', minWidth: 300, flex: '0 0 auto' }}>
          <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)', marginBottom: 4 }}>My QR Badge</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 22 }}>Show this when taking or returning a key</div>

          {/* Security pill */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'rgba(45,212,170,0.1)', border: '1px solid rgba(45,212,170,0.25)', fontSize: 11, color: 'var(--teal)', marginBottom: 20 }}>
            🔒 Rotating · expires every {WINDOW_MINUTES} min
          </div>

          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 18 }}>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="My QR Badge" style={{ width: 240, height: 240, borderRadius: 14, border: `3px solid ${urgency}`, display: 'block', transition: 'border-color 0.5s' }} />
            ) : (
              <div style={{ width: 240, height: 240, borderRadius: 14, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>Generating…</div>
            )}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 52, height: 52, borderRadius: '50%', background: 'var(--bg2)', border: `3px solid ${urgency}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: urgency, transition: 'all 0.5s' }}>
              {initials}
            </div>
          </div>

          <div style={{ fontWeight: 600, fontSize: 17, color: 'var(--text)', marginBottom: 2 }}>{profile.full_name}</div>
          <div style={{ fontSize: 12, color: profile.role === 'noc' ? 'var(--amber)' : 'var(--teal)', marginBottom: 20 }}>
            {profile.role === 'noc' ? '🖥️ NOC Analyst' : '🔧 Field Engineer'}
          </div>

          {/* Countdown */}
          <div style={{ maxWidth: 240, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>Expires in</span>
              <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: urgency, transition: 'color 0.5s' }}>
                {String(Math.floor(secsLeft / 60)).padStart(2, '0')}:{String(secsLeft % 60).padStart(2, '0')}
              </span>
            </div>
            <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: urgency, borderRadius: 3, transition: 'width 1s linear, background 0.5s' }} />
            </div>
            {secsLeft <= 30 && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 8 }}>⚠ Refreshing soon — new code will appear automatically</div>}
          </div>
        </div>

        {/* Right: Info + instructions */}
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontWeight: 600, fontSize: 18, color: 'var(--text)', marginBottom: 6 }}>How to use your QR Badge</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 28, lineHeight: 1.7 }}>
            Your QR badge is your digital identity for key transactions. It replaces manual signing and provides tamper-proof verification.
          </div>

          {[
            { icon: '1️⃣', title: 'When taking a key', body: 'The NOC Analyst fills the Check-Out form and selects your name. Show this screen — they will scan your QR to confirm you received the key. The record is then locked with your QR signature.' },
            { icon: '2️⃣', title: 'When returning a key', body: 'On the Active Keys page, click "📷 Scan QR" next to your key row. Show this screen. The NOC scans it, your identity is verified, and the return is logged with timestamp.' },
            { icon: '🔒', title: 'Why it\'s secure', body: `Your QR code rotates every ${WINDOW_MINUTES} minutes. A screenshot taken more than ${WINDOW_MINUTES} minutes ago will be automatically rejected — so nobody can use a saved image to impersonate you.` },
          ].map((item, i) => (
            <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>{item.body}</div>
                </div>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
            <button onClick={() => router.push('/dashboard')} style={{ padding: '9px 20px', borderRadius: 'var(--radius)', background: 'var(--amber)', border: 'none', color: '#0f1117', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              ← Dashboard
            </button>
            <button onClick={signOut} style={{ padding: '9px 20px', borderRadius: 'var(--radius)', background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
