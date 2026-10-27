<script setup lang="ts">
const editor = useEditorStore()
const { t } = useI18n()

const addedNodes = computed(() => editor.document.nodes.filter(node => node.isNew))
const changedNodes = computed(() => editor.document.nodes.filter(node => node.modified && !node.isNew))
const removed = computed(() => [
  ...editor.document.deletedGroups.map(id => `group ${id}`),
  ...editor.document.deletedUsers.map(id => `user ${id}`),
  ...editor.document.deletedTracks.map(id => `track ${id}`)
])

const added = computed(() => addedNodes.value.length)
const changed = computed(() => changedNodes.value.length)
const removedCount = computed(() => removed.value.length)

const summary = computed(() => {
  const parts: string[] = []
  if (added.value) {
    parts.push(`+${added.value}`)
  }
  if (changed.value) {
    parts.push(`~${changed.value}`)
  }
  if (removedCount.value) {
    parts.push(`−${removedCount.value}`)
  }
  return parts.join(' ')
})
</script>

<template>
  <div class="lp-savebar-wrap">
    <div class="lp-savebar">
      <UPopover v-if="editor.dirty" :content="{ align: 'center', side: 'top', sideOffset: 8 }">
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          class="font-mono"
          :label="summary"
          :aria-label="summary"
        />
        <template #content>
          <div class="max-h-72 w-80 overflow-auto p-3">
            <ul class="space-y-1 font-mono text-xs">
              <li v-for="node in addedNodes" :key="node.id" class="text-primary">
                + {{ node.key }}
              </li>
              <li v-for="node in changedNodes" :key="node.id">
                ~ {{ node.key }} = {{ node.value }}
              </li>
              <li v-for="id in removed" :key="id" class="text-error">
                − {{ id }}
              </li>
            </ul>
          </div>
        </template>
      </UPopover>
      <UButton
        :loading="editor.saveStatus === 'saving'"
        icon="i-lucide-save"
        @click="editor.saveData()"
      >
        {{ editor.socketStatus ? t('editor.apply') : t('editor.save') }}
      </UButton>
    </div>
  </div>
</template>
