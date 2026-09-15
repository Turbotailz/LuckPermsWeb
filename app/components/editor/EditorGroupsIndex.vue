<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { parseNodeType } from '~/utils/editor'
import { editorGroupPath, editorTrackPath } from '~/utils/editor-routes'

interface GroupRow {
  id: string
  name: string
  weight: string
  permissions: number
  tracks: string[]
  isNew?: boolean
  modified?: boolean
}

const editor = useEditorStore()
const { t } = useI18n()
const { code } = useEditorNavigation()
const search = ref('')

const groups = computed(() => editor.sessions.filter(session => session.type === 'group'))

const rows = computed<GroupRow[]>(() => {
  const query = search.value.trim().toLowerCase()
  return groups.value
    .map((group) => {
      const nodes = editor.document.nodes.filter(node => node.sessionId === group.id)
      const weightNode = nodes.find(node => parseNodeType(node.key).type === 'weight')
      return {
        id: group.id,
        name: group.displayName,
        weight: weightNode ? weightNode.key.slice('weight.'.length) : '',
        permissions: nodes.length,
        tracks: editor.tracks.filter(track => track.groups.includes(group.id)).map(track => track.id),
        isNew: group.new,
        modified: group.modified
      }
    })
    .filter((row) => {
      if (!query) {
        return true
      }
      return [row.name, row.id, ...row.tracks].some(value => value.toLowerCase().includes(query))
    })
    .sort((a, b) => Number(b.weight || 0) - Number(a.weight || 0) || a.name.localeCompare(b.name))
})

function actionsFor(row: GroupRow): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = [
    {
      label: t('editor.groups.edit'),
      icon: 'i-lucide-pencil',
      to: editorGroupPath(code.value, row.id)
    }
  ]
  if (row.id !== 'default') {
    items.push({
      label: t('editor.delete'),
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect() {
        editor.setModal('deleteGroup', { groupId: row.id })
      }
    })
  }
  return items
}
</script>

<template>
  <EditorIndexPage
    :title="t('editor.nav.groups')"
    :description="t('editor.index.descriptionGroups')"
    :add-label="t('editor.groups.add')"
    :search-placeholder="t('editor.index.searchGroups')"
    v-model:search="search"
    @add="editor.setModal('createGroup', groups)"
  >
    <ul v-if="rows.length" role="list" class="divide-y divide-default">
      <li
        v-for="row in rows"
        :key="row.id"
        class="flex items-center justify-between gap-3 px-4 py-3 hover:bg-elevated/50 sm:px-6"
      >
        <NuxtLink
          :to="editorGroupPath(code, row.id)"
          class="flex min-w-0 flex-1 items-center gap-3"
        >
          <UAvatar icon="i-lucide-users" size="md" />
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
            v-for="trackId in row.tracks"
            :key="trackId"
            :to="editorTrackPath(code, trackId)"
            size="xs"
            color="neutral"
            variant="subtle"
            icon="i-lucide-git-branch"
          >
            {{ trackId }}
          </UButton>
        </div>

        <div class="flex shrink-0 items-center gap-3">
          <UTooltip v-if="row.weight" :text="t('editor.index.weight')">
            <span class="inline-flex items-center gap-1.5 text-sm tabular-nums text-muted">
              <UIcon name="i-lucide-scale" class="size-4" />
              {{ row.weight }}
            </span>
          </UTooltip>
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
