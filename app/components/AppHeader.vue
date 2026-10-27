<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import bisect from '~/assets/images/bisect.svg'
import { isEditorPath, isToolRoute, isWikiPath, stripLocalePrefix } from '~/utils/tool-routes'

const { t } = useI18n()
const localePath = useLocalePath()
const { selfHosted } = useLpConfig()
const language = useLanguageStore()
const route = useRoute()

const toolsOpen = computed(() => isToolRoute(route.path))

const toolsItem = computed<NavigationMenuItem>(() => ({
  label: t('links.tools.name'),
  icon: 'i-lucide-wrench',
  active: toolsOpen.value,
  children: [
    { label: t('links.tools.editor'), to: localePath('/editor'), icon: 'i-lucide-pencil' },
    { label: t('links.tools.verbose'), to: localePath('/verbose'), icon: 'i-lucide-scroll-text' },
    { label: t('links.tools.tree'), to: localePath('/treeview'), icon: 'i-lucide-git-fork' }
  ]
}))

const items = computed<NavigationMenuItem[]>(() => {
  if (selfHosted) {
    return [toolsItem.value]
  }

  return [
    { label: t('links.download'), to: localePath('/download'), icon: 'i-lucide-circle-arrow-down' },
    { label: t('wiki'), to: localePath('/wiki'), icon: 'i-lucide-book' },
    toolsItem.value
  ]
})

const mobileItems = computed<NavigationMenuItem[]>(() => {
  if (selfHosted) {
    return items.value
  }

  return [
    ...items.value,
    { label: 'GitHub', to: 'https://github.com/LuckPerms/LuckPerms', target: '_blank', icon: 'i-simple-icons-github' },
    { label: 'Discord', to: 'https://discord.gg/luckperms', target: '_blank', icon: 'i-simple-icons-discord' },
    { label: t('sponsorPage.title'), to: localePath('/sponsor'), icon: 'i-lucide-heart' }
  ]
})

const isWiki = computed(() => isWikiPath(route.path))
const isEditor = computed(() => isEditorPath(route.path))
</script>

<template>
  <UHeader
    :title="t('links.home')"
    :to="localePath('/')"
    :ui="isEditor ? { container: 'max-w-none lg:px-6' } : undefined"
  >
    <template #left>
      <ULink
        :to="localePath('/')"
        class="flex shrink-0 items-center gap-2 text-xl font-bold text-highlighted"
      >
        <BrandLogo variant="lockup" />
      </ULink>
      <ULink
        v-if="!selfHosted && stripLocalePrefix(route.path) !== '/sponsor'"
        :to="localePath('/sponsor')"
        :aria-label="`${t('sponsorBy')} BisectHosting. ${t('sponsorCta')}`"
        class="ms-1 hidden items-center gap-2.5 border-s border-default ps-3.5 lg:flex"
      >
        <span class="shrink-0 rounded-md bg-inverted p-1">
          <img :src="bisect" alt="" class="h-4 w-auto">
        </span>
        <span class="hidden flex-col text-xs leading-snug xl:flex">
          <bdi class="whitespace-nowrap text-muted">
            {{ t('sponsorBy') }}
            <span class="font-semibold text-highlighted">BisectHosting</span>
          </bdi>
          <bdi class="whitespace-nowrap text-muted">{{ t('sponsorCta') }}</bdi>
        </span>
      </ULink>
    </template>

    <UNavigationMenu :items="items" class="hidden lg:flex" />

    <template #right>
      <UContentSearchButton v-if="!selfHosted && !isEditor" />
      <UColorModeButton />
      <AppLocaleSelect
        :model-value="language.userLocale"
        :locales="language.supportedLanguages"
        class="hidden w-44 sm:flex"
        @update:model-value="language.setUserLocale"
      />
      <UButton
        v-if="!selfHosted"
        color="neutral"
        variant="ghost"
        icon="i-simple-icons-github"
        to="https://github.com/LuckPerms/LuckPerms"
        target="_blank"
        aria-label="GitHub"
        class="hidden lg:inline-flex"
      />
      <UButton
        v-if="!selfHosted"
        color="neutral"
        variant="ghost"
        icon="i-simple-icons-discord"
        to="https://discord.gg/luckperms"
        target="_blank"
        aria-label="Discord"
        class="hidden lg:inline-flex"
      />
    </template>

    <template #body>
      <div class="mb-4 sm:hidden">
        <p class="mb-2 text-sm font-semibold text-highlighted">
          {{ t('links.language') }}
        </p>
        <AppLocaleSelect
          :model-value="language.userLocale"
          :locales="language.supportedLanguages"
          class="w-full"
          @update:model-value="language.setUserLocale"
        />
      </div>
      <UNavigationMenu :items="mobileItems" orientation="vertical" class="-mx-2.5" />
      <div v-if="isWiki && !selfHosted" class="mt-6 border-t border-default pt-4">
        <p class="mb-3 text-sm font-semibold text-highlighted">
          {{ t('wiki') }}
        </p>
        <WikiNav />
      </div>
    </template>
  </UHeader>
</template>
