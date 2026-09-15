<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'
import logo from '~/assets/images/logo.svg'

withDefaults(defineProps<{
  title: string
  description?: string
  loading?: boolean
  error?: boolean
  variant?: 'outline' | 'solid' | 'soft' | 'subtle' | 'naked'
  actions?: ButtonProps[]
}>(), {
  loading: false,
  error: false,
  variant: 'naked',
  actions: () => []
})
</script>

<template>
  <div class="flex min-h-[calc(100vh-var(--ui-header-height))] items-center justify-center p-6">
    <UEmpty
      :avatar="{ src: logo, alt: 'LuckPerms' }"
      :title="title"
      :description="description"
      :loading="loading"
      :variant="error ? 'subtle' : variant"
      :actions="actions"
      size="xl"
    >
      <template #footer>
        <div class="flex max-w-md flex-col items-center gap-3 text-center">
          <slot />
        </div>
      </template>
    </UEmpty>
  </div>
</template>
