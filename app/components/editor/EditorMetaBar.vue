<script setup lang="ts">
import type { EditorNode, EditorSession } from '~/types/editor'
import { parseNodeType } from '~/utils/editor'
import { editorGroupPath, editorSectionPath } from '~/utils/editor-routes'

const props = defineProps<{
  session: EditorSession
  sessionData: {
    type: string
    parents: EditorNode[]
    weight: EditorNode[]
    prefixes: EditorNode[]
    suffixes: EditorNode[]
  }
}>()

const editor = useEditorStore()
const { t } = useI18n()
const { code, section } = useEditorNavigation()
const adding = ref(false)

const indexPath = computed(() => editorSectionPath(code.value, section.value))
const showId = computed(() => props.session.type === 'group' && props.session.displayName !== props.session.id)

const groupWeight = computed(() => {
  const { weight } = props.sessionData
  if (!weight.length) {
    return t('editor.groups.none')
  }
  if (weight.length === 1) {
    return weight[0]!.key.split('.').pop()
  }
  return t('editor.meta.multiple')
})

const parents = computed(() =>
  props.sessionData.parents.filter(parent => parent.value).map(parent => parent.key.split('.').pop() as string)
)

const prefixes = computed(() => affixes(props.sessionData.prefixes, 'prefix'))
const suffixes = computed(() => affixes(props.sessionData.suffixes, 'suffix'))

const available = computed(() =>
  editor.sessions.filter(session => session.type === 'group' && !parents.value.includes(session.id))
)

function affixes(nodes: EditorNode[], kind: 'prefix' | 'suffix') {
  return nodes.flatMap((node) => {
    if (!node.value) {
      return []
    }
    const parsed = parseNodeType(node.key)
    if (parsed.type !== kind) {
      return []
    }
    return [{
      id: node.id,
      text: kind === 'prefix' ? parsed.prefix : parsed.suffix,
      weight: parsed.weight
    }]
  })
}

function addParent(id: string) {
  editor.addNodes([{
    sessionId: props.session.id,
    key: `group.${id}`,
    value: true,
    isNew: true
  }], 'Add parent')
  adding.value = false
}

function removeParent(id: string) {
  const node = props.sessionData.parents.find(parent => parent.key === `group.${id}`)
  if (node) {
    editor.deleteNode(node.id)
  }
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-default px-3 py-1.5 text-sm">
    <UTooltip :text="t(`editor.nav.${section}`)">
      <UButton
        color="neutral"
        variant="ghost"
        size="xs"
        icon="i-lucide-arrow-left"
        :aria-label="t(`editor.nav.${section}`)"
        :to="indexPath"
      />
    </UTooltip>

    <div class="flex min-w-0 items-center gap-2">
      <PlayerAvatar v-if="sessionData.type === 'user'" :id="session.id" :name="session.displayName" :title="false" />
      <span class="truncate font-semibold text-highlighted">{{ session.displayName }}</span>
      <span v-if="showId" class="truncate font-mono text-muted">({{ session.id }})</span>
    </div>

    <div v-if="sessionData.type === 'group'" class="flex items-center gap-1.5">
      <span class="text-muted">{{ t('editor.meta.weight') }}</span>
      <UBadge color="neutral" variant="subtle">{{ groupWeight }}</UBadge>
    </div>

    <div class="flex min-w-0 flex-wrap items-center gap-1.5">
      <span class="text-muted">{{ t('editor.meta.parents') }}</span>
      <UButton size="xs" icon="i-lucide-plus" variant="ghost" :aria-label="t('editor.meta.add', { id: session.id })" @click="adding = !adding" />
      <span
        v-for="parent in parents"
        :key="parent"
        class="inline-flex items-center rounded-md bg-elevated pe-0.5"
      >
        <UButton
          :to="editorGroupPath(code, parent)"
          color="neutral"
          variant="ghost"
          size="xs"
        >
          {{ parent }}
        </UButton>
        <UButton icon="i-lucide-x" size="xs" variant="ghost" :aria-label="t('editor.meta.removeParent', { parent })" @click.stop="removeParent(parent)" />
      </span>
      <div v-if="adding" class="flex flex-wrap gap-1">
        <UButton v-for="group in available" :key="group.id" size="xs" color="neutral" variant="subtle" @click="addParent(group.id)">
          {{ group.id }}
        </UButton>
      </div>
    </div>

    <div v-if="prefixes.length" class="flex min-w-0 flex-wrap items-center gap-1.5">
      <span class="text-muted">{{ t('editor.groups.prefix') }}</span>
      <UBadge
        v-for="item in prefixes"
        :key="item.id"
        color="neutral"
        variant="subtle"
        class="max-w-48 truncate font-mono"
        :title="`${item.text} (${t('editor.nodes.weightLabel')}: ${item.weight})`"
      >
        {{ item.text }}
      </UBadge>
    </div>

    <div v-if="suffixes.length" class="flex min-w-0 flex-wrap items-center gap-1.5">
      <span class="text-muted">{{ t('editor.groups.suffix') }}</span>
      <UBadge
        v-for="item in suffixes"
        :key="item.id"
        color="neutral"
        variant="subtle"
        class="max-w-48 truncate font-mono"
        :title="`${item.text} (${t('editor.nodes.weightLabel')}: ${item.weight})`"
      >
        {{ item.text }}
      </UBadge>
    </div>
  </div>
</template>
