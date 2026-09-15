<script setup lang="ts">
import type { EditorNode } from '~/types/editor'
import { nodeDisplayValue, parseNodeType } from '~/utils/editor'

const props = defineProps<{
  node: EditorNode
  showType?: boolean
}>()

const editor = useEditorStore()
const { t } = useI18n()
const editing = ref(false)
const keyValue = ref(props.node.key)

watch(() => props.node.key, (value) => {
  keyValue.value = value
})

const parsed = computed(() => parseNodeType(props.node.key))
const display = computed(() => nodeDisplayValue(props.node.key))
const chatValue = computed(() => {
  if (parsed.value.type === 'prefix') {
    return parsed.value.prefix
  }
  if (parsed.value.type === 'suffix') {
    return parsed.value.suffix
  }
  return ''
})
const chatWeight = computed(() => {
  return parsed.value.type === 'prefix' || parsed.value.type === 'suffix'
    ? parsed.value.weight
    : ''
})
const isChatMeta = computed(() => parsed.value.type === 'prefix' || parsed.value.type === 'suffix')

function commit() {
  editing.value = false
  if (keyValue.value !== props.node.key) {
    editor.updateNode(props.node.id, 'key', keyValue.value)
  }
}
</script>

<template>
  <div class="min-w-0 w-full">
    <div
      v-if="!editing"
      class="flex min-w-0 cursor-pointer items-center gap-2 truncate"
      @click="editing = true"
    >
      <UBadge v-if="showType" size="xs" variant="subtle" class="shrink-0">
        {{ t(`editor.nodes.types.${parsed.type}`) }}
      </UBadge>
      <template v-if="isChatMeta">
        <EditorChatText :value="chatValue" class="min-w-0 truncate text-sm leading-5" />
        <span class="shrink-0 font-mono text-xs text-muted">({{ chatWeight }})</span>
      </template>
      <span v-else class="truncate font-mono text-sm leading-5">{{ display }}</span>
    </div>
    <UInput
      v-else
      v-model="keyValue"
      autofocus
      size="xs"
      class="w-full"
      :ui="{ base: 'w-full font-mono' }"
      @keydown.enter="commit"
      @keydown.tab="commit"
      @blur="commit"
    />
  </div>
</template>
