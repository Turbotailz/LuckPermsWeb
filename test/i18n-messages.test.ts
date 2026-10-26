import { describe, expect, it } from 'vitest'
import { isValidI18nMessage, repairCatalog } from '../scripts/i18n-messages.mjs'

const english = {
  avatar: 'Avatar of {name}',
  home: {
    why: { more: 'See the {wiki} article' },
    discord: 'Join {count} others'
  },
  download: { bukkit: 'Spigot, Paper, etc ({version})' },
  editor: { nodes: { copy: 'Copy {count} node | Copy {count} nodes' } }
}

describe('Crowdin vue-i18n repair', () => {
  it('keeps valid placeholders and replaces translated placeholder names', () => {
    const { messages, replaced } = repairCatalog({
      avatar: '{नाम}',
      home: {
        why: { more: 'अधिक जानकारी के लिए, {विकी} पर विकी लेख देखें' },
        discord: 'Join {count} others'
      },
      download: { bukkit: 'Spigot ({संस्करण})' }
    }, english)

    expect(messages.avatar).toBe(english.avatar)
    expect(messages.home.why.more).toBe(english.home.why.more)
    expect(messages.home.discord).toBe('Join {count} others')
    expect(messages.download.bukkit).toBe(english.download.bukkit)
    expect(replaced).toEqual(['avatar', 'home.why.more', 'download.bukkit'])
    expect(isValidI18nMessage(messages.home.why.more)).toBe(true)
  })

  it('replaces unbalanced braces and nested placeholders with English', () => {
    const { messages, replaced } = repairCatalog({
      avatar: 'Avatar de {{name}}',
      editor: { nodes: { copy: 'کپی گره {count} به ... | گره 1} را کپی کنید' } }
    }, english)

    expect(messages.avatar).toBe(english.avatar)
    expect(messages.editor.nodes.copy).toBe(english.editor.nodes.copy)
    expect(replaced).toEqual(['avatar', 'editor.nodes.copy'])
  })

  it('keeps an empty string and literalizes when English is also unusable', () => {
    expect(isValidI18nMessage('')).toBe(true)
    const { messages } = repairCatalog({ broken: '{नाम}' }, { broken: '{also bad' })
    expect(isValidI18nMessage(messages.broken)).toBe(true)
    expect(messages.broken).not.toContain('{नाम}')
  })
})
