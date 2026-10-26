<script setup lang="ts">
const { open } = useContentSearch()
const shown = ref(false)
const panel = defineAsyncComponent(() => import('./SiteSearchDialog.vue'))

defineShortcuts({
  meta_k: {
    usingInput: true,
    handler: () => {
      open.value = !open.value
    }
  }
})

watch(open, (isOpen) => {
  if (isOpen) {
    shown.value = true
  }
})
</script>

<template>
  <component :is="panel" v-if="shown" />
</template>
