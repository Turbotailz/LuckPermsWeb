<script setup lang="ts">
const props = withDefaults(defineProps<{
  title: string
  icon: string
  compact?: boolean
}>(), {
  compact: false
})

const slots = useSlots()
const cardUi = computed(() => ({
  header: 'px-4 py-3 sm:px-4',
  body: props.compact || !slots.default ? 'hidden' : 'p-4 sm:p-4 space-y-3'
}))
</script>

<template>
  <UCard variant="subtle" :ui="cardUi">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div class="flex min-w-0 items-center gap-2.5">
          <EditorCardIcon :name="icon" />
          <p class="truncate text-sm font-medium text-highlighted">
            {{ title }}
          </p>
        </div>
        <div class="flex min-w-0 items-center justify-end gap-1.5">
          <slot name="badge" />
          <slot name="actions" />
        </div>
      </div>
    </template>
    <slot v-if="!compact" />
  </UCard>
</template>
