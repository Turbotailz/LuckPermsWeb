<script setup lang="ts">
import { useVirtualizer } from '@tanstack/vue-virtual'
import type { EditorNode } from '~/types/editor'
import { contextSortKey } from '~/utils/editor'

const props = defineProps<{ nodes: EditorNode[] }>()
const editor = useEditorStore()
const { t } = useI18n()

const sort = reactive({ method: 'key' as string, desc: true })
const parentRef = ref<HTMLElement | null>(null)

const sortedNodes = computed(() => {
  const copy = [...props.nodes]
  copy.sort((a, b) => {
    let cmp = 0
    if (sort.method === 'key') {
      cmp = a.key.localeCompare(b.key)
    } else if (sort.method === 'value') {
      cmp = Number(a.value) - Number(b.value)
    } else if (sort.method === 'expiry') {
      cmp = (a.expiry || 0) - (b.expiry || 0)
    } else {
      cmp = contextSortKey(a.context).localeCompare(contextSortKey(b.context))
    }
    return sort.desc ? cmp : -cmp
  })
  return copy
})

const virtualizer = useVirtualizer(computed(() => ({
  count: sortedNodes.value.length,
  getScrollElement: () => parentRef.value,
  estimateSize: () => 44,
  overscan: 12
})))

const selectedInView = computed(() => {
  const ids = new Set(props.nodes.map(node => node.id))
  return editor.selectedNodeIds.filter(id => ids.has(id))
})
const allSelected = computed(() => props.nodes.length > 0 && selectedInView.value.length === props.nodes.length)

function changeSort(method: string) {
  if (sort.method === method) {
    sort.desc = !sort.desc
  } else {
    sort.desc = true
    sort.method = method
  }
}

function selectAll() {
  if (allSelected.value) {
    editor.deselectAllSessionNodes(props.nodes)
  } else {
    editor.selectAllSessionNodes(props.nodes)
  }
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="grid grid-cols-[2rem_minmax(0,2fr)_6rem_8rem_minmax(0,1.5fr)_2rem] items-center gap-2 border-b border-default bg-muted px-3 py-2 text-sm font-semibold text-highlighted">
      <UCheckbox :model-value="allSelected" :aria-label="t('editor.nodes.selectAll')" @update:model-value="selectAll" />
      <UButton color="neutral" variant="link" class="justify-start gap-1.5 px-0" @click="changeSort('key')">
        {{ t('editor.permissions') }}
        <UBadge color="neutral" variant="subtle" size="xs">{{ nodes.length }}</UBadge>
      </UButton>
      <UButton color="neutral" variant="link" class="justify-start px-0" @click="changeSort('value')">{{ t('editor.value') }}</UButton>
      <UButton color="neutral" variant="link" class="justify-start px-0" @click="changeSort('expiry')">{{ t('editor.expiry') }}</UButton>
      <UButton color="neutral" variant="link" class="justify-start px-0" @click="changeSort('contexts')">{{ t('editor.contexts') }}</UButton>
      <span />
    </div>
    <div ref="parentRef" class="min-h-0 flex-1 overflow-auto">
      <div :style="{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }">
        <EditorNodeRow
          v-for="virtualRow in virtualizer.getVirtualItems()"
          :key="sortedNodes[virtualRow.index]!.id"
          :node="sortedNodes[virtualRow.index]!"
          class="absolute left-0 w-full"
          :style="{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }"
        />
      </div>
    </div>
  </div>
</template>
