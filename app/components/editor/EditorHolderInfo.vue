<script setup lang="ts">
import type { EditorNode, EditorSession } from '~/types/editor'
import { buildNodeKey, parseNodeType } from '~/utils/editor'
import { extraNodeCount, holderHasExtras, isBareNode, pickPrimaryNode } from '~/utils/holder-meta'
import { editorGroupPath } from '~/utils/editor-routes'

const props = defineProps<{
  session: EditorSession
  nodes: EditorNode[]
}>()

const advanced = defineModel<boolean>('advanced', { required: true })

const editor = useEditorStore()
const { t } = useI18n()
const { code } = useEditorNavigation()
const { selfHosted, siteUrl } = useLpConfig()
const weightWikiTo = selfHosted ? `${siteUrl}/wiki/features/weight` : '/wiki/features/weight'

const displayNode = computed(() => pickPrimaryNode(props.nodes, 'displayname'))
const weightNode = computed(() => pickPrimaryNode(props.nodes, 'weight'))
const prefixNode = computed(() => pickPrimaryNode(props.nodes, 'prefix'))
const suffixNode = computed(() => pickPrimaryNode(props.nodes, 'suffix'))
const parentNodes = computed(() =>
  props.nodes.filter(node => node.key.startsWith('group.') && isBareNode(node))
)
const metaNodes = computed(() =>
  props.nodes.filter(node => parseNodeType(node.key).type === 'meta' && isBareNode(node))
)

const parentIds = computed(() => parentNodes.value.map(node => node.key.slice('group.'.length)))
const availableParents = computed(() =>
  editor.sessions.filter(session => session.type === 'group' && session.id !== props.session.id && !parentIds.value.includes(session.id))
)
const parentItems = computed(() =>
  [...availableParents.value]
    .sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }) || a.id.localeCompare(b.id))
    .map(group => ({
      id: group.id,
      label: group.displayName,
      suffix: group.displayName !== group.id ? group.id : undefined
    }))
)
const parentGroups = computed(() => [{
  id: 'parents',
  items: parentItems.value
}])
const pendingParents = ref<string[]>([])

const displayDraft = ref('')
const weightDraft = ref('')
const prefixText = ref('')
const prefixWeight = ref('0')
const suffixText = ref('')
const suffixWeight = ref('0')
const addingParent = ref(false)
const displayNameOpen = ref(false)
const weightOpen = ref(false)
const prefixOpen = ref(false)
const suffixOpen = ref(false)
const metaOpen = ref(false)
const editingMetaId = ref<string | null>(null)
const metaKeyDraft = ref('')
const metaValueDraft = ref('')

const groupHasDisplayName = computed(() => {
  const name = props.session.displayName?.trim()
  return Boolean(name && name !== props.session.id)
})

const groupDisplayTitle = computed(() =>
  groupHasDisplayName.value ? props.session.displayName : props.session.id
)

watch(displayNode, (node) => {
  displayDraft.value = node && parseNodeType(node.key).type === 'displayname'
    ? parseNodeType(node.key).displayName || ''
    : ''
}, { immediate: true })

watch(weightNode, (node) => {
  weightDraft.value = node && parseNodeType(node.key).type === 'weight'
    ? String(parseNodeType(node.key).weight || '')
    : ''
}, { immediate: true })

watch(prefixNode, (node) => {
  const parsed = node ? parseNodeType(node.key) : null
  if (parsed?.type === 'prefix') {
    prefixText.value = parsed.prefix || ''
    prefixWeight.value = parsed.weight || '0'
  } else {
    prefixText.value = ''
    prefixWeight.value = weightDraft.value || '0'
  }
}, { immediate: true })

watch(suffixNode, (node) => {
  const parsed = node ? parseNodeType(node.key) : null
  if (parsed?.type === 'suffix') {
    suffixText.value = parsed.suffix || ''
    suffixWeight.value = parsed.weight || '0'
  } else {
    suffixText.value = ''
    suffixWeight.value = weightDraft.value || '0'
  }
}, { immediate: true })

