<script setup lang="ts">
const props = defineProps<{
  node?: string
  branchData: Record<string, unknown> | unknown
}>()

const treeStore = useTreeStore()
const open = ref(true)

watch(() => treeStore.expandToken, () => {
  open.value = true
})
watch(() => treeStore.collapseToken, () => {
  if (props.node) {
    open.value = false
  }
})

const children = computed(() => {
  if (props.branchData && typeof props.branchData === 'object' && !Array.isArray(props.branchData)) {
    return props.branchData as Record<string, unknown>
  }
  return {}
})
const hasChildren = computed(() => Object.keys(children.value).length > 0)
const result = computed(() => {
  if (!props.node || !treeStore.checkResults) {
    return null
  }
  return treeStore.checkResults[props.node] || null
})
const resultColor = computed(() => {
  if (result.value === 'true') return 'primary' as const
  if (result.value === 'false') return 'error' as const
  return 'neutral' as const
})
</script>

<template>
  <div :class="node ? 'ps-4' : ''">
    <UCollapsible v-if="node" v-model:open="open">
      <UButton
        color="neutral"
        variant="ghost"
        block
        class="mb-0.5 justify-between"
      >
        <span class="flex items-center gap-1">
          <UIcon v-if="hasChildren" :name="open ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" />
          <span class="font-mono text-sm">{{ node }}</span>
        </span>
        <UBadge v-if="result" :color="resultColor" variant="subtle" class="font-mono">{{ result }}</UBadge>
      </UButton>
      <template #content>
        <TreeBranch
          v-for="(branch, child) in children"
          :key="String(child)"
          :node="String(child)"
          :branch-data="branch"
        />
      </template>
    </UCollapsible>
    <template v-else-if="hasChildren">
      <TreeBranch
        v-for="(branch, child) in children"
        :key="String(child)"
        :node="String(child)"
        :branch-data="branch"
      />
    </template>
  </div>
</template>
