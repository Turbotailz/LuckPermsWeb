<script setup lang="ts">
import { loadWikiSearchData } from '~/utils/wiki-search'

const navigation = shallowRef<Awaited<ReturnType<typeof loadWikiSearchData>>['navigation']>([])
const files = shallowRef<Awaited<ReturnType<typeof loadWikiSearchData>>['files']>([])
const pending = ref(true)

onMounted(async () => {
  try {
    const data = await loadWikiSearchData()
    navigation.value = data.navigation
    files.value = data.files
  } finally {
    pending.value = false
  }
})
</script>

<template>
  <!-- Shortcut stays on SiteSearch so opening search does not toggle twice. -->
  <UContentSearch
    :files="files"
    :navigation="navigation"
    :loading="pending"
    shortcut="ctrl_alt_shift_f9"
    :fuse="{ resultLimit: 20 }"
  />
</template>
