<script setup lang="ts">
definePageMeta({
  layout: 'tools',
  ssr: false
})

defineI18nRoute(false)

const route = useRoute()
await navigateTo(`/editor/${route.params.id}/groups`, { replace: true })
</script>

<template>
  <div />
</template>
