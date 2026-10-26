<script setup lang="ts">
import type { Locale, Messages } from '@nuxt/ui'
import { loadUiLocale } from '~/utils/locale'
import { isEditorPath, isToolRoute } from '~/utils/tool-routes'

const language = useLanguageStore()
const { locale } = useI18n()
const { selfHosted } = useLpConfig()
const route = useRoute()
const showSearch = computed(() => !selfHosted && !isEditorPath(route.path))
const isTools = computed(() => isToolRoute(route.path))

if (isTools.value) {
  await language.applyStoredLocale()
}

const uiLocale = shallowRef<Locale<Messages>>(await loadUiLocale(String(locale.value)))

watch(() => locale.value, async (code) => {
  uiLocale.value = await loadUiLocale(String(code))
})

useHead({
  htmlAttrs: {
    lang: () => String(locale.value),
    dir: () => language.htmlDir
  }
})

onMounted(() => {
  useAppStore().fetchAppData()
  language.hydrateFromStorage()
})
</script>

<template>
  <UApp :locale="uiLocale">
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
      <SiteSearch v-if="showSearch" />
    </ClientOnly>
  </UApp>
</template>
