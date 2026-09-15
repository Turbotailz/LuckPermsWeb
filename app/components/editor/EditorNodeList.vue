<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { EditorNode } from '~/types/editor'
import { contextSortKey, parseNodeType } from '~/utils/editor'

const props = defineProps<{
  nodes: EditorNode[]
  advanced?: boolean
}>()

const editor = useEditorStore()
const { t } = useI18n()

const selectedInView = computed(() => {
  const ids = new Set(props.nodes.map(node => node.id))
  return editor.selectedNodeIds.filter(id => ids.has(id))
})
const allSelected = computed(() => props.nodes.length > 0 && selectedInView.value.length === props.nodes.length)
const someSelected = computed(() => selectedInView.value.length > 0 && !allSelected.value)

function selectAll(value: boolean | 'indeterminate') {
  if (value) {
    editor.selectAllSessionNodes(props.nodes)
  } else {
    editor.deselectAllSessionNodes(props.nodes)
  }
}

const columns = computed(() => {
  const cols: TableColumn<EditorNode>[] = [
    {
      id: 'select',
      enableSorting: false,
      meta: { class: { th: 'w-10', td: 'w-10' } }
    }
  ]

  if (props.advanced) {
    cols.push({
      id: 'type',
      accessorFn: row => parseNodeType(row.key).type,
      header: t('editor.nodes.type'),
      meta: { class: { th: 'w-28', td: 'w-28' } }
    })
  }

  cols.push(
    {
      accessorKey: 'key',
      header: t('editor.permissions')
    },
    {
      accessorKey: 'value',
      header: t('editor.enabled'),
      meta: { class: { th: 'w-24', td: 'w-24' } }
    },
    {
      accessorKey: 'expiry',
      header: t('editor.expiry'),
      sortingFn: (a, b) => (a.original.expiry || Number.MAX_SAFE_INTEGER) - (b.original.expiry || Number.MAX_SAFE_INTEGER),
      meta: { class: { th: 'w-28', td: 'w-28' } }
    },
    {
      id: 'contexts',
      accessorFn: row => contextSortKey(row.context),
      header: t('editor.contexts')
    },
    {
      id: 'actions',
      enableSorting: false,
      meta: { class: { th: 'w-10', td: 'w-10' } }
    }
  )

  return cols
})
</script>

<template>
  <UTable
    :data="nodes"
    :columns="columns"
    :get-row-id="(row: EditorNode) => row.id"
    sticky
    :virtualize="{ estimateSize: 36, overscan: 12 }"
    :empty="t('editor.nodes.empty')"
    class="h-full min-h-0"
    :ui="{
      th: 'bg-muted/50 px-3 py-2',
      td: 'px-3 py-1.5 text-sm'
    }"
  >
    <template #select-header>
      <UCheckbox
        size="sm"
        :model-value="someSelected ? 'indeterminate' : allSelected"
        :aria-label="t('editor.nodes.selectAll')"
        @update:model-value="selectAll"
      />
    </template>
    <template #select-cell="{ row }">
      <UCheckbox
        size="sm"
        :model-value="editor.selectedNodeIds.includes(row.original.id)"
        :aria-label="t('editor.nodes.select')"
        @update:model-value="editor.toggleNodeSelect(row.original.id)"
      />
    </template>
    <template #type-cell="{ row }">
      <UBadge size="xs" variant="subtle">
        {{ t(`editor.nodes.types.${parseNodeType(row.original.key).type}`) }}
      </UBadge>
    </template>
    <template #key-cell="{ row }">
      <EditorNodeKey :node="row.original" />
    </template>
    <template #value-cell="{ row }">
      <USwitch
        size="xs"
        :model-value="row.original.value"
        :aria-label="t('editor.enabled')"
        @update:model-value="editor.updateNode(row.original.id, 'value', $event)"
      />
    </template>
    <template #expiry-cell="{ row }">
      <EditorNodeExpiry :node="row.original" />
    </template>
    <template #contexts-cell="{ row }">
      <EditorNodeContexts :node="row.original" />
    </template>
    <template #actions-cell="{ row }">
      <UButton
        icon="i-lucide-x"
        size="xs"
        variant="ghost"
        color="error"
        :aria-label="t('editor.delete')"
        @click="editor.deleteNode(row.original.id)"
      />
    </template>
  </UTable>
</template>
