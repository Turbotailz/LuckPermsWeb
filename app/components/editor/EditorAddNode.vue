<script setup lang="ts">
import { buildNodeKey, flattenContexts } from '~/utils/editor'

const props = defineProps<{
  simple?: boolean
}>()

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
const expiry = ref<number | null>(null)
const contexts = ref<Record<string, string[]>>({})
const contextKey = ref('')
const contextValue = ref('')

const types = computed(() => {
  const items = [
    { value: 'permission', label: t('editor.nodes.types.permission') },
    { value: 'inheritance', label: t('editor.nodes.types.inheritance') },
    { value: 'prefix', label: t('editor.nodes.types.prefix') },
    { value: 'suffix', label: t('editor.nodes.types.suffix') },
    { value: 'meta', label: t('editor.nodes.types.meta') },
    { value: 'weight', label: t('editor.nodes.types.weight') },
    { value: 'displayname', label: t('editor.nodes.types.displayname') }
  ]
  return items.filter((item) => {
    if (props.simple) {
      return item.value === 'permission'
    }
    if (editor.currentSession?.type === 'user') {
      return item.value !== 'weight' && item.value !== 'displayname'
    }
    return true
  })
})

watch([() => props.simple, () => editor.currentSession?.type], () => {
  if (props.simple) {
    nodeType.value = 'permission'
    return
  }
  if (editor.currentSession?.type === 'user' && (nodeType.value === 'weight' || nodeType.value === 'displayname')) {
    nodeType.value = 'permission'
  }
})

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
    expiry: expiry.value,
    context: contexts.value,
    isNew: true
  })))
  keys.forEach(key => editor.addKnownPermission(key))
  permissionsList.value = []
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-end gap-3">
      <UFormField v-if="!simple" :label="t('editor.nodes.nodeType')">
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
          <UInput v-model="nodeParts[nodeType]" class="font-mono" />
          <EditorChatText
            v-if="nodeParts[nodeType]"
            :value="nodeParts[nodeType]"
            class="mt-1.5 text-sm"
          />
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
      <UFormField :label="t('editor.enabled')">
        <USwitch v-model="value" />
      </UFormField>
      <UFormField :label="t('editor.expiry')" class="min-w-56">
        <EditorExpiryField v-model="expiry" />
      </UFormField>
      <UButton :disabled="!keysToAdd().length" @click="add">
        {{ t('editor.add') }}
      </UButton>
    </div>
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <UBadge v-for="entry in flatContexts" :key="`${entry.key}:${entry.value}`" color="neutral" variant="subtle" class="font-mono">
        {{ entry.key }}:{{ entry.value }}
      </UBadge>
      <UInput v-model="contextKey" size="xs" :placeholder="t('editor.key')" class="w-28" />
      <UInput v-model="contextValue" size="xs" :placeholder="t('editor.value')" class="w-28" @keydown.enter="addContext" />
      <UButton size="xs" icon="i-lucide-plus" @click="addContext">
        {{ t('editor.nodes.addContext') }}
      </UButton>
    </div>
  </div>
</template>
