<script setup lang="ts">
import { editorSectionPath } from '~/utils/editor-routes'

const route = useRoute()
const editor = useEditorStore()
const { t } = useI18n()
const { code, section } = useEditorNavigation()

const holderId = computed(() => {
  const groupId = route.params.groupId
  const userId = route.params.userId
  if (typeof groupId === 'string' && groupId) {
    return groupId
  }
  if (typeof userId === 'string' && userId) {
    return userId
  }
  return ''
})

const session = computed(() => editor.sessions.find(item => item.id === holderId.value) ?? null)
const nodes = computed(() => editor.allNodes.filter(node => node.sessionId === holderId.value))
const indexPath = computed(() => editorSectionPath(code.value, section.value))
const sessionData = computed(() => {
  if (!session.value) {
    return null
  }
  return {
    type: session.value.type,
    parents: nodes.value.filter(node => node.key.startsWith('group.')),
    displayname: nodes.value.filter(node => node.key.startsWith('displayname.')),
    weight: nodes.value.filter(node => node.key.startsWith('weight.')),
    prefixes: nodes.value.filter(node => node.key.startsWith('prefix.')),
    suffixes: nodes.value.filter(node => node.key.startsWith('suffix.')),
    meta: nodes.value.filter(node => node.key.startsWith('meta.'))
  }
})
</script>

<template>
  <div v-if="session && sessionData" class="flex min-h-0 flex-1 flex-col">
    <EditorMetaBar :session="session" :session-data="sessionData" />
    <EditorNodeList :nodes="nodes" />
  </div>
  <UEmpty
    v-else
    icon="i-lucide-search"
    variant="naked"
    :title="t('editor.index.notFound')"
    class="flex-1"
  >
    <template #actions>
      <UButton color="neutral" variant="subtle" :label="t(`editor.nav.${section}`)" :to="indexPath" />
    </template>
  </UEmpty>
</template>
