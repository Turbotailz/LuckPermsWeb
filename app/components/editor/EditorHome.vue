<script setup lang="ts">
import type { ProgressGroupItem } from '@nuxt/ui'
import {
  editorGroupPath,
  editorSectionPath
} from '~/utils/editor-routes'

const NODE_TYPE_META: Record<string, Pick<ProgressGroupItem, 'color' | 'icon'>> = {
  permission: { color: 'primary', icon: 'i-lucide-key-round' },
  inheritance: { color: 'info', icon: 'i-lucide-git-merge' },
  weight: { color: 'neutral', icon: 'i-lucide-scale' },
  prefix: { color: 'success', icon: 'i-lucide-text' },
  suffix: { color: 'warning', icon: 'i-lucide-whole-word' },
  meta: { color: 'secondary', icon: 'i-lucide-tag' },
  displayname: { color: 'error', icon: 'i-lucide-type' }
}

const SEGMENT_COLORS = ['primary', 'info', 'success', 'warning', 'secondary', 'error', 'neutral'] as const

const { t } = useI18n()
const { code } = useEditorNavigation()
const insights = useEditorInsights()
const toast = useToast()

const stats = computed(() => [
  {
    key: 'groups',
    title: t('editor.nav.groups'),
    icon: 'i-lucide-users',
    value: insights.groupCount,
    to: editorSectionPath(code.value, 'groups')
  },
  {
    key: 'users',
    title: t('editor.nav.users'),
    icon: 'i-lucide-user',
    value: insights.userCount,
    to: editorSectionPath(code.value, 'users')
  },
  {
    key: 'tracks',
    title: t('editor.nav.tracks'),
    icon: 'i-lucide-git-branch',
    value: insights.trackCount,
    to: editorSectionPath(code.value, 'tracks')
  },
  {
    key: 'nodes',
    title: t('editor.home.nodes'),
    icon: 'i-lucide-key-round',
    value: insights.nodeCount
  }
])

const sessionBits = computed(() => {
  const bits: { label: string, value: string }[] = []
  if (insights.platform) {
    bits.push({ label: t('editor.home.platform'), value: insights.platform })
  }
  if (insights.uploader) {
    bits.push({ label: t('editor.home.uploader'), value: insights.uploader })
  }
  if (insights.uploadedAt) {
    bits.push({ label: t('editor.home.uploaded'), value: insights.uploadedAt })
  }
  bits.push({ label: t('editor.home.alias'), value: `/${insights.alias}` })
  return bits
})

const nodeTypeItems = computed<ProgressGroupItem[]>(() =>
  insights.nodeTypes.map(item => ({
    label: t(`editor.home.nodeType.${item.key}`),
    value: item.count,
    ...NODE_TYPE_META[item.key]
  }))
)

const contextItems = computed<ProgressGroupItem[]>(() =>
  insights.contextUsage.map((item, index) => ({
    label: item.label,
    value: item.count,
    color: SEGMENT_COLORS[index % SEGMENT_COLORS.length]
  }))
)

const contextMax = computed(() =>
  insights.contextUsage.reduce((sum, item) => sum + item.count, 0)
)

const usedNamespaceItems = computed<ProgressGroupItem[]>(() =>
  insights.usedNamespaceBreakdown.map((item, index) => ({
    label: item.key === 'other' ? t('editor.home.namespacesOther') : item.key,
    value: item.count,
    color: SEGMENT_COLORS[index % SEGMENT_COLORS.length]
  }))
)

const usedNamespaceMax = computed(() =>
  insights.usedNamespaceBreakdown.reduce((sum, item) => sum + item.count, 0)
)

function coverageColor(usedKnown: number, known: number) {
  if (usedKnown <= 0) {
    return 'warning'
  }
  if (usedKnown >= known) {
    return 'success'
  }
  return 'primary'
}

const pluginBadgeColor = computed(() => {
  switch (insights.pluginUpdate.status) {
    case 'current':
      return 'success'
    case 'outdated':
      return 'warning'
    case 'ahead':
      return 'info'
    default:
      return 'neutral'
  }
})

const pluginStatusLabel = computed(() => {
  switch (insights.pluginUpdate.status) {
    case 'current':
      return t('editor.home.versionCurrent')
    case 'outdated':
      return t('editor.home.versionOutdated')
    case 'ahead':
      return t('editor.home.versionAhead', { latest: insights.pluginUpdate.latestVersion })
    default:
      return ''
  }
})

const outdatedActions = computed(() => [{
  label: t('editor.home.downloadLatest', { version: insights.pluginUpdate.latestVersion }),
  icon: 'i-lucide-download',
  to: insights.pluginUpdate.to,
  target: insights.pluginUpdate.external ? '_blank' : undefined,
  external: insights.pluginUpdate.external,
  color: 'warning' as const,
  onClick: insights.pluginUpdate.downloadPlatform
    ? () => trackPlausible('Download', { type: insights.pluginUpdate.downloadPlatform })
    : undefined
}])

