<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import { editorSectionPath } from '~/utils/editor-routes'
import { isPermissionNode } from '~/utils/holder-meta'

const route = useRoute()
const editor = useEditorStore()
const { t } = useI18n()
const { code, section } = useEditorNavigation()
const advanced = useLocalStorage('lp-editor-holder-advanced', false)

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
const nodes = computed(() => editor.nodesBySessionId.get(holderId.value) ?? [])
const tableNodes = computed(() =>
  advanced.value ? nodes.value : nodes.value.filter(isPermissionNode)
)
const indexPath = computed(() => editorSectionPath(code.value, section.value))

watch(advanced, (enabled) => {
  if (!enabled) {
    editor.deselectAllSessionNodes(nodes.value.filter(node => !isPermissionNode(node)))
  }
})
</script>

<template>
  <div v-if="session" class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 lg:overflow-hidden lg:p-4">
    <EditorHolderInfo
      v-model:advanced="advanced"
      :session="session"
      :nodes="nodes"
      class="shrink-0"
    />
    <div class="flex min-h-80 flex-col gap-3 lg:min-h-0 lg:flex-1 lg:flex-row">
      <div class="lp-perm-table flex min-h-80 min-w-0 flex-1 flex-col overflow-hidden lg:min-h-0">
        <div class="flex items-center justify-between gap-3 border-b border-default px-3 py-2">
          <div class="flex min-w-0 items-center gap-2">
            <p class="truncate text-sm font-semibold text-highlighted">
              {{ t('editor.permissions') }}
            </p>
            <UBadge color="neutral" variant="subtle" size="xs">
              {{ tableNodes.length }}
            </UBadge>
          </div>
          <EditorNodeBulkBar class="shrink-0" />
        </div>
        <EditorNodeList :nodes="tableNodes" :advanced="advanced" class="min-h-64 flex-1 lg:min-h-0" />
      </div>
      <EditorPermissionTree
        v-if="!advanced"
        :nodes="nodes"
        class="hidden w-60 shrink-0 xl:flex"
      />
    </div>
    <div class="lp-add-node shrink-0">
      <p class="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
        {{ advanced ? t('editor.nodes.add') : t('editor.holder.addPermission') }}
      </p>
      <EditorAddNode :simple="!advanced" />
    </div>
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
