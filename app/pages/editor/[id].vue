<script setup lang="ts">
definePageMeta({
  layout: 'tools',
  ssr: false
})

defineI18nRoute(false)

const { t } = useI18n()
useSeoMeta({
  title: () => t('editor.description'),
  robots: 'noindex, nofollow'
})
</script>

<template>
  <EditorWorkspace>
    <NuxtPage />
  </EditorWorkspace>
</template>
