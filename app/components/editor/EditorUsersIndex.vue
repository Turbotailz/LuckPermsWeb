<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { EditorNode } from '~/types/editor'
import { parseNodeType } from '~/utils/editor'
import { editorGroupPath, editorUserPath } from '~/utils/editor-routes'

interface UserRow {
  id: string
  name: string
  permissions: number
  groups: string[]
  modified?: boolean
  isNew?: boolean
}

const editor = useEditorStore()
const { t } = useI18n()
const { code } = useEditorNavigation()
const search = ref('')

const none: EditorNode[] = []

const rows = computed<UserRow[]>(() => {
  const query = search.value.trim().toLowerCase()
  const nodesBySession = editor.nodesBySessionId
  return editor.sessions
    .filter(session => session.type === 'user')
    .map((user) => {
      const nodes = nodesBySession.get(user.id) ?? none
      return {
        id: user.id,
        name: user.displayName,
        permissions: nodes.length,
        groups: nodes.flatMap((node) => {
          if (!node.value) {
            return []
          }
          const parsed = parseNodeType(node.key)
          return parsed.type === 'inheritance' && parsed.groupName ? [parsed.groupName] : []
        }),
        modified: user.modified,
        isNew: user.new
      }
    })
    .filter((row) => {
      if (!query) {
        return true
      }
      return [row.name, row.id, ...row.groups].some(value => value.toLowerCase().includes(query))
    })
    .sort((a, b) => a.name.localeCompare(b.name))
})

const GROUP_PREVIEW = 3

function visibleGroups(groups: string[]) {
  return groups.slice(0, GROUP_PREVIEW)
}

function hiddenGroupCount(groups: string[]) {
  return Math.max(0, groups.length - GROUP_PREVIEW)
}

function actionsFor(row: UserRow): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = [
    {
      label: t('editor.users.edit'),
      icon: 'i-lucide-pencil',
      to: editorUserPath(code.value, row.id)
    }
  ]
  if (editor.canDeleteUsers) {
    items.push({
      label: t('editor.delete'),
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect() {
        editor.setModal('deleteUser', { userId: row.id, name: row.name })
      }
    })
  }
  return items
}
</script>

<template>
  <EditorIndexPage
    :title="t('editor.nav.users')"
    :description="t('editor.index.descriptionUsers')"
    :add-label="t('editor.users.add')"
    :search-placeholder="t('editor.index.searchUsers')"
    v-model:search="search"
    @add="editor.setModal('createUser')"
  >
    <EditorVirtualList v-slot="{ item: row }" :items="rows" :estimate-size="48">
      <div
        role="listitem"
        class="flex h-12 items-center justify-between gap-3 border-b border-default px-4 hover:bg-elevated/50 sm:px-6"
      >
        <NuxtLink
          :to="editorUserPath(code, row.id)"
          class="flex min-w-32 flex-1 items-center gap-3"
        >
          <PlayerAvatar :id="row.id" :name="row.name" size="sm" :title="false" />
          <p
            class="truncate text-sm font-medium text-highlighted"
            :class="{ 'text-primary': row.isNew, italic: row.modified }"
          >
            {{ row.name }}
          </p>
        </NuxtLink>

        <div class="hidden min-w-0 shrink items-center justify-end gap-1 sm:flex">
          <UButton
            v-for="groupId in visibleGroups(row.groups)"
            :key="groupId"
            :to="editorGroupPath(code, groupId)"
            size="xs"
            color="neutral"
            variant="subtle"
            icon="i-lucide-users"
            class="max-w-28 shrink-0 truncate"
          >
            {{ groupId }}
          </UButton>
          <UTooltip
            v-if="hiddenGroupCount(row.groups)"
            :text="row.groups.slice(GROUP_PREVIEW).join(', ')"
          >
            <UBadge color="neutral" variant="subtle" size="sm" class="shrink-0 tabular-nums">
              {{ t('editor.index.moreGroups', { n: hiddenGroupCount(row.groups) }) }}
            </UBadge>
          </UTooltip>
        </div>

        <div class="flex shrink-0 items-center gap-3">
          <UTooltip :text="t('editor.index.permissions', row.permissions)">
            <span class="inline-flex items-center gap-1.5 text-sm tabular-nums text-muted">
              <UIcon name="i-lucide-key-round" class="size-4" />
              {{ row.permissions }}
            </span>
          </UTooltip>
          <UDropdownMenu :items="actionsFor(row)">
            <UButton
              icon="i-lucide-ellipsis-vertical"
              color="neutral"
              variant="ghost"
              size="sm"
              square
              :aria-label="t('editor.index.actions')"
            />
          </UDropdownMenu>
        </div>
      </div>
    </EditorVirtualList>
  </EditorIndexPage>
</template>
