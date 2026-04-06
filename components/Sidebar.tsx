'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: '◈' },
  { href: '/active',    label: 'Active Keys', icon: '⬡' },
  { href: '/history',   label: 'Log History', icon: '≡' },
  { href: '/sites',     label: 'Sites', icon: '◉' },
  { href: '/engineers', label: 'Engineers', icon: '◎' },
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <aside style={{
      width: 220, flexShrink: 0,
      background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      minHeight: '100vh', position: 'sticky', top: 0,
    }}>
      <div style={{ padding: '22px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'var(--amber-bg)', border: '1px solid rgba(245,166,35,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: 'var(--amber)',
          }}>🔑</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>NOC Key Tracker</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Operations Centre</div>
          </div>
        </div>
      </div>

      <nav style={{ padding: '12px 10px', flex: 1 }}>
        {nav.map(item => {
          const active = path.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 'var(--radius)',
              marginBottom: 2, fontSize: 13, fontWeight: active ? 500 : 400,
              color: active ? 'var(--amber)' : 'var(--text2)',
              background: active ? 'var(--amber-bg)' : 'transparent',
              transition: 'all 0.15s',
              textDecoration: 'none',
            }}>
              <span style={{ fontSize: 14, opacity: active ? 1 : 0.6 }}>{item.icon}</span>
              {item.label}
              {active && <span style={{
                marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%',
                background: 'var(--amber)',
              }} />}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text3)' }}>
        v1.0 · NOC System
      </div>
    </aside>
  )
}
