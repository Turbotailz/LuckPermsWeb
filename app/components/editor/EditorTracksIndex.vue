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
    <ul v-if="rows.length" role="list" class="divide-y divide-default">
      <li
        v-for="row in rows"
        :key="row.id"
        class="flex items-center justify-between gap-3 px-4 py-3 hover:bg-elevated/50 sm:px-6"
      >
        <NuxtLink
          :to="editorTrackPath(code, row.id)"
          class="flex min-w-0 flex-1 items-center gap-3"
        >
          <UAvatar icon="i-lucide-git-branch" size="md" />
          <div class="min-w-0 text-sm">
            <p
              class="truncate font-medium text-highlighted"
              :class="{ 'text-primary': row.isNew }"
            >
              {{ row.id }}
            </p>
          </div>
        </NuxtLink>

        <div class="flex min-w-0 flex-wrap items-center justify-end gap-1">
          <UButton
            v-for="groupId in row.groups"
            :key="groupId"
            :to="editorGroupPath(code, groupId)"
            size="xs"
            color="neutral"
            variant="subtle"
            icon="i-lucide-users"
          >
            {{ groupId }}
          </UButton>
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
      </li>
    </ul>
    <UEmpty
      v-else
      icon="i-lucide-search"
      variant="naked"
      :title="t('editor.noResults')"
      class="py-12"
    />
  </EditorIndexPage>
</template>
