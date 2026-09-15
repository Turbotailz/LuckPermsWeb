<script setup lang="ts">
defineProps<{
  metaKey: string
  metaValue: string
}>()

const emit = defineEmits<{
  edit: []
}>()

const { t } = useI18n()
</script>

<template>
  <div class="flex min-w-0 items-center gap-2">
    <span class="min-w-0 flex-1 truncate font-mono text-sm text-highlighted">{{ metaKey }}</span>
    <span class="min-w-0 flex-1 truncate font-mono text-sm text-muted">{{ metaValue }}</span>
    <UButton
      icon="i-lucide-pencil"
      color="neutral"
      variant="ghost"
      size="xs"
      class="shrink-0"
      :title="t('editor.holder.editMeta')"
      :aria-label="t('editor.holder.editMeta')"
      @click="emit('edit')"
    />
  </div>
</template>
