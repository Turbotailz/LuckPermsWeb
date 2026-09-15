<script setup lang="ts">
import type { EditorNode } from '~/types/editor'

const props = defineProps<{
  node: EditorNode
}>()

const editor = useEditorStore()
const { t, locale } = useI18n()
const open = ref(false)

const expiryMs = computed({
  get() {
    return props.node.expiry
  },
  set(value: number | null) {
    editor.updateNode(props.node.id, 'expiry', value)
  }
})

const expiryLabel = computed(() =>
  props.node.expiry ? relativeDate(props.node.expiry, locale.value, Date.now(), true) : t('editor.nodes.noExpiry')
)
</script>

<template>
  <UPopover v-model:open="open">
    <UTooltip :text="expiryLabel">
      <UButton
        color="neutral"
        variant="ghost"
        size="xs"
        :icon="node.expiry ? undefined : 'i-lucide-infinity'"
        :aria-label="expiryLabel"
        class="text-muted"
      >
        <span v-if="node.expiry" class="font-mono text-xs">
          {{ relativeDate(node.expiry, locale) }}
        </span>
      </UButton>
    </UTooltip>
    <template #content>
      <div class="w-80 space-y-2 p-3">
        <p class="text-sm font-medium text-highlighted">
          {{ t('editor.expiry') }}
        </p>
        <EditorExpiryField v-model="expiryMs" inline-calendar />
      </div>
    </template>
  </UPopover>
</template>
