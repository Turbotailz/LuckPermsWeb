<script setup lang="ts">
definePageMeta({
  layout: 'tools'
})

defineI18nRoute(false)

const { t } = useI18n()
usePageSeo({
  title: t('editor.description'),
  description: t('home.apps.editor'),
  path: '/editor',
  eyebrow: t('links.tools.name')
})

const editor = useEditorStore()
onMounted(() => {
  editor.reset()
})
</script>

<template>
  <EditorLandingEmpty />
</template>
