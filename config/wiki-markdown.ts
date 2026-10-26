/** Turn wiki-relative screenshot paths into app URLs and fill empty alt text. */

export function wikiImageAlt(file: string) {
  const base = file.split('/').pop() || file
  const stem = base.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').trim()
  return stem || 'Wiki image'
}

export function rewriteWikiImageMarkdown(body: string) {
  const markdown = body.replace(
    /!\[([^\]]*)]\(((?:\.\.\/)+)img\/([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_match, alt: string, _relative: string, file: string) => {
      const label = alt.trim() || wikiImageAlt(file)
      return `![${label}](/wiki-img/${file})`
    }
  )

  return markdown.replace(/<img\b([^>]*?)>/gi, (tag, attrs: string) => {
    const src = attrs.match(/\bsrc=(["'])((?:\.\.\/)+)img\/([^"']+)\1/i)
    if (!src) {
      return tag
    }
    const quote = src[1]
    const file = src[3]
    let next = attrs.replace(src[0], `src=${quote}/wiki-img/${file}${quote}`)
    if (!/\balt\s*=/i.test(next)) {
      next = `${next.slice(0, src.index)}alt=${quote}${wikiImageAlt(file)}${quote} ${next.slice(src.index)}`
    } else {
      next = next.replace(/\balt\s*=\s*(["'])\s*\1/i, `alt="${wikiImageAlt(file)}"`)
    }
    return `<img${next}>`
  })
}
