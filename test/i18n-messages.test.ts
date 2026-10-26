import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  applyOverlay,
  fillLegacyMessages,
  isCorruptMessage,
  isValidI18nMessage,
  repairCatalog,
  splitLegacyWhy
} from '../scripts/i18n-messages.mjs'

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

  it('fills v3 why cards and the hero from the older catalog instead of leaving them missing', () => {
    const { messages, filled } = fillLegacyMessages({
      home: {
        why: {
          description: 'LuckPerms ist ein Berechtigungs-Plugin für Minecraft-Server.',
          fast: '<b>schnell</b> - geschrieben mit Fokus auf Leistung.',
          easy: '<b>Einfach zu bedienen</b> - Berechtigungen über Befehle einrichten'
        }
      }
    })

    expect(messages.home.why.fastTitle).toBe('Schnell')
    expect(messages.home.why.fastDescription).toBe('Geschrieben mit Fokus auf Leistung.')
    expect(messages.home.why.easyTitle).toBe('Einfach zu bedienen')
    expect(messages.home.hero.description).toBe('LuckPerms ist ein Berechtigungs-Plugin für Minecraft-Server.')
    expect(filled).toContain('home.hero.description')
    expect(splitLegacyWhy('<b>schnell</b> - geschrieben.')?.title).toBe('Schnell')
  })

  it('lets a committed overlay replace the derived German hero', () => {
    const overlay = JSON.parse(readFileSync(new URL('../i18n/overlays/de.json', import.meta.url), 'utf8'))
    const { messages } = fillLegacyMessages({
      home: {
        why: {
          description: 'Ältere Beschreibung',
          fast: '<b>schnell</b> - geschrieben.'
        }
      }
    })
    const merged = applyOverlay(messages, overlay)
    expect(merged.home.hero.eyebrow).toBe('Open Source und für immer kostenlos')
    expect(merged.home.hero.description).not.toBe('Ältere Beschreibung')
    expect(merged.home.why.fastTitle).toBe('Schnell')
    expect(merged.skipToContent).toBe('Zum Inhalt springen')
  })

  it('replaces smashed Persian and known-bad Hindi with English', () => {
    expect(isCorruptMessage('Lelaک پrmeز یک پ پ پelaگیn')).toBe(true)
    expect(isCorruptMessage('شما به elaک‌پرمز نیاز دارید')).toBe(true)
    expect(isCorruptMessage('LuckPerms هو إضافة للصلاحيات لخوادم Minecraft.')).toBe(false)
    expect(isCorruptMessage('إصدار الـBungeecord خاصتك غير مدعوم, يرجى استعمال Travertine.')).toBe(false)
    expect(isCorruptMessage('Spigot، Paper، إلخ')).toBe(false)
    expect(isCorruptMessage('क्यों भाग्य?')).toBe(true)

    const { messages, replaced } = repairCatalog({
      home: {
        why: {
          description: 'Lelaک پrmeز یک پ پ پelaگیn medیrیt',
          title: 'क्यों भाग्य?'
        }
      },
      links: { download: 'तंग' },
      quiz: { result: 'شما به elaک‌پرمز نیاز دارید' }
    }, {
      home: {
        why: {
          description: 'LuckPerms is a permissions plugin for Minecraft servers.',
          title: 'Why LuckPerms?'
        }
      },
      links: { download: 'Download' },
      quiz: { result: 'You should use LuckPerms.' }
    })

    expect(messages.home.why.description).toBe('LuckPerms is a permissions plugin for Minecraft servers.')
    expect(messages.home.why.title).toBe('Why LuckPerms?')
    expect(messages.links.download).toBe('Download')
    expect(messages.quiz.result).toBe('You should use LuckPerms.')
    expect(replaced).toEqual([
      'home.why.description',
      'home.why.title',
      'links.download',
      'quiz.result'
    ])
  })

  it('keeps an empty string and literalizes when English is also unusable', () => {
    expect(isValidI18nMessage('')).toBe(true)
    const { messages } = repairCatalog({ broken: '{नाम}' }, { broken: '{also bad' })
    expect(isValidI18nMessage(messages.broken)).toBe(true)
    expect(messages.broken).not.toContain('{नाम}')
  })
})
