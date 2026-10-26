/** Collections registered in content.config.ts. Add `wiki_de` here when that locale is published. */
export const publishedWikiCollections = ['wiki_en'] as const

export function wikiCollectionName(locale: string) {
  return `wiki_${locale.replace(/-/g, '_')}`
}

/**
 * Locale collection first, then English. A locale with no translated articles
 * still renders the English page instead of 404ing.
 */
export function wikiCollectionsForLocale(
  locale: string,
  published: readonly string[] = publishedWikiCollections
) {
  const localized = wikiCollectionName(locale || 'en')
  const ordered = published.filter(name => name === localized)
  if (localized !== 'wiki_en' && published.includes('wiki_en')) {
    ordered.push('wiki_en')
  }
  return ordered
}
