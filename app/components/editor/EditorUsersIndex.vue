<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { TableRow } from '@tanstack/vue-table'
import { editorUserPath } from '~/utils/editor-routes'

interface UserRow {
  id: string
  name: string
  nodes: number
  modified?: boolean
}

const editor = useEditorStore()
const { t } = useI18n()
const { code, toUser } = useEditorNavigation()
const filter = useEditorSectionFilter()

const data = computed<UserRow[]>(() =>
  editor.sessions.filter(session => session.type === 'user').map(user => ({
    id: user.id,
    name: user.displayName,
    nodes: editor.document.nodes.filter(node => node.sessionId === user.id).length,
    modified: user.modified
  }))
)

const columns: TableColumn<UserRow>[] = [
  { accessorKey: 'name', header: t('editor.nav.users') },
  { accessorKey: 'id', header: 'UUID' },
  { accessorKey: 'nodes', header: t('editor.index.nodes') },
  { id: 'actions', header: '' }
]

function onSelect(event: Event, row: TableRow<UserRow>) {
  if ((event.target as HTMLElement | null)?.closest('[data-editor-row-action]')) {
    return
  }
  toUser(row.original.id)
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
          :to="editorUserPath(code, row.original.id)"
          color="neutral"
          variant="link"
          class="p-0 font-normal"
          :class="{ italic: row.original.modified }"
        >
          <span class="flex items-center gap-2">
            <PlayerAvatar :id="row.original.id" :name="row.original.name" :title="false" />
            {{ row.original.name }}
          </span>
        </UButton>
      </template>
      <template #id-cell="{ row }">
        <span class="font-mono text-sm text-muted">{{ row.original.id }}</span>
      </template>
      <template #actions-cell="{ row }">
        <UButton
          v-if="editor.canDeleteUsers"
          icon="i-lucide-x"
          size="xs"
          color="neutral"
          variant="ghost"
          data-editor-row-action
          :aria-label="t('editor.delete')"
          @click.stop="editor.setModal('deleteUser', { userId: row.original.id, name: row.original.name })"
        />
      </template>
    </UTable>
  </div>
</template>
