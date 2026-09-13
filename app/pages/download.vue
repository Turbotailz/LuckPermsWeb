<script setup lang="ts">
import bukkitImg from '~/assets/images/platforms/bukkit.png'
import fabricImg from '~/assets/images/platforms/fabric.png'
import neoforgeImg from '~/assets/images/platforms/neoforge.png'
import forgeImg from '~/assets/images/platforms/forge.png'
import hytaleImg from '~/assets/images/platforms/hytale.png'
import velocityImg from '~/assets/images/platforms/velocity.png'
import spongeImg from '~/assets/images/platforms/sponge.png'
import nukkitImg from '~/assets/images/platforms/nukkit.png'
import bungeeImg from '~/assets/images/platforms/bungeecord.png'

definePageMeta({
  middleware: 'public-site'
})

const { t, locale } = useI18n()
const app = useAppStore()
const quizOpen = ref(false)

usePageSeo({
  title: t('download.title'),
  description: t('download.hero.description'),
  path: '/download',
  eyebrow: t('links.download')
})

const heroUi = {
  root: 'relative overflow-hidden',
  container: 'py-10 sm:py-14 lg:py-16 gap-10 lg:gap-12',
  title: 'text-5xl sm:text-7xl text-pretty tracking-tight font-bold text-highlighted',
  description: 'mt-6 text-lg sm:text-xl/8 text-muted text-pretty max-w-xl',
  links: 'flex flex-wrap items-center gap-3'
}

const sectionUi = {
  container: 'py-12 sm:py-16 lg:py-20 gap-8 sm:gap-10',
  body: 'mt-10',
  footer: 'mt-8'
}

const primaryLink = {
  activeClass: 'text-primary font-medium',
  inactiveClass: 'text-primary font-medium hover:underline'
}

const relativeTimestamp = computed(() => {
  if (!app.versionTimestamp) {
    return null
  }
  return relativeDate(app.versionTimestamp, locale.value, Date.now(), true)
})

const platformImages: Record<string, string> = {
  bukkit: bukkitImg,
  fabric: fabricImg,
  neoforge: neoforgeImg,
  forge: forgeImg,
  hytale: hytaleImg,
  velocity: velocityImg,
  sponge: spongeImg,
  nukkit: nukkitImg,
  bungeecord: bungeeImg
}

const mosaic = ['bukkit', 'velocity', 'fabric', 'forge', 'neoforge', 'sponge'] as const

const platforms = computed(() => [
  { key: 'bukkit', name: 'Bukkit', img: 'bukkit', href: app.downloads.bukkit, small: t('download.bukkit', { version: '1.8.8 - 1.21.x' }) },
  { key: 'fabric', name: 'Fabric', img: 'fabric', href: app.downloads.fabric, small: t('download.fabric', { version: '26.2' }) },
  { key: 'neoforge', name: 'NeoForge', img: 'neoforge', href: app.downloads.neoforge, small: t('download.neoforge', { version: '26.2' }) },
  { key: 'forge', name: 'Forge', img: 'forge', href: app.downloads.forge, small: t('download.forge', { version: '26.2' }) },
  { key: 'hytale', name: 'Hytale', img: 'hytale', href: app.downloads.hytale, small: t('download.hytale', { version: 'beta' }) },
  { key: 'velocity', name: 'Velocity', img: 'velocity', href: app.downloads.velocity, small: t('download.velocity', { version: '3.x' }) },
  { key: 'sponge', name: 'Sponge', img: 'sponge', href: app.downloads.sponge, small: t('download.sponge', { version: 'API 12' }) },
  { key: 'nukkit', name: 'Nukkit', img: 'nukkit', href: app.downloads.nukkit, small: t('download.nukkit') },
  { key: 'bungee', name: 'BungeeCord', img: 'bungeecord', href: app.downloads.bungee, small: t('download.bungee') },
  { key: 'bukkit-legacy', name: 'Bukkit Legacy', img: 'bukkit', href: app.downloads['bukkit-legacy'], small: t('download.bukkitLegacy') }
])

function logDownload(platform: string) {
  trackPlausible('Download', { type: platform })
}
</script>

