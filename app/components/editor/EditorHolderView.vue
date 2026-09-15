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
  <div v-if="session" class="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden lg:flex-row">
      <div class="max-h-80 shrink-0 overflow-y-auto lg:max-h-none lg:w-1/4 lg:min-w-64">
        <EditorHolderInfo
          v-model:advanced="advanced"
          :session="session"
          :nodes="nodes"
        />
      </div>
      <div class="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <UCard
          variant="subtle"
          class="flex min-h-0 flex-1 flex-col overflow-hidden"
          :ui="{
            root: 'flex min-h-0 flex-1 flex-col overflow-hidden',
            header: 'px-4 py-3 sm:px-4',
            body: 'flex min-h-0 flex-1 flex-col overflow-hidden p-0 sm:p-0'
          }"
        >
          <template #header>
            <div class="flex min-w-0 items-center justify-between gap-3">
              <div class="flex min-w-0 items-center gap-2.5">
                <EditorCardIcon name="i-lucide-key-round" />
                <p class="truncate text-sm font-medium text-highlighted">
                  {{ t('editor.permissions') }}
                </p>
                <UBadge color="neutral" variant="subtle" size="xs">
                  {{ tableNodes.length }}
                </UBadge>
              </div>
              <EditorNodeBulkBar class="shrink-0" />
            </div>
          </template>
          <EditorNodeList :nodes="tableNodes" :advanced="advanced" class="min-h-0 flex-1" />
        </UCard>
        <UCard
          variant="subtle"
          :ui="{ header: 'px-4 py-3 sm:px-4', body: 'p-4 sm:p-4' }"
        >
          <template #header>
            <div class="flex items-center gap-2.5">
              <EditorCardIcon name="i-lucide-plus" />
              <p class="text-sm font-medium text-highlighted">
                {{ advanced ? t('editor.nodes.add') : t('editor.holder.addPermission') }}
              </p>
            </div>
          </template>
          <EditorAddNode :simple="!advanced" />
        </UCard>
      </div>
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
