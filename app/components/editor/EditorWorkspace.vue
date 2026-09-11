<script setup lang="ts">
import { useEventListener } from '@vueuse/core'

const route = useRoute()
const editor = useEditorStore()
const { t } = useI18n()
const { announce } = useAnnounce()
const { section } = useEditorNavigation()
const sectionFilter = ref('')
provide(editorSectionFilterKey, sectionFilter)

watch(section, () => {
  sectionFilter.value = ''
})

const searchOpen = ref(false)
const searchQuery = ref('')
const debouncedQuery = ref('')
let timer: ReturnType<typeof setTimeout> | undefined

watch(searchQuery, (value) => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    debouncedQuery.value = String(value).toLowerCase()
  }, 200)
})

const sessionId = computed(() => String(route.params.id || ''))
const holderId = computed(() => {
  const groupId = route.params.groupId
  const userId = route.params.userId
  if (typeof groupId === 'string' && groupId) {
    return groupId
  }
  if (typeof userId === 'string' && userId) {
    return userId
  }
  return null
})
const showAddNode = computed(() => Boolean(holderId.value && editor.currentSession))

async function loadFromRoute() {
  const id = sessionIdFromRoute(route)
  if (!id) {
    editor.reset()
    return
  }
  if (editor.loaded && editor.sessionId === id) {
    return
  }
  try {
    await editor.load(id)
  } catch {
    // errors flagged on store
  }
}

watch(() => sessionIdFromRoute(route), loadFromRoute)
onMounted(loadFromRoute)

watch(
  () => route.path,
  (path) => {
    const id = String(route.params.id || '')
    if (id && /^\/editor\/[^/]+\/?$/.test(path)) {
      navigateTo(`/editor/${id}/groups`, { replace: true })
    }
  },
  { immediate: true }
)

watch(
  [() => editor.loaded, holderId],
  () => {
    if (!editor.loaded) {
      return
    }
    editor.setCurrentSession(holderId.value)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (!route.path.startsWith('/editor/') || route.path === '/editor') {
    editor.reset()
  }
})

useEventListener('beforeunload', (event: BeforeUnloadEvent) => {
  if (editor.dirty) {
    event.preventDefault()
    event.returnValue = ''
  }
})

defineShortcuts({
  meta_s: {
    handler: () => {
      if (editor.loaded) {
        editor.saveData()
      }
    }
  },
  meta_z: {
    handler: () => {
      const label = editor.undo()
      if (label) {
        announce(t('editor.history.undone', { action: label }))
      }
    }
  },
  shift_meta_z: {
    handler: () => {
      const label = editor.redo()
      if (label) {
        announce(t('editor.history.redone', { action: label }))
      }
    }
  },
  meta_y: {
    handler: () => {
      const label = editor.redo()
      if (label) {
        announce(t('editor.history.redone', { action: label }))
      }
    }
  }
})
</script>

<template>
  <ToolEmpty
    v-if="!editor.loaded"
    :title="t('editor.description')"
    :description="t('editor.start')"
    :loading="!editor.errors.load && !editor.errors.unsupported && Boolean(sessionId)"
    :error="editor.errors.load || editor.errors.unsupported"
    :actions="sessionId ? [] : [{ label: t('tools.demo'), to: '/editor/demo/groups', icon: 'i-lucide-play' }]"
  >
    <UAlert
      v-if="editor.errors.load"
      color="error"
      variant="subtle"
      :title="t('editor.error.title')"
      :description="t('editor.error.info')"
    />
    <UAlert
      v-else-if="editor.errors.unsupported"
      color="warning"
      variant="subtle"
      :title="t('editor.unsupported.title')"
    >
      <template #description>
        <i18n-t keypath="editor.unsupported.info" tag="span">
          <template #download>
            <ULink to="/download">{{ t('editor.unsupported.download') }}</ULink>
          </template>
        </i18n-t>
      </template>
    </UAlert>
    <template v-else-if="!sessionId">
      <div class="flex flex-col items-center gap-2">
        <CommandCode value="/lp editor" />
        <CommandCode value="/lp user <user> editor" />
        <CommandCode value="/lp group <group> editor" />
      </div>
    </template>
  </ToolEmpty>

  <UDashboardGroup v-else storage-key="lp-editor">
    <EditorSidebar v-model:filter="sectionFilter" />
    <UDashboardPanel :ui="{ body: 'flex min-h-0 flex-col gap-0 overflow-hidden p-0 sm:gap-0 sm:p-0' }">
      <template #header>
        <UDashboardNavbar :title="t('links.tools.editor')">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #trailing>
            <EditorTabs />
          </template>
          <template #right>
            <UTooltip v-if="editor.socketStatus" :text="t('editor.socketConnected')">
              <UIcon name="i-lucide-network" class="text-primary" />
            </UTooltip>
            <UButton
              icon="i-lucide-undo-2"
              color="neutral"
              variant="ghost"
              :disabled="!editor.canUndo"
              :aria-label="t('editor.undo')"
              @click="editor.undo()"
            />
            <UButton
              icon="i-lucide-redo-2"
              color="neutral"
              variant="ghost"
              :disabled="!editor.canRedo"
              :aria-label="t('editor.redo')"
              @click="editor.redo()"
            />
            <UInput
              v-if="searchOpen"
              v-model="searchQuery"
              :placeholder="t('editor.search')"
              autofocus
              class="w-48"
            />
            <UButton
              :icon="searchQuery ? 'i-lucide-x' : 'i-lucide-search'"
              color="neutral"
              variant="ghost"
              :aria-label="t('editor.search')"
              @click="searchOpen = !searchOpen; if (!searchOpen) { searchQuery = ''; debouncedQuery = '' }"
            />
            <UButton
              :loading="editor.saveStatus === 'saving'"
              icon="i-lucide-save"
              @click="editor.saveData()"
            >
              {{ editor.socketStatus ? t('editor.apply') : t('editor.save') }}
            </UButton>
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="flex min-h-0 flex-1 flex-col">
          <EditorSearchResults
            v-if="debouncedQuery"
            :query="debouncedQuery"
            @clear="searchQuery = ''; debouncedQuery = ''; searchOpen = false"
          />
          <div v-show="!debouncedQuery" class="flex min-h-0 flex-1 flex-col">
            <slot />
          </div>
        </div>
      </template>

      <template #footer>
        <EditorAddNode v-if="showAddNode || editor.selectedNodes.length" />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>

  <EditorModals />
</template>
