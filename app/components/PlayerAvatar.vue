<script setup lang="ts">
import defaultSkin from '~/assets/images/defaultskin.png'

const props = withDefaults(defineProps<{
  id: string
  name?: string
  title?: boolean
  size?: '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
}>(), {
  title: true,
  size: 'xs'
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
const helmSize = computed(() => {
  const sizes: Record<string, number> = {
    '3xs': 16,
    '2xs': 20,
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 56,
    '2xl': 64,
    '3xl': 80
  }
  return sizes[props.size] ?? 24
})
const src = computed(() =>
  platform.value === 'Hytale'
    ? `https://crafthead.net/hytale/helm/${key.value}/${helmSize.value}`
    : `https://crafthead.net/helm/${key.value}/${helmSize.value}`
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
    :size="size"
    class="rounded-sm [image-rendering:pixelated]"
    :ui="{ image: '[image-rendering:pixelated]' }"
    @error="onError"
  />
</template>
