'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import CheckoutModal from './CheckoutModal'

export default function Topbar({ title, sub }: { title: string; sub?: string }) {
  const { profile } = useAuth()
  const [now, setNow] = useState('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleString('en-AU', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }))
    tick()
    const t = setInterval(tick, 30000)
    return () => clearInterval(t)
  }, [])

  return (
    <>
      <header style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{title}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{sub}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{now}</span>
          {/* Both NOC and engineers can initiate a checkout */}
          <button
            onClick={() => setShowModal(true)}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius)', background: 'var(--amber)', border: 'none', color: '#0f1117', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'opacity 0.15s' }}
            onMouseOver={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseOut={e => (e.currentTarget.style.opacity = '1')}
          >
            + Check Out Key
          </button>
        </div>
      </header>
      {showModal && (
        <CheckoutModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); window.location.reload() }}
        />
      )}
    </>
  )
}
