import { describe, expect, it } from 'vitest'
import { sanitizeTrustedHtml } from '../app/utils/trusted-html'

describe('Crowdin trusted HTML', () => {
  it('keeps the formatting tags used by the English catalog and drops attributes', () => {
    expect(sanitizeTrustedHtml('<b>fast</b> - written')).toBe('<b>fast</b> - written')
    expect(sanitizeTrustedHtml('<strong>Note:</strong> after <code>applyedits</code>')).toBe('<strong>Note:</strong> after <code>applyedits</code>')
    expect(sanitizeTrustedHtml('Start or restart<br>your server')).toBe('Start or restart<br>your server')
    expect(sanitizeTrustedHtml('<em>only</em> and <i>italic</i>')).toBe('<em>only</em> and <i>italic</i>')
    expect(sanitizeTrustedHtml('<span>3</span> selected')).toBe('<span>3</span> selected')
    expect(sanitizeTrustedHtml('<b class="x" style="background:url(javascript:alert(1))" onclick="alert(1)">ok</b>')).toBe('<b>ok</b>')
    expect(sanitizeTrustedHtml('<code href="javascript:alert(1)" onmouseover="alert(1)">.jar</code>')).toBe('<code>.jar</code>')
  })

  it('strips disallowed tags, including event handlers nested in an allowed tag', () => {
    const group = sanitizeTrustedHtml('Are you sure you want to delete group: <code><img src=x onerror="alert(1)"></code>')
    expect(group).not.toMatch(/onerror|javascript:|<img|<script/i)
    expect(group.startsWith('Are you sure you want to delete group:')).toBe(true)

    expect(sanitizeTrustedHtml('<script>alert(1)</script><b>kept</b>')).toBe('<b>kept</b>')
    expect(sanitizeTrustedHtml('<iframe src="javascript:alert(1)"></iframe>text')).toBe('text')
    expect(sanitizeTrustedHtml('<a href="https://luckperms.net/wiki/privacy-policy">Privacy</a>')).toBe('Privacy')
    expect(sanitizeTrustedHtml('<a href="javascript:alert(1)">click</a>')).toBe('click')
  })

  it('does not keep a break tag that smuggles an event handler', () => {
    const cleaned = sanitizeTrustedHtml('line<br onclick="alert(1)">next')
    expect(cleaned).not.toMatch(/onclick|alert/i)
    expect(cleaned).toContain('line')
    expect(cleaned).toContain('next')
  })
})
