import {
  Component,
  MiniMessage,
  NamedTextColor,
  PlainTextComponentSerializer,
  TextColor,
  TextDecoration
} from 'minimessage-js'

const AMPERSAND = '&'
const SECTION = '\u00A7'
const HEX = /^[0-9a-f]{6}$/i

const NAMED_COLORS: Record<string, NamedTextColor> = {
  0: NamedTextColor.BLACK,
  1: NamedTextColor.DARK_BLUE,
  2: NamedTextColor.DARK_GREEN,
  3: NamedTextColor.DARK_AQUA,
  4: NamedTextColor.DARK_RED,
  5: NamedTextColor.DARK_PURPLE,
  6: NamedTextColor.GOLD,
  7: NamedTextColor.GRAY,
  8: NamedTextColor.DARK_GRAY,
  9: NamedTextColor.BLUE,
  a: NamedTextColor.GREEN,
  b: NamedTextColor.AQUA,
  c: NamedTextColor.RED,
  d: NamedTextColor.LIGHT_PURPLE,
  e: NamedTextColor.YELLOW,
  f: NamedTextColor.WHITE
}

const DECORATIONS: Record<string, TextDecoration> = {
  k: TextDecoration.OBFUSCATED,
  l: TextDecoration.BOLD,
  m: TextDecoration.STRIKETHROUGH,
  n: TextDecoration.UNDERLINED,
  o: TextDecoration.ITALIC
}

const mini = MiniMessage.miniMessage()
const plain = PlainTextComponentSerializer.plainText()

/** Matches LuckPerms `Message.formatColoredValue`. */
export function containsLegacyFormatting(value: string) {
  return value.includes(AMPERSAND) || value.includes(SECTION)
}

export function parseColoredValue(value: string) {
  if (containsLegacyFormatting(value)) {
    return deserializeLegacy(value)
  }
  return mini.deserialize(value)
}

export function formatColoredHtml(value: string) {
  if (!value) {
    return ''
  }
  try {
    return mini.toHTML(parseColoredValue(value))
  } catch {
    return escapeHtml(value)
  }
}

export function formatColoredPlain(value: string) {
  if (!value) {
    return ''
  }
  try {
    return plain.serialize(parseColoredValue(value))
  } catch {
    return value
  }
}

function deserializeLegacy(value: string) {
  const input = value.replaceAll(SECTION, AMPERSAND)
  const parts: Component[] = []
  let color: TextColor | null = null
  let decorations: TextDecoration[] = []
  let buffer = ''

  const flush = () => {
    if (!buffer) {
      return
    }
    let component = Component.text(buffer)
    if (color) {
      component = component.color(color)
    }
    if (decorations.length) {
      component = component.decorate(...decorations)
    }
    parts.push(component)
    buffer = ''
  }

  for (let index = 0; index < input.length;) {
    const format = readLegacyFormat(input, index)
    if (format) {
      flush()
      if (format.reset) {
        color = null
        decorations = []
      } else if (format.color) {
        color = format.color
        decorations = []
      } else if (format.decoration && !decorations.includes(format.decoration)) {
        decorations = [...decorations, format.decoration]
      }
      index += format.length
      continue
    }
    buffer += input[index]
    index += 1
  }

  flush()
  if (!parts.length) {
    return Component.empty()
  }
  if (parts.length === 1) {
    return parts[0]!
  }
  return Component.empty().append(...parts)
}

function readLegacyFormat(input: string, index: number) {
  if (input[index] !== AMPERSAND || index + 1 >= input.length) {
    return null
  }

  const mark = input[index + 1]!

  if (mark === '#' && index + 8 <= input.length) {
    const hex = input.slice(index + 2, index + 8)
    if (HEX.test(hex)) {
      const color = TextColor.fromHexString(`#${hex}`)
      if (color) {
        return { length: 8, color }
      }
    }
  }

  if (mark.toLowerCase() === 'x' && index + 14 <= input.length) {
    let hex = ''
    let valid = true
    for (let step = 0; step < 6; step++) {
      const amp = index + 2 + step * 2
      const digit = input[amp + 1]
      if (input[amp] !== AMPERSAND || !digit || !/^[0-9a-f]$/i.test(digit)) {
        valid = false
        break
      }
      hex += digit
    }
    if (valid) {
      const color = TextColor.fromHexString(`#${hex}`)
      if (color) {
        return { length: 14, color }
      }
    }
  }

  const code = mark.toLowerCase()
  if (code === 'r') {
    return { length: 2, reset: true as const }
  }
  const named = NAMED_COLORS[code]
  if (named) {
    return { length: 2, color: named }
  }
  const decoration = DECORATIONS[code]
  if (decoration) {
    return { length: 2, decoration }
  }
  return null
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}
