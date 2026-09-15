<script setup lang="ts">
import type { EditorNode } from '~/types/editor'
import { flattenContexts } from '~/utils/editor'

const props = defineProps<{
  node: EditorNode
}>()

const editor = useEditorStore()
const { t } = useI18n()
const open = ref(false)
const contextKey = ref('')
const contextValue = ref('')

const contexts = computed(() => flattenContexts(props.node.context))
const primaryContext = computed(() => contexts.value[0] ?? null)
const hiddenContextCount = computed(() => Math.max(0, contexts.value.length - 1))
const hiddenContextLabel = computed(() =>
  contexts.value.slice(1).map(entry => `${entry.key}:${entry.value}`).join(', ')
)
const potentialValues = computed(() =>
  editor.potentialContexts.find(item => item.key === contextKey.value)?.values || []
)

function addContext() {
  if (!contextKey.value || !contextValue.value) {
    return
  }
  const existing = flattenContexts(props.node.context)
  existing.push({ key: contextKey.value, value: contextValue.value })
  const grouped: Record<string, string[]> = {}
  existing.forEach((entry) => {
    grouped[entry.key] = [...(grouped[entry.key] || []), entry.value]
  })
  editor.updateNodeContext(props.node.id, grouped)
  contextKey.value = ''
  contextValue.value = ''
}

function removeContext(key: string, value: string) {
  const remaining = flattenContexts(props.node.context).filter(entry => !(entry.key === key && entry.value === value))
  const grouped: Record<string, string[]> = {}
  remaining.forEach((entry) => {
    grouped[entry.key] = [...(grouped[entry.key] || []), entry.value]
  })
  editor.updateNodeContext(props.node.id, grouped)
}
</script>

<template>
  <UPopover v-model:open="open">
    <UButton color="neutral" variant="ghost" size="xs" class="max-w-full" :aria-label="t('editor.contexts')">
      <span v-if="contexts.length" class="flex min-w-0 items-center gap-1">
        <UBadge
          color="neutral"
          variant="subtle"
          size="xs"
          class="min-w-0 max-w-36 truncate font-mono"
        >
          {{ primaryContext!.key }}:{{ primaryContext!.value }}
        </UBadge>
        <UTooltip v-if="hiddenContextCount" :text="hiddenContextLabel">
          <UBadge color="neutral" variant="subtle" size="xs" class="shrink-0 tabular-nums">
            {{ t('editor.index.moreGroups', { n: hiddenContextCount }) }}
          </UBadge>
        </UTooltip>
      </span>
      <UIcon v-else name="i-lucide-minus" class="size-4 text-muted" />
    </UButton>
    <template #content>
      <div class="w-72 space-y-2 p-3">
        <h4 class="font-semibold text-highlighted">
          {{ t('editor.contexts') }} ({{ contexts.length }})
        </h4>
        <div v-for="entry in contexts" :key="`${entry.key}:${entry.value}`" class="flex items-center justify-between text-sm">
          <span class="font-mono">{{ entry.key }}: {{ entry.value }}</span>
          <UButton icon="i-lucide-x" size="xs" variant="ghost" @click="removeContext(entry.key, entry.value)" />
        </div>
        <UInput v-model="contextKey" :placeholder="t('editor.key')" size="sm" />
        <UInput v-model="contextValue" :placeholder="t('editor.value')" size="sm" @keydown.enter="addContext" />
        <div class="flex flex-wrap gap-1">
          <UButton
            v-for="item in editor.potentialContexts"
            :key="item.key"
            size="xs"
            color="neutral"
            variant="subtle"
            @click="contextKey = item.key"
          >
            {{ item.key }}
          </UButton>
        </div>
        <div class="flex flex-wrap gap-1">
          <UButton
            v-for="value in potentialValues"
            :key="value"
            size="xs"
            color="neutral"
            variant="outline"
            @click="contextValue = value"
          >
            {{ value }}
          </UButton>
        </div>
        <UButton size="sm" block icon="i-lucide-plus" @click="addContext">
          {{ t('editor.nodes.addContext') }}
        </UButton>
      </div>
    </template>
  </UPopover>
</template>
