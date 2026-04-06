type Variant = 'out' | 'in' | 'overdue' | 'site' | 'neutral'

const styles: Record<Variant, React.CSSProperties> = {
  out:     { background: 'var(--red-bg)',   color: 'var(--red)',   border: '1px solid rgba(242,100,100,0.25)' },
  in:      { background: 'var(--teal-bg)',  color: 'var(--teal)',  border: '1px solid rgba(45,212,170,0.25)' },
  overdue: { background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid rgba(245,166,35,0.25)' },
  site:    { background: 'var(--bg3)',      color: 'var(--text2)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)' },
  neutral: { background: 'var(--bg3)',      color: 'var(--text2)', border: '1px solid var(--border)' },
}

export default function Badge({ variant, children }: { variant: Variant; children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px',
      borderRadius: 20, fontSize: 11, fontWeight: 500,
      ...styles[variant],
    }}>{children}</span>
  )
}