watch(displayNameOpen, (open) => {
  if (open) {
    displayDraft.value = currentDisplayName()
  }
})

watch(weightOpen, (open) => {
  if (open) {
    weightDraft.value = currentWeight()
  }
})

watch(prefixOpen, (open) => {
  if (open) {
    const current = currentPrefix()
    prefixText.value = current.text
    prefixWeight.value = current.weight
  }
})

watch(suffixOpen, (open) => {
  if (open) {
    const current = currentSuffix()
    suffixText.value = current.text
    suffixWeight.value = current.weight
  }
})

function extras(type: string) {
  return extraNodeCount(props.nodes, type)
}

function asText(value: unknown) {
  return String(value ?? '').trim()
}

function currentDisplayName() {
  const parsed = displayNode.value ? parseNodeType(displayNode.value.key) : null
  return parsed?.type === 'displayname' ? parsed.displayName || '' : ''
}

function currentWeight() {
  const parsed = weightNode.value ? parseNodeType(weightNode.value.key) : null
  return parsed?.type === 'weight' ? parsed.weight : ''
}

const weightValue = computed(() => currentWeight())
const prefixValue = computed(() => currentPrefix().text)
const suffixValue = computed(() => currentSuffix().text)

function currentPrefix() {
  const parsed = prefixNode.value ? parseNodeType(prefixNode.value.key) : null
  if (parsed?.type !== 'prefix') {
    return { text: '', weight: weightDraft.value || '0' }
  }
  return { text: parsed.prefix || '', weight: parsed.weight || '0' }
}

function currentSuffix() {
  const parsed = suffixNode.value ? parseNodeType(suffixNode.value.key) : null
  if (parsed?.type !== 'suffix') {
    return { text: '', weight: weightDraft.value || '0' }
  }
  return { text: parsed.suffix || '', weight: parsed.weight || '0' }
}

function commitDisplayName() {
  const value = asText(displayDraft.value)
  if (value === currentDisplayName()) {
    return
  }
  editor.replaceNodeKey(
    props.session.id,
    displayNode.value?.id,
    value ? buildNodeKey('displayname', { displayName: value }) : null,
    props.session.type === 'group' ? { sessionDisplayName: value || props.session.id } : undefined
  )
}

function saveDisplayName() {
  commitDisplayName()
  displayNameOpen.value = false
}

function commitWeight() {
  const value = asText(weightDraft.value)
  if (value === currentWeight()) {
    return
  }
  editor.replaceNodeKey(
    props.session.id,
    weightNode.value?.id,
    value ? buildNodeKey('weight', { weight: value }) : null
  )
}

function saveWeight() {
  commitWeight()
  weightOpen.value = false
}

function commitPrefix() {
  const text = String(prefixText.value ?? '')
  const weight = asText(prefixWeight.value) || '0'
  const current = currentPrefix()
  if (text === current.text && (text ? weight : current.weight) === current.weight) {
    return
  }
  editor.replaceNodeKey(
    props.session.id,
    prefixNode.value?.id,
    text ? buildNodeKey('prefix', { weight, prefix: text }) : null
  )
}

function savePrefix() {
  commitPrefix()
  prefixOpen.value = false
}

function commitSuffix() {
  const text = String(suffixText.value ?? '')
  const weight = asText(suffixWeight.value) || '0'
  const current = currentSuffix()
  if (text === current.text && (text ? weight : current.weight) === current.weight) {
    return
  }
  editor.replaceNodeKey(
    props.session.id,
    suffixNode.value?.id,
    text ? buildNodeKey('suffix', { weight, suffix: text }) : null
  )
}

function saveSuffix() {
  commitSuffix()
  suffixOpen.value = false
}

function addParents(ids: string[]) {
  const unique = [...new Set(ids)].filter(id => id && !parentIds.value.includes(id))
  if (!unique.length) {
    return
  }
  editor.addNodes(unique.map(id => ({
    sessionId: props.session.id,
    key: `group.${id}`,
    value: true,
    isNew: true
  })), unique.length === 1 ? 'Add parent' : 'Add parents')
}

