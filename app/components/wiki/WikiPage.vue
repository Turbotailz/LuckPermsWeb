<script setup lang="ts">
import type { ContentTocLink } from '@nuxt/ui'

defineProps<{
  title?: string
  description?: string
  toc?: ContentTocLink[]
}>()

const route = useRoute()
const { data: meta } = await useAsyncData(
  () => `wiki-meta:${route.path}`,
  () => $fetch('/api/wiki-meta', { query: { path: route.path } })
)

const pageUi = {
  root: 'flex flex-col lg:grid lg:grid-cols-12! lg:gap-8',
  left: 'lg:col-span-3! min-w-0',
  center: 'lg:col-span-6! min-w-0',
  right: 'lg:col-span-3! min-w-0 order-first lg:order-last'
}

const tocUi = {
  link: 'min-w-0',
  linkText: 'truncate'
}
</script>

<template>
  <UContainer>
    <UPage :ui="pageUi">
      <template #left>
        <UPageAside>
          <WikiNav />
        </UPageAside>
      </template>

      <UPageHeader :title="title" :description="description" />
      <UPageBody>
        <slot />
      </UPageBody>

      <template #right>
        <UContentToc
          v-if="toc?.length"
          highlight
          highlight-variant="circuit"
          :links="toc"
          :ui="tocUi"
        >
          <template #link="{ link }">
            <span class="truncate min-w-0" :title="link.text">{{ link.text }}</span>
          </template>
          <template #bottom>
            <USeparator type="dashed" class="hidden lg:block" />
            <WikiPageMeta :updated-at="meta?.updatedAt" :edit-url="meta?.editUrl" />
          </template>
        </UContentToc>
        <aside v-else class="hidden lg:block sticky top-(--ui-header-height) py-8">
          <WikiPageMeta :updated-at="meta?.updatedAt" :edit-url="meta?.editUrl" />
        </aside>
      </template>
    </UPage>
  </UContainer>
</template>
