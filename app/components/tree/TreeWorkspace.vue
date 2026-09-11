<script setup lang="ts">
const route = useRoute()
const treeStore = useTreeStore()
const { t } = useI18n()

async function load() {
  const id = sessionIdFromRoute(route)
  if (!id) {
    treeStore.reset()
    return
  }
  try {
    await treeStore.load(id)
  } catch {
    // store flags errors
  }
}

onMounted(load)
watch(() => route.fullPath, load)
onBeforeUnmount(() => {
  if (!route.path.startsWith('/treeview/')) {
    treeStore.reset()
  }
})

const hasData = computed(() => Boolean(treeStore.metadata && treeStore.tree))
const sessionId = computed(() => sessionIdFromRoute(route))
</script>

<template>
  <ToolEmpty
    v-if="!hasData"
    :title="t('tree.title')"
    :description="t('tree.home.generate')"
    :loading="Boolean(sessionId) && !treeStore.errors.load && !treeStore.errors.unsupported"
    :error="treeStore.errors.load || treeStore.errors.unsupported"
    :actions="sessionId ? [] : [{ label: t('tools.demo'), to: '/treeview/demo', icon: 'i-lucide-play' }]"
  >
    <UAlert
      v-if="treeStore.errors.load"
      color="error"
      variant="subtle"
      :title="t('editor.error.title')"
      :description="t('editor.error.info')"
    />
    <UAlert
      v-else-if="treeStore.errors.unsupported"
      color="warning"
      variant="subtle"
      :title="t('editor.unsupported.title')"
    />
    <template v-else-if="!sessionId">
      <div class="flex flex-col items-center gap-2">
        <CommandCode :value="`/lp tree [${t('tree.home.scope')}] [${t('tree.home.player')}]`" />
        <p class="text-sm text-muted">{{ t('tree.home.url') }}</p>
      </div>
    </template>
  </ToolEmpty>

  <UDashboardGroup v-else storage-key="lp-tree">
    <UDashboardSidebar collapsible resizable :default-size="24" :min-size="18">
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted">{{ t('tree.uploaded') }}</span>
          <PlayerAvatar
            v-if="treeStore.metadata?.uploader?.uuid && treeStore.metadata.uploader.uuid !== '00000000-0000-0000-0000-000000000000'"
            :id="treeStore.metadata.uploader.uuid"
            :title="false"
          />
          <span class="text-sm">{{ treeStore.metadata?.uploader?.name }}</span>
        </div>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between gap-3">
            <dt class="text-muted">{{ t('tree.time') }}</dt>
            <dd class="font-mono text-highlighted">{{ treeStore.metadata?.time }}</dd>
          </div>
          <div v-if="treeStore.metadata?.root" class="flex justify-between gap-3">
            <dt class="text-muted">Root</dt>
            <dd class="font-mono text-highlighted">{{ treeStore.metadata.root }}</dd>
          </div>
          <div v-if="treeStore.metadata?.referenceUser" class="flex items-center justify-between gap-3">
            <dt class="text-muted">{{ t('tree.user') }}</dt>
            <dd class="flex items-center gap-2">
              <PlayerAvatar :id="treeStore.metadata.referenceUser.uuid" :name="treeStore.metadata.referenceUser.name" />
              {{ treeStore.metadata.referenceUser.name }}
            </dd>
          </div>
        </dl>
        <div class="flex gap-2">
          <UButton color="neutral" variant="subtle" icon="i-lucide-plus" @click="treeStore.expandAll()">{{ t('tree.expand') }}</UButton>
          <UButton color="neutral" variant="subtle" icon="i-lucide-minus" @click="treeStore.collapseAll()">{{ t('tree.collapse') }}</UButton>
        </div>
      </div>
    </UDashboardSidebar>
    <UDashboardPanel :ui="{ body: 'p-0 gap-0 overflow-hidden' }">
      <template #header>
        <UDashboardNavbar :title="t('tree.title')">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
        </UDashboardNavbar>
      </template>
      <template #body>
        <div class="min-h-0 flex-1 overflow-auto p-4">
          <TreeBranch
            v-for="(branch, node) in treeStore.tree"
            :key="String(node)"
            :node="String(node)"
            :branch-data="branch"
          />
        </div>
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
