export function formatDuration(ms: number): string {
  if (ms < 0) return '—'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

export function parseDT(date: string, time: string): Date {
  return new Date(`${date}T${time}`)
}

export function isOverdue(dateOut: string, timeOut: string, thresholdHours = 8): boolean {
  return Date.now() - parseDT(dateOut, timeOut).getTime() > thresholdHours * 3600000
}

export function getInitials(name: string): string {
  return name.split(/[\s.(]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

const avatarPalette = [
  { bg: 'rgba(74,158,255,0.15)',  color: '#4a9eff' },
  { bg: 'rgba(45,212,170,0.15)',  color: '#2dd4aa' },
  { bg: 'rgba(245,166,35,0.15)',  color: '#f5a623' },
  { bg: 'rgba(242,100,100,0.15)', color: '#f26464' },
  { bg: 'rgba(94,200,122,0.15)',  color: '#5ec87a' },
]
export function avatarStyle(name: string) {
  return avatarPalette[name.charCodeAt(0) % avatarPalette.length]
}
