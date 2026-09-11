<script setup lang="ts">
const language = useLanguageStore()
const { selfHosted } = useLpConfig()
const route = useRoute()
const showSearch = computed(() => !selfHosted && !route.path.startsWith('/editor'))
const isTools = computed(() =>
  ['/editor', '/verbose', '/treeview'].some(prefix => route.path === prefix || route.path.startsWith(`${prefix}/`))
)

const { data: navigation } = await useAsyncData('wiki-nav', async () => {
  if (selfHosted) {
    return []
  }
  try {
    return await queryCollectionNavigation('wiki_en')
  } catch {
    return []
  }
}, { default: () => [] })

const { data: files } = useLazyAsyncData('wiki-search', async () => {
  if (selfHosted) {
    return []
  }
  try {
    return await queryCollectionSearchSections('wiki_en', { ignoredTags: ['style'] })
  } catch {
    return []
  }
}, { server: false, default: () => [] })

onMounted(() => {
  useAppStore().fetchAppData()
  language.fetchLanguages()
})
</script>

<template>
  <UApp>
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:font-bold focus:text-inverted"
    >
      {{ $t('skipToContent') }}
    </a>
    <div id="lp-announcer" class="sr-only" aria-live="polite" aria-atomic="true" />
    <NuxtAnnouncer />
    <NuxtLoadingIndicator color="var(--ui-primary)" />
    <AppHeader />
    <UMain id="main-content">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UMain>
    <AppFooter v-if="!isTools" />
    <ClientOnly>
      <LazyUContentSearch
        v-if="showSearch"
        :files="files || []"
        :navigation="navigation || []"
        shortcut="meta_k"
        :fuse="{ resultLimit: 20 }"
      />
    </ClientOnly>
  </UApp>
</template>
