'use client'
import { useAuth } from '@/lib/AuthContext'
import Sidebar from './Sidebar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()

  // Show a full-screen spinner while auth state is being determined
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🔑</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Loading…</div>
        </div>
      </div>
    )
  }

  // If no session, render nothing — the page component handles the redirect
  if (!session) return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{
        flex: 1, minWidth: 0,
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg)',
      }}>
        {children}
      </div>
    </div>
  )
}
