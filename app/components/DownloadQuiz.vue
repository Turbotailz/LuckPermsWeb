<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })
defineProps<{ downloads: Record<string, string | undefined> }>()

const { t } = useI18n()
const page = ref(1)
const options = reactive({
  single: false,
  network: false,
  bukkit: false,
  sponge: false,
  fabric: false,
  forge: false,
  neoforge: false,
  nukkit: false,
  bungee: false,
  velocity: false,
  hytale: false,
  legacy: false,
  latest: false,
  unsupported: false
})

const serverType = computed(() => {
  if (options.bukkit) return 'Bukkit'
  if (options.sponge) return 'Sponge'
  if (options.fabric) return 'Fabric'
  if (options.forge) return 'Forge'
  if (options.neoforge) return 'NeoForge'
  if (options.nukkit) return 'Nukkit'
  if (options.bungee) return 'BungeeCord'
  if (options.velocity) return 'Velocity'
  if (options.hytale) return 'Hytale'
  return ''
})

function proceed(next: number, answer: keyof typeof options) {
  options[answer] = true
  page.value = next
}

function reset() {
  page.value = 1
  Object.keys(options).forEach((key) => {
    options[key as keyof typeof options] = false
  })
}

watch(open, (value) => {
  if (!value) {
    reset()
  }
})
</script>

