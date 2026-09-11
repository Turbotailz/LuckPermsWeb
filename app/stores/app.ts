import { defineStore } from 'pinia'

export interface AppDownloads {
  bukkit?: string
  'bukkit-legacy'?: string
  bungee?: string
  nukkit?: string
  sponge?: string
  velocity?: string
  fabric?: string
  forge?: string
  neoforge?: string
  hytale?: string
  [key: string]: string | undefined
}

export const useAppStore = defineStore('app', () => {
  const version = ref<string | null>(null)
  const versionTimestamp = ref<number | null>(null)
  const changeLog = ref<Array<{ version: string, commit: string, title: string, timestamp: number }>>([])
  const downloads = ref<AppDownloads>({})
  const extensions = ref<Record<string, string>>({})
  const additionalPlugins = ref<Record<string, string>>({})
  const placeholderExpansions = ref<Record<string, string>>({})
  const discordUserCount = ref<number | null>(null)
  const loaded = ref(false)

  async function fetchAppData() {
    const { apiUrl } = useLpConfig()
    try {
      const data = await $fetch<{
        version: string
        versionTimestamp: number
        changeLog: typeof changeLog.value
        downloads: AppDownloads
        extensions: Record<string, string>
        additionalPlugins: Record<string, string>
        placeholderExpansions: Record<string, string>
        discordUserCount: number
      }>(`${apiUrl}data/all`)
      version.value = data.version
      versionTimestamp.value = data.versionTimestamp
      changeLog.value = data.changeLog || []
      downloads.value = data.downloads || {}
      extensions.value = data.extensions || {}
      additionalPlugins.value = data.additionalPlugins || {}
      placeholderExpansions.value = data.placeholderExpansions || {}
      discordUserCount.value = data.discordUserCount ?? null
      loaded.value = true
    } catch (error) {
      console.error('Error getting metadata, retrying in 10s', error)
      setTimeout(() => {
        fetchAppData()
      }, 10_000)
    }
  }

  return {
    version,
    versionTimestamp,
    changeLog,
    downloads,
    extensions,
    additionalPlugins,
    placeholderExpansions,
    discordUserCount,
    loaded,
    fetchAppData
  }
})
