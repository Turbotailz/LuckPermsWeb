<script setup lang="ts">
defineProps<{
  title?: string
  icon?: string
}>()
</script>

<template>
  <aside class="lp-callout lp-callout-note">
    <p v-if="title" class="font-semibold">{{ title }}</p>
    <div><slot /></div>
  </aside>
</template>