function onParentSelect(ids: Array<string | { id: string }>) {
  addParents(ids.map(id => typeof id === 'string' ? id : id.id))
  pendingParents.value = []
}

watch(() => props.session.id, () => {
  pendingParents.value = []
  addingParent.value = false
  displayNameOpen.value = false
  weightOpen.value = false
  prefixOpen.value = false
  suffixOpen.value = false
  metaOpen.value = false
  editingMetaId.value = null
})

watch(availableParents, (groups) => {
  if (!groups.length) {
    addingParent.value = false
  }
})

function removeParent(id: string) {
  const node = parentNodes.value.find(item => item.key === `group.${id}`)
  if (node) {
    editor.deleteNode(node.id)
  }
}

function metaParts(node: EditorNode) {
  const parsed = parseNodeType(node.key)
  if (parsed.type !== 'meta') {
    return { key: '', value: '' }
  }
  return { key: parsed.key, value: parsed.value }
}

const metaModalTitle = computed(() =>
  editingMetaId.value ? t('editor.holder.editMeta') : t('editor.holder.addMeta')
)
const metaDraftValid = computed(() => Boolean(metaKeyDraft.value.trim() && metaValueDraft.value.trim()))

function openAddMeta() {
  editingMetaId.value = null
  metaKeyDraft.value = ''
  metaValueDraft.value = ''
  metaOpen.value = true
}

function openEditMeta(node: EditorNode) {
  const parts = metaParts(node)
  editingMetaId.value = node.id
  metaKeyDraft.value = parts.key
  metaValueDraft.value = parts.value
  metaOpen.value = true
}

function commitMeta(node: EditorNode, key: string, value: string) {
  const nextKey = key.trim()
  const nextValue = value.trim()
  const current = metaParts(node)
  if (!nextKey || !nextValue) {
    return
  }
  if (nextKey === current.key && nextValue === current.value) {
    return
  }
  editor.replaceNodeKey(props.session.id, node.id, buildNodeKey('meta', { key: nextKey, value: nextValue }))
}

function saveMeta() {
  const key = metaKeyDraft.value.trim()
  const value = metaValueDraft.value.trim()
  if (!key || !value) {
    return
  }
  if (editingMetaId.value) {
    const node = metaNodes.value.find(item => item.id === editingMetaId.value)
    if (node) {
      commitMeta(node, key, value)
    }
  } else {
    editor.replaceNodeKey(props.session.id, undefined, buildNodeKey('meta', { key, value }))
  }
  metaOpen.value = false
}

