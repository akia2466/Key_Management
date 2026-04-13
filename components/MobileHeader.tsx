'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import CheckoutModal from './CheckoutModal'

export default function MobileHeader() {
  const { profile, signOut, refreshProfile } = useAuth()
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const roleColor = profile?.role === 'admin' ? 'var(--red)' : profile?.role === 'noc' ? 'var(--amber)' : 'var(--teal)'

  const handleSuccess = async () => {
    setShowModal(false)
    await refreshProfile()
    router.refresh()
  }

  return (
    <>
      <header style={{
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 20 }}>🔑</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>NOC Keys</div>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setShowModal(true)}
            style={{ padding: '7px 12px', borderRadius: 'var(--radius)', background: 'var(--amber)', border: 'none', color: '#0f1117', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
          >
            + Check Out
          </button>

          {/* Avatar/menu button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{ width: 34, height: 34, borderRadius: '50%', background: roleColor + '22', border: `1.5px solid ${roleColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: roleColor, cursor: 'pointer', flexShrink: 0 }}
          >
            {profile?.full_name.split(/[\s.]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')}
          </button>
        </div>
      </header>

      {/* Dropdown menu */}
      {showMenu && (
        <>
          <div onClick={() => setShowMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
          <div style={{
            position: 'fixed', top: 60, right: 12, zIndex: 100, minWidth: 200,
            background: 'var(--bg2)', border: '1px solid var(--border2)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{profile?.full_name}</div>
              <div style={{ fontSize: 11, color: roleColor, marginTop: 2 }}>
                {profile?.role === 'admin' ? '👑 Admin' : profile?.role === 'noc' ? '🖥️ NOC Analyst' : '🔧 Field Engineer'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{profile?.email}</div>
            </div>
            {profile?.role === 'engineer' && (
              <button onClick={() => { setShowMenu(false); router.push('/profile') }}
                style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, color: 'var(--teal)', cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center' }}>
                🔲 My QR Badge
              </button>
            )}
            {profile?.role === 'admin' && (
              <button onClick={() => { setShowMenu(false); router.push('/admin') }}
                style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, color: 'var(--red)', cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center' }}>
                ⚙ Admin Panel
              </button>
            )}
            <button onClick={() => { setShowMenu(false); signOut() }}
              style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, color: 'var(--text2)', cursor: 'pointer', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
              ↩ Sign Out
            </button>
          </div>
        </>
      )}

      {showModal && <CheckoutModal onClose={() => setShowModal(false)} onSuccess={handleSuccess} />}
    </>
  )
}
