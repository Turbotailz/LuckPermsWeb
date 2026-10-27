<script setup lang="ts">
const editor = useEditorStore()
const { t } = useI18n()

const added = computed(() => editor.document.nodes.filter(node => node.isNew).length)
const changed = computed(() => editor.document.nodes.filter(node => node.modified && !node.isNew).length)
const removed = computed(() =>
  editor.document.deletedGroups.length
  + editor.document.deletedUsers.length
  + editor.document.deletedTracks.length
)
</script>

<template>
  <div class="lp-savebar flex items-center justify-end gap-3 border-t border-default px-3 py-2">
    <p v-if="editor.dirty" class="me-auto min-w-0 truncate font-mono text-xs text-muted" aria-live="polite">
      <span v-if="added">+{{ added }}</span>
      <span v-if="changed"> ~{{ changed }}</span>
      <span v-if="removed"> −{{ removed }}</span>
    </p>
    <UButton
      :loading="editor.saveStatus === 'saving'"
      icon="i-lucide-save"
      @click="editor.saveData()"
    >
      {{ editor.socketStatus ? t('editor.apply') : t('editor.save') }}
    </UButton>
  </div>
</template>
