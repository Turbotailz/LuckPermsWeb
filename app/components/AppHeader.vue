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

const items = computed<NavigationMenuItem[]>(() => {
  const tools: NavigationMenuItem = {
    label: t('links.tools.name'),
    icon: 'i-lucide-wrench',
    active: toolsOpen.value,
    children: [
      { label: t('links.tools.editor'), to: '/editor', icon: 'i-lucide-pencil' },
      { label: t('links.tools.verbose'), to: '/verbose', icon: 'i-lucide-scroll-text' },
      { label: t('links.tools.tree'), to: '/treeview', icon: 'i-lucide-git-fork' }
    ]
  }

  if (selfHosted) {
    return [tools]
  }

  return [
    { label: t('links.download'), to: '/download', icon: 'i-lucide-circle-arrow-down' },
    { label: t('wiki'), to: '/wiki', icon: 'i-lucide-book' },
    tools,
    { label: 'GitHub', to: 'https://github.com/LuckPerms/LuckPerms', target: '_blank', icon: 'i-simple-icons-github' },
    { label: 'Discord', to: 'https://discord.gg/luckperms', target: '_blank', icon: 'i-simple-icons-discord' }
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
    <template #title>
      <span class="flex items-center gap-2">
        <BrandLogo size="size-8" />
        LuckPerms
      </span>
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
        v-if="!selfHosted && !route.path.startsWith('/sponsor')"
        to="/sponsor"
        color="neutral"
        variant="ghost"
        class="hidden max-w-xs items-center gap-2 xl:inline-flex"
      >
        <span class="rounded-md bg-inverted p-1">
          <img :src="bisect" alt="Bisect Hosting" class="h-5">
        </span>
        <span class="text-left text-xs leading-tight text-muted">
          <TrustedHtml :html="t('sponsor')" />
        </span>
      </UButton>
    </template>

    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>
</template>
