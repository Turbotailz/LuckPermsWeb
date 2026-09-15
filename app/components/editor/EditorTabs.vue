<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { editorSectionPath, type EditorSection } from '~/utils/editor-routes'

const editor = useEditorStore()
const { t } = useI18n()
const { code, section } = useEditorNavigation()

function item(value: EditorSection, icon: string, badge?: number): NavigationMenuItem {
  return {
    label: t(`editor.nav.${value}`),
    icon,
    to: editorSectionPath(code.value, value),
    badge,
    exact: value === 'home',
    active: section.value === value
  }
}

const items = computed<NavigationMenuItem[][]>(() => [
  [
    item('home', 'i-lucide-layout-dashboard'),
    item('groups', 'i-lucide-users', editor.sessions.filter(session => session.type === 'group').length),
    item('users', 'i-lucide-user', editor.sessions.filter(session => session.type === 'user').length),
    item('tracks', 'i-lucide-git-branch', editor.tracks.length)
  ],
  [
    {
      label: t('editor.nav.documentation'),
      icon: 'i-lucide-book-open',
      to: '/wiki/features/web-editor'
    }
  ]
])
</script>

<template>
  <UNavigationMenu
    :items="items"
    highlight
    class="flex-1"
  />
</template>
