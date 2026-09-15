<script setup lang="ts">
import type { EditorNode, EditorSession } from '~/types/editor'

const props = defineProps<{ query: string }>()
const emit = defineEmits<{ clear: [] }>()
const editor = useEditorStore()
const { t } = useI18n()
const { toHolder } = useEditorNavigation()

function openSession(type: 'group' | 'user', id: string) {
  toHolder(type, id)
  emit('clear')
}

type SearchRow
  = { kind: 'header', id: string, session: EditorSession, nodes: EditorNode[] }
    | { kind: 'node', id: string, node: EditorNode }

const rows = computed<SearchRow[]>(() => {
  const q = props.query.toLowerCase()
  const matches = editor.allNodes.filter((node) => {
    if (String(node.key).toLowerCase().includes(q)) {
      return true
    }
    const session = editor.document.sessions[node.sessionId]
    return session?.displayName.toLowerCase().includes(q) || session?.id.toLowerCase().includes(q)
  })
  const bySession = new Map<string, typeof matches>()
  matches.forEach((node) => {
    const list = bySession.get(node.sessionId) || []
    list.push(node)
    bySession.set(node.sessionId, list)
  })
  const list: SearchRow[] = []
  for (const [id, nodes] of bySession) {
    const session = editor.document.sessions[id]
    if (!session) {
      continue
    }
    list.push({ kind: 'header', id: `header:${id}`, session, nodes })
    for (const node of nodes) {
      list.push({ kind: 'node', id: node.id, node })
    }
  }
  return list
})

const virtualize = computed(() => ({
  estimateSize: (index: number) => rows.value[index]?.kind === 'header' ? 40 : 48,
  overscan: 10
}))
</script>

<template>
  <div class="min-h-0 flex-1 overflow-hidden p-4">
    <UEmpty v-if="!rows.length" icon="i-lucide-search" variant="naked" :title="t('editor.noResults')" />
    <UScrollArea
      v-else
      v-slot="{ item }"
      :items="rows"
      :virtualize="virtualize"
      class="h-full min-h-0"
    >
      <section
        v-if="item.kind === 'header'"
        class="flex h-10 items-center gap-2 font-semibold"
      >
        <UCheckbox
          :model-value="item.nodes.every(node => editor.selectedNodeMap[node.id])"
          @update:model-value="(checked) => checked ? editor.selectAllSessionNodes(item.nodes) : editor.deselectAllSessionNodes(item.nodes)"
        />
        <small class="text-muted capitalize">{{ item.session.type }}</small>
        <PlayerAvatar v-if="item.session.type === 'user'" :id="item.session.id" :name="item.session.displayName" :title="false" />
        <UButton
          color="neutral"
          variant="link"
          class="p-0"
          @click="openSession(item.session.type, item.session.id)"
        >
          {{ item.session.displayName }}
        </UButton>
      </section>
      <EditorNodeRow v-else :node="item.node" show-type />
    </UScrollArea>
  </div>
</template>
