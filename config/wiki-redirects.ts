export const wikiRedirects: Record<string, string> = {
  '/wiki/Home': '/wiki',
  '/wiki/Installation': '/wiki/install',
  '/wiki/Network-Installation': '/wiki/install/network',
  '/wiki/Hytale': '/wiki/install/hytale',
  '/wiki/Usage': '/wiki/getting-started',
  '/wiki/Storage-types': '/wiki/storage',
  '/wiki/Configuration': '/wiki/configuration',
  '/wiki/FAQ': '/wiki/faq',
  '/wiki/Command-Usage': '/wiki/commands',
  '/wiki/General-Commands': '/wiki/commands/general',
  '/wiki/User-Commands': '/wiki/commands/user',
  '/wiki/Group-Commands': '/wiki/commands/group',
  '/wiki/Permission-Commands': '/wiki/commands/permission',
  '/wiki/Parent-Commands': '/wiki/commands/parent',
  '/wiki/Meta-Commands': '/wiki/commands/meta',
  '/wiki/Track-Commands': '/wiki/commands/track',
  '/wiki/Log-Commands': '/wiki/commands/log',
  '/wiki/Permissions': '/wiki/commands/permissions',
  '/wiki/Web-Editor': '/wiki/features/web-editor',
  '/wiki/Web-Editor-Technical-Details': '/wiki/features/web-editor/technical',
  '/wiki/Context': '/wiki/features/context',
  '/wiki/Weight': '/wiki/features/weight',
  '/wiki/Prefixes,-Suffixes-&-Meta': '/wiki/features/prefixes-suffixes-meta',
  '/wiki/Verbose': '/wiki/features/verbose',
  '/wiki/Tracks': '/wiki/features/tracks',
  '/wiki/Default-Groups': '/wiki/features/default-groups',
  '/wiki/Syncing-data-between-servers': '/wiki/guides/syncing',
  '/wiki/Storage-system-errors': '/wiki/guides/storage-errors',
  '/wiki/Migration': '/wiki/guides/migration',
  '/wiki/Switching-storage-types': '/wiki/guides/switching-storage',
  '/wiki/Bulk-Editing': '/wiki/guides/bulk-editing',
  '/wiki/Prefix-&-Suffix-Stacking': '/wiki/guides/prefix-stacking',
  '/wiki/Extensions': '/wiki/guides/extensions',
  '/wiki/Argument-based-command-permissions': '/wiki/guides/argument-permissions',
  '/wiki/Developer-API': '/wiki/developers/api',
  '/wiki/Developer-API-Usage': '/wiki/developers/api-usage',
  '/wiki/Standalone-and-REST-API': '/wiki/developers/standalone-rest',
  '/wiki/Contributing': '/wiki/developers/contributing',
  '/wiki/Upgrading-from-v4-to-v5': '/wiki/reference/upgrade-v4-v5',
  '/wiki/Migrating-from-GroupManager-or-PermissionsEx': '/wiki/reference/migrating-gm-pex',
  '/wiki/Advanced-Setup': '/wiki/reference/permission-calculation',
  '/wiki/Self-hosting-the-web-interfaces': '/wiki/reference/self-hosting',
  '/wiki/Why-LuckPerms': '/wiki/about/why-luckperms',
  '/wiki/Credits': '/wiki/about/credits',
  '/wiki/Locale-and-Translations': '/wiki/about/locale',
  '/wiki/Placeholders': '/wiki/about/placeholders',
  '/wiki/External-connections': '/wiki/about/external-connections'
}

function isCaseOnlyRedirect(from: string, to: string) {
  return from !== to && from.toLowerCase() === to.toLowerCase()
}

/** Old GitHub wiki URLs that differ from the new path only by case. */
export const wikiCaseOnlyRedirects = Object.fromEntries(
  Object.entries(wikiRedirects).filter(([from, to]) => isCaseOnlyRedirect(from, to))
) as Record<string, string>

export function wikiRouteRules() {
  // Vue Router matches routeRules case-insensitively, so `/wiki/FAQ` → `/wiki/faq`
  // would loop forever and blank the FAQ / Configuration pages.
  return Object.fromEntries(
    Object.entries(wikiRedirects)
      .filter(([from, to]) => !isCaseOnlyRedirect(from, to))
      .map(([from, to]) => [
        from,
        { redirect: { to, statusCode: 301 as const } }
      ])
  )
}
