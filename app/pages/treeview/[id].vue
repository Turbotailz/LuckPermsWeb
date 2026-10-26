<script setup lang="ts">
definePageMeta({
  layout: 'tools',
  ssr: false
})
const { t } = useI18n()
useSeoMeta({
  title: () => t('tree.title'),
  description: () => t('tree.home.generate'),
  robots: 'noindex, nofollow'
})
</script>

<template>
  <TreeWorkspace />
</template>
