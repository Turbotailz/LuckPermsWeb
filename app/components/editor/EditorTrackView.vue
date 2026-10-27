<script setup lang="ts">
import { editorGroupPath, editorSectionPath } from '~/utils/editor-routes'

const route = useRoute()
const editor = useEditorStore()
const { t } = useI18n()
const { code } = useEditorNavigation()

const trackId = computed(() => String(route.params.trackId || ''))
const track = computed(() => editor.tracks.find(item => item.id === trackId.value))
const tracksIndex = computed(() => editorSectionPath(code.value, 'tracks'))

function edit() {
  if (track.value) {
    editor.setModal('createTrack', { track: track.value })
  }
}

function remove() {
  const id = track.value?.id
  if (!id) {
    return
  }
  editor.deleteTrack(id)
  navigateTo(tracksIndex.value)
}
</script>

<template>
  <div v-if="track" class="flex min-h-0 flex-1 flex-col">
    <div class="flex items-center gap-2 border-b border-default px-4 py-2">
      <UButton
        color="neutral"
        variant="ghost"
        size="xs"
        icon="i-lucide-arrow-left"
        :label="t('editor.nav.tracks')"
        :to="tracksIndex"
      />
      <span class="ms-2 font-semibold text-highlighted">{{ track.id }}</span>
      <div class="ms-auto flex gap-1">
        <UButton icon="i-lucide-pencil" size="xs" variant="ghost" :aria-label="t('editor.tracks.edit')" @click="edit" />
        <UButton icon="i-lucide-x" size="xs" variant="ghost" :aria-label="t('editor.tracks.delete')" @click="remove" />
      </div>
    </div>
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
      <h2 class="mb-3 shrink-0 text-sm font-semibold text-highlighted">{{ t('editor.tracks.groups') }}</h2>
      <ol class="min-h-0 flex-1 space-y-2 overflow-auto">
        <li v-for="(group, index) in track.groups" :key="group">
          <NuxtLink :to="editorGroupPath(code, group)" class="lp-track-row">
            <span class="lp-track-index">{{ index + 1 }}</span>
            <span class="min-w-0 flex-1 truncate font-semibold">{{ group }}</span>
          </NuxtLink>
        </li>
      </ol>
    </div>
  </div>
  <UEmpty
    v-else
    icon="i-lucide-search"
    variant="naked"
    :title="t('editor.index.notFound')"
    class="flex-1"
  >
    <template #actions>
      <UButton color="neutral" variant="subtle" :label="t('editor.nav.tracks')" :to="tracksIndex" />
    </template>
  </UEmpty>
</template>
