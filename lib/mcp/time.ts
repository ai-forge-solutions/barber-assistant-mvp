function localStamp(ms: number, formatter: Intl.DateTimeFormat): string {
  const p = Object.fromEntries(formatter.formatToParts(new Date(ms)).map(x => [x.type, x.value]))
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`
}

/** Fail closed for skipped or repeated wall-clock times. Never guess a DST offset. */
export function localInstant(date: string, clock: string, timezone: string): string | null {
  validDate(date)
  if (!/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(clock)) throw new Error('Invalid time')
  const wall = `${date}T${clock.length === 5 ? `${clock}:00` : clock}`
  const naive = Date.parse(`${wall}Z`)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  })
  const offsets = new Set<number>()
  for (let h = -36; h <= 36; h += 6) {
    const sample = naive + h * 3600000
    offsets.add(Date.parse(`${localStamp(sample, formatter)}Z`) - sample)
  }
  const matches = [...offsets].map(offset => naive - offset)
    .filter(ms => localStamp(ms, formatter) === wall)
  return matches.length === 1 ? new Date(matches[0]).toISOString() : null
}

export function validDate(value: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      !Number.isFinite(Date.parse(`${value}T00:00:00Z`)) ||
      new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
    throw new Error('Invalid date')
  }
  return value
}

export function parseInstant(value: string): string {
  const match = typeof value === 'string' && /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(value)
  if (!match) throw new Error('Invalid timestamp: explicit offset required')
  validDate(match[1])
  const offset = match[5]
  if (+match[2] > 23 || +match[3] > 59 || +match[4] > 59 ||
      (offset !== 'Z' && (+offset.slice(1, 3) > 14 || +offset.slice(4) > 59 ||
        (+offset.slice(1, 3) === 14 && +offset.slice(4) !== 0)))) throw new Error('Invalid timestamp')
  const ms = Date.parse(value)
  if (!Number.isFinite(ms)) throw new Error('Invalid timestamp')
  return new Date(ms).toISOString()
}
