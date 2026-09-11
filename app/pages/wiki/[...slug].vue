<script setup lang="ts">
definePageMeta({
  layout: 'wiki',
  middleware: 'public-site'
})

const route = useRoute()
const { siteUrl } = useLpConfig()
const slug = computed(() => {
  const raw = route.params.slug
  const parts = Array.isArray(raw) ? raw : [raw]
  return parts.filter(Boolean).join('/')
})
const path = computed(() => `/wiki/${slug.value}`)

const { data: page } = await useAsyncData(
  () => `wiki-${path.value}`,
  () => queryCollection('wiki_en').path(path.value).first()
)

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Wiki page not found' })
}

useSeoMeta({
  title: page.value.title,
  description: page.value.description,
  ogTitle: page.value.title,
  ogDescription: page.value.description,
  ogUrl: `${siteUrl}${path.value}`
})

useHead({
  link: [{ rel: 'canonical', href: `${siteUrl}${path.value}` }],
  script: page.value
    ? [{
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          headline: page.value.title,
          description: page.value.description,
          url: `${siteUrl}${path.value}`
        })
      }]
    : []
})

const { data: surrounding } = await useAsyncData(
  () => `wiki-surround-${path.value}`,
  () => queryCollectionItemSurroundings('wiki_en', path.value)
)
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
