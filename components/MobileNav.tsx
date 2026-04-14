'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'

export default function MobileNav() {
  const path = usePathname()
  const { profile } = useAuth()
  const isEngineer   = profile?.role === 'engineer'
  const isAdmin      = profile?.role === 'admin'
  const isSupervisor = profile?.role === 'supervisor'

  const tabs = [
    { href: '/dashboard', label: 'Home',    icon: '◈' },
    { href: '/active',    label: 'Active',  icon: '⬡' },
    { href: '/history',   label: 'History', icon: '≡' },
    { href: '/sites',     label: 'Sites',   icon: '◉' },
    ...(isEngineer
      ? [{ href: '/profile',   label: 'My QR',  icon: '🔲' }]
      : isAdmin
        ? [{ href: '/admin',   label: 'Admin',  icon: '⚙' }]
        : [{ href: '/engineers', label: 'Team', icon: '◎' }]
    ),
  ]

  return (
    <nav className="mobile-bottom-nav" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'var(--bg2)', borderTop: '1px solid var(--border)',
      display: 'none', // overridden by CSS media query
      alignItems: 'stretch',
      height: 62, paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(tab => {
        const active = path === tab.href || (tab.href !== '/dashboard' && path.startsWith(tab.href))
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3,
              textDecoration: 'none', padding: '6px 4px',
              color: active ? 'var(--amber)' : 'var(--text3)',
              borderTop: active ? '2px solid var(--amber)' : '2px solid transparent',
              transition: 'all 0.15s',
              background: active ? 'var(--amber-bg)' : 'transparent',
            }}
          >
            <span style={{ fontSize: 16 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
