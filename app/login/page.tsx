'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'engineer' | 'noc'>('engineer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) { setError('Full name is required.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, role } }
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuccess('Account created! Check your email to confirm, then sign in.')
    setTab('login')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--amber-bg)', border: '1px solid rgba(245,166,35,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 14px' }}>🔑</div>
          <div style={{ fontWeight: 700, fontSize: 22, color: 'var(--text)' }}>NOC Key Tracker</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Network Operations Centre</div>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {(['login', 'register'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); setSuccess('') }} style={{ flex: 1, padding: '14px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: tab === t ? 'var(--amber)' : 'var(--text3)', borderBottom: tab === t ? '2px solid var(--amber)' : '2px solid transparent', transition: 'all 0.15s' }}>
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <div style={{ padding: 28 }}>
            {success && <div style={{ padding: '10px 14px', background: 'var(--teal-bg)', border: '1px solid rgba(45,212,170,0.3)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--teal)', marginBottom: 18 }}>{success}</div>}
            {error && <div style={{ padding: '10px 14px', background: 'var(--red-bg)', border: '1px solid rgba(242,100,100,0.3)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--red)', marginBottom: 18 }}>{error}</div>}

            {tab === 'login' ? (
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Email</label>
                  <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Password</label>
                  <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px 0', borderRadius: 'var(--radius)', background: 'var(--amber)', border: 'none', color: '#0f1117', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Signing in…' : 'Sign In →'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Full Name</label>
                  <input style={inp} type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="e.g. Eddie Harrison" />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Email</label>
                  <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Password</label>
                  <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>Role</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {(['engineer', 'noc'] as const).map(r => (
                      <div key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: '10px 12px', borderRadius: 'var(--radius)', cursor: 'pointer', border: `1px solid ${role === r ? (r === 'noc' ? 'rgba(245,166,35,0.6)' : 'rgba(45,212,170,0.6)') : 'var(--border)'}`, background: role === r ? (r === 'noc' ? 'var(--amber-bg)' : 'var(--teal-bg)') : 'var(--bg3)', transition: 'all 0.15s' }}>
                        <div style={{ fontSize: 20, marginBottom: 4 }}>{r === 'noc' ? '🖥️' : '🔧'}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: role === r ? (r === 'noc' ? 'var(--amber)' : 'var(--teal)') : 'var(--text2)' }}>{r === 'noc' ? 'NOC Analyst' : 'Field Engineer'}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{r === 'noc' ? 'Manages key log' : 'Takes/returns keys'}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px 0', borderRadius: 'var(--radius)', background: 'var(--amber)', border: 'none', color: '#0f1117', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text3)' }}>
          Secured with Supabase Auth · NOC Key Management v2
        </div>
      </div>
    </div>
  )
}
