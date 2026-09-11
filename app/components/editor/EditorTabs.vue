<script setup lang="ts">
import { editorSectionPath, type EditorSection } from '~/utils/editor-routes'

const editor = useEditorStore()
const { t } = useI18n()
const { code, section } = useEditorNavigation()

const items = computed(() => [
  {
    label: t('editor.nav.groups'),
    value: 'groups' as EditorSection,
    icon: 'i-lucide-users',
    badge: editor.sessions.filter(session => session.type === 'group').length
  },
  {
    label: t('editor.nav.users'),
    value: 'users' as EditorSection,
    icon: 'i-lucide-user',
    badge: editor.sessions.filter(session => session.type === 'user').length
  },
  {
    label: t('editor.nav.tracks'),
    value: 'tracks' as EditorSection,
    icon: 'i-lucide-git-branch',
    badge: editor.tracks.length
  }
])
</script>

<template>
  <nav class="flex min-w-0 items-center overflow-x-auto" aria-label="Editor sections">
    <UButton
      v-for="item in items"
      :key="item.value"
      :to="editorSectionPath(code, item.value)"
      :icon="item.icon"
      :label="item.label"
      color="neutral"
      variant="link"
      size="lg"
      :aria-current="section === item.value ? 'page' : undefined"
      :ui="{
        base: section === item.value
          ? 'rounded-none border-b-2 border-primary text-base text-highlighted'
          : 'rounded-none border-b-2 border-transparent text-base text-muted'
      }"
    >
      <template #trailing>
        <UBadge color="neutral" variant="subtle" size="xs">{{ item.badge }}</UBadge>
      </template>
    </UButton>
  </nav>
</template>
