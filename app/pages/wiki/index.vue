<script setup lang="ts">
definePageMeta({
  layout: 'wiki',
  middleware: 'public-site'
})

const { t } = useI18n()
const { siteUrl } = useLpConfig()

const { data: page } = await useAsyncData('wiki-home', () => queryCollection('wiki_en').path('/wiki').first())

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Wiki home not found' })
}

usePageSeo({
  title: page.value.title || 'Wiki',
  description: page.value.description || t('wiki'),
  path: '/wiki',
  eyebrow: t('wiki'),
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: page.value.title,
    description: page.value.description,
    url: `${siteUrl}/wiki`,
    inLanguage: 'en-GB',
    dateModified: page.value.updatedAt,
    publisher: {
      '@type': 'Organization',
      name: 'LuckPerms',
      url: siteUrl
    }
  }
})

const { data: surrounding } = await useAsyncData('wiki-nav-home', () => queryCollectionItemSurroundings('wiki_en', '/wiki'))
</script>

<template>
  <WikiPage
    v-if="page"
    :title="page.title"
    :description="page.description"
    :toc="page.body?.toc?.links"
  >
    <ContentRenderer :value="page" class="max-w-none" />
    <UContentSurround v-if="surrounding" :surround="surrounding" />
  </WikiPage>
</template>
