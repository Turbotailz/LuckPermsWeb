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

useSeoMeta({
  title: () => t('download.title'),
  description: () => t('download.title')
})

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
    <UPageHero :title="t('download.title')">
      <template #headline>
        <UBadge color="primary" variant="subtle" size="lg">v{{ app.version || '…' }}</UBadge>
      </template>
      <template #description>
        <p v-if="relativeTimestamp">{{ t('download.build', { time: relativeTimestamp }) }}</p>
      </template>
    </UPageHero>

    <UPageSection :title="t('download.typeChoose')">
      <template #body>
        <UPageList class="mx-auto max-w-2xl">
          <UPageCard
            v-for="platform in platforms"
            :key="platform.key"
            :title="platform.name"
            :description="platform.small"
            :to="platform.href"
            target="_blank"
            variant="subtle"
            orientation="horizontal"
            @click="logDownload(platform.key)"
          >
            <template #leading>
              <UAvatar :src="platformImages[platform.img]" :alt="platform.name" size="md" class="rounded-md bg-muted p-1" />
            </template>
          </UPageCard>
        </UPageList>
        <div class="mt-6 text-center">
          <UButton color="neutral" variant="subtle" icon="i-lucide-circle-help" @click="quizOpen = true">
            {{ t('download.typeHelp') }}
          </UButton>
        </div>
      </template>
    </UPageSection>

    <UPageSection :title="t('download.changelog')">
      <template #body>
        <UPageList divide class="mx-auto max-w-3xl">
          <div
            v-for="entry in app.changeLog"
            :key="entry.version"
            class="flex items-center justify-between gap-4 py-3"
          >
            <span class="min-w-0">
              <ULink :to="`https://github.com/LuckPerms/LuckPerms/commit/${entry.commit}`" target="_blank" class="font-mono">
                v{{ entry.version }}
              </ULink>
              <span class="ms-2 text-default">{{ entry.title }}</span>
            </span>
            <span class="shrink-0 text-sm text-muted">{{ relativeDate(entry.timestamp, locale) }}</span>
          </div>
        </UPageList>
      </template>
    </UPageSection>

    <UPageSection :title="t('download.install.title')">
      <template #body>
        <ol class="mx-auto max-w-2xl list-decimal space-y-3 ps-5 text-left text-default">
          <li><TrustedHtml :html="t('download.install.add')" /></li>
          <li><TrustedHtml :html="t('download.install.restart')" /></li>
          <li><TrustedHtml :html="t('download.install.config')" /></li>
          <i18n-t keypath="download.install.setup" tag="li">
            <template #wiki>
              <ULink to="/wiki/getting-started">{{ t('download.install.wiki') }}</ULink>
            </template>
          </i18n-t>
        </ol>
      </template>
    </UPageSection>

    <UPageSection :title="t('download.trouble.title')">
      <template #body>
        <ul class="mx-auto max-w-2xl list-disc space-y-3 ps-5 text-left text-default">
          <li>{{ t('download.trouble.console') }}</li>
          <i18n-t keypath="download.trouble.read" tag="li">
            <template #wiki>
              <ULink to="/wiki/install">{{ t('download.trouble.wiki') }}</ULink>
            </template>
          </i18n-t>
          <i18n-t keypath="download.trouble.support" tag="li">
            <template #discord>
              <ULink to="https://discord.gg/luckperms" target="_blank">Discord</ULink>
            </template>
          </i18n-t>
        </ul>
      </template>
    </UPageSection>

    <UPageSection :title="t('download.extensions.title')">
      <template #description>
        <i18n-t keypath="download.extensions.description" tag="span">
          <template #wiki>
            <ULink to="/wiki/guides/extensions">{{ t('download.extensions.descriptionWiki') }}</ULink>
          </template>
        </i18n-t>
      </template>
      <UPageGrid>
        <UPageCard
          :title="t('download.extensions.legacy')"
          :description="t('download.extensions.legacyInfo')"
          :to="app.extensions['extension-legacy-api']"
          target="_blank"
          variant="subtle"
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
          @click="logDownload('extension-default-assignments')"
        >
          <template #description>
            <i18n-t keypath="download.extensions.defaultAssignmentsInfo" tag="span">
              <template #wiki>
                <ULink to="/wiki/features/default-groups">{{ t('download.extensions.groups') }}</ULink>
              </template>
            </i18n-t>
          </template>
          <template #footer>
            <p class="text-sm text-muted">{{ t('download.extensions.version') }}</p>
          </template>
        </UPageCard>
      </UPageGrid>
    </UPageSection>

    <UPageSection :title="t('download.additional.title')" :description="t('download.additional.description')">
      <UPageCard
        :title="t('download.additional.extracontexts')"
        :description="t('download.additional.extracontextsInfo')"
        :to="app.additionalPlugins.extracontexts"
        target="_blank"
        variant="subtle"
        class="mx-auto max-w-xl"
      >
        <template #footer>
          <p class="text-sm text-muted">{{ t('download.additional.extracontextsMeta') }}</p>
        </template>
      </UPageCard>
    </UPageSection>

    <UPageSection :title="t('download.placeholders.title')">
      <template #description>
        <i18n-t keypath="download.placeholders.description" tag="span">
          <template #wiki>
            <ULink to="/wiki/about/placeholders#placeholders">{{ t('download.placeholders.link') }}</ULink>
          </template>
        </i18n-t>
      </template>
      <UPageGrid>
        <UPageCard
          title="PlaceholderAPI"
          :description="t('download.placeholders.bukkitOnly')"
          :to="app.placeholderExpansions['bukkit-placeholderapi']"
          target="_blank"
          variant="subtle"
        />
        <UPageCard
          title="MVdWPlaceholderAPI"
          :description="t('download.placeholders.bukkitOnly')"
          :to="app.placeholderExpansions['bukkit-mvdw']"
          target="_blank"
          variant="subtle"
        />
        <UPageCard
          title="Fabric PlaceholderAPI"
          :description="t('download.placeholders.fabricMeta')"
          :to="app.placeholderExpansions['fabric-placeholderapi']"
          target="_blank"
          variant="subtle"
        />
      </UPageGrid>
    </UPageSection>

    <DownloadQuiz v-model:open="quizOpen" :downloads="app.downloads" />
  </div>
</template>
