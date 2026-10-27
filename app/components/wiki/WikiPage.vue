<script setup lang="ts">
import type { ContentTocLink } from '@nuxt/ui'
import { wikiSections } from '~/utils/wiki-nav'

const props = defineProps<{
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

const route = useRoute()
const localePath = useLocalePath()
const { t, locale } = useI18n()

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

const barePath = computed(() => {
  const prefix = `/${locale.value}`
  const path = route.path
  if (path === prefix || path.startsWith(`${prefix}/`)) {
    return path.slice(prefix.length) || '/'
  }
  return path
})

const sectionTitle = computed(() =>
  wikiSections.find(section => section.paths.some(path => barePath.value === path || barePath.value.startsWith(`${path}/`)))?.title
)

const updatedLabel = computed(() => {
  if (!props.updatedAt) {
    return ''
  }
  const date = new Date(props.updatedAt)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' }).format(date)
})
</script>

<template>
  <UPage :ui="pageUi" class="lp-wiki-article">
    <header class="mb-8 border-b border-default pb-6">
      <nav class="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-muted" :aria-label="t('wiki')">
        <ULink :to="localePath('/wiki')" class="font-medium text-primary hover:underline">{{ t('wiki') }}</ULink>
        <template v-if="sectionTitle && sectionTitle !== title">
          <span aria-hidden="true">/</span>
          <span>{{ sectionTitle }}</span>
        </template>
        <span aria-hidden="true">/</span>
        <span class="text-highlighted">{{ title }}</span>
      </nav>
      <h1 class="text-4xl font-semibold tracking-tight text-highlighted sm:text-5xl">{{ title }}</h1>
      <p v-if="description" class="mt-3 max-w-2xl text-lg text-muted">{{ description }}</p>
      <p v-if="updatedLabel" class="mt-4 font-mono text-xs text-muted">{{ updatedLabel }}</p>
    </header>
    <UPageBody class="lp-prose">
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
