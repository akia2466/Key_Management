'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import CheckoutModal from './CheckoutModal'

export default function Topbar({ title, sub }: { title: string; sub?: string }) {
  const { profile, refreshProfile } = useAuth()
  const router = useRouter()
  const [now, setNow]           = useState('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleString('en-AU', {
      weekday: 'short', day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit', hour12: true,
    }))
    tick()
    const t = setInterval(tick, 30000)
    return () => clearInterval(t)
  }, [])

  const handleSuccess = async () => {
    setShowModal(false)
    // Refresh profile then use router.refresh() — no hard reload, no stuck loading
    await refreshProfile()
    router.refresh()
  }

  return (
    <>
      <header className="hide-mobile" style={{
        height: 60, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 20px',
        background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 10, flexShrink: 0,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--text3)', display: 'none' }} className="topbar-time">{now}</span>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '8px 14px', borderRadius: 'var(--radius)',
              background: 'var(--amber)', border: 'none',
              color: '#0f1117', fontWeight: 600, fontSize: 13,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            + Check Out
          </button>
        </div>
      </header>
      {showModal && (
        <CheckoutModal onClose={() => setShowModal(false)} onSuccess={handleSuccess} />
      )}
    </>
  )
}
