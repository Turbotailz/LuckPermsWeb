<script setup lang="ts">
defineProps<{
  title: string
  description: string
  addLabel: string
  searchPlaceholder: string
}>()

const emit = defineEmits<{
  add: []
}>()

const search = defineModel<string>('search', { default: '' })
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6">
    <div class="mx-auto flex min-h-0 w-full flex-1 flex-col gap-4 lg:max-w-2xl">
      <UPageCard
        :title="title"
        :description="description"
        variant="naked"
        orientation="horizontal"
        class="shrink-0"
      >
        <UButton
          :label="addLabel"
          icon="i-lucide-plus"
          color="neutral"
          class="w-fit lg:ms-auto"
          @click.stop="emit('add')"
        />
      </UPageCard>

      <UPageCard
        variant="subtle"
        class="min-h-0 flex-1 overflow-hidden"
        :ui="{
          root: 'flex min-h-0 flex-1 flex-col overflow-hidden',
          container: 'flex min-h-0 flex-1 flex-col gap-y-0 p-0 sm:p-0 lg:flex lg:grid-cols-none',
          wrapper: 'hidden'
        }"
      >
        <div class="flex min-h-0 min-w-0 flex-1 flex-col">
          <div class="shrink-0 border-b border-default p-4">
            <UInput
              v-model="search"
              icon="i-lucide-search"
              :placeholder="searchPlaceholder"
              class="w-full"
            />
          </div>
          <div class="min-h-0 flex-1">
            <slot />
          </div>
        </div>
      </UPageCard>
    </div>
  </div>
</template>
