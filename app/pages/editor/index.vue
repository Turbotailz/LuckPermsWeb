<script setup lang="ts">
definePageMeta({
  layout: 'tools'
})

const { t } = useI18n()
usePageSeo({
  title: t('editor.description'),
  description: t('home.apps.editor'),
  path: '/editor',
  eyebrow: t('links.tools.name')
})

onMounted(() => {
  // The landing page does not render a session. Load the store only to clear one.
  void import('~/stores/editor').then(mod => mod.useEditorStore().reset())
})
</script>

<template>
  <EditorLandingEmpty />
</template>
