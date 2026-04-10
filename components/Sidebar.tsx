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

  const navItem = (href: string, label: string, icon: string) => {
    const active = path.startsWith(href)
    return (
      <Link key={href} href={href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 'var(--radius)', marginBottom: 2, fontSize: 13, fontWeight: active ? 500 : 400, color: active ? 'var(--amber)' : 'var(--text2)', background: active ? 'var(--amber-bg)' : 'transparent', textDecoration: 'none', transition: 'all 0.15s' }}>
        <span style={{ fontSize: 14, opacity: active ? 1 : 0.6 }}>{icon}</span>
        {label}
        {active && <span style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: 'var(--amber)' }} />}
      </Link>
    )
  }

  return (
    <aside style={{ width: 220, flexShrink: 0, background: 'var(--bg2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'sticky', top: 0 }}>

      {/* Logo */}
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--amber-bg)', border: '1px solid rgba(245,166,35,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔑</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>NOC Key Tracker</div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>Operations Centre</div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav style={{ padding: '10px 10px', flex: 1 }}>
        {mainNav.map(item => navItem(item.href, item.label, item.icon))}

        {/* Admin section — only visible to admins */}
        {profile?.role === 'admin' && (
          <>
            <div style={{ margin: '14px 12px 6px', fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Admin</div>
            {navItem('/admin', 'User Management', '⚙')}
          </>
        )}
      </nav>

      {/* User footer */}
      {profile && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '14px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Avatar name={profile.full_name} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.full_name}</div>
              <div style={{ fontSize: 10, marginTop: 1, color: profile.role === 'admin' ? 'var(--red)' : profile.role === 'noc' ? 'var(--amber)' : 'var(--teal)' }}>
                {profile.role === 'admin' ? '👑 Admin' : profile.role === 'noc' ? '🖥️ NOC Analyst' : '🔧 Field Engineer'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => router.push('/profile')} style={{ flex: 1, padding: '6px 0', borderRadius: 'var(--radius)', background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', fontSize: 11, cursor: 'pointer' }}>
              My QR
            </button>
            <button onClick={signOut} style={{ flex: 1, padding: '6px 0', borderRadius: 'var(--radius)', background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', fontSize: 11, cursor: 'pointer' }}>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
