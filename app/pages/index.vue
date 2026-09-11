<script setup lang="ts">
definePageMeta({
  title: 'LuckPerms'
})

const { t } = useI18n()
const app = useAppStore()
const { selfHosted } = useLpConfig()

useSeoMeta({
  title: 'LuckPerms',
  titleTemplate: '',
  description: () => t('description'),
  ogTitle: 'LuckPerms',
  ogDescription: () => t('description')
})

const whyCards = computed(() => [
  { key: 'home.why.fast' as const, icon: 'i-lucide-zap' },
  { key: 'home.why.reliable' as const, icon: 'i-lucide-shield-check' },
  { key: 'home.why.easy' as const, icon: 'i-lucide-sparkles' },
  { key: 'home.why.flexible' as const, icon: 'i-lucide-layers' },
  { key: 'home.why.extensive' as const, icon: 'i-lucide-sliders-horizontal' },
  { key: 'home.why.free' as const, icon: 'i-lucide-heart' }
])

const toolCards = computed(() => [
  { title: t('links.editor'), description: t('editor.description'), icon: 'i-lucide-pencil', to: '/editor' },
  { title: t('links.verbose'), description: t('verbose.title'), icon: 'i-lucide-scroll-text', to: '/verbose' },
  { title: t('links.tree'), description: t('tree.title'), icon: 'i-lucide-git-fork', to: '/treeview' }
])
</script>

<template>
  <div>
    <UPageHero
      title="LuckPerms"
      :description="t('description')"
    >
      <template #headline>
        <BrandLogo size="size-28" />
      </template>
      <template #links>
        <template v-if="!selfHosted">
          <UButton size="xl" to="/download" icon="i-lucide-circle-arrow-down">
            {{ t('links.download') }}
            <UBadge color="neutral" variant="subtle" class="ms-2">v{{ app.version || '…' }}</UBadge>
          </UButton>
          <p class="max-w-lg text-sm text-muted">{{ t('home.supported') }}</p>
        </template>
      </template>
    </UPageHero>

    <template v-if="!selfHosted">
      <UPageSection
        :title="t('home.why.title')"
        :description="`${t('home.why.description')} ${t('home.why.its')}`"
      >
        <UPageGrid>
          <UPageCard
            v-for="card in whyCards"
            :key="card.key"
            :icon="card.icon"
            variant="subtle"
          >
            <template #description>
              <TrustedHtml :html="t(card.key)" />
            </template>
          </UPageCard>
        </UPageGrid>
        <i18n-t keypath="home.why.more" tag="p" class="mt-8 text-center text-muted">
          <template #wiki>
            <ULink to="/wiki/about/why-luckperms">{{ t('home.why.why') }}</ULink>
          </template>
        </i18n-t>
      </UPageSection>

      <UPageSection
        :title="t('home.apps.title')"
        :description="`${t('home.apps.description1')} ${t('home.apps.description2')}`"
      >
        <UPageGrid>
          <UPageCard
            v-for="card in toolCards"
            :key="card.to"
            v-bind="card"
            variant="subtle"
            spotlight
          />
        </UPageGrid>
      </UPageSection>

      <UPageSection>
        <UPageGrid>
          <UPageCard
            :title="t('links.wiki')"
            :description="t('home.wiki')"
            icon="i-lucide-book"
            to="/wiki"
            variant="outline"
          />
          <UPageCard
            title="GitHub"
            :description="t('home.github')"
            icon="i-simple-icons-github"
            to="https://github.com/LuckPerms/LuckPerms"
            target="_blank"
            variant="outline"
          />
          <UPageCard
            title="Discord"
            :description="t('home.discord', { count: app.discordUserCount ?? '…' })"
            icon="i-simple-icons-discord"
            to="https://discord.gg/luckperms"
            target="_blank"
            variant="outline"
          />
          <UPageCard
            :title="t('home.partner.title')"
            :description="t('home.partner.description')"
            icon="i-lucide-server"
            to="/sponsor"
            variant="outline"
            class="sm:col-span-2 lg:col-span-1"
          />
        </UPageGrid>
      </UPageSection>
    </template>

    <UPageSection v-else>
      <UPageGrid>
        <UPageCard
          v-for="card in toolCards"
          :key="card.to"
          v-bind="card"
          variant="subtle"
          spotlight
        />
      </UPageGrid>
    </UPageSection>
  </div>
</template>
