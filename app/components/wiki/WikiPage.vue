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
  root: 'flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(13rem,18rem)]! xl:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]! 2xl:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)]! lg:gap-8 xl:gap-10',
  center: 'lg:col-span-1! min-w-0',
  right: 'lg:col-span-1! min-w-0 order-first lg:order-last'
}

const tocUi = {
  link: 'min-w-0',
  linkText: 'truncate'
}
</script>

<template>
  <UPage :ui="pageUi">
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
</template>
