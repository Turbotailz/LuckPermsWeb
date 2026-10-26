import { describe, expect, it } from 'vitest'
import { rewriteWikiImageMarkdown, wikiImageAlt } from '../config/wiki-markdown'

describe('wiki image markdown', () => {
  it('rewrites relative img paths and fills an empty alt from the filename', () => {
    const source = [
      'The result should look something like this:',
      '',
      '![](../img/usage-1.png)',
      '',
      '[![](../../img/credits-yourkit.png)](https://www.yourkit.com/)',
      '',
      '![Already described](../img/usage-2.png)'
    ].join('\n')

    const rewritten = rewriteWikiImageMarkdown(source)
    expect(rewritten).toContain('![usage 1](/wiki-img/usage-1.png)')
    expect(rewritten).toContain('[![credits yourkit](/wiki-img/credits-yourkit.png)](https://www.yourkit.com/)')
    expect(rewritten).toContain('![Already described](/wiki-img/usage-2.png)')
    expect(rewritten).not.toContain('../img/')
    expect(wikiImageAlt('usage-10.png')).toBe('usage 10')
  })

  it('rewrites HTML img tags and adds alt when the attribute is missing', () => {
    const source = '  <img src="../img/usage-inheritance-1.png" height="800"/>'
    expect(rewriteWikiImageMarkdown(source)).toBe(
      '  <img alt="usage inheritance 1" src="/wiki-img/usage-inheritance-1.png" height="800"/>'
    )
  })
})
