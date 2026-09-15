<script setup lang="ts">
defineProps<{
  nodeId: string
}>()

const editor = useEditorStore()
const { t } = useI18n()
</script>

<template>
  <UCheckbox
    size="sm"
    :model-value="!!editor.selectedNodeMap[nodeId]"
    :aria-label="t('editor.nodes.select')"
    @update:model-value="editor.toggleNodeSelect(nodeId)"
  />
</template>
