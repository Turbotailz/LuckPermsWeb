<script setup lang="ts">
import type { EditorNode } from '~/types/editor'

const props = defineProps<{
  node: EditorNode
  showType?: boolean
}>()

const editor = useEditorStore()
const { t } = useI18n()
const selected = computed(() => !!editor.selectedNodeMap[props.node.id])
</script>

<template>
  <div
    class="flex items-center gap-3 border-b border-default px-3 py-2 text-sm"
    :class="{ 'lp-row-added': node.isNew, 'lp-row-changed': node.modified && !node.isNew }"
  >
    <UCheckbox
      :model-value="selected"
      :aria-label="t('editor.nodes.select')"
      @update:model-value="editor.toggleNodeSelect(node.id)"
    />
    <EditorNodeKey :node="node" :show-type="showType" class="min-w-0 flex-1" />
    <EditorValueBadge :node-id="node.id" :value="node.value" />
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
