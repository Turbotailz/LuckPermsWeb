<script setup lang="ts">
definePageMeta({
  layout: 'tools',
  ssr: false
})
defineI18nRoute(false)

const { t } = useI18n()
useSeoMeta({ title: () => t('verbose.title') })
</script>

<template>
  <VerboseWorkspace />
</template>
