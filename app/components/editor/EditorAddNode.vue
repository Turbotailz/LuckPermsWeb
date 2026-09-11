<script setup lang="ts">
import { buildNodeKey } from '~/utils/editor'
import { flattenContexts } from '~/utils/editor'

const editor = useEditorStore()
const { t } = useI18n()

const nodeType = ref('permission')
const permissionsList = ref<string[]>([])
const nodeParts = reactive({
  groupName: '',
  weight: '0',
  prefix: '',
  suffix: '',
  key: '',
  value: '',
  displayName: ''
})
const value = ref(true)
const expiry = ref<Date | null>(null)
const contexts = ref<Record<string, string[]>>({})
const contextKey = ref('')
const contextValue = ref('')
const replaceContexts = ref(false)
const bulkValue = ref<boolean | null>(null)

const types = computed(() => [
  { value: 'permission', label: t('editor.nodes.types.permission') },
  { value: 'inheritance', label: t('editor.nodes.types.inheritance') },
  { value: 'prefix', label: t('editor.nodes.types.prefix') },
  { value: 'suffix', label: t('editor.nodes.types.suffix') },
  { value: 'meta', label: t('editor.nodes.types.meta') },
  { value: 'weight', label: t('editor.nodes.types.weight') },
  { value: 'displayname', label: t('editor.nodes.types.displayname') }
])

const knownGroups = computed(() => editor.sessions.filter(session => session.type === 'group').map(session => session.id))
const flatContexts = computed(() => flattenContexts(contexts.value))

function addContext() {
  if (!contextKey.value || !contextValue.value) {
    return
  }
  const next = { ...contexts.value }
  next[contextKey.value] = [...new Set([...(next[contextKey.value] || []), contextValue.value])]
  contexts.value = next
  contextKey.value = ''
  contextValue.value = ''
}

function onPermissionTag(tag: string) {
  const parts = tag.split(/[\s,]+/).map(item => item.trim()).filter(Boolean)
  permissionsList.value = [...new Set([...permissionsList.value, ...parts])]
}

function keysToAdd() {
  if (nodeType.value === 'permission') {
    return permissionsList.value
  }
  const key = buildNodeKey(nodeType.value, {
    groupName: nodeParts.groupName,
    weight: nodeParts.weight,
    prefix: nodeParts.prefix,
    suffix: nodeParts.suffix,
    key: nodeParts.key,
    value: nodeParts.value,
    displayName: nodeParts.displayName,
    permission: permissionsList.value[0]
  })
  return key ? [key] : []
}

function add() {
  const sessionId = editor.currentSessionId
  if (!sessionId) {
    return
  }
  const keys = keysToAdd()
  if (!keys.length) {
    return
  }
  editor.addNodes(keys.map(key => ({
    sessionId,
    key,
    value: value.value,
    expiry: expiry.value ? expiry.value.getTime() : null,
    context: contexts.value,
    isNew: true
  })))
  keys.forEach(key => editor.addKnownPermission(key))
  permissionsList.value = []
}

function applyBulk() {
  editor.bulkUpdateNode({
    value: bulkValue.value,
    expiry: expiry.value ? expiry.value.getTime() : null,
    replace: replaceContexts.value,
    contexts: contexts.value
  })
}
</script>

