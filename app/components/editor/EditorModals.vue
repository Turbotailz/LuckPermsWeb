<script setup lang="ts">
import draggable from 'vuedraggable'
import type { EditorSession, EditorTrack } from '~/types/editor'

const editor = useEditorStore()
const route = useRoute()
const { t } = useI18n()
const { toGroup, toTrack, toSection } = useEditorNavigation()

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
})

const groups = computed(() => editor.sessions.filter(session => session.type === 'group'))
const modalGroups = computed(() => (Array.isArray(editor.modal.object) ? editor.modal.object as EditorSession[] : groups.value))
const availableTrackGroups = computed(() => groups.value.filter(group => !trackForm.groups.includes(group.id)))
const isAddingTrack = computed(() => !(editor.modal.object as { track?: EditorTrack } | undefined)?.track)
const alias = computed(() => editor.metaData.commandAlias || 'lp')
const saveKey = computed(() => (editor.modal.object as { saveKey?: string, demo?: boolean } | undefined)?.saveKey)
const isDemoSave = computed(() => (editor.modal.object as { demo?: boolean } | undefined)?.demo || editor.sessionId === 'demo')
const nonce = computed(() => (editor.modal.object as { nonce?: string } | undefined)?.nonce)
const deleteGroupId = computed(() => (editor.modal.object as { groupId?: string } | undefined)?.groupId)
const deleteUser = computed(() => editor.modal.object as { userId?: string, name?: string } | undefined)

const applyCommand = computed(() => `/${alias.value} applyedits ${saveKey.value || ''}`)
const trustCommand = computed(() => `/${alias.value} trusteditor ${nonce.value || ''}`)

const modalTitle = computed(() => {
  switch (editor.modal.type) {
    case 'createGroup': return t('editor.groups.create')
    case 'createTrack': return t(isAddingTrack.value ? 'editor.tracks.create' : 'editor.tracks.edit')
    case 'deleteGroup': return t('editor.delete')
    case 'deleteUser': return t('editor.delete')
    case 'deleteNodes': return t('editor.delete')
    case 'copyNodes': return t('editor.copy')
    case 'moveNodes': return t('editor.move')
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
          <USelect
            v-model="groupForm.parent"
            :items="[{ label: t('editor.groups.none'), value: 0 }, ...modalGroups.map(group => ({ label: group.displayName, value: group.id }))]"
          />
        </UFormField>
        <UFormField :label="t('editor.groups.weight')">
          <UInput v-model="groupForm.weight" type="number" />
        </UFormField>
        <UFormField :label="t('editor.groups.prefix')">
          <UInput v-model="groupForm.prefix" />
        </UFormField>
        <UFormField :label="t('editor.groups.suffix')">
          <UInput v-model="groupForm.suffix" />
        </UFormField>
        <UButton class="sm:col-span-2" @click="submitGroup">{{ t('editor.groups.add') }}</UButton>
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
          <ul class="mt-2 space-y-1">
            <li v-for="group in availableTrackGroups" :key="group.id">
              <UButton color="neutral" variant="subtle" block @click="trackForm.groups.push(group.id)">{{ group.id }}</UButton>
            </li>
          </ul>
        </div>
        <UButton class="sm:col-span-2" :disabled="!trackForm.id || !trackForm.groups.length" @click="submitTrack">
          {{ t(isAddingTrack ? 'editor.tracks.add' : 'editor.tracks.save') }}
        </UButton>
      </div>

      <div v-else-if="editor.modal.type === 'deleteGroup'" class="space-y-4">
        <p><TrustedHtml :html="t('editor.groups.delete', { group: deleteGroupId })" /></p>
        <p>{{ t('editor.groups.deleteConfirm', { count: editor.allNodes.filter(node => node.sessionId === deleteGroupId).length }) }}</p>
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

      <div v-else-if="editor.modal.type === 'copyNodes' || editor.modal.type === 'moveNodes'" class="space-y-3">
        <p>{{ t(editor.modal.type === 'copyNodes' ? 'editor.copy' : 'editor.move') }}</p>
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="session in editor.sessions"
            :key="session.id"
            color="neutral"
            @click="editor.modal.type === 'copyNodes' ? editor.copyNodes([session.id]) : editor.moveNodes(session.id)"
          >
            {{ session.displayName }}
          </UButton>
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
