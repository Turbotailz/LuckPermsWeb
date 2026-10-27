<script setup lang="ts">
import { editorSectionPath, localizeToolPath, type EditorSection } from '~/utils/editor-routes'

const editor = useEditorStore()
const { t } = useI18n()
const { code, section } = useEditorNavigation()

const items = computed(() => [
  { value: 'home' as EditorSection, label: t('editor.nav.home'), to: editorSectionPath(code.value, 'home') },
  {
    value: 'groups' as EditorSection,
    label: t('editor.nav.groups'),
    to: editorSectionPath(code.value, 'groups'),
    badge: editor.sessions.filter(session => session.type === 'group').length
  },
  {
    value: 'users' as EditorSection,
    label: t('editor.nav.users'),
    to: editorSectionPath(code.value, 'users'),
    badge: editor.sessions.filter(session => session.type === 'user').length
  },
  {
    value: 'tracks' as EditorSection,
    label: t('editor.nav.tracks'),
    to: editorSectionPath(code.value, 'tracks'),
    badge: editor.tracks.length
  }
])
</script>

<template>
  <div class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
    <UButton
      v-for="item in items"
      :key="item.value"
      :to="item.to"
      size="sm"
      class="lp-editor-tab rounded-full"
      :class="{ 'lp-editor-tab-active': section === item.value }"
      color="neutral"
      :variant="section === item.value ? 'solid' : 'ghost'"
    >
      {{ item.label }}
      <span v-if="item.badge" class="ms-1.5 font-mono text-xs opacity-80">{{ item.badge }}</span>
    </UButton>
    <UButton
      :to="localizeToolPath('/wiki/features/web-editor')"
      size="sm"
      color="neutral"
      variant="ghost"
      icon="i-lucide-book-open"
      class="lp-editor-tab ms-auto rounded-full"
      :label="t('editor.nav.documentation')"
    />
  </div>
</template>
