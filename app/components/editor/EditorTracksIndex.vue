<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { TableRow } from '@tanstack/vue-table'
import { editorTrackPath } from '~/utils/editor-routes'

interface TrackRow {
  id: string
  members: string
  count: number
  isNew?: boolean
}

const editor = useEditorStore()
const { t } = useI18n()
const { code, toTrack, toSection } = useEditorNavigation()
const route = useRoute()
const filter = useEditorSectionFilter()

const data = computed<TrackRow[]>(() =>
  [...editor.tracks].sort((a, b) => a.id.localeCompare(b.id)).map(track => ({
    id: track.id,
    members: track.groups.join(', '),
    count: track.groups.length,
    isNew: track.new
  }))
)

const columns: TableColumn<TrackRow>[] = [
  { accessorKey: 'id', header: t('editor.nav.tracks') },
  { accessorKey: 'members', header: t('editor.index.members') },
  { accessorKey: 'count', header: t('editor.index.count') },
  { id: 'actions', header: '' }
]

function onSelect(event: Event, row: TableRow<TrackRow>) {
  if ((event.target as HTMLElement | null)?.closest('[data-editor-row-action]')) {
    return
  }
  toTrack(row.original.id)
}

function trackById(id: string) {
  return editor.tracks.find(track => track.id === id)
}

function removeTrack(id: string) {
  editor.deleteTrack(id)
  if (route.params.trackId === id) {
    toSection('tracks')
  }
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <UTable
      :data="data"
      :columns="columns"
      :global-filter="filter"
      sticky
      class="flex-1"
      :ui="{ tr: 'cursor-pointer' }"
      :empty="t('editor.noResults')"
      @select="onSelect"
    >
      <template #id-cell="{ row }">
        <UButton
          :to="editorTrackPath(code, row.original.id)"
          color="neutral"
          variant="link"
          class="p-0 font-normal"
          :class="{ 'text-primary': row.original.isNew }"
        >
          {{ row.original.id }}
        </UButton>
      </template>
      <template #members-cell="{ row }">
        <span class="text-muted">{{ row.original.members }}</span>
      </template>
      <template #actions-cell="{ row }">
        <div class="flex justify-end gap-1">
          <UButton
            icon="i-lucide-pencil"
            size="xs"
            variant="ghost"
            data-editor-row-action
            :aria-label="t('editor.tracks.edit')"
            @click.stop="trackById(row.original.id) && editor.setModal('createTrack', { track: trackById(row.original.id) })"
          />
          <UButton
            icon="i-lucide-x"
            size="xs"
            variant="ghost"
            data-editor-row-action
            :aria-label="t('editor.tracks.delete')"
            @click.stop="removeTrack(row.original.id)"
          />
        </div>
      </template>
    </UTable>
  </div>
</template>
