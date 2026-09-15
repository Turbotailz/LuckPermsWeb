<script setup lang="ts" generic="T">
withDefaults(defineProps<{
  items: T[]
  estimateSize?: number
  overscan?: number
  gap?: number
}>(), {
  estimateSize: 64,
  overscan: 8,
  gap: 0
})

defineSlots<{
  default(props: { item: T, index: number }): unknown
  empty(): unknown
}>()
</script>

<template>
  <UScrollArea
    v-if="items.length"
    v-slot="{ item, index }"
    role="list"
    :items="items"
    :virtualize="{
      estimateSize,
      overscan,
      gap,
      skipMeasurement: true
    }"
    class="h-full min-h-0"
  >
    <slot :item="item" :index="index" />
  </UScrollArea>
  <slot v-else name="empty">
    <UEmpty
      icon="i-lucide-search"
      variant="naked"
      :title="$t('editor.noResults')"
      class="py-12"
    />
  </slot>
</template>
