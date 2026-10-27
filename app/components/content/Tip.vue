<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <aside class="lp-callout lp-callout-tip">
    <p v-if="title" class="font-semibold">{{ title }}</p>
    <div><slot /></div>
  </aside>
</template>
