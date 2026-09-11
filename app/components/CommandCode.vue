<script setup lang="ts">
const props = withDefaults(defineProps<{
  value: string
  copyable?: boolean
}>(), {
  copyable: false
})

const { t } = useI18n()
const { announce } = useAnnounce()

async function copy() {
  await navigator.clipboard.writeText(props.value)
  announce(t('editor.copied'))
}
</script>

<template>
  <UButton
    v-if="copyable"
    color="neutral"
    variant="subtle"
    icon="i-lucide-copy"
    class="font-mono"
    @click="copy"
  >
    {{ value }}
  </UButton>
  <UBadge
    v-else
    color="neutral"
    variant="subtle"
    class="font-mono font-normal"
  >
    {{ value }}
  </UBadge>
</template>
