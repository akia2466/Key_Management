'use client'
import { useState } from 'react'
import { supabase, UserProfile, Role } from '@/lib/supabase'
import Avatar from '@/components/Avatar'
import Badge from '@/components/Badge'

type Stats = { total: number; active: number }

const ROLE_META: Record<Role, { label: string; color: string; bg: string; icon: string }> = {
  admin:      { label: 'Admin',          color: 'var(--red)',   bg: 'var(--red-bg)',   icon: '👑' },
  supervisor: { label: 'Supervisor',     color: '#a78bfa',      bg: 'rgba(167,139,250,0.12)', icon: '📋' },
  noc:        { label: 'NOC Analyst',    color: 'var(--amber)', bg: 'var(--amber-bg)', icon: '🖥️' },
  engineer:   { label: 'Field Engineer', color: 'var(--teal)',  bg: 'var(--teal-bg)',  icon: '🔧' },
}

const COMPANIES = [
  'Vodafone PNG', 'Huawei', 'Ericsson', 'Nokia', 'ZTE',
  'Digicel', 'BMobile', 'Other Contractor',
]

export default function AdminClient({
  profiles, statsMap, currentUserId, onRefresh,
}: {
  profiles: UserProfile[]
  statsMap: Record<string, Stats>
  currentUserId: string
  onRefresh: () => Promise<void>
}) {
  const [users, setUsers]         = useState<UserProfile[]>(profiles)
  const [search, setSearch]       = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [showInvite, setShowInvite] = useState(false)
  const [editUser, setEditUser]   = useState<UserProfile | null>(null)
  const [saving, setSaving]       = useState<string | null>(null)
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const allCompanies = [...new Set(users.map(u => u.company).filter(Boolean))].sort()

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.company ?? '').toLowerCase().includes(search.toLowerCase())
    const matchRole    = roleFilter === 'all' || u.role === roleFilter
    const matchCompany = companyFilter === 'all' || u.company === companyFilter
    return matchSearch && matchRole && matchCompany
  })

  async function updateRole(userId: string, role: Role) {
    setSaving(userId)
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
    setSaving(null)
    if (error) { showToast('Failed: ' + error.message, false); return }
    setUsers(u => u.map(p => p.id === userId ? { ...p, role } : p))
    showToast('Role updated')
  }

  async function updateCompany(userId: string, company: string) {
    setSaving(userId)
    const { error } = await supabase.from('profiles').update({ company }).eq('id', userId)
    setSaving(null)
    if (error) { showToast('Failed: ' + error.message, false); return }
    setUsers(u => u.map(p => p.id === userId ? { ...p, company } : p))
    showToast('Company updated')
  }

  async function toggleActive(user: UserProfile) {
    if (user.id === currentUserId) { showToast('Cannot deactivate your own account', false); return }
    setSaving(user.id)
    const newVal = !user.is_active
    const { error } = await supabase.from('profiles').update({ is_active: newVal }).eq('id', user.id)
    setSaving(null)
    if (error) { showToast('Failed: ' + error.message, false); return }
    setUsers(u => u.map(p => p.id === user.id ? { ...p, is_active: newVal } : p))
    showToast(newVal ? 'User activated' : 'User deactivated')
  }

  async function deleteUser(user: UserProfile) {
    if (user.id === currentUserId) { showToast('Cannot delete your own account', false); return }
    if (!window.confirm(`Permanently delete "${user.full_name}" (${user.email})? This cannot be undone.`)) return
    setSaving(user.id)
    // Delete profile row — auth.users row will cascade via FK if set up, otherwise stays
    const { error } = await supabase.from('profiles').delete().eq('id', user.id)
    setSaving(null)
    if (error) { showToast('Delete failed: ' + error.message, false); return }
    setUsers(u => u.filter(p => p.id !== user.id))
    await onRefresh()
    showToast(`${user.full_name} deleted`)
  }

  async function updateFullName(userId: string, full_name: string) {
    setSaving(userId)
    const { error } = await supabase.from('profiles').update({ full_name }).eq('id', userId)
    setSaving(null)
    if (error) { showToast('Failed: ' + error.message, false); return }
    setUsers(u => u.map(p => p.id === userId ? { ...p, full_name } : p))
    setEditUser(null)
    showToast('Name updated')
  }

  const th: React.CSSProperties = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)', whiteSpace: 'nowrap' }
  const td: React.CSSProperties = { padding: '11px 14px', borderBottom: '1px solid var(--border)', fontSize: 13, verticalAlign: 'middle' }
  const inp: React.CSSProperties = { padding: '7px 10px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 12, outline: 'none' }

  const counts = { admin: 0, supervisor: 0, noc: 0, engineer: 0, inactive: 0 }
  users.forEach(u => {
    counts[u.role]++
    if (!u.is_active) counts.inactive++
  })

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 500, padding: '12px 18px', borderRadius: 'var(--radius)', background: toast.ok ? 'var(--teal-bg)' : 'var(--red-bg)', border: `1px solid ${toast.ok ? 'rgba(45,212,170,0.4)' : 'rgba(242,100,100,0.4)'}`, color: toast.ok ? 'var(--teal)' : 'var(--red)', fontSize: 13, fontWeight: 500 }}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      {/* Summary cards */}
      <div className="stats-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Users',    value: users.length,         color: 'var(--text)' },
          { label: 'Admin + Super',  value: counts.admin + counts.supervisor, color: 'var(--red)' },
          { label: 'NOC Analysts',   value: counts.noc,           color: 'var(--amber)' },
          { label: 'Field Engineers',value: counts.engineer,      color: 'var(--teal)' },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 26, fontWeight: 600, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {counts.inactive > 0 && (
        <div style={{ padding: '10px 16px', background: 'var(--amber-bg)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--amber)', marginBottom: 16 }}>
          ⚠ {counts.inactive} deactivated account{counts.inactive > 1 ? 's' : ''}
        </div>
      )}

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, company…" style={{ ...inp, width: 200 }} />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as Role | 'all')} style={inp}>
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="supervisor">Supervisor</option>
            <option value="noc">NOC Analyst</option>
            <option value="engineer">Field Engineer</option>
          </select>
          <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} style={inp}>
            <option value="all">All companies</option>
            {allCompanies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
          <button onClick={() => setShowInvite(true)} style={{ padding: '7px 16px', borderRadius: 'var(--radius)', background: 'var(--amber)', border: 'none', color: '#0f1117', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
            + Create User
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>User</th>
                <th style={th}>Company</th>
                <th style={th}>Role</th>
                <th style={th}>Status</th>
                <th style={th}>Key Activity</th>
                <th style={th}>Joined</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: 'var(--text3)', padding: 40 }}>No users found</td></tr>
              )}
              {filtered.map(u => {
                const meta = ROLE_META[u.role]
                const stats = statsMap[u.id]
                const isSelf = u.id === currentUserId
                const isLoading = saving === u.id
                return (
                  <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.5 }}>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={u.full_name} size={32} />
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>
                            {u.full_name}
                            {isSelf && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--teal)', background: 'var(--teal-bg)', padding: '1px 6px', borderRadius: 10 }}>You</span>}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Company — editable dropdown */}
                    <td style={td}>
                      <select
                        value={u.company || 'Vodafone PNG'}
                        disabled={isLoading}
                        onChange={e => updateCompany(u.id, e.target.value)}
                        style={{ ...inp, fontSize: 12, maxWidth: 160 }}
                      >
                        {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>

                    {/* Role */}
                    <td style={td}>
                      {isSelf ? (
                        <span style={{ fontSize: 12, color: meta.color, background: meta.bg, padding: '3px 10px', borderRadius: 20, fontWeight: 500 }}>
                          {meta.icon} {meta.label}
                        </span>
                      ) : (
                        <select value={u.role} disabled={isLoading}
                          onChange={e => updateRole(u.id, e.target.value as Role)}
                          style={{ ...inp, fontSize: 12, color: meta.color, background: meta.bg, border: `1px solid ${meta.color}44`, fontWeight: 500, cursor: 'pointer' }}>
                          <option value="admin">👑 Admin</option>
                          <option value="supervisor">📋 Supervisor</option>
                          <option value="noc">🖥️ NOC Analyst</option>
                          <option value="engineer">🔧 Field Engineer</option>
                        </select>
                      )}
                    </td>

                    <td style={td}><Badge variant={u.is_active ? 'in' : 'out'}>{u.is_active ? 'Active' : 'Inactive'}</Badge></td>

                    <td style={td}>
                      {stats ? (
                        <div style={{ fontSize: 12 }}>
                          <span style={{ color: 'var(--text2)' }}>{stats.total} total</span>
                          {stats.active > 0 && <span style={{ color: 'var(--amber)', marginLeft: 8 }}>· {stats.active} out</span>}
                        </div>
                      ) : <span style={{ fontSize: 12, color: 'var(--text3)' }}>No records</span>}
                    </td>

                    <td style={{ ...td, fontSize: 12, color: 'var(--text2)' }}>{new Date(u.created_at).toLocaleDateString('en-AU')}</td>

                    <td style={td}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setEditUser(u)} style={{ padding: '4px 10px', borderRadius: 'var(--radius)', background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: 11, cursor: 'pointer' }}>✏ Edit</button>
                        {!isSelf && (
                          <>
                            <button onClick={() => toggleActive(u)} disabled={isLoading}
                              style={{ padding: '4px 10px', borderRadius: 'var(--radius)', background: 'none', border: `1px solid ${u.is_active ? 'rgba(242,100,100,0.4)' : 'rgba(45,212,170,0.4)'}`, color: u.is_active ? 'var(--red)' : 'var(--teal)', fontSize: 11, cursor: 'pointer', opacity: isLoading ? 0.5 : 1 }}>
                              {isLoading ? '…' : u.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button onClick={() => deleteUser(u)} disabled={isLoading}
                              style={{ padding: '4px 10px', borderRadius: 'var(--radius)', background: 'none', border: '1px solid rgba(242,100,100,0.6)', color: 'var(--red)', fontSize: 11, cursor: 'pointer', opacity: isLoading ? 0.5 : 1 }}
                              title="Permanently delete this user">
                              🗑 Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onSuccess={(u) => { setUsers(prev => [...prev, u]); setShowInvite(false); onRefresh(); showToast(`User created: ${u.email}`) }} />}
      {editUser && <EditNameModal user={editUser} onClose={() => setEditUser(null)} onSave={(name) => updateFullName(editUser.id, name)} saving={saving === editUser.id} />}
    </>
  )
}

/* ─── Invite Modal ─── */
function InviteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (u: UserProfile) => void }) {
  const [email, setEmail]           = useState('')
  const [fullName, setFullName]     = useState('')
  const [role, setRole]             = useState<Role>('engineer')
  const [company, setCompany]       = useState('Vodafone PNG')
  const [tempPassword, setTempPassword] = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 13, outline: 'none' }
  const lbl: React.CSSProperties = { fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 5 }

  const COMPANIES = ['Vodafone PNG', 'Huawei', 'Ericsson', 'Nokia', 'ZTE', 'Digicel', 'BMobile', 'Other Contractor']

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !fullName || !tempPassword) { setError('All fields required.'); return }
    if (tempPassword.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true); setError('')
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email, password: tempPassword,
      options: { data: { full_name: fullName, role, company } }
    })
    if (signUpErr || !data.user) { setError(signUpErr?.message ?? 'Sign-up failed.'); setLoading(false); return }
    await supabase.from('profiles').upsert({ id: data.user.id, email, full_name: fullName, role, company, is_active: true })
    onSuccess({ id: data.user.id, email, full_name: fullName, role, company, is_active: true, created_at: new Date().toISOString() })
    setLoading(false)
  }

  const ROLE_OPTS: { value: Role; icon: string; label: string; desc: string }[] = [
    { value: 'admin',      icon: '👑', label: 'Admin',       desc: 'Full system access' },
    { value: 'supervisor', icon: '📋', label: 'Supervisor',  desc: 'Same as NOC + oversight' },
    { value: 'noc',        icon: '🖥️', label: 'NOC Analyst', desc: 'Manage key log' },
    { value: 'engineer',   icon: '🔧', label: 'Engineer',    desc: 'Field staff' },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-lg)', padding: 28, width: 460, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>Create New User</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>Account created immediately</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}><label style={lbl}>Full Name *</label><input style={inp} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Eddie Harrison" required /></div>
          <div style={{ marginBottom: 14 }}><label style={lbl}>Email *</label><input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="engineer@example.com" required /></div>
          <div style={{ marginBottom: 14 }}><label style={lbl}>Temporary Password *</label><input style={inp} type="text" value={tempPassword} onChange={e => setTempPassword(e.target.value)} placeholder="Share with user after creation" required /></div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Company *</label>
            <select style={inp} value={company} onChange={e => setCompany(e.target.value)}>
              {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={lbl}>Role *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {ROLE_OPTS.map(r => {
                const colors: Record<Role, string> = { admin: 'var(--red)', supervisor: '#a78bfa', noc: 'var(--amber)', engineer: 'var(--teal)' }
                const bgs: Record<Role, string> = { admin: 'var(--red-bg)', supervisor: 'rgba(167,139,250,0.12)', noc: 'var(--amber-bg)', engineer: 'var(--teal-bg)' }
                const active = role === r.value
                return (
                  <div key={r.value} onClick={() => setRole(r.value)}
                    style={{ padding: '10px 12px', borderRadius: 'var(--radius)', cursor: 'pointer', border: `1px solid ${active ? colors[r.value] + '88' : 'var(--border)'}`, background: active ? bgs[r.value] : 'var(--bg3)', transition: 'all 0.15s' }}>
                    <div style={{ fontSize: 16, marginBottom: 3 }}>{r.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: active ? colors[r.value] : 'var(--text2)' }}>{r.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{r.desc}</div>
                  </div>
                )
              })}
            </div>
          </div>
          {error && <div style={{ padding: '8px 12px', background: 'var(--red-bg)', border: '1px solid rgba(242,100,100,0.3)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--red)', marginBottom: 14 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', borderRadius: 'var(--radius)', background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '9px 22px', borderRadius: 'var(--radius)', background: 'var(--amber)', border: 'none', color: '#0f1117', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Edit Name Modal ─── */
function EditNameModal({ user, onClose, onSave, saving }: { user: UserProfile; onClose: () => void; onSave: (name: string) => void; saving: boolean }) {
  const [name, setName] = useState(user.full_name)
  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 13, outline: 'none' }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-lg)', padding: 28, width: 380, maxWidth: '95vw' }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>Edit User</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Full Name</label>
          <input style={inp} value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div style={{ marginBottom: 20, fontSize: 12, color: 'var(--text3)' }}>{user.email} · {user.company}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 'var(--radius)', background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onSave(name.trim())} disabled={saving || !name.trim()} style={{ padding: '9px 20px', borderRadius: 'var(--radius)', background: 'var(--amber)', border: 'none', color: '#0f1117', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
