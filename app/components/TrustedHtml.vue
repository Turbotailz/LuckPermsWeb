<script setup lang="ts">
const props = defineProps<{ html: string }>()

const allowed = computed(() =>
  props.html
    .replace(/<(?!\/?(?:b|strong|code|br|em|i)\b)[^>]*>/gi, '')
)
</script>

<template>
  <span
    class="[&_b]:font-semibold [&_strong]:font-semibold [&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1 [&_code]:font-mono [&_code]:text-sm"
    v-html="allowed"
  />
</template>
