/**
 * Wiki search hits Nuxt Content's client SQLite build (wasm + SQL dump).
 * Call this only after someone opens search, not during the first load.
 */
export async function loadWikiSearchData() {
  const [navigation, files] = await Promise.all([
    queryCollectionNavigation('wiki_en').catch(() => []),
    queryCollectionSearchSections('wiki_en', { ignoredTags: ['style'] }).catch(() => [])
  ])
  return {
    navigation: navigation || [],
    files: files || []
  }
}
