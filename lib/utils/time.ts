/** Parse "HH:MM" or "HH:MM:SS" into total minutes from midnight */
export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** Format total minutes from midnight to "HH:MM" */
export function fromMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export interface OccupiedRange {
  start: number // minutes from midnight
  end: number
}

/**
 * Generate available slots of `stepMin` duration between `startTime` and `endTime`,
 * excluding the break window and any occupied ranges (appointments / blocked slots).
 *
 * A slot is excluded if it overlaps with ANY occupied range.
 * Overlap condition: slotStart < occupiedEnd && slotEnd > occupiedStart
 */
export function generateSlots(
  startTime: string,
  endTime: string,
  stepMin: number,
  breakStart: string | null,
  breakEnd: string | null,
  occupied: OccupiedRange[]
): string[] {
  const start = toMinutes(startTime)
  const end = toMinutes(endTime)
  const breakS = breakStart ? toMinutes(breakStart) : null
  const breakE = breakEnd ? toMinutes(breakEnd) : null

  const slots: string[] = []

  for (let t = start; t + stepMin <= end; t += stepMin) {
    const slotEnd = t + stepMin

    // Exclude if slot falls within break
    if (breakS !== null && breakE !== null) {
      if (t < breakE && slotEnd > breakS) continue
    }

    // Exclude if slot overlaps any occupied range
    const blocked = occupied.some((o) => t < o.end && slotEnd > o.start)
    if (blocked) continue

    slots.push(fromMinutes(t))
  }

  return slots
}