<template>
  <div>
    <UPageHero
      orientation="horizontal"
      :title="t('download.title')"
      :description="t('download.hero.description')"
      :ui="heroUi"
    >
      <template #headline>
        <UBadge v-if="app.version" color="primary" variant="subtle" size="lg">
          v{{ app.version }}
        </UBadge>
      </template>
      <template #body>
        <p v-if="relativeTimestamp" class="text-muted">
          {{ t('download.build', { time: relativeTimestamp }) }}
        </p>
      </template>
      <template #links>
        <UButton size="xl" to="#platforms" icon="i-lucide-circle-arrow-down">
          {{ t('download.typeChoose') }}
        </UButton>
        <UButton
          size="xl"
          color="neutral"
          variant="outline"
          to="/wiki/getting-started"
          trailing-icon="i-lucide-arrow-right"
        >
          {{ t('download.install.wiki') }}
        </UButton>
      </template>
      <div class="relative mx-auto flex w-full max-w-md items-center justify-center py-6 lg:py-0">
        <div class="absolute size-48 rounded-full bg-primary/20 blur-3xl sm:size-64" />
        <div class="relative grid grid-cols-3 gap-3">
          <div
            v-for="key in mosaic"
            :key="key"
            class="flex size-16 items-center justify-center rounded-xl bg-muted/80 p-2 ring ring-default sm:size-20"
          >
            <img :src="platformImages[key]" :alt="key" class="size-full object-contain">
          </div>
        </div>
      </div>
    </UPageHero>

    <UPageSection
      id="platforms"
      :title="t('download.typeChoose')"
      :ui="sectionUi"
      class="scroll-mt-(--ui-header-height)"
    >
      <template #body>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UPageCard
            v-for="platform in platforms"
            :key="platform.key"
            :title="platform.name"
            :description="platform.small"
            :to="platform.href"
            target="_blank"
            variant="subtle"
            @click="logDownload(platform.key)"
          >
            <template #leading>
              <UAvatar :src="platformImages[platform.img]" :alt="platform.name" size="md" class="rounded-md bg-muted p-1" />
            </template>
          </UPageCard>
        </div>
      </template>
      <template #footer>
        <div class="text-center">
          <UButton color="neutral" variant="subtle" icon="i-lucide-circle-help" @click="quizOpen = true">
            {{ t('download.typeHelp') }}
          </UButton>
        </div>
      </template>
    </UPageSection>

    <UPageSection :title="t('download.changelog')" :ui="sectionUi">
      <template #body>
        <UPageCard variant="subtle" class="mx-auto max-w-3xl">
          <UPageList divide>
            <div
              v-for="entry in app.changeLog"
              :key="entry.version"
              class="flex items-center justify-between gap-4 py-3"
            >
              <span class="min-w-0">
                <ULink
                  :to="`https://github.com/LuckPerms/LuckPerms/commit/${entry.commit}`"
                  target="_blank"
                  class="font-mono"
                  v-bind="primaryLink"
                >
                  v{{ entry.version }}
                </ULink>
                <span class="ms-2 text-default">{{ entry.title }}</span>
              </span>
              <span class="shrink-0 text-sm text-muted">{{ relativeDate(entry.timestamp, locale) }}</span>
            </div>
          </UPageList>
        </UPageCard>
      </template>
    </UPageSection>

    <UPageSection :title="t('download.install.title')" :ui="sectionUi">
      <template #body>
        <UPageCard variant="subtle" class="mx-auto max-w-2xl">
          <ol class="list-decimal space-y-3 ps-5 text-left text-default">
            <li><TrustedHtml :html="t('download.install.add')" /></li>
            <li><TrustedHtml :html="t('download.install.restart')" /></li>
            <li><TrustedHtml :html="t('download.install.config')" /></li>
            <i18n-t keypath="download.install.setup" tag="li">
              <template #wiki>
                <ULink to="/wiki/getting-started" v-bind="primaryLink">{{ t('download.install.wiki') }}</ULink>
              </template>
            </i18n-t>
          </ol>
        </UPageCard>
      </template>
    </UPageSection>

    <UPageSection :title="t('download.trouble.title')" :ui="sectionUi">
      <template #body>
        <UPageCard variant="subtle" class="mx-auto max-w-2xl">
          <ul class="list-disc space-y-3 ps-5 text-left text-default">
            <li>{{ t('download.trouble.console') }}</li>
            <i18n-t keypath="download.trouble.read" tag="li">
              <template #wiki>
                <ULink to="/wiki/install" v-bind="primaryLink">{{ t('download.trouble.wiki') }}</ULink>
              </template>
            </i18n-t>
            <i18n-t keypath="download.trouble.support" tag="li">
              <template #discord>
                <ULink to="https://discord.gg/luckperms" target="_blank" v-bind="primaryLink">Discord</ULink>
              </template>
            </i18n-t>
          </ul>
        </UPageCard>
      </template>
    </UPageSection>

    <UPageSection :title="t('download.extensions.title')" :ui="sectionUi">
      <template #description>
        <i18n-t keypath="download.extensions.description" tag="span">
          <template #wiki>
            <ULink to="/wiki/guides/extensions" v-bind="primaryLink">{{ t('download.extensions.descriptionWiki') }}</ULink>
          </template>
        </i18n-t>
      </template>
      <template #body>
        <UPageGrid>
          <UPageCard
            :title="t('download.extensions.legacy')"
            :description="t('download.extensions.legacyInfo')"
            :to="app.extensions['extension-legacy-api']"
            target="_blank"
            variant="subtle"
            spotlight
            @click="logDownload('extension-legacy-api')"
          >
            <template #footer>
              <p class="text-sm text-muted">{{ t('download.extensions.version') }}</p>
            </template>
          </UPageCard>
          <UPageCard
            :title="t('download.extensions.defaultAssignments')"
            :to="app.extensions['extension-default-assignments']"
            target="_blank"
            variant="subtle"
            spotlight
            @click="logDownload('extension-default-assignments')"
          >
            <template #description>
              <i18n-t keypath="download.extensions.defaultAssignmentsInfo" tag="span">
                <template #wiki>
                  <ULink to="/wiki/features/default-groups" v-bind="primaryLink">{{ t('download.extensions.groups') }}</ULink>
                </template>
              </i18n-t>
            </template>
            <template #footer>
              <p class="text-sm text-muted">{{ t('download.extensions.version') }}</p>
            </template>
          </UPageCard>
        </UPageGrid>
      </template>
    </UPageSection>

    <UPageSection
      :title="t('download.additional.title')"
      :description="t('download.additional.description')"
      :ui="sectionUi"
    >
      <template #body>
        <UPageCard
          :title="t('download.additional.extracontexts')"
          :description="t('download.additional.extracontextsInfo')"
          :to="app.additionalPlugins.extracontexts"
          target="_blank"
          variant="subtle"
          spotlight
          class="mx-auto max-w-xl"
        >
          <template #footer>
            <p class="text-sm text-muted">{{ t('download.additional.extracontextsMeta') }}</p>
          </template>
        </UPageCard>
      </template>
    </UPageSection>

    <UPageSection :title="t('download.placeholders.title')" :ui="sectionUi">
      <template #description>
        <i18n-t keypath="download.placeholders.description" tag="span">
          <template #wiki>
            <ULink to="/wiki/about/placeholders#placeholders" v-bind="primaryLink">{{ t('download.placeholders.link') }}</ULink>
          </template>
        </i18n-t>
      </template>
      <template #body>
        <UPageGrid>
          <UPageCard
            title="PlaceholderAPI"
            :description="t('download.placeholders.bukkitOnly')"
            :to="app.placeholderExpansions['bukkit-placeholderapi']"
            target="_blank"
            variant="subtle"
            spotlight
          />
          <UPageCard
            title="MVdWPlaceholderAPI"
            :description="t('download.placeholders.bukkitOnly')"
            :to="app.placeholderExpansions['bukkit-mvdw']"
            target="_blank"
            variant="subtle"
            spotlight
          />
          <UPageCard
            title="Fabric PlaceholderAPI"
            :description="t('download.placeholders.fabricMeta')"
            :to="app.placeholderExpansions['fabric-placeholderapi']"
            target="_blank"
            variant="subtle"
            spotlight
          />
        </UPageGrid>
      </template>
    </UPageSection>

    <DownloadQuiz v-model:open="quizOpen" :downloads="app.downloads" />
  </div>
</template>
