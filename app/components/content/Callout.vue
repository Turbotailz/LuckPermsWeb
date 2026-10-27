<script setup lang="ts">
defineProps<{
  title?: string
  color?: string
}>()
</script>

<template>
  <aside class="lp-callout" :class="color ? `lp-callout-${color}` : 'lp-callout-note'">
    <p v-if="title" class="font-semibold">{{ title }}</p>
    <div><slot /></div>
  </aside>
</template>
