import { describe, expect, it } from 'vitest'
import { uiLocaleKey } from '../app/utils/locale'

describe('ui locale chunks', () => {
  it('maps site locales onto a single Nuxt UI file', () => {
    expect(uiLocaleKey('en')).toBe('en_gb')
    expect(uiLocaleKey('en-PT')).toBe('en_gb')
    expect(uiLocaleKey('de')).toBe('de')
    expect(uiLocaleKey('zh-CN')).toBe('zh_cn')
    expect(uiLocaleKey('zh-TW')).toBe('zh_tw')
    expect(uiLocaleKey('pt-BR')).toBe('pt_br')
    expect(uiLocaleKey('fa')).toBe('fa_ir')
    expect(uiLocaleKey('no')).toBe('nb_no')
    expect(uiLocaleKey('fil')).toBe('en')
    expect(uiLocaleKey('sr-CS')).toBe('en')
    expect(uiLocaleKey('not-a-locale')).toBe('en_gb')
  })
})
