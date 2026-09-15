<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn, TableRow } from '@nuxt/ui'
import type { Column, ColumnFiltersState, SortingState } from '@tanstack/vue-table'
import type { EditorNode } from '~/types/editor'
import { contextSortKey, parseNodeType } from '~/utils/editor'

const props = defineProps<{
  nodes: EditorNode[]
  advanced?: boolean
}>()

const editor = useEditorStore()
const { t } = useI18n()

const sorting = ref<SortingState>([{ id: 'key', desc: false }])
const columnFilters = ref<ColumnFiltersState>([])

function sortableHeader(label: string, centered = false) {
  return ({ column }: { column: Column<EditorNode, unknown> }) => {
    const isSorted = column.getIsSorted()
    const button = h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      size: 'sm',
      label,
      icon: isSorted
        ? (isSorted === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : 'i-lucide-arrow-down-wide-narrow')
        : 'i-lucide-arrow-up-down',
      class: centered ? '-mx-2.5' : '-ms-2.5',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
    })
    return centered ? h('div', { class: 'flex justify-center' }, [button]) : button
  }
}

const tableMeta = {
  class: {
    tr: (row: TableRow<EditorNode>) => {
      if (row.original.isNew) {
        return 'bg-primary/10'
      }
      if (row.original.modified) {
        return 'bg-warning/10'
      }
      return undefined
    }
  }
}

const columns = computed(() => {
  const cols: TableColumn<EditorNode>[] = [
    {
      id: 'select',
      enableSorting: false,
      enableResizing: false,
      size: 40,
      meta: {
        class: {
          th: 'w-10 min-w-10 max-w-10',
          td: 'w-10 min-w-10 max-w-10'
        }
      }
    }
  ]

  if (props.advanced) {
    cols.push({
      id: 'type',
      accessorFn: row => parseNodeType(row.key).type,
      header: sortableHeader(t('editor.nodes.type')),
      enableResizing: false,
      size: 112,
      meta: {
        class: {
          th: 'w-28 min-w-28 max-w-28',
          td: 'w-28 min-w-28 max-w-28'
        }
      }
    })
  }

  cols.push(
    {
      accessorKey: 'key',
      header: sortableHeader(t('editor.permissions')),
      size: 400,
      filterFn: 'includesString',
      meta: {
        class: {
          th: 'min-w-0 w-full',
          td: 'min-w-0 w-full'
        }
      }
    },
    {
      accessorKey: 'value',
      header: sortableHeader(t('editor.enabled'), true),
      enableResizing: false,
      size: 96,
      sortingFn: (a, b) => Number(b.original.value) - Number(a.original.value),
      meta: {
        class: {
          th: 'w-24 min-w-24 max-w-24 text-center',
          td: 'w-24 min-w-24 max-w-24 text-center'
        }
      }
    },
    {
      accessorKey: 'expiry',
      header: sortableHeader(t('editor.expiry'), true),
      enableResizing: false,
      size: 112,
      sortingFn: (a, b) => (a.original.expiry || Number.MAX_SAFE_INTEGER) - (b.original.expiry || Number.MAX_SAFE_INTEGER),
      meta: {
        class: {
          th: 'w-28 min-w-28 max-w-28 text-center',
          td: 'w-28 min-w-28 max-w-28 text-center'
        }
      }
    },
    {
      id: 'contexts',
      accessorFn: row => contextSortKey(row.context),
      header: sortableHeader(t('editor.contexts')),
      enableResizing: false,
      size: 180,
      meta: {
        class: {
          th: 'w-44 min-w-44 max-w-44',
          td: 'w-44 min-w-44 max-w-44'
        }
      }
    },
    {
      id: 'actions',
      enableSorting: false,
      enableResizing: false,
      size: 40,
      meta: {
        class: {
          th: 'w-10 min-w-10 max-w-10',
          td: 'w-10 min-w-10 max-w-10'
        }
      }
    }
  )

  return cols
})

const keyFilterValue = computed({
  get() {
    const filter = columnFilters.value.find(item => item.id === 'key')
    return typeof filter?.value === 'string' ? filter.value : ''
  },
  set(value: string) {
    const next = value.trim()
      ? [{ id: 'key', value }]
      : []
    columnFilters.value = next
  }
})

function clearKeyFilter() {
  keyFilterValue.value = ''
}
</script>

<template>
  <UTable
    v-model:sorting="sorting"
    v-model:column-filters="columnFilters"
    :data="nodes"
    :columns="columns"
    :meta="tableMeta"
    :get-row-id="(row: EditorNode) => row.id"
    sticky
    :virtualize="{ estimateSize: 36, overscan: 12 }"
    :empty="t('editor.nodes.empty')"
    class="h-full min-h-0"
    :ui="{
      base: 'table-fixed min-w-full',
      th: 'bg-muted/50 px-3 py-2',
      td: 'px-3 py-1.5 text-sm overflow-hidden'
    }"
  >
    <template #select-header>
      <EditorNodeSelectAll :nodes="nodes" />
    </template>
    <template #select-cell="{ row }">
      <EditorNodeSelect :node-id="row.original.id" />
    </template>
    <template #key-header="{ column }">
      <div class="flex min-w-0 items-center gap-1.5">
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          class="-ms-2.5 shrink-0"
          :label="t('editor.permissions')"
          :icon="column.getIsSorted()
            ? (column.getIsSorted() === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : 'i-lucide-arrow-down-wide-narrow')
            : 'i-lucide-arrow-up-down'"
          @click="column.toggleSorting(column.getIsSorted() === 'asc')"
        />
        <UInput
          v-model="keyFilterValue"
          icon="i-lucide-list-filter"
          size="xs"
          :placeholder="t('editor.filter')"
          class="min-w-0 flex-1"
          :ui="{ base: 'font-mono' }"
          @click.stop
        >
          <template v-if="keyFilterValue" #trailing>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="link"
              size="xs"
              :aria-label="t('editor.clearFilters')"
              @click.stop="clearKeyFilter"
            />
          </template>
        </UInput>
      </div>
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
      <div class="flex justify-center">
        <USwitch
          size="xs"
          :model-value="row.original.value"
          :aria-label="t('editor.enabled')"
          @update:model-value="editor.updateNode(row.original.id, 'value', $event)"
        />
      </div>
    </template>
    <template #expiry-cell="{ row }">
      <div class="flex justify-center">
        <EditorNodeExpiry :node="row.original" />
      </div>
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