async function copySessionId() {
  if (!insights.sessionId || !import.meta.client) {
    return
  }
  await navigator.clipboard.writeText(insights.sessionId)
  toast.add({ title: t('editor.home.copiedId'), color: 'success' })
}
</script>

<template>
  <div class="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <UPageCard
        :title="t('editor.home.title')"
        :description="t('editor.home.description')"
        variant="naked"
        orientation="horizontal"
      >
        <div class="flex flex-wrap items-center gap-2 lg:ms-auto">
          <UBadge
            v-if="insights.pluginVersion"
            :color="pluginBadgeColor"
            variant="subtle"
          >
            <span class="text-muted">{{ t('editor.home.plugin') }}</span>
            <span class="font-medium text-highlighted">{{ insights.pluginVersion }}</span>
            <span v-if="pluginStatusLabel" class="text-muted">· {{ pluginStatusLabel }}</span>
          </UBadge>
          <UBadge
            v-for="bit in sessionBits"
            :key="bit.label"
            color="neutral"
            variant="subtle"
          >
            <span class="text-muted">{{ bit.label }}</span>
            <span class="font-medium text-highlighted">{{ bit.value }}</span>
          </UBadge>
          <UButton
            v-if="insights.sessionId"
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-lucide-copy"
            :label="insights.sessionId"
            @click="copySessionId"
          />
        </div>
      </UPageCard>

      <UAlert
        v-if="insights.pluginUpdate.status === 'outdated'"
        color="warning"
        variant="subtle"
        icon="i-lucide-circle-alert"
        orientation="horizontal"
        :title="t('editor.home.outdatedTitle')"
        :description="t('editor.home.outdatedDescription', {
          current: insights.pluginVersion,
          latest: insights.pluginUpdate.latestVersion
        })"
        :actions="outdatedActions"
      />

      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <UPageCard
          v-for="stat in stats"
          :key="stat.key"
          :to="stat.to"
          :icon="stat.icon"
          :title="stat.title"
          variant="subtle"
        >
          <p class="text-2xl font-semibold tabular-nums text-highlighted">
            {{ stat.value.toLocaleString() }}
          </p>
        </UPageCard>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <UPageCard
          :title="t('editor.home.nodeMix')"
          variant="subtle"
        >
          <UProgressGroup
            v-if="insights.nodeCount"
            status
            :max="insights.nodeCount"
            :items="nodeTypeItems"
            :ui="{ status: 'w-full justify-between' }"
          >
            <template #status>
              <p>{{ insights.nodeCount.toLocaleString() }} {{ t('editor.home.nodes') }}</p>
              <p class="text-muted">
                {{ t('editor.home.nodeMixHint', {
                  unique: insights.uniquePermissions.toLocaleString(),
                  known: insights.knownPermissions.toLocaleString()
                }) }}
              </p>
            </template>
            <template #item-trailing="{ item }">
              {{ (item.value || 0).toLocaleString() }}
            </template>
          </UProgressGroup>
          <div class="mt-4 flex flex-wrap gap-2 text-xs text-muted">
            <span>{{ t('editor.home.negated', { n: insights.negated }) }}</span>
            <span>{{ t('editor.home.expiry', { n: insights.withExpiry }) }}</span>
            <span>{{ t('editor.home.contextual', { n: insights.withContext }) }}</span>
          </div>
        </UPageCard>

        <UPageCard
          :title="t('editor.home.contexts')"
          :description="t('editor.home.contextsHint')"
          variant="subtle"
        >
          <UProgressGroup
            v-if="contextItems.length"
            :max="contextMax"
            :items="contextItems"
          >
            <template #item-label="{ item }">
              <span class="font-mono">{{ item.label }}</span>
            </template>
            <template #item-trailing="{ item }">
              {{ (item.value || 0).toLocaleString() }}
            </template>
          </UProgressGroup>
          <p v-else class="text-sm text-muted">
            {{ t('editor.home.noContexts') }}
          </p>
          <div
            v-if="insights.potentialContexts.length"
            class="mt-4 flex flex-wrap gap-1.5"
          >
            <UBadge
              v-for="ctx in insights.potentialContexts"
              :key="ctx.key"
              color="neutral"
              variant="subtle"
              :label="`${ctx.key} (${ctx.values.length})`"
            />
          </div>
        </UPageCard>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <UPageCard
          :title="t('editor.home.usedNamespaces')"
          :description="t('editor.home.usedNamespacesHint')"
          variant="subtle"
        >
          <UProgressGroup
            v-if="usedNamespaceItems.length"
            status
            :max="usedNamespaceMax"
            :items="usedNamespaceItems"
            :ui="{ status: 'w-full justify-between' }"
          >
            <template #status>
              <p>{{ t('editor.home.usedNamespacesStatus', insights.uniquePermissions) }}</p>
              <p v-if="insights.unknownUniqueCount" class="text-muted">
                {{ t('editor.home.usedNamespacesUnknown', insights.unknownUniqueCount) }}
              </p>
            </template>
            <template #item-label="{ item }">
              <span class="font-mono">{{ item.label }}</span>
            </template>
            <template #item-trailing="{ item }">
              {{ (item.value || 0).toLocaleString() }}
            </template>
          </UProgressGroup>
        </UPageCard>

        <UPageCard
          :title="t('editor.home.knownCoverage')"
          :description="t('editor.home.knownCoverageHint')"
          variant="subtle"
        >
          <ul v-if="insights.knownCoverage.length" class="space-y-3">
            <li
              v-for="item in insights.knownCoverage"
              :key="item.key"
              class="space-y-1"
            >
              <div class="flex items-center justify-between gap-2 text-sm">
                <span class="truncate font-mono font-medium text-highlighted">{{ item.key }}</span>
                <span class="shrink-0 tabular-nums text-muted">
                  {{ t('editor.home.knownUsed', { used: item.usedKnown, known: item.known }) }}
                </span>
              </div>
              <UProgress
                :model-value="item.usedKnown"
                :max="item.known"
                size="xs"
                :color="coverageColor(item.usedKnown, item.known)"
              />
            </li>
          </ul>
          <p v-else class="text-sm text-muted">
            {{ t('editor.home.noKnown') }}
          </p>
        </UPageCard>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <UPageCard
          :title="t('editor.home.heaviestGroups')"
          :description="t('editor.home.heaviestGroupsHint')"
          variant="subtle"
          :ui="{ container: 'gap-y-0 p-0 sm:p-0', wrapper: 'px-4 pt-4 sm:px-6 sm:pt-6' }"
        >
          <ul class="divide-y divide-default">
            <li
              v-for="group in insights.heaviestGroups"
              :key="group.id"
            >
              <NuxtLink
                :to="group.to"
                class="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-elevated/50 sm:px-6"
              >
                <span class="min-w-0 truncate font-medium text-highlighted">{{ group.name }}</span>
                <span class="flex shrink-0 items-center gap-3 tabular-nums text-muted">
                  <span v-if="group.weight" class="inline-flex items-center gap-1">
                    <UIcon name="i-lucide-scale" class="size-3.5" />
                    {{ group.weight }}
                  </span>
                  <span class="inline-flex items-center gap-1">
                    <UIcon name="i-lucide-key-round" class="size-3.5" />
                    {{ group.count.toLocaleString() }}
                  </span>
                </span>
              </NuxtLink>
            </li>
          </ul>
        </UPageCard>

        <UPageCard
          :title="t('editor.home.userParents')"
          :description="t('editor.home.userParentsHint')"
          variant="subtle"
          :ui="{ container: 'gap-y-0 p-0 sm:p-0', wrapper: 'px-4 pt-4 sm:px-6 sm:pt-6' }"
        >
          <ul v-if="insights.userParents.length" class="divide-y divide-default">
            <li
              v-for="item in insights.userParents"
              :key="item.key"
            >
              <NuxtLink
                :to="editorGroupPath(code, item.key)"
                class="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-elevated/50 sm:px-6"
              >
                <span class="min-w-0 truncate font-medium text-highlighted">{{ item.label }}</span>
                <span class="shrink-0 tabular-nums text-muted">{{ t('editor.home.usersInGroup', item.count) }}</span>
              </NuxtLink>
            </li>
          </ul>
          <p v-else class="px-4 pb-4 text-sm text-muted sm:px-6 sm:pb-6">
            {{ t('editor.home.noUserParents') }}
          </p>
        </UPageCard>
      </div>

      <UPageCard
        v-if="insights.tracks.length"
        :title="t('editor.home.tracks')"
        variant="subtle"
        :ui="{ container: 'gap-y-0 p-0 sm:p-0', wrapper: 'px-4 pt-4 sm:px-6 sm:pt-6' }"
      >
        <ul class="divide-y divide-default">
          <li
            v-for="track in insights.tracks"
            :key="track.id"
          >
            <NuxtLink
              :to="track.to"
              class="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-elevated/50 sm:px-6"
            >
              <span class="font-medium text-highlighted">{{ track.id }}</span>
              <span class="min-w-0 truncate text-muted">{{ track.groups.join(', ') || t('editor.home.emptyTrack') }}</span>
            </NuxtLink>
          </li>
        </ul>
      </UPageCard>

      <UPageCard
        v-if="insights.emptyGroups.length"
        :title="t('editor.home.emptyGroups')"
        :description="t('editor.home.emptyGroupsHint')"
        variant="subtle"
      >
        <div class="flex flex-wrap gap-1.5">
          <UButton
            v-for="group in insights.emptyGroups"
            :key="group.id"
            :to="editorGroupPath(code, group.id)"
            size="xs"
            color="neutral"
            variant="subtle"
          >
            {{ group.displayName }}
          </UButton>
        </div>
      </UPageCard>
    </div>
  </div>
</template>
