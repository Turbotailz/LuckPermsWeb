import { coerce, compare } from 'semver'
import type { AppDownloads } from '~/stores/app'

export type PluginVersionStatus = 'unknown' | 'current' | 'outdated' | 'ahead'

export function comparePluginVersions(current?: string | null, latest?: string | null) {
  const currentVersion = String(current || '')
  const latestVersion = String(latest || '')
  const currentSemver = coerce(currentVersion)
  const latestSemver = coerce(latestVersion)
  if (!currentSemver || !latestSemver) {
    return {
      status: 'unknown' as const,
      currentVersion,
      latestVersion
    }
  }
  const result = compare(currentSemver, latestSemver)
  return {
    status: (result < 0 ? 'outdated' : result > 0 ? 'ahead' : 'current') as PluginVersionStatus,
    currentVersion,
    latestVersion
  }
}

export function pluginDownloadForAlias(alias: string, downloads: AppDownloads) {
  if (alias === 'lpv' && downloads.velocity) {
    return { to: downloads.velocity, external: true, downloadPlatform: 'velocity' }
  }
  if (alias === 'lpb' && downloads.bungee) {
    return { to: downloads.bungee, external: true, downloadPlatform: 'bungee' }
  }
  return { to: '/download', external: false, downloadPlatform: '' }
}
