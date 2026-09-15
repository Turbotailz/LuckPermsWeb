<script setup lang="ts">
import type { ContentTocLink } from '@nuxt/ui'

defineProps<{
  title?: string
  description?: string
  toc?: ContentTocLink[]
  updatedAt?: string
  editUrl?: string
  contributors?: {
    name: string
    username?: string
    avatar?: string
  }[]
}>()

const pageUi = {
  root: 'flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(13rem,18rem)]! xl:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]! 2xl:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)]! lg:gap-8 xl:gap-10',
  center: 'lg:col-span-1! min-w-0',
  right: 'lg:col-span-1! min-w-0 order-first lg:order-last'
}

const tocUi = {
  list: 'min-w-0',
  item: 'min-w-0',
  itemWithChildren: 'min-w-0',
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
          <span class="min-w-0 flex-1 truncate" :title="link.text">{{ link.text }}</span>
        </template>
        <template #bottom>
          <WikiContributors
            :contributors="contributors"
            :updated-at="updatedAt"
            :edit-url="editUrl"
          />
        </template>
      </UContentToc>
      <aside v-else class="flex flex-col gap-6 lg:sticky lg:top-(--ui-header-height) py-8">
        <WikiContributors
          :contributors="contributors"
          :updated-at="updatedAt"
          :edit-url="editUrl"
        />
      </aside>
    </template>
  </UPage>
</template>
