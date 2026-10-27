<script setup lang="ts">
const props = defineProps<{
  value: boolean
  nodeId: string
}>()

const editor = useEditorStore()
const { t } = useI18n()

function toggle() {
  editor.updateNode(props.nodeId, 'value', !props.value)
}
</script>

<template>
  <button
    type="button"
    role="switch"
    class="lp-value"
    :data-value="value ? 'true' : 'false'"
    :aria-checked="value ? 'true' : 'false'"
    :aria-label="t('editor.enabled')"
    @click="toggle"
  >
    {{ value ? 'true' : 'false' }}
  </button>
</template>
