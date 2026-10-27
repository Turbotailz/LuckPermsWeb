<script setup lang="ts">
definePageMeta({
  title: 'LuckPerms'
})

const { t } = useI18n()
const localePath = useLocalePath()
const app = useAppStore()
const { selfHosted, siteUrl } = useLpConfig()

usePageSeo({
  title: 'LuckPerms',
  description: t('home.hero.description'),
  path: '/',
  titleTemplate: '',
  eyebrow: 'Permissions plugin',
  jsonLd: [
    {
      '@type': 'Organization',
      name: 'LuckPerms',
      url: `${siteUrl}/`,
      logo: `${siteUrl}/logo.png`,
      sameAs: [
        'https://github.com/LuckPerms/LuckPerms',
        'https://discord.gg/luckperms'
      ]
    },
    {
      '@type': 'WebSite',
      name: 'LuckPerms',
      url: `${siteUrl}/`,
      description: t('home.hero.description')
    },
    {
      '@type': 'SoftwareApplication',
      name: 'LuckPerms',
      applicationCategory: 'GameApplication',
      operatingSystem: 'Minecraft',
      url: `${siteUrl}/`,
      downloadUrl: `${siteUrl}/download`,
      image: `${siteUrl}/logo.png`,
      description: t('home.hero.description'),
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      }
    }
  ]
})

const platforms = ['Paper', 'Velocity', 'Fabric', 'Forge', 'NeoForge', 'Sponge']

const sectionUi = {
  container: 'py-12 sm:py-16 lg:py-20 gap-8 sm:gap-10',
  body: 'mt-10',
  footer: 'mt-8'
}

const whyCards = computed(() => [
  { title: t('home.why.fastTitle'), description: t('home.why.fastDescription'), icon: 'i-lucide-zap' },
  { title: t('home.why.reliableTitle'), description: t('home.why.reliableDescription'), icon: 'i-lucide-shield-check' },
  { title: t('home.why.easyTitle'), description: t('home.why.easyDescription'), icon: 'i-lucide-sparkles' },
  { title: t('home.why.flexibleTitle'), description: t('home.why.flexibleDescription'), icon: 'i-lucide-layers' },
  { title: t('home.why.extensiveTitle'), description: t('home.why.extensiveDescription'), icon: 'i-lucide-sliders-horizontal' },
  { title: t('home.why.freeTitle'), description: t('home.why.freeDescription'), icon: 'i-lucide-heart' }
])

const toolCards = computed(() => [
  { title: t('links.editor'), description: t('home.apps.editor'), icon: 'i-lucide-pencil', to: localePath('/editor') },
  { title: t('links.verbose'), description: t('home.apps.verbose'), icon: 'i-lucide-scroll-text', to: localePath('/verbose') },
  { title: t('links.tree'), description: t('home.apps.tree'), icon: 'i-lucide-git-fork', to: localePath('/treeview') }
])
</script>

<template>
  <div>
    <UPageHero
      orientation="horizontal"
      title="LuckPerms"
      :description="t('home.hero.description')"
      :ui="{
        root: 'lp-hero relative overflow-hidden',
        container: 'py-10 sm:py-14 lg:py-16 gap-10 lg:gap-12',
        title: 'text-5xl sm:text-7xl lg:text-8xl text-pretty tracking-tight font-extrabold text-highlighted',
        description: 'mt-6 text-lg sm:text-xl/8 text-muted text-pretty max-w-xl',
        links: 'flex flex-col items-start gap-5'
      }"
    >
      <template #headline>
        <span class="text-sm font-semibold">{{ t('home.hero.eyebrow') }}</span>
      </template>
      <template #links>
        <div v-if="!selfHosted" class="flex flex-wrap items-center gap-3">
          <UButton size="xl" color="neutral" class="lp-hero-cta" :to="localePath('/download')" icon="i-lucide-circle-arrow-down">
            {{ t('links.download') }}
            <UBadge color="neutral" variant="subtle" class="lp-version-badge ms-2">v{{ app.version || '…' }}</UBadge>
          </UButton>
          <UButton
            size="xl"
            color="neutral"
            variant="outline"
            class="lp-hero-secondary"
            :to="localePath('/wiki')"
            trailing-icon="i-lucide-arrow-right"
          >
            {{ t('wiki') }}
          </UButton>
        </div>
        <div v-if="!selfHosted" class="flex max-w-xl flex-wrap gap-2">
          <UBadge
            v-for="platform in platforms"
            :key="platform"
            color="neutral"
            variant="subtle"
            size="md"
            class="lp-chip"
          >
            {{ platform }}
          </UBadge>
        </div>
      </template>
      <div class="relative z-1 mx-auto flex w-full items-center justify-center py-6 lg:py-0">
        <div class="lp-mark-disc size-44 sm:size-52">
          <BrandLogo size="size-24 sm:size-28" />
        </div>
      </div>
    </UPageHero>

    <template v-if="!selfHosted">
      <UPageSection
        :title="t('home.why.title')"
        :description="t('home.why.description')"
        :ui="sectionUi"
      >
        <template #body>
          <div class="overflow-hidden rounded-2xl border border-default bg-default">
            <div class="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3">
              <UPageCard
                v-for="card in whyCards"
                :key="card.title"
                :icon="card.icon"
                :title="card.title"
                :description="card.description"
                class="rounded-none"
                :ui="{
                  leading: 'mb-5 flex size-9 items-center justify-center rounded-lg bg-primary/10'
                }"
              />
            </div>
          </div>
        </template>
        <template #footer>
          <i18n-t keypath="home.why.more" tag="p" class="text-center text-muted">
            <template #wiki>
              <ULink
                :to="localePath('/wiki/about/why-luckperms')"
                active-class="text-primary font-medium"
                inactive-class="text-primary font-medium hover:underline"
              >
                {{ t('home.why.why') }}
              </ULink>
            </template>
          </i18n-t>
        </template>
      </UPageSection>

      <UPageSection
        :title="t('home.apps.title')"
        :description="`${t('home.apps.description1')} ${t('home.apps.description2')}`"
        :ui="sectionUi"
      >
        <template #body>
          <UPageGrid>
            <UPageCard
              v-for="card in toolCards"
              :key="card.to"
              v-bind="card"
              variant="subtle"
              spotlight
            />
          </UPageGrid>
        </template>
      </UPageSection>

      <UPageSection :title="t('home.resources.title')" :ui="sectionUi">
        <template #body>
          <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-4">
            <UPageCard
              :title="t('links.wiki')"
              :description="t('home.wiki')"
              icon="i-lucide-book"
              :to="localePath('/wiki')"
              variant="outline"
              spotlight
            />
            <UPageCard
              title="GitHub"
              :description="t('home.github')"
              icon="i-simple-icons-github"
              to="https://github.com/LuckPerms/LuckPerms"
              target="_blank"
              variant="outline"
              spotlight
            />
            <UPageCard
              title="Discord"
              :description="t('home.discord', { count: app.discordUserCount ?? '…' })"
              icon="i-simple-icons-discord"
              to="https://discord.gg/luckperms"
              target="_blank"
              variant="outline"
              spotlight
            />
            <UPageCard
              :title="t('home.partner.name')"
              :description="t('home.partner.description')"
              icon="i-lucide-server"
              :to="localePath('/sponsor')"
              variant="outline"
              spotlight
            />
          </div>
        </template>
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
