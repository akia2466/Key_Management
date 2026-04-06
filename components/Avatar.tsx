import { getInitials, avatarStyle } from '@/lib/utils'

export default function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  const { bg, color } = avatarStyle(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.38), fontWeight: 600,
    }}>
      {getInitials(name)}
    </div>
  )
}
