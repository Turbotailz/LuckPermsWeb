<script setup lang="ts">
import type { EditorNode } from '~/types/editor'
import { isPermissionNode } from '~/utils/holder-meta'

const props = defineProps<{
  nodes: EditorNode[]
}>()

const { t } = useI18n()

interface Branch {
  name: string
  value?: boolean
  children: Branch[]
}

const tree = computed(() => {
  const root: Branch[] = []
  const index = new Map<string, Branch>()
  for (const node of props.nodes) {
    if (!isPermissionNode(node)) {
      continue
    }
    const parts = node.key.split('.').filter(Boolean)
    let path = ''
    let list = root
    parts.forEach((part, indexInKey) => {
      path = path ? `${path}.${part}` : part
      let branch = index.get(path)
      if (!branch) {
        branch = { name: part, children: [] }
        index.set(path, branch)
        list.push(branch)
      }
      if (indexInKey === parts.length - 1) {
        branch.value = node.value
      }
      list = branch.children
    })
  }
  return root.sort((a, b) => a.name.localeCompare(b.name))
})

const open = ref<Set<string>>(new Set())

watch(tree, (branches) => {
  open.value = new Set(branches.slice(0, 4).map(branch => branch.name))
}, { immediate: true })

function toggle(name: string) {
  const next = new Set(open.value)
  if (next.has(name)) {
    next.delete(name)
  } else {
    next.add(name)
  }
  open.value = next
}
</script>

<template>
  <aside class="lp-perm-tree flex min-h-0 flex-col overflow-hidden">
    <p class="border-b border-default px-3 py-2 text-xs font-semibold tracking-wide text-muted uppercase">
      {{ t('editor.permissions') }}
    </p>
    <ul class="min-h-0 flex-1 space-y-1 overflow-auto p-2">
      <li v-for="branch in tree" :key="branch.name">
        <button
          type="button"
          class="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-start text-sm font-medium text-highlighted hover:bg-elevated"
          @click="toggle(branch.name)"
        >
          <UIcon
            :name="open.has(branch.name) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
            class="size-3.5 shrink-0 text-muted"
          />
          <span class="min-w-0 flex-1 truncate font-mono">{{ branch.name }}</span>
          <span
            v-if="branch.value !== undefined"
            class="lp-value"
            :data-value="String(branch.value)"
          >{{ branch.value }}</span>
        </button>
        <ul v-if="open.has(branch.name)" class="ms-4 space-y-0.5 border-s border-default ps-2">
          <li v-for="child in branch.children" :key="child.name" class="py-0.5">
            <div class="flex items-center gap-2">
              <span class="min-w-0 flex-1 truncate font-mono text-xs text-default">{{ child.name }}</span>
              <span
                v-if="child.value !== undefined"
                class="lp-value"
                :data-value="String(child.value)"
              >{{ child.value }}</span>
            </div>
            <ul v-if="child.children.length" class="ms-3 space-y-0.5">
              <li v-for="leaf in child.children" :key="leaf.name" class="flex items-center gap-2 py-0.5">
                <span class="min-w-0 flex-1 truncate font-mono text-xs text-muted">{{ leaf.name }}</span>
                <span
                  v-if="leaf.value !== undefined"
                  class="lp-value"
                  :data-value="String(leaf.value)"
                >{{ leaf.value }}</span>
              </li>
            </ul>
          </li>
        </ul>
      </li>
    </ul>
  </aside>
</template>
