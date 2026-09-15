<script setup lang="ts">
import draggable from 'vuedraggable'
import { flattenContexts, normalizeUserId } from '~/utils/editor'
import type { EditorSession, EditorTrack } from '~/types/editor'
import { isLocalEditorSession } from '~/assets/data/editor-samples'

const editor = useEditorStore()
const route = useRoute()
const { t } = useI18n()
const { toGroup, toUser, toTrack, toSection } = useEditorNavigation()

const open = computed({
  get: () => Boolean(editor.modal.type),
  set: (value) => {
    if (!value) {
      editor.closeModal()
    }
  }
})

const groupForm = reactive({
  name: '',
  displayName: '',
  parent: 0 as string | number,
  weight: 0,
  prefix: '',
  suffix: ''
})

const trackForm = reactive<EditorTrack>({ id: '', groups: [], type: 'track' })
const userForm = reactive({ id: '', displayName: '' })
const copyTargets = ref<string[]>([])
const moveTarget = ref<string | undefined>()
const bulkExpiry = ref<number | null>(null)
const bulkContextKey = ref('')
const bulkContextValue = ref('')
const bulkContexts = ref<Record<string, string[]>>({})
const bulkReplaceContexts = ref(false)

watch(() => editor.modal.type, (type) => {
  if (type === 'createTrack') {
    const existing = (editor.modal.object as { track?: EditorTrack } | undefined)?.track
    trackForm.id = existing?.id || ''
    trackForm.groups = existing ? [...existing.groups] : []
  }
  if (type === 'createGroup') {
    groupForm.name = ''
    groupForm.displayName = ''
    groupForm.parent = 0
    groupForm.weight = 0
    groupForm.prefix = ''
    groupForm.suffix = ''
  }
  if (type === 'createUser') {
    userForm.id = ''
    userForm.displayName = ''
  }
  if (type === 'copyNodes') {
    copyTargets.value = []
  }
  if (type === 'moveNodes') {
    moveTarget.value = undefined
  }
  if (type === 'bulkExpiry') {
    bulkExpiry.value = null
  }
  if (type === 'bulkContexts') {
    bulkContextKey.value = ''
    bulkContextValue.value = ''
    bulkContexts.value = {}
    bulkReplaceContexts.value = false
  }
})

const groups = computed(() => editor.sessions.filter(session => session.type === 'group'))
const holderItems = computed(() =>
  editor.sessions
    .filter(session => session.id !== editor.currentSessionId)
    .map(session => ({
      label: session.displayName,
      value: session.id,
      description: session.id !== session.displayName ? session.id : (session.type === 'user' ? t('editor.nav.users') : t('editor.nav.groups'))
    }))
)
const bulkContextList = computed(() => flattenContexts(bulkContexts.value))
const modalGroups = computed(() => (Array.isArray(editor.modal.object) ? editor.modal.object as EditorSession[] : groups.value))
const availableTrackGroups = computed(() => groups.value.filter(group => !trackForm.groups.includes(group.id)))
const isAddingTrack = computed(() => !(editor.modal.object as { track?: EditorTrack } | undefined)?.track)
const alias = computed(() => editor.metaData.commandAlias || 'lp')
const saveKey = computed(() => (editor.modal.object as { saveKey?: string, demo?: boolean } | undefined)?.saveKey)
const isDemoSave = computed(() => (editor.modal.object as { demo?: boolean } | undefined)?.demo || isLocalEditorSession(editor.sessionId))
const nonce = computed(() => (editor.modal.object as { nonce?: string } | undefined)?.nonce)
const deleteGroupId = computed(() => (editor.modal.object as { groupId?: string } | undefined)?.groupId)
const deleteUser = computed(() => editor.modal.object as { userId?: string, name?: string } | undefined)

const applyCommand = computed(() => `/${alias.value} applyedits ${saveKey.value || ''}`)
const trustCommand = computed(() => `/${alias.value} trusteditor ${nonce.value || ''}`)

const modalTitle = computed(() => {
  switch (editor.modal.type) {
    case 'createGroup': return t('editor.groups.create')
    case 'createUser': return t('editor.users.create')
    case 'createTrack': return t(isAddingTrack.value ? 'editor.tracks.create' : 'editor.tracks.edit')
    case 'deleteGroup': return t('editor.delete')
    case 'deleteUser': return t('editor.delete')
    case 'deleteNodes': return t('editor.delete')
    case 'copyNodes': return t('editor.nodes.copy', editor.selectedNodes.length)
    case 'moveNodes': return t('editor.nodes.move', editor.selectedNodes.length)
    case 'bulkExpiry': return t('editor.nodes.bulkExpiry')
    case 'bulkContexts': return t('editor.nodes.bulkContexts')
    case 'savedChanges': return t('editor.saved')
    case 'trustPrompt': return t('editor.trust.title')
    case 'reusedSessionWarning': return t('editor.reusedsession.title')
    default: return ''
  }
})

