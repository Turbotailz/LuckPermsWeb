export function relativeDate(date: number, language: string, baseDate?: number, includeTime?: boolean) {
  const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' })
  const now = baseDate || Date.now()
  const diff = date - now
  const absDiff = Math.abs(diff)

  let value: number
  let unit: Intl.RelativeTimeFormatUnit

  if (absDiff < 60_000) {
    value = Math.floor(diff / 1000)
    unit = 'second'
  } else if (absDiff < 3_600_000) {
    value = Math.floor(diff / 60_000)
    unit = 'minute'
  } else if (absDiff < 86_400_000) {
    value = Math.floor(diff / 3_600_000)
    unit = 'hour'
  } else if (absDiff < 604_800_000) {
    value = Math.floor(diff / 86_400_000)
    unit = 'day'
  } else if (absDiff < 2_629_800_000) {
    value = Math.floor(diff / 604_800_000)
    unit = 'week'
  } else {
    value = Math.floor(diff / 2_629_800_000)
    unit = 'month'
  }

  const dateFormat = rtf.format(value, unit)

  if (includeTime) {
    const timeFormat = new Intl.DateTimeFormat(language, {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    }).format(new Date(date))
    return `${dateFormat} @ ${timeFormat}`
  }

  return dateFormat
}
