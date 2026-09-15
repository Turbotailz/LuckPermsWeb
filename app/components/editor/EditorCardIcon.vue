<script setup lang="ts">
defineProps<{
  name: string
}>()
</script>

<template>
  <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
    <UIcon :name="name" class="size-4 text-primary" />
  </div>
</template>