function submitGroup() {
  if (!groupForm.name) {
    return
  }
  const name = groupForm.name.toLowerCase().replace(/ /g, '-')
  editor.addGroup({
    ...groupForm,
    name
  })
  toGroup(name)
}

function submitUser() {
  const id = normalizeUserId(userForm.id)
  if (!id) {
    return
  }
  const existing = editor.sessions.find(session =>
    session.type === 'user'
    && (session.id === id || session.displayName.toLowerCase() === id.toLowerCase())
  )
  if (existing) {
    editor.closeModal()
    toUser(existing.id)
    return
  }
  editor.addUser({
    id,
    displayName: userForm.displayName.trim() || userForm.id.trim() || id
  })
  toUser(id)
}

function submitTrack() {
  if (!trackForm.id || !trackForm.groups.length) {
    return
  }
  if (isAddingTrack.value) {
    editor.addTrack({ ...trackForm })
    toTrack(trackForm.id)
    return
  }
  const original = (editor.modal.object as { track: EditorTrack }).track
  editor.updateTrack(original.id, { ...trackForm })
  if (original.id !== trackForm.id) {
    toTrack(trackForm.id)
  }
}

function addBulkContext() {
  if (!bulkContextKey.value || !bulkContextValue.value) {
    return
  }
  const next = { ...bulkContexts.value }
  next[bulkContextKey.value] = [...new Set([...(next[bulkContextKey.value] || []), bulkContextValue.value])]
  bulkContexts.value = next
  bulkContextKey.value = ''
  bulkContextValue.value = ''
}

function removeBulkContext(key: string, value: string) {
  const remaining = flattenContexts(bulkContexts.value).filter(entry => !(entry.key === key && entry.value === value))
  const grouped: Record<string, string[]> = {}
  remaining.forEach((entry) => {
    grouped[entry.key] = [...(grouped[entry.key] || []), entry.value]
  })
  bulkContexts.value = grouped
}

function confirmCopy() {
  if (!copyTargets.value.length) {
    return
  }
  editor.copyNodes(copyTargets.value)
}

function confirmMove() {
  if (!moveTarget.value) {
    return
  }
  editor.moveNodes(moveTarget.value)
}

function applyBulkExpiry() {
  if (bulkExpiry.value == null) {
    return
  }
  editor.bulkUpdateNode({ expiry: bulkExpiry.value })
}

function applyBulkContexts() {
  editor.bulkUpdateNode({
    contexts: bulkContexts.value,
    replace: bulkReplaceContexts.value
  })
}

function confirmDeleteGroup() {
  const id = deleteGroupId.value
  if (!id) {
    return
  }
  const open = route.params.groupId === id
  editor.deleteSession(id)
  if (open) {
    toSection('groups')
  }
}

function confirmDeleteUser() {
  const id = deleteUser.value?.userId
  if (!id) {
    return
  }
  const open = route.params.userId === id
  editor.deleteSession(id)
  if (open) {
    toSection('users')
  }
}
</script>

