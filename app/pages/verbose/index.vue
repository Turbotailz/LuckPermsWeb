<script setup lang="ts">
definePageMeta({
  layout: 'tools',
  ssr: false
})
const { t } = useI18n()
useSeoMeta({
  title: () => t('verbose.title'),
  description: () => t('home.apps.verbose')
})
</script>

<template>
  <VerboseWorkspace />
</template>
