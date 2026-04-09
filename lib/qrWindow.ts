/**
 * Time-windowed QR security — same concept as WhatsApp Link to Device.
 * The QR code rotates every WINDOW_MINUTES minutes.
 * A saved/printed screenshot becomes invalid after one window expires.
 */

export const WINDOW_MINUTES = 5

/**
 * Returns the current time window string: "YYYYMMDDHHMM" floored to nearest 5-min slot.
 * e.g. 09:13 → "09:10", 09:17 → "09:15"
 */
export function getCurrentWindow(): string {
  const now = new Date()
  const slotMinutes = Math.floor(now.getMinutes() / WINDOW_MINUTES) * WINDOW_MINUTES
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(slotMinutes)
  )
}

/**
 * Returns the previous window string (for ±1 slot tolerance during transitions).
 */
export function getPreviousWindow(): string {
  const now = new Date()
  const slotMinutes = Math.floor(now.getMinutes() / WINDOW_MINUTES) * WINDOW_MINUTES
  const slotMs = new Date(now)
  slotMs.setMinutes(slotMinutes - WINDOW_MINUTES, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    slotMs.getFullYear().toString() +
    pad(slotMs.getMonth() + 1) +
    pad(slotMs.getDate()) +
    pad(slotMs.getHours()) +
    pad(slotMs.getMinutes())
  )
}

/**
 * Builds the QR payload for a given engineer.
 */
export function buildQRPayload(engineerName: string): string {
  return JSON.stringify({
    type: 'noc_engineer',
    name: engineerName,
    id: `eng_${engineerName.toLowerCase().replace(/[\s.()]+/g, '_')}`,
    window: getCurrentWindow(),
  })
}

/**
 * Validates a scanned QR payload.
 * Accepts current window and previous window (grace period for transitions).
 */
export function validateQRPayload(raw: string): { valid: boolean; name?: string; reason?: string } {
  try {
    const data = JSON.parse(raw)
    if (data.type !== 'noc_engineer' || !data.name || !data.window) {
      return { valid: false, reason: 'Not a valid NOC engineer QR code.' }
    }
    const current = getCurrentWindow()
    const previous = getPreviousWindow()
    if (data.window !== current && data.window !== previous) {
      return { valid: false, reason: 'QR code has expired. Engineer must refresh their code.' }
    }
    return { valid: true, name: data.name }
  } catch {
    return { valid: false, reason: 'Could not read QR code data.' }
  }
}

/**
 * Returns seconds remaining in the current window, for the countdown timer.
 */
export function secondsUntilNextWindow(): number {
  const now = new Date()
  const slotMinutes = Math.floor(now.getMinutes() / WINDOW_MINUTES) * WINDOW_MINUTES
  const nextSlot = new Date(now)
  nextSlot.setMinutes(slotMinutes + WINDOW_MINUTES, 0, 0)
  return Math.ceil((nextSlot.getTime() - now.getTime()) / 1000)
}
