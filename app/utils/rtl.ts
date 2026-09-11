const RTL_LOCALES = new Set(['ar', 'fa', 'he', 'ur', 'yi', 'ckb', 'ps', 'dv'])

export function localeDir(code: string) {
  const base = code.split(/[-_]/)[0]?.toLowerCase() || 'en'
  return RTL_LOCALES.has(base) ? 'rtl' : 'ltr'
}
