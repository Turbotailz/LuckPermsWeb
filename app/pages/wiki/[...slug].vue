<script setup lang="ts">
definePageMeta({
  layout: 'wiki',
  middleware: 'public-site'
})

const route = useRoute()
const { siteUrl } = useLpConfig()
const { t } = useI18n()
const path = computed(() => wikiPagePathFromSlug(route.params.slug as string | string[] | undefined))

const { data: page } = await useAsyncData(
  () => `wiki-${path.value}`,
  () => queryCollection('wiki_en').path(path.value).first()
)

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Wiki page not found' })
}

usePageSeo({
  title: page.value.title,
  description: page.value.description || page.value.title,
  path: path.value,
  eyebrow: t('wiki'),
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: page.value.title,
    description: page.value.description,
    url: `${siteUrl}${path.value}`,
    inLanguage: 'en-GB',
    dateModified: page.value.updatedAt,
    publisher: {
      '@type': 'Organization',
      name: 'LuckPerms',
      url: siteUrl
    }
  }
})

const { data: surrounding } = await useAsyncData(
  () => `wiki-surround-${path.value}`,
  () => queryCollectionItemSurroundings('wiki_en', path.value)
)
</script>

<template>
  <WikiPage
    v-if="page"
    :key="path"
    :title="page.title"
    :description="page.description"
    :toc="page.body?.toc?.links"
    :updated-at="page.updatedAt"
    :edit-url="page.editUrl"
    :contributors="page.contributors"
  >
    <ContentRenderer :value="page" class="max-w-none" />
    <UContentSurround v-if="surrounding" :surround="surrounding" />
  </WikiPage>
</template>
