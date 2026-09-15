<script setup lang="ts">
const props = defineProps<{ query: string }>()
const emit = defineEmits<{ clear: [] }>()
const editor = useEditorStore()
const { t } = useI18n()
const { toHolder } = useEditorNavigation()

function openSession(type: 'group' | 'user', id: string) {
  toHolder(type, id)
  emit('clear')
}

const grouped = computed(() => {
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
  return [...bySession.entries()].map(([id, nodes]) => ({
    session: editor.document.sessions[id],
    nodes
  })).filter(group => group.session)
})
</script>

<template>
  <div class="min-h-0 flex-1 overflow-auto p-4">
    <UEmpty v-if="!grouped.length" icon="i-lucide-search" variant="naked" :title="t('editor.noResults')" />
    <div v-else class="space-y-6">
      <section v-for="group in grouped" :key="group.session!.id">
        <h2 class="mb-2 flex items-center gap-2 font-semibold">
          <UCheckbox
            :model-value="group.nodes.every(node => editor.selectedNodeIds.includes(node.id))"
            @update:model-value="(checked) => checked ? editor.selectAllSessionNodes(group.nodes) : editor.deselectAllSessionNodes(group.nodes)"
          />
          <small class="text-muted capitalize">{{ group.session!.type }}</small>
          <PlayerAvatar v-if="group.session!.type === 'user'" :id="group.session!.id" :name="group.session!.displayName" :title="false" />
          <UButton
            color="neutral"
            variant="link"
            class="p-0"
            @click="openSession(group.session!.type, group.session!.id)"
          >
            {{ group.session!.displayName }}
          </UButton>
        </h2>
        <EditorNodeRow v-for="node in group.nodes" :key="node.id" :node="node" show-type />
      </section>
    </div>
  </div>
</template>
