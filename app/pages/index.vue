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
      <section class="lp-band-cream">
        <div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div class="max-w-2xl">
          <h2 class="text-3xl font-semibold tracking-tight text-highlighted sm:text-4xl">{{ t('home.why.title') }}</h2>
          <p class="mt-4 text-lg text-muted">{{ t('home.why.description') }}</p>
        </div>
        <div class="mt-10 grid gap-x-12 gap-y-8 lg:grid-cols-2">
          <article v-for="card in whyCards.slice(0, 2)" :key="card.title" class="border-s-4 border-primary ps-5">
            <h3 class="text-2xl font-semibold tracking-tight text-highlighted">{{ card.title }}</h3>
            <p class="mt-2 text-muted">{{ card.description }}</p>
          </article>
          <div class="grid content-start gap-6 sm:grid-cols-2 lg:grid-cols-1">
            <article v-for="card in whyCards.slice(2)" :key="card.title">
              <h3 class="font-semibold text-highlighted">{{ card.title }}</h3>
              <p class="mt-1 text-sm text-muted">{{ card.description }}</p>
            </article>
          </div>
        </div>
        <i18n-t keypath="home.why.more" tag="p" class="mt-10 text-muted">
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
        </div>
      </section>

      <section class="lp-band-forest">
        <div class="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div>
            <h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">{{ t('home.apps.title') }}</h2>
            <p class="mt-4 max-w-xl text-lg opacity-80">{{ t('home.apps.description1') }} {{ t('home.apps.description2') }}</p>
            <ul class="mt-8 space-y-3">
              <li v-for="card in toolCards" :key="card.to">
                <ULink :to="card.to" class="group flex items-start gap-3">
                  <UIcon :name="card.icon" class="mt-0.5 size-5 text-primary" />
                  <span>
                    <span class="font-semibold group-hover:underline">{{ card.title }}</span>
                    <span class="mt-0.5 block text-sm opacity-75">{{ card.description }}</span>
                  </span>
                </ULink>
              </li>
            </ul>
          </div>
          <div class="lp-preview" aria-hidden="true">
            <div class="lp-preview-bar">
              <BrandLogo size="size-5" />
              <span>mod</span>
              <span class="ms-auto font-mono text-xs opacity-70">weight 50</span>
            </div>
            <div class="space-y-1.5 p-3 font-mono text-xs">
              <div class="lp-preview-row"><span>essentials.fly</span><span class="lp-value" data-value="true">true</span></div>
              <div class="lp-preview-row lp-row-added"><span>essentials.gamemode</span><span class="lp-value" data-value="true">true</span></div>
              <div class="lp-preview-row"><span>worldedit.*</span><span class="lp-value" data-value="false">false</span></div>
            </div>
            <pre class="lp-preview-cmd"><span>/lp</span> group mod permission set essentials.fly true</pre>
          </div>
        </div>
      </section>

      <section class="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 class="text-3xl font-semibold tracking-tight text-highlighted">{{ t('home.resources.title') }}</h2>
        <div class="mt-8 grid gap-8 border-y border-default py-8 sm:grid-cols-2 lg:grid-cols-4">
          <ULink :to="localePath('/wiki')" class="group">
            <p class="font-semibold text-highlighted group-hover:underline">{{ t('links.wiki') }}</p>
            <p class="mt-1 text-sm text-muted">{{ t('home.wiki') }}</p>
          </ULink>
          <ULink to="https://github.com/LuckPerms/LuckPerms" target="_blank" class="group">
            <p class="font-semibold text-highlighted group-hover:underline">GitHub</p>
            <p class="mt-1 text-sm text-muted">{{ t('home.github') }}</p>
          </ULink>
          <ULink to="https://discord.gg/luckperms" target="_blank" class="group">
            <p class="font-semibold text-highlighted group-hover:underline">Discord</p>
            <p class="mt-1 text-sm text-muted">{{ t('home.discord', { count: app.discordUserCount ?? '…' }) }}</p>
          </ULink>
          <ULink :to="localePath('/sponsor')" class="group">
            <p class="font-semibold text-highlighted group-hover:underline">{{ t('home.partner.name') }}</p>
            <p class="mt-1 text-sm text-muted">{{ t('home.partner.description') }}</p>
          </ULink>
        </div>
      </section>
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
