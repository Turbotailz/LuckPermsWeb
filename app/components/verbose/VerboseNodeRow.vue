<script setup lang="ts">
import type { VerboseNode } from '~/stores/verbose'

const props = defineProps<{
  node: VerboseNode
}>()

const { t } = useI18n()
const open = ref(false)
const resultColor = computed(() => {
  if (props.node.result === 'true') return 'primary' as const
  if (props.node.result === 'false') return 'error' as const
  return 'neutral' as const
})
</script>

<template>
  <UCollapsible v-model:open="open" class="mb-1">
    <UButton
      color="neutral"
      variant="subtle"
      block
      class="justify-start"
    >
      <span class="flex min-w-40 items-center gap-2">
        <PlayerAvatar
          v-if="node.who?.uuid && node.who.uuid !== '00000000-0000-0000-0000-000000000000'"
          :id="node.who.uuid"
          :name="node.who.identifier"
          :title="false"
        />
        {{ node.who?.identifier }}
      </span>
      <span class="flex-1 truncate text-left font-mono text-sm">{{ node.permission || (node.key ? `meta: ${node.key}` : '') }}</span>
      <UBadge :color="resultColor" variant="subtle" class="font-mono">{{ node.result }}</UBadge>
    </UButton>
    <template #content>
      <UCard class="mt-1">
        <div class="grid gap-4 text-sm md:grid-cols-3">
          <dl class="space-y-2">
            <div v-if="node.context?.length" class="flex flex-col gap-1">
              <dt class="text-muted">{{ t('verbose.context') }}</dt>
              <dd>
                <UBadge
                  v-for="ctx in node.context"
                  :key="`${ctx.key}:${ctx.value}`"
                  color="neutral"
                  variant="subtle"
                  class="me-1 font-mono"
                >
                  {{ ctx.key }}: {{ ctx.value }}
                </UBadge>
              </dd>
            </div>
            <div>
              <dt class="text-muted">{{ t('verbose.origin') }}</dt>
              <dd class="font-mono">{{ node.origin }}</dd>
            </div>
            <div v-if="node.resultInfo?.processorClass">
              <dt class="text-muted">{{ t('verbose.processor') }}</dt>
              <dd class="font-mono">{{ node.resultInfo.processorClass.split('.').at(-1) }}</dd>
            </div>
            <div>
              <dt class="text-muted">{{ t('verbose.thread') }}</dt>
              <dd class="font-mono">{{ node.thread }}</dd>
            </div>
            <div v-if="node.timestamp">
              <dt class="text-muted">Time</dt>
              <dd class="font-mono">{{ node.timestamp }}</dd>
            </div>
          </dl>
          <div class="md:col-span-2">
            <p class="text-muted">{{ t('verbose.trace') }}</p>
            <pre class="mt-1 max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">{{ (node.trace || []).join('\n') }}</pre>
            <template v-if="node.resultInfo?.node">
              <p class="mt-3 text-muted">{{ t('verbose.cause') }}</p>
              <pre class="mt-1 overflow-auto rounded-md bg-muted p-3 text-xs">{{ JSON.stringify(node.resultInfo.node, null, 2) }}</pre>
            </template>
          </div>
        </div>
      </UCard>
    </template>
  </UCollapsible>
</template>
