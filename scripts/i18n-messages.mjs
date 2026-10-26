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

export function repairMessages(translated, english, path = '', replaced = []) {
  if (typeof translated === 'string') {
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
