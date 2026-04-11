'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import Avatar from './Avatar'

const mainNav = [
  { href: '/dashboard', label: 'Dashboard',  icon: '◈' },
  { href: '/active',    label: 'Active Keys', icon: '⬡' },
  { href: '/history',   label: 'Log History', icon: '≡' },
  { href: '/sites',     label: 'Sites',       icon: '◉' },
  { href: '/engineers', label: 'Engineers',   icon: '◎' },
]

export default function Sidebar() {
  const path = usePathname()
  const router = useRouter()
  const { profile, signOut } = useAuth()

  const isAdmin    = profile?.role === 'admin'
  const isNoc      = profile?.role === 'noc'
  const isEngineer = profile?.role === 'engineer'

  const roleColor = isAdmin ? 'var(--red)' : isNoc ? 'var(--amber)' : 'var(--teal)'
  const roleLabel = isAdmin ? '👑 Admin' : isNoc ? '🖥️ NOC Analyst' : '🔧 Field Engineer'

  const NavItem = ({ href, label, icon }: { href: string; label: string; icon: string }) => {
    const active = path === href || (href !== '/dashboard' && path.startsWith(href))
    return (
      <Link
        href={href}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 12px', borderRadius: 'var(--radius)', marginBottom: 2,
          fontSize: 13, fontWeight: active ? 500 : 400,
          color: active ? 'var(--amber)' : 'var(--text2)',
          background: active ? 'var(--amber-bg)' : 'transparent',
          textDecoration: 'none', transition: 'all 0.15s',
        }}
      >
        <span style={{ fontSize: 14, opacity: active ? 1 : 0.6 }}>{icon}</span>
        {label}
        {active && (
          <span style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: 'var(--amber)' }} />
        )}
      </Link>
    )
  }

  return (
    <aside style={{
      width: 220, flexShrink: 0, background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      minHeight: '100vh', position: 'sticky', top: 0,
    }}>

      {/* Logo */}
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'var(--amber-bg)', border: '1px solid rgba(245,166,35,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>🔑</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>NOC Key Tracker</div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>Operations Centre</div>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav style={{ padding: '10px', flex: 1, overflowY: 'auto' }}>
        {mainNav.map(item => <NavItem key={item.href} {...item} />)}

        {/* Admin-only section */}
        {isAdmin && (
          <>
            <div style={{
              margin: '16px 12px 6px',
              fontSize: 10, fontWeight: 600, color: 'var(--text3)',
              textTransform: 'uppercase', letterSpacing: '0.6px',
            }}>
              Administration
            </div>
            <NavItem href="/admin" label="User Management" icon="⚙" />
          </>
        )}
      </nav>

      {/* User footer — always visible when logged in */}
      {profile ? (
        <div style={{ borderTop: '1px solid var(--border)', padding: 14 }}>

          {/* User info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Avatar name={profile.full_name} size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12, fontWeight: 600, color: 'var(--text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {profile.full_name}
              </div>
              <div style={{ fontSize: 10, color: roleColor, marginTop: 2 }}>{roleLabel}</div>
              <div style={{
                fontSize: 10, color: 'var(--text3)', marginTop: 1,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {profile.email}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

            {/* My QR — only for engineers */}
            {isEngineer && (
              <button
                onClick={() => router.push('/profile')}
                style={{
                  width: '100%', padding: '7px 0', borderRadius: 'var(--radius)',
                  background: 'var(--teal-bg)', border: '1px solid rgba(45,212,170,0.3)',
                  color: 'var(--teal)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                🔲 My QR Badge
              </button>
            )}

            {/* Admin panel shortcut */}
            {isAdmin && (
              <button
                onClick={() => router.push('/admin')}
                style={{
                  width: '100%', padding: '7px 0', borderRadius: 'var(--radius)',
                  background: 'rgba(242,100,100,0.1)', border: '1px solid rgba(242,100,100,0.3)',
                  color: 'var(--red)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                ⚙ Admin Panel
              </button>
            )}

            {/* Sign out — always visible */}
            <button
              onClick={signOut}
              style={{
                width: '100%', padding: '7px 0', borderRadius: 'var(--radius)',
                background: 'none', border: '1px solid var(--border2)',
                color: 'var(--text3)', fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.15s',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(242,100,100,0.5)'; e.currentTarget.style.color = 'var(--red)' }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text3)' }}
            >
              ↩ Sign Out
            </button>
          </div>
        </div>
      ) : (
        /* Fallback if profile is null but session exists */
        <div style={{ borderTop: '1px solid var(--border)', padding: 14 }}>
          <button
            onClick={signOut}
            style={{ width: '100%', padding: '7px 0', borderRadius: 'var(--radius)', background: 'none', border: '1px solid var(--border2)', color: 'var(--text3)', fontSize: 12, cursor: 'pointer' }}
          >
            ↩ Sign Out
          </button>
        </div>
      )}
    </aside>
  )
}