<template>
  <UModal v-model:open="open" :title="modalTitle" :ui="{ content: 'sm:max-w-2xl' }">
    <template #body>
      <div v-if="editor.modal.type === 'createGroup'" class="grid gap-4 sm:grid-cols-2">
        <UFormField :label="t('editor.groups.name')">
          <UInput :model-value="groupForm.name" @update:model-value="groupForm.name = String($event).toLowerCase().replace(/ /g, '-')" />
        </UFormField>
        <UFormField :label="t('editor.groups.displayName')">
          <UInput v-model="groupForm.displayName" />
        </UFormField>
        <UFormField :label="t('editor.groups.parent')">
          <USelectMenu
            v-model="groupForm.parent"
            virtualize
            value-key="value"
            label-key="label"
            class="w-full"
            :items="[{ label: t('editor.groups.none'), value: 0 }, ...modalGroups.map(group => ({ label: group.displayName, value: group.id }))]"
          />
        </UFormField>
        <UFormField :label="t('editor.groups.weight')">
          <UInput v-model="groupForm.weight" type="number" />
        </UFormField>
        <UFormField :label="t('editor.groups.prefix')">
          <UInput v-model="groupForm.prefix" class="font-mono" />
          <EditorChatText v-if="groupForm.prefix" :value="groupForm.prefix" class="mt-1.5 text-sm" />
        </UFormField>
        <UFormField :label="t('editor.groups.suffix')">
          <UInput v-model="groupForm.suffix" class="font-mono" />
          <EditorChatText v-if="groupForm.suffix" :value="groupForm.suffix" class="mt-1.5 text-sm" />
        </UFormField>
        <UButton class="sm:col-span-2" @click="submitGroup">{{ t('editor.groups.add') }}</UButton>
      </div>

      <div v-else-if="editor.modal.type === 'createUser'" class="grid gap-4">
        <UFormField :label="t('editor.users.identifier')" :hint="t('editor.users.identifierHint')">
          <UInput v-model="userForm.id" autofocus />
        </UFormField>
        <UFormField :label="t('editor.users.displayName')">
          <UInput v-model="userForm.displayName" />
        </UFormField>
        <UButton :disabled="!userForm.id.trim()" @click="submitUser">{{ t('editor.users.add') }}</UButton>
      </div>

      <div v-else-if="editor.modal.type === 'createTrack'" class="grid gap-6 sm:grid-cols-2">
        <div>
          <UFormField :label="t('editor.tracks.name')">
            <UInput :model-value="trackForm.id" @update:model-value="trackForm.id = String($event).toLowerCase().replace(/ /g, '-')" />
          </UFormField>
          <p class="mt-2 text-sm text-muted">{{ t('editor.tracks.tip') }}</p>
          <draggable v-model="trackForm.groups" item-key="value" tag="ol" class="mt-2 space-y-1">
            <template #item="{ element, index }">
              <li class="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                <span>{{ index + 1 }}. {{ element }}</span>
                <UButton icon="i-lucide-x" size="xs" variant="ghost" @click="trackForm.groups.splice(index, 1)" />
              </li>
            </template>
          </draggable>
        </div>
        <div>
          <h3 class="font-semibold">{{ t('editor.tracks.addGroups') }}</h3>
          <UScrollArea
            v-if="availableTrackGroups.length"
            v-slot="{ item: group }"
            :items="availableTrackGroups"
            :virtualize="{ estimateSize: 36, overscan: 8, skipMeasurement: true }"
            class="mt-2 h-64"
          >
            <UButton color="neutral" variant="subtle" block class="h-8" @click="trackForm.groups.push(group.id)">{{ group.id }}</UButton>
          </UScrollArea>
          <p v-else class="mt-2 text-sm text-muted">{{ t('editor.noResults') }}</p>
        </div>
        <UButton class="sm:col-span-2" :disabled="!trackForm.id || !trackForm.groups.length" @click="submitTrack">
          {{ t(isAddingTrack ? 'editor.tracks.add' : 'editor.tracks.save') }}
        </UButton>
      </div>

      <div v-else-if="editor.modal.type === 'deleteGroup'" class="space-y-4">
        <p><TrustedHtml :html="t('editor.groups.delete', { group: deleteGroupId })" /></p>
        <p>{{ t('editor.groups.deleteConfirm', { count: editor.nodesBySessionId.get(deleteGroupId || '')?.length || 0 }) }}</p>
        <div class="flex gap-2">
          <UButton color="error" @click="confirmDeleteGroup">{{ t('editor.delete') }}</UButton>
          <UButton color="neutral" variant="ghost" @click="editor.closeModal()">{{ t('editor.cancel') }}</UButton>
        </div>
      </div>

      <div v-else-if="editor.modal.type === 'deleteUser'" class="space-y-4">
        <p>{{ t('editor.users.delete', { user: deleteUser?.name }) }}</p>
        <div class="flex gap-2">
          <UButton color="error" @click="confirmDeleteUser">{{ t('editor.delete') }}</UButton>
          <UButton color="neutral" variant="ghost" @click="editor.closeModal()">{{ t('editor.cancel') }}</UButton>
        </div>
      </div>

      <div v-else-if="editor.modal.type === 'deleteNodes'" class="space-y-4">
        <p>{{ t('editor.nodes.deleteConfirm', editor.selectedNodes.length) }}</p>
        <div class="flex gap-2">
          <UButton color="error" @click="editor.deleteSelectedNodes()">{{ t('editor.delete') }}</UButton>
          <UButton color="neutral" variant="ghost" @click="editor.closeModal()">{{ t('editor.cancel') }}</UButton>
        </div>
      </div>

      <div v-else-if="editor.modal.type === 'copyNodes'" class="space-y-4">
        <UFormField :label="t('editor.nodes.target')">
          <UInputMenu
            v-model="copyTargets"
            :items="holderItems"
            value-key="value"
            label-key="label"
            multiple
            virtualize
            :placeholder="t('editor.nodes.targetPlaceholder')"
          />
        </UFormField>
        <div class="flex gap-2">
          <UButton :disabled="!copyTargets.length" @click="confirmCopy">{{ t('editor.copy') }}</UButton>
          <UButton color="neutral" variant="ghost" @click="editor.closeModal()">{{ t('editor.cancel') }}</UButton>
        </div>
      </div>

      <div v-else-if="editor.modal.type === 'moveNodes'" class="space-y-4">
        <UFormField :label="t('editor.nodes.target')">
          <UInputMenu
            v-model="moveTarget"
            :items="holderItems"
            value-key="value"
            label-key="label"
            virtualize
            :placeholder="t('editor.nodes.targetPlaceholder')"
          />
        </UFormField>
        <div class="flex gap-2">
          <UButton :disabled="!moveTarget" @click="confirmMove">{{ t('editor.move') }}</UButton>
          <UButton color="neutral" variant="ghost" @click="editor.closeModal()">{{ t('editor.cancel') }}</UButton>
        </div>
      </div>

      <div v-else-if="editor.modal.type === 'bulkExpiry'" class="space-y-4">
        <p>{{ t('editor.nodes.bulkExpiryHint', editor.selectedNodes.length) }}</p>
        <UFormField :label="t('editor.expiry')">
          <EditorExpiryField v-model="bulkExpiry" />
        </UFormField>
        <div class="flex gap-2">
          <UButton @click="applyBulkExpiry">{{ t('editor.update') }}</UButton>
          <UButton color="neutral" variant="subtle" @click="editor.bulkUpdateNode({ expiry: null })">
            {{ t('editor.nodes.clearExpiry') }}
          </UButton>
          <UButton color="neutral" variant="ghost" @click="editor.closeModal()">{{ t('editor.cancel') }}</UButton>
        </div>
      </div>

      <div v-else-if="editor.modal.type === 'bulkContexts'" class="space-y-4">
        <p>{{ t('editor.nodes.bulkContextsHint', editor.selectedNodes.length) }}</p>
        <div class="flex flex-wrap gap-1.5">
          <UBadge
            v-for="entry in bulkContextList"
            :key="`${entry.key}:${entry.value}`"
            color="neutral"
            variant="subtle"
            class="font-mono pe-0.5"
          >
            {{ entry.key }}:{{ entry.value }}
            <UButton icon="i-lucide-x" size="xs" variant="ghost" @click="removeBulkContext(entry.key, entry.value)" />
          </UBadge>
        </div>
        <div class="flex items-end gap-2">
          <UFormField :label="t('editor.key')" class="min-w-0 flex-1">
            <UInput v-model="bulkContextKey" />
          </UFormField>
          <UFormField :label="t('editor.value')" class="min-w-0 flex-1">
            <UInput v-model="bulkContextValue" @keydown.enter.prevent="addBulkContext" />
          </UFormField>
          <UButton icon="i-lucide-plus" color="neutral" variant="subtle" :aria-label="t('editor.nodes.addContext')" @click="addBulkContext" />
        </div>
        <UCheckbox v-model="bulkReplaceContexts" :label="t('editor.nodes.replace')" />
        <div class="flex gap-2">
          <UButton @click="applyBulkContexts">{{ t('editor.update') }}</UButton>
          <UButton color="neutral" variant="ghost" @click="editor.closeModal()">{{ t('editor.cancel') }}</UButton>
        </div>
      </div>

      <div v-else-if="editor.modal.type === 'savedChanges'" class="space-y-4">
        <UAlert
          v-if="isDemoSave"
          color="warning"
          variant="subtle"
          :title="t('editor.demoNoSave')"
        />
        <template v-else>
          <p>{{ t('editor.command') }}</p>
          <CommandCode :value="applyCommand" copyable />
          <TrustedHtml :html="t('editor.applyNote')" />
        </template>
      </div>

      <div v-else-if="editor.modal.type === 'trustPrompt'" class="space-y-4">
        <p>{{ t('editor.trust.prompt') }}</p>
        <CommandCode :value="trustCommand" copyable />
        <TrustedHtml :html="t('editor.trust.note')" />
      </div>

      <div v-else-if="editor.modal.type === 'reusedSessionWarning'" class="space-y-4">
        <UAlert color="warning" variant="subtle" :title="t('editor.reusedsession.title')" :description="t('editor.reusedsession.desc')" />
        <p>{{ t('editor.reusedsession.desc2') }}</p>
      </div>
    </template>
  </UModal>
</template>
