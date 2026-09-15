<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { editorGroupPath, editorTrackPath } from '~/utils/editor-routes'

interface TrackRow {
  id: string
  groups: string[]
  isNew?: boolean
}

const editor = useEditorStore()
const { t } = useI18n()
const { code, toSection } = useEditorNavigation()
const route = useRoute()
const search = ref('')

const rows = computed<TrackRow[]>(() => {
  const query = search.value.trim().toLowerCase()
  return [...editor.tracks]
    .map(track => ({
      id: track.id,
      groups: track.groups,
      isNew: track.new
    }))
    .filter((row) => {
      if (!query) {
        return true
      }
      return [row.id, ...row.groups].some(value => value.toLowerCase().includes(query))
    })
    .sort((a, b) => a.id.localeCompare(b.id))
})

function trackById(id: string) {
  return editor.tracks.find(track => track.id === id)
}

function removeTrack(id: string) {
  editor.deleteTrack(id)
  if (route.params.trackId === id) {
    toSection('tracks')
  }
}

function actionsFor(row: TrackRow): DropdownMenuItem[] {
  return [
    {
      label: t('editor.tracks.edit'),
      icon: 'i-lucide-pencil',
      onSelect() {
        const track = trackById(row.id)
        if (track) {
          editor.setModal('createTrack', { track })
        }
      }
    },
    {
      label: t('editor.tracks.delete'),
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect() {
        removeTrack(row.id)
      }
    }
  ]
}

const GROUP_PREVIEW = 3

function visibleGroups(groups: string[]) {
  return groups.slice(0, GROUP_PREVIEW)
}

function hiddenGroupCount(groups: string[]) {
  return Math.max(0, groups.length - GROUP_PREVIEW)
}
</script>

<template>
  <EditorIndexPage
    :title="t('editor.nav.tracks')"
    :description="t('editor.index.descriptionTracks')"
    :add-label="t('editor.tracks.add')"
    :search-placeholder="t('editor.index.searchTracks')"
    v-model:search="search"
    @add="editor.setModal('createTrack')"
  >
    <EditorVirtualList v-slot="{ item: row }" :items="rows" :estimate-size="48">
      <div
        role="listitem"
        class="flex h-12 items-center justify-between gap-3 border-b border-default px-4 hover:bg-elevated/50 sm:px-6"
      >
        <NuxtLink
          :to="editorTrackPath(code, row.id)"
          class="flex min-w-32 flex-1 items-center gap-3"
        >
          <UAvatar icon="i-lucide-git-branch" size="sm" />
          <p
            class="truncate text-sm font-medium text-highlighted"
            :class="{ 'text-primary': row.isNew }"
          >
            {{ row.id }}
          </p>
        </NuxtLink>

        <div class="hidden min-w-0 shrink items-center justify-end gap-1 sm:flex">
          <UButton
            v-for="groupId in visibleGroups(row.groups)"
            :key="groupId"
            :to="editorGroupPath(code, groupId)"
            size="xs"
            color="neutral"
            variant="subtle"
            icon="i-lucide-users"
            class="max-w-28 shrink-0 truncate"
          >
            {{ groupId }}
          </UButton>
          <UTooltip
            v-if="hiddenGroupCount(row.groups)"
            :text="row.groups.slice(GROUP_PREVIEW).join(', ')"
          >
            <UBadge color="neutral" variant="subtle" size="sm" class="shrink-0 tabular-nums">
              {{ t('editor.index.moreGroups', { n: hiddenGroupCount(row.groups) }) }}
            </UBadge>
          </UTooltip>
        </div>

        <div class="flex shrink-0 items-center gap-3">
          <UTooltip :text="t('editor.index.groupsCount', row.groups.length)">
            <span class="inline-flex items-center gap-1.5 text-sm tabular-nums text-muted">
              <UIcon name="i-lucide-users" class="size-4" />
              {{ row.groups.length }}
            </span>
          </UTooltip>
          <UDropdownMenu :items="actionsFor(row)">
            <UButton
              icon="i-lucide-ellipsis-vertical"
              color="neutral"
              variant="ghost"
              size="sm"
              square
              :aria-label="t('editor.index.actions')"
            />
          </UDropdownMenu>
        </div>
      </div>
    </EditorVirtualList>
  </EditorIndexPage>
</template>
