<script setup lang="ts">
import type { EditorNode } from '~/types/editor'

const props = defineProps<{
  node: EditorNode
  showType?: boolean
}>()

const editor = useEditorStore()
const { t } = useI18n()
const selected = computed(() => editor.selectedNodeIds.includes(props.node.id))
</script>

<template>
  <div
    class="flex items-center gap-3 border-b border-default px-3 py-2 text-sm"
    :class="{ 'bg-primary/10': node.isNew, 'bg-warning/10': node.modified && !node.isNew }"
  >
    <UCheckbox
      :model-value="selected"
      :aria-label="t('editor.nodes.select')"
      @update:model-value="editor.toggleNodeSelect(node.id)"
    />
    <EditorNodeKey :node="node" :show-type="showType" class="min-w-0 flex-1" />
    <USwitch
      size="sm"
      :model-value="node.value"
      :aria-label="t('editor.enabled')"
      @update:model-value="editor.updateNode(node.id, 'value', $event)"
    />
    <EditorNodeExpiry :node="node" />
    <EditorNodeContexts :node="node" class="min-w-0 max-w-48" />
    <UButton
      icon="i-lucide-x"
      size="xs"
      variant="ghost"
      color="error"
      :aria-label="t('editor.delete')"
      @click="editor.deleteNode(node.id)"
    />
  </div>
</template>