<template>
  <UModal v-model:open="open" :title="t('download.typeHelp')" :ui="{ content: 'sm:max-w-lg' }">
    <template #body>
      <div v-if="page === 1" class="space-y-3">
        <h2 class="text-lg font-bold">{{ t('quiz.choose') }}</h2>
        <UButton block size="lg" color="neutral" variant="subtle" @click="proceed(2, 'single')">{{ t('quiz.single') }}</UButton>
        <UButton block size="lg" color="neutral" variant="subtle" @click="proceed(2, 'network')">{{ t('quiz.network') }}</UButton>
      </div>

      <div v-else-if="page === 2" class="space-y-3">
        <h2 class="text-lg font-bold">{{ t('quiz.type') }}</h2>
        <template v-if="options.single">
          <UButton block color="neutral" variant="subtle" @click="proceed(3, 'bukkit')">Spigot / Paper</UButton>
          <UButton block color="neutral" variant="subtle" @click="proceed(3, 'sponge')">SpongeForge / SpongeVanilla</UButton>
          <UButton block color="neutral" variant="subtle" @click="proceed(3, 'fabric')">Fabric</UButton>
          <UButton block color="neutral" variant="subtle" @click="proceed(3, 'forge')">Forge</UButton>
          <UButton block color="neutral" variant="subtle" @click="proceed(3, 'neoforge')">NeoForge</UButton>
          <UButton block color="neutral" variant="subtle" @click="proceed(4, 'latest'); options.hytale = true">Hytale</UButton>
          <UButton block color="neutral" variant="subtle" @click="proceed(3, 'nukkit')">NukkitX</UButton>
        </template>
        <template v-if="options.network">
          <p class="text-muted">{{ t('quiz.note') }}</p>
          <UButton block color="neutral" variant="subtle" @click="proceed(5, 'bungee')">BungeeCord / Waterfall</UButton>
          <UButton block color="neutral" variant="subtle" @click="proceed(5, 'velocity')">Velocity</UButton>
        </template>
      </div>

      <div v-else-if="page === 3" class="space-y-3">
        <h2 class="text-lg font-bold">{{ t('quiz.version', { serverType }) }}</h2>
        <template v-if="options.bukkit">
          <UButton block color="neutral" variant="subtle" @click="proceed(4, 'latest')">{{ t('quiz.newer', { version: '1.8.8' }) }}</UButton>
          <UButton block color="neutral" variant="outline" @click="proceed(4, 'unsupported')">1.8 - 1.8.7</UButton>
          <UButton block color="neutral" variant="subtle" @click="proceed(4, 'legacy')">1.7.10</UButton>
          <UButton block color="neutral" variant="outline" @click="proceed(4, 'unsupported')">{{ t('quiz.older', { version: '1.7.9' }) }}</UButton>
        </template>
        <template v-if="options.sponge">
          <UButton block color="neutral" variant="subtle" @click="proceed(4, 'latest')">{{ t('quiz.newer', { version: 'SpongeAPI 12' }) }}</UButton>
          <UButton block color="neutral" variant="outline" @click="proceed(4, 'unsupported')">{{ t('quiz.older', { version: 'SpongeAPI 7' }) }}</UButton>
        </template>
        <template v-if="options.fabric || options.forge || options.neoforge">
          <UButton block color="neutral" variant="subtle" @click="proceed(4, 'latest')">{{ t('quiz.newer', { version: '1.21' }) }}</UButton>
          <UButton block color="neutral" variant="outline" @click="proceed(4, 'unsupported')">{{ t('quiz.older', { version: '1.20' }) }}</UButton>
        </template>
        <template v-if="options.nukkit">
          <UButton block color="neutral" variant="subtle" @click="proceed(4, 'latest')">{{ t('quiz.newer', { version: 'b93' }) }}</UButton>
          <UButton block color="neutral" variant="outline" @click="proceed(4, 'unsupported')">{{ t('quiz.newer', { version: 'b92' }) }}</UButton>
        </template>
      </div>

      <div v-else-if="page === 5" class="space-y-3">
        <h2 class="text-lg font-bold">{{ t('quiz.version', { serverType }) }}</h2>
        <template v-if="options.bungee">
          <UButton block color="neutral" variant="subtle" @click="proceed(4, 'latest')">{{ t('quiz.newer', { version: '1.8.8' }) }}</UButton>
          <UButton block color="neutral" variant="outline" @click="proceed(4, 'unsupported')">{{ t('quiz.older', { version: '1.8.7' }) }}</UButton>
        </template>
        <template v-if="options.velocity">
          <UButton block color="neutral" variant="subtle" @click="proceed(4, 'latest')">{{ t('quiz.newer', { version: '3.0' }) }}</UButton>
          <UButton block color="neutral" variant="outline" @click="proceed(4, 'unsupported')">{{ t('quiz.newer', { version: '1.0' }) }}</UButton>
        </template>
      </div>

      <div v-else class="space-y-3 text-center">
        <template v-if="options.latest">
          <h2 class="text-lg font-bold">{{ t('quiz.result', { serverType }) }}</h2>
          <UButton
            v-if="options.bukkit"
            :to="downloads.bukkit"
            external
            size="lg"
          >{{ t('links.download') }}</UButton>
          <UButton v-if="options.sponge" :to="downloads.sponge" external size="lg">{{ t('links.download') }}</UButton>
          <UButton v-if="options.fabric" :to="downloads.fabric" external size="lg">{{ t('links.download') }}</UButton>
          <UButton v-if="options.forge" :to="downloads.forge" external size="lg">{{ t('links.download') }}</UButton>
          <UButton v-if="options.neoforge" :to="downloads.neoforge" external size="lg">{{ t('links.download') }}</UButton>
          <UButton v-if="options.nukkit" :to="downloads.nukkit" external size="lg">{{ t('links.download') }}</UButton>
          <UButton v-if="options.hytale" :to="downloads.hytale" external size="lg">{{ t('links.download') }}</UButton>
          <UButton v-if="options.bungee" :to="downloads.bungee" external size="lg">{{ t('links.download') }}</UButton>
          <UButton v-if="options.velocity" :to="downloads.velocity" external size="lg">{{ t('links.download') }}</UButton>
        </template>
        <template v-else-if="options.legacy">
          <h2 class="text-lg font-bold">{{ t('quiz.resultLegacy', { serverType }) }}</h2>
          <UButton :to="downloads['bukkit-legacy']" external size="lg">{{ t('links.download') }}</UButton>
        </template>
        <h2 v-else-if="options.unsupported && options.bungee" class="text-lg font-bold">{{ t('quiz.travertine') }}</h2>
        <h2 v-else-if="options.unsupported" class="text-lg font-bold">{{ t('quiz.outdated', { serverType }) }}</h2>
      </div>
    </template>
  </UModal>
</template>
