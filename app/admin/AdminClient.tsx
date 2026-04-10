'use client'
import { useState } from 'react'
import { supabase, UserProfile, Role } from '@/lib/supabase'
import Avatar from '@/components/Avatar'
import Badge from '@/components/Badge'

type Stats = { total: number; active: number }

const ROLE_META: Record<Role, { label: string; color: string; bg: string; icon: string; desc: string }> = {
  admin:    { label: 'Admin',          color: 'var(--red)',   bg: 'var(--red-bg)',   icon: '👑', desc: 'Full system access, user management' },
  noc:      { label: 'NOC Analyst',    color: 'var(--amber)', bg: 'var(--amber-bg)', icon: '🖥️', desc: 'Manage key log, check-out/in' },
  engineer: { label: 'Field Engineer', color: 'var(--teal)',  bg: 'var(--teal-bg)',  icon: '🔧', desc: 'Take and return site keys' },
}

export default function AdminClient({
  profiles,
  statsMap,
  currentUserId,
}: {
  profiles: UserProfile[]
  statsMap: Record<string, Stats>
  currentUserId: string
}) {
  const [users, setUsers] = useState<UserProfile[]>(profiles)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all')
  const [showInvite, setShowInvite] = useState(false)
  const [editUser, setEditUser] = useState<UserProfile | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  async function updateRole(userId: string, role: Role) {
    setSaving(userId)
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
    setSaving(null)
    if (error) { showToast('Failed to update role: ' + error.message, false); return }
    setUsers(u => u.map(p => p.id === userId ? { ...p, role } : p))
    showToast('Role updated successfully')
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

  async function updateFullName(userId: string, full_name: string) {
    setSaving(userId)
    const { error } = await supabase.from('profiles').update({ full_name }).eq('id', userId)
    setSaving(null)
    if (error) { showToast('Failed: ' + error.message, false); return }
    setUsers(u => u.map(p => p.id === userId ? { ...p, full_name } : p))
    setEditUser(null)
    showToast('Name updated')
  }

  const th: React.CSSProperties = {
    padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 500,
    color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.4px',
    borderBottom: '1px solid var(--border)', background: 'var(--bg3)', whiteSpace: 'nowrap',
  }
  const td: React.CSSProperties = { padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, verticalAlign: 'middle' }
  const inp: React.CSSProperties = { padding: '7px 10px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 12, outline: 'none' }

  const adminCount    = users.filter(u => u.role === 'admin').length
  const nocCount      = users.filter(u => u.role === 'noc').length
  const engCount      = users.filter(u => u.role === 'engineer').length
  const inactiveCount = users.filter(u => !u.is_active).length

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 500, padding: '12px 18px', borderRadius: 'var(--radius)', background: toast.ok ? 'var(--teal-bg)' : 'var(--red-bg)', border: `1px solid ${toast.ok ? 'rgba(45,212,170,0.4)' : 'rgba(242,100,100,0.4)'}`, color: toast.ok ? 'var(--teal)' : 'var(--red)', fontSize: 13, fontWeight: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Users', value: users.length, color: 'var(--text)' },
          { label: 'Admins', value: adminCount, color: 'var(--red)' },
          { label: 'NOC Analysts', value: nocCount, color: 'var(--amber)' },
          { label: 'Field Engineers', value: engCount, color: 'var(--teal)' },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 600, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Inactive warning */}
      {inactiveCount > 0 && (
        <div style={{ padding: '10px 16px', background: 'var(--amber-bg)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--amber)', marginBottom: 16, display: 'flex', gap: 8 }}>
          ⚠ {inactiveCount} deactivated account{inactiveCount > 1 ? 's' : ''} — these users cannot log in.
        </div>
      )}

      {/* Main table */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…" style={{ ...inp, width: 220 }} />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as Role | 'all')} style={inp}>
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="noc">NOC Analyst</option>
            <option value="engineer">Field Engineer</option>
          </select>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
          <button onClick={() => setShowInvite(true)} style={{ padding: '7px 16px', borderRadius: 'var(--radius)', background: 'var(--amber)', border: 'none', color: '#0f1117', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
            + Invite User
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>User</th>
                <th style={th}>Role</th>
                <th style={th}>Status</th>
                <th style={th}>Key Activity</th>
                <th style={th}>Joined</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: 'var(--text3)', padding: 40 }}>No users found</td></tr>
              )}
              {filtered.map(u => {
                const meta = ROLE_META[u.role]
                const stats = statsMap[u.id]
                const isSelf = u.id === currentUserId
                const isLoading = saving === u.id
                return (
                  <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.55 }}>

                    {/* User info */}
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ position: 'relative' }}>
                          <Avatar name={u.full_name} size={34} />
                          {!u.is_active && (
                            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>🚫</div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text)' }}>
                            {u.full_name}
                            {isSelf && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--teal)', background: 'var(--teal-bg)', padding: '1px 6px', borderRadius: 10 }}>You</span>}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role selector */}
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14 }}>{meta.icon}</span>
                        {isSelf ? (
                          <span style={{ fontSize: 12, color: meta.color, background: meta.bg, padding: '3px 10px', borderRadius: 20, fontWeight: 500 }}>
                            {meta.label}
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            disabled={isLoading}
                            onChange={e => updateRole(u.id, e.target.value as Role)}
                            style={{ ...inp, fontSize: 12, color: meta.color, background: meta.bg, border: `1px solid ${meta.color}33`, fontWeight: 500, cursor: 'pointer' }}
                          >
                            <option value="admin">👑 Admin</option>
                            <option value="noc">🖥️ NOC Analyst</option>
                            <option value="engineer">🔧 Field Engineer</option>
                          </select>
                        )}
                      </div>
                    </td>

                    {/* Active status */}
                    <td style={td}>
                      <Badge variant={u.is_active ? 'in' : 'out'}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>

                    {/* Key stats */}
                    <td style={td}>
                      {stats ? (
                        <div style={{ fontSize: 12 }}>
                          <span style={{ color: 'var(--text2)' }}>{stats.total} total</span>
                          {stats.active > 0 && <span style={{ color: 'var(--amber)', marginLeft: 8 }}>· {stats.active} out now</span>}
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text3)' }}>No records</span>
                      )}
                    </td>

                    {/* Joined */}
                    <td style={{ ...td, fontSize: 12, color: 'var(--text2)' }}>
                      {new Date(u.created_at).toLocaleDateString('en-AU')}
                    </td>

                    {/* Actions */}
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => setEditUser(u)}
                          style={{ padding: '4px 10px', borderRadius: 'var(--radius)', background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: 11, cursor: 'pointer' }}
                        >
                          ✏ Edit
                        </button>
                        {!isSelf && (
                          <button
                            onClick={() => toggleActive(u)}
                            disabled={isLoading}
                            style={{ padding: '4px 10px', borderRadius: 'var(--radius)', background: 'none', border: `1px solid ${u.is_active ? 'rgba(242,100,100,0.4)' : 'rgba(45,212,170,0.4)'}`, color: u.is_active ? 'var(--red)' : 'var(--teal)', fontSize: 11, cursor: 'pointer', opacity: isLoading ? 0.5 : 1 }}
                          >
                            {isLoading ? '…' : u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
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

      {/* Invite Modal */}
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onSuccess={(u) => { setUsers(prev => [...prev, u]); setShowInvite(false); showToast(`Invite sent to ${u.email}`) }} />}

      {/* Edit Name Modal */}
      {editUser && <EditNameModal user={editUser} onClose={() => setEditUser(null)} onSave={(name) => updateFullName(editUser.id, name)} saving={saving === editUser.id} />}
    </>
  )
}

