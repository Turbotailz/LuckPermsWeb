import { queryCollection } from '#imports'
import { wikiCollectionsForLocale } from '../../config/wiki-collections'

export async function queryWikiPage(path: string, locale: string) {
  let collection = 'wiki_en'
  for (const name of wikiCollectionsForLocale(locale)) {
    collection = name
    const page = await queryCollection(name).path(path).first()
    if (page) {
      return { page, collection: name }
    }
  }
  return { page: null, collection }
}
