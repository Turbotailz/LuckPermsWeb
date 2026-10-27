<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  icon: string
  compact?: boolean
}>(), {
  compact: false
})

const slots = useSlots()
</script>

<template>
  <div class="flex flex-col gap-2 border-t border-default/80 pt-3">
    <div class="flex items-center justify-between gap-2">
      <div class="flex min-w-0 items-center gap-2">
        <UIcon :name="icon" class="size-3.5 shrink-0 text-primary" />
        <p class="truncate text-xs font-semibold tracking-wide text-muted uppercase">
          {{ title }}
        </p>
        <slot name="badge" />
      </div>
      <div class="flex min-w-0 items-center justify-end gap-1.5">
        <slot name="actions" />
      </div>
    </div>
    <div v-if="!compact && slots.default">
      <slot />
    </div>
  </div>
</template>
