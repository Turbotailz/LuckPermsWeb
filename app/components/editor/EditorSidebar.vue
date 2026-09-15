<script setup lang="ts">
import {
  editorGroupPath,
  editorTrackPath,
  editorUserPath
} from '~/utils/editor-routes'

const filter = defineModel<string>('filter', { default: '' })

const editor = useEditorStore()
const route = useRoute()
const { t } = useI18n()
const { code, section } = useEditorNavigation()

const groups = computed(() => editor.sessions.filter(session => session.type === 'group'))
const users = computed(() => editor.sessions.filter(session => session.type === 'user'))
const tracks = computed(() => [...editor.tracks].sort((a, b) => a.id.localeCompare(b.id)))

const query = computed(() => filter.value.trim().toLowerCase())

const filteredGroups = computed(() => {
  if (!query.value) {
    return groups.value
  }
  return groups.value.filter(group =>
    group.id.toLowerCase().includes(query.value) || group.displayName.toLowerCase().includes(query.value)
  )
})

const filteredUsers = computed(() => {
  if (!query.value) {
    return users.value
  }
  return users.value.filter(user =>
    user.id.toLowerCase().includes(query.value) || user.displayName.toLowerCase().includes(query.value)
  )
})

const filteredTracks = computed(() => {
  if (!query.value) {
    return tracks.value
  }
  return tracks.value.filter(track =>
    track.id.toLowerCase().includes(query.value) || track.groups.some(group => group.toLowerCase().includes(query.value))
  )
})

const activeGroupId = computed(() => typeof route.params.groupId === 'string' ? route.params.groupId : '')
const activeUserId = computed(() => typeof route.params.userId === 'string' ? route.params.userId : '')
const activeTrackId = computed(() => typeof route.params.trackId === 'string' ? route.params.trackId : '')

function weightFor(groupId: string) {
  const node = editor.weightNodes.find(item => item.sessionId === groupId)
  return node ? node.key.split('weight.')[1] || '' : ''
}

function trackById(id: string) {
  return editor.tracks.find(track => track.id === id)
}

function editTrack(id: string) {
  const track = trackById(id)
  if (track) {
    editor.setModal('createTrack', { track })
  }
}
</script>

<template>
  <UDashboardSidebar
    id="holders"
    collapsible
    resizable
    :default-size="14"
    :min-size="11"
    :max-size="22"
    :ui="{ header: 'h-auto min-w-0 flex-col items-stretch gap-2 px-2 py-2', body: 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-2' }"
  >
    <template #header="{ collapsed }">
      <UInput
        v-if="!collapsed"
        v-model="filter"
        icon="i-lucide-list-filter"
        class="w-full min-w-0"
        :placeholder="t('editor.filter')"
      />
      <UButton
        v-if="section === 'groups'"
        icon="i-lucide-plus"
        :label="collapsed ? undefined : t('editor.groups.add')"
        :square="collapsed"
        :block="!collapsed"
        size="sm"
        @click="editor.setModal('createGroup', groups)"
      />
      <UButton
        v-else-if="section === 'users'"
        icon="i-lucide-plus"
        :label="collapsed ? undefined : t('editor.users.add')"
        :square="collapsed"
        :block="!collapsed"
        size="sm"
        @click="editor.setModal('createUser')"
      />
      <UButton
        v-else-if="section === 'tracks'"
        icon="i-lucide-plus"
        :label="collapsed ? undefined : t('editor.tracks.add')"
        :square="collapsed"
        :block="!collapsed"
        size="sm"
        @click="editor.setModal('createTrack')"
      />
    </template>

    <template #default="{ collapsed }">
    <nav v-if="section === 'groups'" class="flex min-h-0 flex-1 flex-col">
      <EditorVirtualList :items="filteredGroups" :estimate-size="32" :overscan="12" :gap="2">
        <template #default="{ item: group }">
          <UButton
            :to="editorGroupPath(code, group.id)"
            color="neutral"
            :variant="activeGroupId === group.id ? 'subtle' : 'ghost'"
            size="sm"
            block
            class="h-8 min-w-0 justify-start"
          >
            <span
              class="min-w-0 truncate"
              :class="{ 'text-primary': group.new, italic: group.modified }"
            >
              {{ group.displayName }}
            </span>
            <span v-if="!collapsed && weightFor(group.id)" class="ms-auto shrink-0 text-xs text-muted">{{ weightFor(group.id) }}</span>
          </UButton>
        </template>
        <template #empty>
          <p class="px-2 py-3 text-sm text-muted">{{ t('editor.noResults') }}</p>
        </template>
      </EditorVirtualList>
    </nav>

    <nav v-else-if="section === 'users'" class="flex min-h-0 flex-1 flex-col">
      <EditorVirtualList :items="filteredUsers" :estimate-size="32" :overscan="12" :gap="2">
        <template #default="{ item: user }">
          <UButton
            :to="editorUserPath(code, user.id)"
            color="neutral"
            :variant="activeUserId === user.id ? 'subtle' : 'ghost'"
            size="sm"
            block
            class="h-8 min-w-0 justify-start"
          >
            <PlayerAvatar :id="user.id" :name="user.displayName" :title="false" />
            <span v-if="!collapsed" class="min-w-0 truncate" :class="{ italic: user.modified }">{{ user.displayName }}</span>
          </UButton>
        </template>
        <template #empty>
          <p class="px-2 py-3 text-sm text-muted">{{ t('editor.noResults') }}</p>
        </template>
      </EditorVirtualList>
    </nav>

    <nav v-else-if="section === 'tracks'" class="flex min-h-0 flex-1 flex-col">
      <EditorVirtualList :items="filteredTracks" :estimate-size="32" :overscan="12" :gap="2">
        <template #default="{ item: track }">
          <div class="flex h-8 min-w-0 items-center gap-0.5">
            <UButton
              :to="editorTrackPath(code, track.id)"
              color="neutral"
              :variant="activeTrackId === track.id ? 'subtle' : 'ghost'"
              size="sm"
              block
              class="min-w-0 justify-start"
            >
              <span class="min-w-0 truncate" :class="{ 'text-primary': track.new }">{{ track.id }}</span>
              <span v-if="!collapsed" class="ms-auto shrink-0 text-xs text-muted">{{ track.groups.length }}</span>
            </UButton>
            <UButton
              v-if="!collapsed"
              icon="i-lucide-pencil"
              size="xs"
              variant="ghost"
              :aria-label="t('editor.tracks.edit')"
              @click="editTrack(track.id)"
            />
          </div>
        </template>
        <template #empty>
          <p class="px-2 py-3 text-sm text-muted">{{ t('editor.noResults') }}</p>
        </template>
      </EditorVirtualList>
    </nav>
    </template>
  </UDashboardSidebar>
</template>
