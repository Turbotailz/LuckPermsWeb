<script setup lang="ts">
import type { EditorNode } from '~/types/editor'

const props = defineProps<{
  nodes: EditorNode[]
}>()

const editor = useEditorStore()
const { t } = useI18n()

const allSelected = computed(() =>
  props.nodes.length > 0 && props.nodes.every(node => editor.selectedNodeMap[node.id])
)
const someSelected = computed(() =>
  props.nodes.some(node => editor.selectedNodeMap[node.id]) && !allSelected.value
)

function selectAll(value: boolean | 'indeterminate') {
  if (value) {
    editor.selectAllSessionNodes(props.nodes)
  } else {
    editor.deselectAllSessionNodes(props.nodes)
  }
}
</script>

<template>
  <UCheckbox
    size="sm"
    :model-value="someSelected ? 'indeterminate' : allSelected"
    :aria-label="t('editor.nodes.selectAll')"
    @update:model-value="selectAll"
  />
</template>
