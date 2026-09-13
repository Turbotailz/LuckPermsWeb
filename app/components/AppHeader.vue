<script setup lang="ts">
import type { NavigationMenuItem, DropdownMenuItem } from '@nuxt/ui'
import bisect from '~/assets/images/bisect.svg'

const { t } = useI18n()
const { selfHosted } = useLpConfig()
const language = useLanguageStore()
const route = useRoute()

const toolsOpen = computed(() =>
  ['/editor', '/verbose', '/treeview'].some(prefix => route.path.startsWith(prefix))
)

const toolsItem = computed<NavigationMenuItem>(() => ({
  label: t('links.tools.name'),
  icon: 'i-lucide-wrench',
  active: toolsOpen.value,
  children: [
    { label: t('links.tools.editor'), to: '/editor', icon: 'i-lucide-pencil' },
    { label: t('links.tools.verbose'), to: '/verbose', icon: 'i-lucide-scroll-text' },
    { label: t('links.tools.tree'), to: '/treeview', icon: 'i-lucide-git-fork' }
  ]
}))

const items = computed<NavigationMenuItem[]>(() => {
  if (selfHosted) {
    return [toolsItem.value]
  }

  return [
    { label: t('links.download'), to: '/download', icon: 'i-lucide-circle-arrow-down' },
    { label: t('wiki'), to: '/wiki', icon: 'i-lucide-book' },
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
    { label: t('sponsorPage.title'), to: '/sponsor', icon: 'i-lucide-heart' }
  ]
})

const languageItems = computed<DropdownMenuItem[][]>(() => [
  language.supportedLanguages.map(item => ({
    label: item.name,
    icon: language.userLocale === item.code ? 'i-lucide-check' : 'i-lucide-languages',
    onSelect: () => language.setUserLocale(item.code)
  }))
])
</script>

<template>
  <UHeader :title="t('links.home')" to="/">
    <template #left>
      <ULink
        to="/"
        class="flex shrink-0 items-center gap-2 text-xl font-bold text-highlighted"
      >
        <BrandLogo size="size-8" />
        LuckPerms
      </ULink>
      <ULink
        v-if="!selfHosted && !route.path.startsWith('/sponsor')"
        to="/sponsor"
        :aria-label="`${t('sponsorBy')} BisectHosting`"
        class="ms-1 hidden items-center gap-2.5 border-s border-default ps-3.5 lg:flex"
      >
        <span class="shrink-0 rounded-md bg-inverted p-1">
          <img :src="bisect" alt="" class="h-4 w-auto">
        </span>
        <span class="hidden flex-col text-xs leading-snug xl:flex">
          <span class="whitespace-nowrap text-muted">
            {{ t('sponsorBy') }}
            <span class="font-semibold text-highlighted">BisectHosting</span>
          </span>
          <span class="whitespace-nowrap text-muted">{{ t('sponsorCta') }}</span>
        </span>
      </ULink>
    </template>

    <UNavigationMenu :items="items" class="hidden lg:flex" />

    <template #right>
      <UContentSearchButton v-if="!selfHosted && !route.path.startsWith('/editor')" />
      <UColorModeButton />
      <UDropdownMenu :items="languageItems">
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-languages"
          :aria-label="t('links.language')"
        />
      </UDropdownMenu>
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
      <UNavigationMenu :items="mobileItems" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>
</template>
