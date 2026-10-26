<script setup lang="ts">
definePageMeta({
  layout: 'tools',
  ssr: false
})
const { t } = useI18n()
useSeoMeta({
  title: () => t('tree.title'),
  description: () => t('home.apps.tree')
})
</script>

<template>
  <TreeWorkspace />
</template>