<template>
  <div class="border-t border-default bg-muted p-3">
    <div v-if="!editor.selectedNodes.length" class="flex flex-wrap items-end gap-3">
      <UFormField :label="t('editor.nodes.nodeType')">
        <USelect v-model="nodeType" :items="types" value-key="value" label-key="label" class="w-40" />
      </UFormField>
      <UFormField v-if="nodeType === 'permission'" :label="t('editor.nodes.labels.permissions')" class="min-w-64 flex-1">
        <UInputMenu
          v-model="permissionsList"
          :items="editor.knownPermissions"
          multiple
          create-item
          :placeholder="t('editor.nodes.permissionPlaceholder')"
          @create="onPermissionTag"
        />
      </UFormField>
      <UFormField v-else-if="nodeType === 'inheritance'" :label="t('editor.nodes.labels.groupName')">
        <UInputMenu v-model="nodeParts.groupName" :items="knownGroups" :placeholder="t('editor.nodes.groupNamePlaceholder')" class="w-48" />
      </UFormField>
      <template v-else-if="nodeType === 'prefix' || nodeType === 'suffix'">
        <UFormField :label="t('editor.nodes.labels.weight')">
          <UInput v-model="nodeParts.weight" type="number" class="w-20" />
        </UFormField>
        <UFormField :label="nodeType === 'prefix' ? t('editor.nodes.labels.prefixText') : t('editor.nodes.labels.suffixText')" class="flex-1">
          <UInput v-model="nodeParts[nodeType]" />
        </UFormField>
      </template>
      <template v-else-if="nodeType === 'meta'">
        <UFormField :label="t('editor.nodes.labels.key')">
          <UInput v-model="nodeParts.key" />
        </UFormField>
        <UFormField :label="t('editor.nodes.labels.value')">
          <UInput v-model="nodeParts.value" />
        </UFormField>
      </template>
      <UFormField v-else-if="nodeType === 'weight'" :label="t('editor.nodes.labels.weightValue')">
        <UInput v-model="nodeParts.weight" type="number" />
      </UFormField>
      <UFormField v-else-if="nodeType === 'displayname'" :label="t('editor.nodes.labels.displayName')" :hint="t('editor.nodes.displayNameWarning')">
        <UInput v-model="nodeParts.displayName" />
      </UFormField>
      <UFormField :label="t('editor.value')">
        <UButton :color="value ? 'primary' : 'error'" variant="subtle" @click="value = !value">{{ value }}</UButton>
      </UFormField>
      <UFormField :label="t('editor.expiry')">
        <UInput
          :model-value="expiry ? expiry.toISOString().slice(0, 16) : ''"
          type="datetime-local"
          @change="expiry = ($event.target as HTMLInputElement).value ? new Date(($event.target as HTMLInputElement).value) : null"
        />
      </UFormField>
      <UButton :disabled="!keysToAdd().length" @click="add">{{ t('editor.add') }}</UButton>
    </div>
    <div v-else class="flex flex-wrap items-center gap-3">
      <UBadge color="neutral" variant="subtle">{{ editor.selectedNodes.length }} selected</UBadge>
      <UButton color="neutral" variant="subtle" @click="editor.setModal('copyNodes')">{{ t('editor.copy') }}</UButton>
      <UButton color="neutral" variant="subtle" @click="editor.setModal('moveNodes')">{{ t('editor.move') }}</UButton>
      <UButton color="error" variant="subtle" @click="editor.setModal('deleteNodes')">{{ t('editor.delete') }}</UButton>
      <UButton variant="ghost" @click="editor.deselectAllSelectedNodes()">{{ t('editor.nodes.deselect') }}</UButton>
      <UButtonGroup>
        <UButton :variant="bulkValue === true ? 'solid' : 'outline'" @click="bulkValue = true">true</UButton>
        <UButton :variant="bulkValue === null ? 'solid' : 'outline'" @click="bulkValue = null">-</UButton>
        <UButton :variant="bulkValue === false ? 'solid' : 'outline'" @click="bulkValue = false">false</UButton>
      </UButtonGroup>
      <UCheckbox v-model="replaceContexts" :label="t('editor.replace')" />
      <UButton @click="applyBulk">{{ t('editor.update') }}</UButton>
    </div>
    <div class="mt-2 flex flex-wrap items-center gap-2 text-sm">
      <UBadge v-for="entry in flatContexts" :key="`${entry.key}:${entry.value}`" color="neutral" variant="subtle" class="font-mono">
        {{ entry.key }}:{{ entry.value }}
      </UBadge>
      <UInput v-model="contextKey" size="xs" :placeholder="t('editor.key')" class="w-28" />
      <UInput v-model="contextValue" size="xs" :placeholder="t('editor.value')" class="w-28" @keydown.enter="addContext" />
      <UButton size="xs" icon="i-lucide-plus" @click="addContext">{{ t('editor.nodes.addContext') }}</UButton>
    </div>
  </div>
</template>
