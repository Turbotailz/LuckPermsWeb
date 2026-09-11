<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const { t } = useI18n()
</script>

<template>
  <UApp>
    <AppHeader />
    <UError
      :error="props.error"
      :clear="{
        label: t('links.home'),
        icon: 'i-lucide-house'
      }"
    />
    <AppFooter />
  </UApp>
</template>
