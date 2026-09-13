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
  <ToolEmpty
    :title="t('editor.description')"
    :description="t('editor.start')"
    :actions="[{ label: t('tools.demo'), to: '/editor/demo/groups', icon: 'i-lucide-play' }]"
  >
    <div class="flex flex-col items-center gap-2">
      <CommandCode value="/lp editor" />
      <CommandCode value="/lp user <user> editor" />
      <CommandCode value="/lp group <group> editor" />
    </div>
  </ToolEmpty>
</template>
