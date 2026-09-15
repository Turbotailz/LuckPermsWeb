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
  <div class="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:py-12">
    <div class="mx-auto flex w-full flex-col gap-4 sm:gap-6 lg:max-w-2xl lg:gap-12">
      <UPageCard
        :title="title"
        :description="description"
        variant="naked"
        orientation="horizontal"
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
        :ui="{
          container: 'gap-y-0 p-0 sm:p-0',
          wrapper: 'hidden'
        }"
      >
        <div>
          <div class="border-b border-default p-4">
            <UInput
              v-model="search"
              icon="i-lucide-search"
              :placeholder="searchPlaceholder"
              class="w-full"
            />
          </div>
          <slot />
        </div>
      </UPageCard>
    </div>
  </div>
</template>
