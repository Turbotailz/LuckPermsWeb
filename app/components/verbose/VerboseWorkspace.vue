<script setup lang="ts">
import { useVirtualizer } from '@tanstack/vue-virtual'

const route = useRoute()
const verbose = useVerboseStore()
const { t } = useI18n()
const filter = ref('')
const excluded = ref<string[]>([])
const parentRef = ref<HTMLElement | null>(null)

async function load() {
  const id = sessionIdFromRoute(route)
  if (!id) {
    verbose.reset()
    return
  }
  try {
    await verbose.load(id)
  } catch {
    // store flags errors
  }
}

onMounted(load)
watch(() => route.fullPath, load)
onBeforeUnmount(() => {
  if (!route.path.startsWith('/verbose/')) {
    verbose.reset()
  }
})

const filtered = computed(() => {
  const data = verbose.data || []
  const q = filter.value.toLowerCase()
  return data.filter(node =>
    !excluded.value.includes(String(node.result))
    && (!q
      || node.permission?.toLowerCase().includes(q)
      || node.key?.toLowerCase().includes(q)
      || node.who?.identifier.toLowerCase().includes(q))
  )
})

const virtualizer = useVirtualizer(computed(() => ({
  count: filtered.value.length,
  getScrollElement: () => parentRef.value,
  estimateSize: () => 40,
  overscan: 10
})))

function toggleExclude(value: string) {
  excluded.value = excluded.value.includes(value)
    ? excluded.value.filter(item => item !== value)
    : [...excluded.value, value]
}

const sessionId = computed(() => sessionIdFromRoute(route))

const metaItems = computed(() => {
  const metadata = verbose.metadata
  if (!metadata) {
    return []
  }
  return [
    { label: t('verbose.start'), value: metadata.startTime },
    { label: t('verbose.end'), value: metadata.endTime },
    { label: t('verbose.duration'), value: metadata.duration },
    { label: t('verbose.count'), value: `${filtered.value.length} / ${metadata.count?.total}` },
    { label: t('verbose.filter'), value: metadata.filter },
    { label: t('verbose.truncated'), value: String(metadata.truncated) }
  ]
})
</script>

<template>
  <ToolEmpty
    v-if="verbose.status !== 2 || !verbose.metadata"
    :title="t('verbose.title')"
    :description="t('verbose.home.generate')"
    :loading="verbose.status === 1"
    :error="verbose.status === 3"
    :actions="sessionId ? [] : [{ label: t('tools.demo'), to: '/verbose/demo', icon: 'i-lucide-play' }]"
  >
    <UAlert
      v-if="verbose.errors.load"
      color="error"
      variant="subtle"
      :title="t('editor.error.title')"
      :description="t('editor.error.info')"
    />
    <UAlert
      v-else-if="verbose.errors.unsupported"
      color="warning"
      variant="subtle"
      :title="t('editor.unsupported.title')"
    />
    <template v-else-if="verbose.status !== 1">
      <div class="flex flex-col items-center gap-2">
        <CommandCode value="/lp verbose record [filter]" />
        <p class="text-sm text-muted">{{ t('verbose.home.performActions') }}</p>
        <CommandCode value="/lp verbose paste" />
        <p class="text-sm text-muted">{{ t('verbose.home.url') }}</p>
      </div>
    </template>
  </ToolEmpty>

  <UDashboardGroup v-else storage-key="lp-verbose">
    <UDashboardSidebar collapsible resizable :default-size="24" :min-size="18">
      <template #header>
        <UInput v-model="filter" :placeholder="t('verbose.filterPlaceholder')" icon="i-lucide-search" />
      </template>
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted">{{ t('verbose.uploaded') }}</span>
          <PlayerAvatar
            v-if="verbose.metadata.uploader?.uuid && verbose.metadata.uploader.uuid !== '00000000-0000-0000-0000-000000000000'"
            :id="verbose.metadata.uploader.uuid"
            :title="false"
          />
          <span class="text-sm">{{ verbose.metadata.uploader?.name }}</span>
        </div>
        <dl class="space-y-2 text-sm">
          <div v-for="item in metaItems" :key="item.label" class="flex justify-between gap-3">
            <dt class="text-muted">{{ item.label }}</dt>
            <dd class="font-mono text-highlighted">{{ item.value }}</dd>
          </div>
        </dl>
        <div class="space-y-2">
          <UCheckbox
            v-for="value in ['true', 'false', 'undefined']"
            :key="value"
            :model-value="excluded.includes(value)"
            @update:model-value="toggleExclude(value)"
          >
            <template #label>
              {{ t('verbose.exclude') }}
              <UBadge :color="value === 'true' ? 'primary' : value === 'false' ? 'error' : 'neutral'" variant="subtle" class="ms-1 font-mono">
                {{ value }}
              </UBadge>
            </template>
          </UCheckbox>
        </div>
      </div>
    </UDashboardSidebar>
    <UDashboardPanel :ui="{ body: 'p-0 gap-0 overflow-hidden' }">
      <template #header>
        <UDashboardNavbar :title="t('verbose.title')">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
        </UDashboardNavbar>
      </template>
      <template #body>
        <div ref="parentRef" class="min-h-0 flex-1 overflow-auto p-4">
          <div :style="{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }">
            <VerboseNodeRow
              v-for="row in virtualizer.getVirtualItems()"
              :key="filtered[row.index]!.id"
              :node="filtered[row.index]!"
              class="absolute left-0 w-full"
              :style="{ transform: `translateY(${row.start}px)` }"
            />
          </div>
        </div>
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
