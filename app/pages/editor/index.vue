<script setup lang="ts">
definePageMeta({
  layout: 'tools',
  ssr: false
})

defineI18nRoute(false)

const { t } = useI18n()
useSeoMeta({ title: () => t('editor.description') })

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
