<script setup lang="ts">
definePageMeta({
  layout: 'tools',
  ssr: false
})
const { t } = useI18n()
useSeoMeta({
  title: () => t('verbose.title'),
  description: () => t('verbose.home.generate'),
  robots: 'noindex, nofollow'
})
</script>

<template>
  <VerboseWorkspace />
</template>