/* ─── Invite Modal ─── */
function InviteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (u: UserProfile) => void }) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<Role>('engineer')
  const [tempPassword, setTempPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 13, outline: 'none' }
  const lbl: React.CSSProperties = { fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 5 }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !fullName || !tempPassword) { setError('All fields are required.'); return }
    if (tempPassword.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true); setError('')
    // Use signUp on behalf — the admin creates the account directly
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email, password: tempPassword,
      options: { data: { full_name: fullName, role } }
    })
    if (signUpErr || !data.user) { setError(signUpErr?.message ?? 'Sign-up failed.'); setLoading(false); return }

    // Ensure profile row exists with correct values
    await supabase.from('profiles').upsert({
      id: data.user.id, email, full_name: fullName, role, is_active: true
    })

    onSuccess({ id: data.user.id, email, full_name: fullName, role, is_active: true, created_at: new Date().toISOString() })
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-lg)', padding: 28, width: 440, maxWidth: '95vw' }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>Create New User</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>Account will be created immediately</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}><label style={lbl}>Full Name *</label><input style={inp} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Eddie Harrison" required /></div>
          <div style={{ marginBottom: 14 }}><label style={lbl}>Email *</label><input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="engineer@example.com" required /></div>
          <div style={{ marginBottom: 14 }}><label style={lbl}>Temporary Password *</label><input style={inp} type="text" value={tempPassword} onChange={e => setTempPassword(e.target.value)} placeholder="They should change this after first login" required /></div>
          <div style={{ marginBottom: 20 }}>
            <label style={lbl}>Role *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(Object.entries(ROLE_META) as [Role, typeof ROLE_META[Role]][]).map(([r, m]) => (
                <div key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: '10px 8px', borderRadius: 'var(--radius)', cursor: 'pointer', border: `1px solid ${role === r ? m.color + '88' : 'var(--border)'}`, background: role === r ? m.bg : 'var(--bg3)', textAlign: 'center', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 18, marginBottom: 3 }}>{m.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: role === r ? m.color : 'var(--text2)' }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '10px 12px', background: 'var(--bg3)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--text2)', marginBottom: 18, lineHeight: 1.7 }}>
            💡 Share the email + temporary password with the user. They can change their password after logging in via <strong style={{ color: 'var(--text)' }}>Profile → Change Password</strong>.
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
        <div style={{ marginBottom: 20, fontSize: 12, color: 'var(--text3)' }}>{user.email}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 'var(--radius)', background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onSave(name.trim())} disabled={saving || !name.trim()} style={{ padding: '9px 20px', borderRadius: 'var(--radius)', background: 'var(--amber)', border: 'none', color: '#0f1117', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
