<script setup lang="ts">
import type { EditorNode } from '~/types/editor'
import { flattenContexts, parseNodeType } from '~/utils/editor'

const props = defineProps<{
  node: EditorNode
}>()

const editor = useEditorStore()
const { t, locale } = useI18n()
const editingKey = ref(false)
const keyValue = ref(props.node.key)
const editingExpiry = ref(false)
const contextOpen = ref(false)
const contextKey = ref('')
const contextValue = ref('')

watch(() => props.node.key, (value) => {
  keyValue.value = value
})

const parsed = computed(() => parseNodeType(props.node.key))
const selected = computed(() => editor.selectedNodeIds.includes(props.node.id))
const contexts = computed(() => flattenContexts(props.node.context))
const expiryLabel = computed(() => props.node.expiry ? relativeDate(props.node.expiry, locale.value) : t('editor.nodes.never'))

const potentialValues = computed(() =>
  editor.potentialContexts.find(item => item.key === contextKey.value)?.values || []
)

function commitKey() {
  editingKey.value = false
  if (keyValue.value !== props.node.key) {
    editor.updateNode(props.node.id, 'key', keyValue.value)
  }
}

function setExpiry(value: Date | null | undefined) {
  editingExpiry.value = false
  editor.updateNode(props.node.id, 'expiry', value || null)
}

function addContext() {
  if (!contextKey.value || !contextValue.value) {
    return
  }
  const next = { ...props.node.context }
  const existing = flattenContexts(next)
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

const display = computed(() => {
  const parsedNode = parsed.value
  switch (parsedNode.type) {
    case 'inheritance':
      return parsedNode.groupName
    case 'prefix':
      return `${parsedNode.prefix} (${t('editor.nodes.weightLabel')}: ${parsedNode.weight})`
    case 'suffix':
      return `${parsedNode.suffix} (${t('editor.nodes.weightLabel')}: ${parsedNode.weight})`
    case 'meta':
      return `${parsedNode.key} = ${parsedNode.value}`
    case 'weight':
      return parsedNode.weight
    case 'displayname':
      return parsedNode.displayName
    default:
      return props.node.key
  }
})
</script>

<template>
  <div
    class="grid grid-cols-[2rem_minmax(0,2fr)_6rem_8rem_minmax(0,1.5fr)_2rem] items-center gap-2 border-b border-default px-3 text-sm"
    :class="{ 'bg-primary/10': node.isNew, 'bg-warning/10': node.modified && !node.isNew }"
  >
    <UCheckbox
      :model-value="selected"
      :aria-label="t('editor.nodes.select')"
      @update:model-value="editor.toggleNodeSelect(node.id)"
    />

    <div>
      <div v-if="!editingKey" class="flex cursor-pointer items-center gap-2 truncate" @click="editingKey = true">
        <UBadge size="xs" variant="subtle">{{ t(`editor.nodes.types.${parsed.type}`) }}</UBadge>
        <span class="truncate font-mono text-sm">{{ display }}</span>
      </div>
      <UInput
        v-else
        v-model="keyValue"
        autofocus
        size="xs"
        @keydown.enter="commitKey"
        @keydown.tab="commitKey"
        @blur="commitKey"
      />
    </div>

    <UButton
      size="xs"
      :color="node.value ? 'primary' : 'error'"
      variant="subtle"
      @click="editor.toggleNodeValue(node.id)"
    >
      {{ node.value }}
    </UButton>

    <div class="flex items-center gap-1">
      <UPopover v-model:open="editingExpiry">
        <UButton color="neutral" variant="ghost" size="xs" class="font-mono">
          {{ expiryLabel }}
        </UButton>
        <template #content>
          <UInput
            type="datetime-local"
            class="m-2"
            @change="setExpiry(($event.target as HTMLInputElement).value ? new Date(($event.target as HTMLInputElement).value) : null)"
          />
        </template>
      </UPopover>
      <UButton v-if="node.expiry" icon="i-lucide-x" size="xs" variant="ghost" :aria-label="t('editor.nodes.deleteExpiry')" @click="editor.updateNode(node.id, 'expiry', null)" />
    </div>

    <UPopover v-model:open="contextOpen">
      <UButton color="neutral" variant="ghost" size="xs" class="max-w-full truncate">
        <template v-if="contexts.length">
          <UBadge
            v-for="entry in contexts"
            :key="`${entry.key}:${entry.value}`"
            color="neutral"
            variant="subtle"
            size="xs"
            class="me-1 font-mono"
          >
            {{ entry.key }}:{{ entry.value }}
          </UBadge>
        </template>
        <span v-else class="text-muted">none</span>
      </UButton>
      <template #content>
        <div class="w-72 space-y-2 p-3">
          <h4 class="font-semibold text-highlighted">{{ t('editor.contexts') }} ({{ contexts.length }})</h4>
          <div v-for="entry in contexts" :key="`${entry.key}:${entry.value}`" class="flex items-center justify-between text-sm">
            <span>{{ entry.key }}: {{ entry.value }}</span>
            <UButton icon="i-lucide-x" size="xs" variant="ghost" @click="removeContext(entry.key, entry.value)" />
          </div>
          <UInput v-model="contextKey" :placeholder="t('editor.key')" size="sm" />
          <UInput v-model="contextValue" :placeholder="t('editor.value')" size="sm" @keydown.enter="addContext" />
          <div class="flex flex-wrap gap-1">
            <UButton v-for="item in editor.potentialContexts" :key="item.key" size="xs" color="neutral" variant="subtle" @click="contextKey = item.key">{{ item.key }}</UButton>
          </div>
          <div class="flex flex-wrap gap-1">
            <UButton v-for="value in potentialValues" :key="value" size="xs" color="neutral" variant="outline" @click="contextValue = value">{{ value }}</UButton>
          </div>
          <UButton size="sm" block icon="i-lucide-plus" @click="addContext">{{ t('editor.nodes.addContext') }}</UButton>
        </div>
      </template>
    </UPopover>

    <UButton icon="i-lucide-x" size="xs" variant="ghost" color="error" :aria-label="t('editor.delete')" @click="editor.deleteNode(node.id)" />
  </div>
</template>
