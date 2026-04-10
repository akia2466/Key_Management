'use client'
import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const deactivated = searchParams.get('reason') === 'deactivated'

  const [tab, setTab] = useState<'login'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(deactivated ? 'Your account has been deactivated. Contact your administrator.' : '')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard')
    })
  }, [router])

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: 'var(--bg3)', border: '1px solid var(--border2)',
    borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14, outline: 'none',
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.replace('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--amber-bg)', border: '1px solid rgba(245,166,35,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 14px' }}>🔑</div>
          <div style={{ fontWeight: 700, fontSize: 22, color: 'var(--text)' }}>NOC Key Tracker</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Network Operations Centre</div>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 28px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ paddingBottom: 14, fontSize: 13, fontWeight: 500, color: 'var(--amber)', borderBottom: '2px solid var(--amber)', display: 'inline-block' }}>Sign In</div>
          </div>

          <div style={{ padding: 28 }}>
            {deactivated && (
              <div style={{ padding: '12px 14px', background: 'var(--red-bg)', border: '1px solid rgba(242,100,100,0.3)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--red)', marginBottom: 20, display: 'flex', gap: 8 }}>
                🚫 {error}
              </div>
            )}
            {!deactivated && error && (
              <div style={{ padding: '10px 14px', background: 'var(--red-bg)', border: '1px solid rgba(242,100,100,0.3)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--red)', marginBottom: 18 }}>{error}</div>
            )}

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Email</label>
                <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
              </div>
              <div style={{ marginBottom: 28 }}>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Password</label>
                <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px 0', borderRadius: 'var(--radius)', background: 'var(--amber)', border: 'none', color: '#0f1117', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Signing in…' : 'Sign In →'}
              </button>
            </form>

            <div style={{ marginTop: 20, padding: '12px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--text3)', lineHeight: 1.7 }}>
              🔒 Accounts are created by your NOC Administrator.<br />
              Contact your admin if you need access.
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text3)' }}>
          Secured with Supabase Auth · NOC Key Management v3
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text3)', fontSize: 13 }}>Loading…</div>}>
      <LoginForm />
    </Suspense>
  )
}
