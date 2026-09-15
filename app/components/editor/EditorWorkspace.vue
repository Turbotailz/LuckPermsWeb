<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { editorHomePath } from '~/utils/editor-routes'

const route = useRoute()
const editor = useEditorStore()
const { t } = useI18n()
const { announce } = useAnnounce()
const { code, section } = useEditorNavigation()
const homePath = computed(() => editorHomePath(code.value))
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
watch(holderId, () => {
  editor.deselectAllSelectedNodes()
})

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
  <EditorLandingEmpty v-if="!editor.loaded && !sessionId" />

  <ToolEmpty
    v-else-if="!editor.loaded"
    variant="subtle"
    :title="t('editor.description')"
    :description="t('editor.intro')"
    :loading="!editor.errors.load && !editor.errors.unsupported"
    :error="editor.errors.load || editor.errors.unsupported"
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
  </ToolEmpty>

  <UDashboardGroup v-else class="flex-col" storage-key="lp-editor-rem" unit="rem">
    <UDashboardNavbar :toggle="section !== 'home'">
      <template #leading>
        <UDashboardSidebarCollapse v-if="section !== 'home'" />
      </template>
      <template #title>
        <NuxtLink :to="homePath" class="truncate">
          {{ t('links.tools.editor') }}
        </NuxtLink>
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

    <UDashboardToolbar>
      <EditorTabs />
    </UDashboardToolbar>

    <div class="flex min-h-0 min-w-0 flex-1 overflow-hidden">
      <EditorSidebar v-if="section !== 'home'" v-model:filter="sectionFilter" />
      <UDashboardPanel :ui="{ body: 'flex min-h-0 flex-col gap-0 overflow-hidden p-0 sm:gap-0 sm:p-0' }">
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
          <EditorNodeBulkBar v-if="!holderId && editor.selectedNodes.length" class="p-3" />
        </template>
      </UDashboardPanel>
    </div>
  </UDashboardGroup>

  <EditorModals />
</template>
