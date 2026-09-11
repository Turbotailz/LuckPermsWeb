<script setup lang="ts">
import type { PageLink } from '@nuxt/ui'

const props = defineProps<{
  updatedAt?: string
  editUrl?: string
}>()

const { t, locale } = useI18n()

const formatted = computed(() => {
  if (!props.updatedAt) {
    return ''
  }
  const date = new Date(props.updatedAt)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' }).format(date)
})

const links = computed<PageLink[]>(() => {
  if (!props.editUrl) {
    return []
  }
  return [{
    label: t('wikiPage.edit'),
    icon: 'i-lucide-pencil',
    to: props.editUrl,
    target: '_blank'
  }]
})
</script>

<template>
  <div v-if="formatted || links.length" class="flex flex-col gap-6">
    <div v-if="formatted">
      <p class="text-sm font-semibold text-highlighted">
        {{ t('wikiPage.lastUpdated') }}
      </p>
      <time class="mt-1 block text-sm text-muted" :datetime="updatedAt">
        {{ formatted }}
      </time>
    </div>
    <UPageLinks v-if="links.length" :links="links" />
  </div>
</template>
