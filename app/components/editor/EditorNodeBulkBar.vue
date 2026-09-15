<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const editor = useEditorStore()
const { t } = useI18n()

const moreItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: t('editor.nodes.bulkEnable'),
      icon: 'i-lucide-check',
      onSelect: () => editor.bulkUpdateNode({ value: true })
    },
    {
      label: t('editor.nodes.bulkDisable'),
      icon: 'i-lucide-x',
      onSelect: () => editor.bulkUpdateNode({ value: false })
    }
  ],
  [
    {
      label: t('editor.nodes.bulkExpiry'),
      icon: 'i-lucide-calendar',
      onSelect: () => editor.setModal('bulkExpiry')
    },
    {
      label: t('editor.nodes.bulkContexts'),
      icon: 'i-lucide-boxes',
      onSelect: () => editor.setModal('bulkContexts')
    }
  ]
])
</script>

<template>
  <div class="flex flex-wrap items-center justify-end gap-1.5">
    <p class="me-1 text-sm text-muted tabular-nums">
      {{ t('editor.nodes.selectedCount', editor.selectedNodes.length) }}
    </p>
    <UButton
      size="xs"
      color="error"
      variant="subtle"
      icon="i-lucide-trash"
      @click="editor.setModal('deleteNodes')"
    >
      {{ t('editor.delete') }}
    </UButton>
    <UButton
      size="xs"
      color="neutral"
      variant="subtle"
      icon="i-lucide-copy"
      @click="editor.setModal('copyNodes')"
    >
      {{ t('editor.copy') }}
    </UButton>
    <UButton
      size="xs"
      color="neutral"
      variant="subtle"
      icon="i-lucide-folder-input"
      @click="editor.setModal('moveNodes')"
    >
      {{ t('editor.move') }}
    </UButton>
    <UDropdownMenu :items="moreItems">
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        icon="i-lucide-ellipsis"
        :aria-label="t('editor.nodes.moreActions')"
      />
    </UDropdownMenu>
    <UButton
      size="xs"
      color="neutral"
      variant="link"
      @click="editor.deselectAllSelectedNodes()"
    >
      {{ t('editor.nodes.deselect') }}
    </UButton>
  </div>
</template>
