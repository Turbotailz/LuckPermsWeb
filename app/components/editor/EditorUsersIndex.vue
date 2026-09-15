<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
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

const rows = computed<UserRow[]>(() => {
  const query = search.value.trim().toLowerCase()
  return editor.sessions
    .filter(session => session.type === 'user')
    .map((user) => {
      const nodes = editor.document.nodes.filter(node => node.sessionId === user.id)
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
    <ul v-if="rows.length" role="list" class="divide-y divide-default">
      <li
        v-for="row in rows"
        :key="row.id"
        class="flex items-center justify-between gap-3 px-4 py-3 hover:bg-elevated/50 sm:px-6"
      >
        <NuxtLink
          :to="editorUserPath(code, row.id)"
          class="flex min-w-0 flex-1 items-center gap-3"
        >
          <PlayerAvatar :id="row.id" :name="row.name" size="md" :title="false" />
          <div class="min-w-0 text-sm">
            <p
              class="truncate font-medium text-highlighted"
              :class="{ 'text-primary': row.isNew, italic: row.modified }"
            >
              {{ row.name }}
            </p>
            <p class="truncate font-mono text-muted">{{ row.id }}</p>
          </div>
        </NuxtLink>

        <div class="flex min-w-0 flex-wrap items-center justify-end gap-1">
          <UButton
            v-for="groupId in row.groups"
            :key="groupId"
            :to="editorGroupPath(code, groupId)"
            size="xs"
            color="neutral"
            variant="subtle"
            icon="i-lucide-users"
          >
            {{ groupId }}
          </UButton>
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
      </li>
    </ul>
    <UEmpty
      v-else
      icon="i-lucide-search"
      variant="naked"
      :title="t('editor.noResults')"
      class="py-12"
    />
  </EditorIndexPage>
</template>
