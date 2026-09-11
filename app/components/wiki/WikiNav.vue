<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'
import { wikiSections } from '~/utils/wiki-nav'

const { data: navigation } = await useAsyncData('wiki-sidebar', () => queryCollectionNavigation('wiki_en'), {
  default: () => []
})

function flatten(items: ContentNavigationItem[] = []): ContentNavigationItem[] {
  return items.flatMap(item => [item, ...flatten(item.children || [])])
}

const byPath = computed(() => {
  const map = new Map<string, ContentNavigationItem>()
  flatten(navigation.value || []).forEach((item) => {
    if (item.path) {
      map.set(item.path, item)
    }
  })
  return map
})

const links = computed<ContentNavigationItem[]>(() => [
  {
    title: byPath.value.get('/wiki')?.title || 'Wiki',
    path: '/wiki'
  },
  ...wikiSections.map(section => ({
    title: section.title,
    children: section.paths.map((path) => {
      const item = byPath.value.get(path)
      return {
        title: item?.title || path.split('/').pop() || path,
        path
      }
    })
  }))
])
</script>

<template>
  <UContentNavigation
    :navigation="links"
    highlight
    :ui="{ linkTitle: 'whitespace-normal text-pretty' }"
  />
</template>
