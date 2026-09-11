<script setup lang="ts">
import defaultSkin from '~/assets/images/defaultskin.png'

const props = withDefaults(defineProps<{
  id: string
  name?: string
  title?: boolean
}>(), {
  title: true
})

const editor = useEditorStore()
const verbose = useVerboseStore()
const tree = useTreeStore()
const { t } = useI18n()

const key = computed(() => props.id.replace(/-/g, ''))
const platform = computed(() =>
  editor.metaData?.platform
  ?? verbose.metadata?.platform
  ?? tree.metadata?.platform
  ?? 'Minecraft'
)
const src = computed(() =>
  platform.value === 'Hytale'
    ? `https://crafthead.net/hytale/helm/${key.value}/24`
    : `https://crafthead.net/helm/${key.value}/24`
)
const currentSrc = ref(src.value)

watch(src, (value) => {
  currentSrc.value = value
})

function onError() {
  currentSrc.value = defaultSkin
}

const label = computed(() => t('avatar', { name: props.name || props.id }))
</script>

<template>
  <UAvatar
    :src="currentSrc"
    :alt="label"
    size="xs"
    class="rounded-sm [image-rendering:pixelated]"
    :ui="{ image: '[image-rendering:pixelated]' }"
    @error="onError"
  />
</template>
