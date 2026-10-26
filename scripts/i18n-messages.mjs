/**
 * Crowdin sometimes translates vue-i18n placeholder names (`{name}` → `{नाम}`)
 * or leaves braces unbalanced. Those strings throw when compiled during SSR and
 * fail the Cloudflare Pages prerender. Invalid messages fall back to English.
 */
import { baseCompile } from '@intlify/message-compiler'

export function isValidI18nMessage(message) {
  if (typeof message !== 'string') {
    return true
  }
  let valid = true
  baseCompile(message, {
    onError() {
      valid = false
    }
  })
  return valid
}

function literalize(message) {
  const escaped = message.replace(/[{}]/g, ch => (ch === '{' ? '{\'{\'}' : '{\'}\'}'))
  if (isValidI18nMessage(escaped)) {
    return escaped
  }
  const stripped = message.replace(/[{}]/g, '')
  return isValidI18nMessage(stripped) ? stripped : ''
}

function englishAt(english, key) {
  if (!english || typeof english !== 'object' || Array.isArray(english)) {
    return undefined
  }
  return english[key]
}

// Letters only. U+060C (،), U+061F (؟), and U+0640 (tatweel in الـBungeecord)
// sit in the Arabic block and must not count as a smashed Latin word.
const ARABIC_LETTER = /[\u0621-\u063F\u0641-\u064A\u066E-\u06D3\u06D5\u06EE-\u06FF\u0750-\u077F\u08A0-\u08FF]/
const LATIN_LETTER = /[A-Za-z]/

/** Crowdin strings that compile but do not mean the English source. */
const KNOWN_BAD_MESSAGES = new Set([
  'तंग',
  'क्यों भाग्य?',
  'क्यों भाग्य'
])

/**
 * Persian catalogs sometimes ship Latin letters smashed into Arabic script
 * (`Lelaک`, `elaک‌پرمز`). A Latin letter touching an Arabic letter is not a
 * product name sitting in a translated sentence.
 */
export function isCorruptMessage(message) {
  if (typeof message !== 'string') {
    return false
  }
  if (KNOWN_BAD_MESSAGES.has(message.trim())) {
    return true
  }
  const stripped = message
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
  for (let i = 0; i < stripped.length - 1; i++) {
    const current = stripped[i]
    const next = stripped[i + 1]
    if (
      (LATIN_LETTER.test(current) && ARABIC_LETTER.test(next))
      || (ARABIC_LETTER.test(current) && LATIN_LETTER.test(next))
    ) {
      return true
    }
  }
  return false
}

const WHY_KEYS = ['fast', 'reliable', 'easy', 'flexible', 'extensive', 'free']

function capitalize(value) {
  if (!value) {
    return value
  }
  return value.charAt(0).toLocaleUpperCase() + value.slice(1)
}

/** `<b>schnell</b> - geschrieben …` → title + description for the v3 cards. */
export function splitLegacyWhy(value) {
  if (typeof value !== 'string') {
    return null
  }
  const match = value.match(/^<b>([\s\S]*?)<\/b>\s*[-–—:]\s*([\s\S]+)$/i)
  if (!match) {
    return null
  }
  const title = capitalize(match[1].replace(/<[^>]+>/g, '').trim())
  let description = match[2].replace(/<[^>]+>/g, '').trim()
  if (!description) {
    return null
  }
  description = capitalize(description)
  if (!/[.!?…]$/.test(description)) {
    description = `${description}.`
  }
  return { title, description }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/**
 * v3 renamed the why-list into title/description pairs and added a hero.
 * Locales that still have the old strings should show those, not English.
 */
export function fillLegacyMessages(messages) {
  const filled = []
  if (!isPlainObject(messages)) {
    return { messages, filled }
  }
  const home = isPlainObject(messages.home) ? messages.home : null
  const why = home && isPlainObject(home.why) ? home.why : null
  if (!why) {
    return { messages, filled }
  }

  for (const key of WHY_KEYS) {
    const parts = splitLegacyWhy(why[key])
    if (!parts) {
      continue
    }
    if (why[`${key}Title`] == null) {
      why[`${key}Title`] = parts.title
      filled.push(`home.why.${key}Title`)
    }
    if (why[`${key}Description`] == null) {
      why[`${key}Description`] = parts.description
      filled.push(`home.why.${key}Description`)
    }
  }

  if (typeof why.description === 'string' && why.description.trim()) {
    if (!isPlainObject(home.hero)) {
      home.hero = {}
    }
    if (home.hero.description == null) {
      home.hero.description = why.description
      filled.push('home.hero.description')
    }
  }

  return { messages, filled }
}

export function applyOverlay(base, overlay) {
  if (!isPlainObject(overlay)) {
    return overlay === undefined ? base : overlay
  }
  const result = isPlainObject(base) ? { ...base } : {}
  for (const [key, value] of Object.entries(overlay)) {
    result[key] = isPlainObject(value)
      ? applyOverlay(result[key], value)
      : value
  }
  return result
}

export function repairMessages(translated, english, path = '', replaced = []) {
  if (typeof translated === 'string') {
    if (isCorruptMessage(translated)) {
      const fallback = typeof english === 'string' ? english : translated
      replaced.push(path || '(root)')
      return fallback
    }
    if (isValidI18nMessage(translated)) {
      return translated
    }
    const fallback = typeof english === 'string' && isValidI18nMessage(english)
      ? english
      : literalize(translated)
    replaced.push(path || '(root)')
    return fallback
  }

  if (Array.isArray(translated)) {
    return translated.map((item, index) => repairMessages(
      item,
      Array.isArray(english) ? english[index] : undefined,
      `${path}[${index}]`,
      replaced
    ))
  }

  if (translated && typeof translated === 'object') {
    const result = {}
    for (const [key, value] of Object.entries(translated)) {
      const nextPath = path ? `${path}.${key}` : key
      result[key] = repairMessages(value, englishAt(english, key), nextPath, replaced)
    }
    return result
  }

  return translated
}

export function repairCatalog(translated, english) {
  const replaced = []
  const messages = repairMessages(translated, english, '', replaced)
  return { messages, replaced }
}
