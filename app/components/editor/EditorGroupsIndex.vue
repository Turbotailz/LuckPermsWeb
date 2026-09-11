<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { TableRow } from '@tanstack/vue-table'
import { editorGroupPath } from '~/utils/editor-routes'

interface GroupRow {
  id: string
  name: string
  weight: string
  nodes: number
  isNew?: boolean
  modified?: boolean
}

const editor = useEditorStore()
const { t } = useI18n()
const { code, toGroup } = useEditorNavigation()
const filter = useEditorSectionFilter()

const groups = computed(() => editor.sessions.filter(session => session.type === 'group'))

const data = computed<GroupRow[]>(() => groups.value.map(group => ({
  id: group.id,
  name: group.displayName,
  weight: weightFor(group.id),
  nodes: editor.document.nodes.filter(node => node.sessionId === group.id).length,
  isNew: group.new,
  modified: group.modified
})))

const columns: TableColumn<GroupRow>[] = [
  { accessorKey: 'name', header: t('editor.nav.groups') },
  { accessorKey: 'id', header: t('editor.groups.name') },
  { accessorKey: 'weight', header: t('editor.index.weight') },
  { accessorKey: 'nodes', header: t('editor.index.nodes') },
  { id: 'actions', header: '' }
]

function weightFor(groupId: string) {
  const node = editor.weightNodes.find(item => item.sessionId === groupId)
  return node ? node.key.split('weight.')[1] || '' : ''
}

function onSelect(event: Event, row: TableRow<GroupRow>) {
  if ((event.target as HTMLElement | null)?.closest('[data-editor-row-action]')) {
    return
  }
  toGroup(row.original.id)
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
      <template #name-cell="{ row }">
        <UButton
          :to="editorGroupPath(code, row.original.id)"
          color="neutral"
          variant="link"
          class="p-0 font-normal"
          :class="{ 'text-primary': row.original.isNew, italic: row.original.modified }"
        >
          {{ row.original.name }}
        </UButton>
      </template>
      <template #id-cell="{ row }">
        <span class="font-mono text-sm text-muted">{{ row.original.id }}</span>
      </template>
      <template #actions-cell="{ row }">
        <UButton
          v-if="row.original.id !== 'default'"
          icon="i-lucide-x"
          size="xs"
          color="neutral"
          variant="ghost"
          data-editor-row-action
          :aria-label="t('editor.delete')"
          @click.stop="editor.setModal('deleteGroup', { groupId: row.original.id })"
        />
      </template>
    </UTable>
  </div>
</template>
