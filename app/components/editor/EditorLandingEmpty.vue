<script setup lang="ts">
import logo from '~/assets/images/logo.svg'

const { t } = useI18n()
</script>

<template>
  <div class="flex min-h-[calc(100vh-var(--ui-header-height))] items-center justify-center p-6">
    <UEmpty
      variant="subtle"
      size="xl"
      :ui="{
        root: 'relative flex flex-col items-stretch gap-0 rounded-lg p-0 sm:p-0 lg:p-0 min-w-0 w-full max-w-lg sm:max-w-4xl sm:flex-row overflow-hidden',
        header: 'flex flex-1 flex-col items-center justify-center gap-2 p-6 sm:p-8 text-center max-w-none',
        body: 'flex items-stretch p-0 max-w-none w-full self-stretch sm:w-px',
        footer: 'flex flex-1 flex-col items-center justify-center gap-3 p-6 sm:p-8 text-center max-w-none'
      }"
    >
      <template #header>
        <UAvatar :src="logo" alt="LuckPerms" size="xl" class="mb-2" />
        <h2 class="text-lg font-medium text-pretty text-highlighted">
          {{ t('editor.description') }}
        </h2>
        <p class="text-base text-balance text-toned">
          {{ t('editor.intro') }}
        </p>
        <div class="mt-4 flex flex-wrap justify-center gap-2">
          <UButton
            size="xl"
            to="/editor/demo"
            icon="i-lucide-play"
          >
            {{ t('tools.demo') }}
          </UButton>
          <UButton
            size="xl"
            to="/wiki/features/web-editor"
            icon="i-lucide-book-open"
            color="neutral"
            variant="outline"
          >
            {{ t('editor.learnMore') }}
          </UButton>
        </div>
      </template>

      <template #body>
        <USeparator class="w-full sm:hidden" />
        <USeparator
          orientation="vertical"
          decorative
          class="hidden h-full sm:flex"
        />
      </template>

      <template #footer>
        <EditorStartPrompt />
      </template>
    </UEmpty>
  </div>
</template>