function deleteEditingMeta() {
  if (editingMetaId.value) {
    editor.deleteNode(editingMetaId.value)
  }
  metaOpen.value = false
  editingMetaId.value = null
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div>
      <UCard variant="subtle" :ui="{ body: 'p-4 sm:p-4' }">
        <div v-if="session.type === 'user'" class="flex items-center gap-3">
          <PlayerAvatar :id="session.id" :name="session.displayName" :title="false" size="sm" />
          <div class="min-w-0">
            <p class="truncate text-lg font-semibold text-highlighted">{{ session.displayName }}</p>
            <p class="truncate font-mono text-xs text-muted">{{ session.id }}</p>
          </div>
        </div>
        <div v-else class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="truncate text-lg font-semibold text-highlighted">{{ groupDisplayTitle }}</p>
            <p v-if="groupHasDisplayName" class="truncate font-mono text-xs text-muted">
              {{ session.id }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <UBadge v-if="extras('displayname')" color="neutral" variant="subtle" size="xs">
              {{ t('editor.holder.extras', extras('displayname')) }}
            </UBadge>
            <UButton
              icon="i-lucide-pencil"
              color="neutral"
              variant="ghost"
              size="xs"
              :title="t('editor.groups.editDisplayName')"
              :aria-label="t('editor.groups.editDisplayName')"
              @click="displayNameOpen = true"
            />
          </div>
        </div>
      </UCard>

      <UModal v-model:open="displayNameOpen" :title="t('editor.groups.editDisplayName')" :ui="{ content: 'sm:max-w-lg' }">
        <template #body>
          <UFormField :label="t('editor.groups.displayName')" :help="t('editor.nodes.displayNameWarning')">
            <UInput
              v-model="displayDraft"
              autofocus
              class="w-full"
              :placeholder="t('editor.nodes.displayNamePlaceholder')"
              @keydown.enter.prevent="saveDisplayName"
            />
          </UFormField>
        </template>
        <template #footer="{ close }">
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="close()">
              {{ t('editor.cancel') }}
            </UButton>
            <UButton @click="saveDisplayName">
              {{ t('editor.save') }}
            </UButton>
          </div>
        </template>
      </UModal>
    </div>

    <EditorHolderCard :title="t('editor.meta.parents')" icon="i-lucide-git-merge">
      <template v-if="extras('inheritance')" #badge>
        <UBadge color="neutral" variant="subtle" size="xs">
          {{ t('editor.holder.extras', extras('inheritance')) }}
        </UBadge>
      </template>
      <template #actions>
        <UPopover
          v-model:open="addingParent"
          :content="{ align: 'end', side: 'bottom', sideOffset: 4 }"
          :ui="{ content: 'z-[100] w-72 p-0' }"
        >
          <UButton
            size="xs"
            color="neutral"
            variant="ghost"
            icon="i-lucide-plus"
            :disabled="!availableParents.length"
            :aria-label="t('editor.meta.add', { id: session.id })"
          />
          <template #content>
            <UCommandPalette
              v-model="pendingParents"
              value-key="id"
              multiple
              size="sm"
              class="w-72"
              :placeholder="t('editor.meta.filterParents')"
              :groups="parentGroups"
              :fuse="{ resultLimit: 10000, fuseOptions: { keys: ['label', 'suffix', 'id'] } }"
              :ui="{ viewport: 'max-h-52' }"
              @update:model-value="onParentSelect"
            >
              <template #empty>
                {{ t('editor.meta.noMatchingParents') }}
              </template>
            </UCommandPalette>
          </template>
        </UPopover>
      </template>
      <div v-if="parentIds.length" class="flex flex-wrap gap-1.5">
        <UBadge
          v-for="parent in parentIds"
          :key="parent"
          color="neutral"
          variant="subtle"
          class="pe-0.5"
        >
          <NuxtLink :to="editorGroupPath(code, parent)" class="hover:underline">{{ parent }}</NuxtLink>
          <UButton
            icon="i-lucide-x"
            size="xs"
            variant="ghost"
            :aria-label="t('editor.meta.removeParent', { parent })"
            @click="removeParent(parent)"
          />
        </UBadge>
      </div>
      <p v-else class="text-sm text-muted">{{ t('editor.groups.none') }}</p>
    </EditorHolderCard>

    <EditorHolderCard
      v-if="session.type === 'group'"
      compact
      :title="t('editor.groups.weight')"
      icon="i-lucide-scale"
    >
      <template v-if="extras('weight')" #badge>
        <UBadge color="neutral" variant="subtle" size="xs">
          {{ t('editor.holder.extras', extras('weight')) }}
        </UBadge>
      </template>
      <template #actions>
        <span
          class="font-mono text-sm tabular-nums"
          :class="weightValue ? 'text-highlighted' : 'text-muted'"
        >
          {{ weightValue || t('editor.groups.none') }}
        </span>
        <UButton
          icon="i-lucide-pencil"
          color="neutral"
          variant="ghost"
          size="xs"
          :title="t('editor.groups.editWeight')"
          :aria-label="t('editor.groups.editWeight')"
          @click="weightOpen = true"
        />
      </template>
    </EditorHolderCard>

    <UModal v-model:open="weightOpen" :title="t('editor.groups.editWeight')">
      <template #body>
        <UFormField :label="t('editor.groups.weight')">
          <UInput
            v-model="weightDraft"
            autofocus
            class="w-full"
            inputmode="numeric"
            :placeholder="t('editor.nodes.weightValuePlaceholder')"
            @keydown.enter.prevent="saveWeight"
          />
          <template #help>
            <span>{{ t('editor.groups.weightHelp') }}</span>
            <ULink
              :to="weightWikiTo"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-1 block text-primary font-medium hover:underline"
            >
              {{ t('editor.groups.weightWiki') }}
            </ULink>
          </template>
        </UFormField>
      </template>
      <template #footer="{ close }">
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="close()">
            {{ t('editor.cancel') }}
          </UButton>
          <UButton @click="saveWeight">
            {{ t('editor.save') }}
          </UButton>
        </div>
      </template>
    </UModal>

    <EditorHolderCard compact :title="t('editor.groups.prefix')" icon="i-lucide-text">
      <template v-if="extras('prefix')" #badge>
        <UBadge color="neutral" variant="subtle" size="xs">
          {{ t('editor.holder.extras', extras('prefix')) }}
        </UBadge>
      </template>
      <template #actions>
        <EditorChatText
          v-if="prefixValue"
          :value="prefixValue"
          class="min-w-0 max-w-36 text-sm"
        />
        <span v-else class="text-sm text-muted">{{ t('editor.groups.none') }}</span>
        <UButton
          icon="i-lucide-pencil"
          color="neutral"
          variant="ghost"
          size="xs"
          class="shrink-0"
          :title="t('editor.groups.editPrefix')"
          :aria-label="t('editor.groups.editPrefix')"
          @click="prefixOpen = true"
        />
      </template>
    </EditorHolderCard>

    <UModal v-model:open="prefixOpen" :title="t('editor.groups.editPrefix')">
      <template #body>
        <div class="space-y-4">
          <UFormField :label="t('editor.nodes.labels.preview')">
            <div class="flex min-h-8 items-center rounded-md bg-muted px-3 py-2">
              <EditorChatText v-if="prefixText" :value="prefixText" class="text-base" />
              <span v-else class="text-sm text-muted">{{ t('editor.groups.none') }}</span>
            </div>
          </UFormField>
          <div class="flex items-end gap-2">
            <UFormField :label="t('editor.nodes.labels.prefixText')" class="min-w-0 flex-1">
              <UInput
                v-model="prefixText"
                autofocus
                class="font-mono"
                :placeholder="t('editor.nodes.prefixPlaceholder')"
                @keydown.enter.prevent="savePrefix"
              />
            </UFormField>
            <UFormField :label="t('editor.nodes.labels.weight')" class="w-20 shrink-0">
              <UInput
                v-model="prefixWeight"
                inputmode="numeric"
                @keydown.enter.prevent="savePrefix"
              />
            </UFormField>
          </div>
        </div>
      </template>
      <template #footer="{ close }">
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="close()">
            {{ t('editor.cancel') }}
          </UButton>
          <UButton @click="savePrefix">
            {{ t('editor.save') }}
          </UButton>
        </div>
      </template>
    </UModal>

    <EditorHolderCard compact :title="t('editor.groups.suffix')" icon="i-lucide-whole-word">
      <template v-if="extras('suffix')" #badge>
        <UBadge color="neutral" variant="subtle" size="xs">
          {{ t('editor.holder.extras', extras('suffix')) }}
        </UBadge>
      </template>
      <template #actions>
        <EditorChatText
          v-if="suffixValue"
          :value="suffixValue"
          class="min-w-0 max-w-36 text-sm"
        />
        <span v-else class="text-sm text-muted">{{ t('editor.groups.none') }}</span>
        <UButton
          icon="i-lucide-pencil"
          color="neutral"
          variant="ghost"
          size="xs"
          class="shrink-0"
          :title="t('editor.groups.editSuffix')"
          :aria-label="t('editor.groups.editSuffix')"
          @click="suffixOpen = true"
        />
      </template>
    </EditorHolderCard>

    <UModal v-model:open="suffixOpen" :title="t('editor.groups.editSuffix')">
      <template #body>
        <div class="space-y-4">
          <UFormField :label="t('editor.nodes.labels.preview')">
            <div class="flex min-h-8 items-center rounded-md bg-muted px-3 py-2">
              <EditorChatText v-if="suffixText" :value="suffixText" class="text-base" />
              <span v-else class="text-sm text-muted">{{ t('editor.groups.none') }}</span>
            </div>
          </UFormField>
          <div class="flex items-end gap-2">
            <UFormField :label="t('editor.nodes.labels.suffixText')" class="min-w-0 flex-1">
              <UInput
                v-model="suffixText"
                autofocus
                class="font-mono"
                :placeholder="t('editor.nodes.suffixPlaceholder')"
                @keydown.enter.prevent="saveSuffix"
              />
            </UFormField>
            <UFormField :label="t('editor.nodes.labels.weight')" class="w-20 shrink-0">
              <UInput
                v-model="suffixWeight"
                inputmode="numeric"
                @keydown.enter.prevent="saveSuffix"
              />
            </UFormField>
          </div>
        </div>
      </template>
      <template #footer="{ close }">
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="close()">
            {{ t('editor.cancel') }}
          </UButton>
          <UButton @click="saveSuffix">
            {{ t('editor.save') }}
          </UButton>
        </div>
      </template>
    </UModal>

    <EditorHolderCard :title="t('editor.nodes.types.meta')" icon="i-lucide-tag">
      <template v-if="extras('meta')" #badge>
        <UBadge color="neutral" variant="subtle" size="xs">
          {{ t('editor.holder.extras', extras('meta')) }}
        </UBadge>
      </template>
      <template #actions>
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-plus"
          :aria-label="t('editor.holder.addMeta')"
          @click="openAddMeta"
        />
      </template>
      <div v-if="metaNodes.length" class="space-y-2">
        <EditorHolderMetaRow
          v-for="node in metaNodes"
          :key="node.id"
          :meta-key="metaParts(node).key"
          :meta-value="metaParts(node).value"
          @edit="openEditMeta(node)"
        />
      </div>
      <p v-else class="text-sm text-muted">{{ t('editor.holder.emptyMeta') }}</p>
    </EditorHolderCard>

    <UModal v-model:open="metaOpen" :title="metaModalTitle" :ui="{ content: 'sm:max-w-lg' }">
      <template #body>
        <div class="space-y-4">
          <UFormField :label="t('editor.nodes.labels.key')">
            <UInput
              v-model="metaKeyDraft"
              autofocus
              class="w-full font-mono"
              :placeholder="t('editor.nodes.metaKeyPlaceholder')"
              @keydown.enter.prevent="saveMeta"
            />
          </UFormField>
          <UFormField :label="t('editor.nodes.labels.value')">
            <UInput
              v-model="metaValueDraft"
              class="w-full font-mono"
              :placeholder="t('editor.nodes.metaValuePlaceholder')"
              @keydown.enter.prevent="saveMeta"
            />
          </UFormField>
        </div>
      </template>
      <template #footer="{ close }">
        <div class="flex w-full items-center justify-end gap-2">
          <UButton
            v-if="editingMetaId"
            color="error"
            variant="ghost"
            class="me-auto"
            @click="deleteEditingMeta"
          >
            {{ t('editor.delete') }}
          </UButton>
          <UButton color="neutral" variant="ghost" @click="close()">
            {{ t('editor.cancel') }}
          </UButton>
          <UButton :disabled="!metaDraftValid" @click="saveMeta">
            {{ t('editor.save') }}
          </UButton>
        </div>
      </template>
    </UModal>

    <UAlert
      v-if="!advanced && holderHasExtras(nodes, session.type)"
      color="neutral"
      variant="subtle"
      icon="i-lucide-layers"
      :title="t('editor.holder.extrasTitle')"
      :description="t('editor.holder.extrasHint')"
    />

    <EditorHolderCard :title="t('editor.holder.advanced')" icon="i-lucide-settings-2">
      <USwitch
        v-model="advanced"
        :description="t('editor.holder.advancedHint')"
      />
    </EditorHolderCard>
  </div>
</template>
