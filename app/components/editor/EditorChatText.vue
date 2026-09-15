<script setup lang="ts">
import { formatColoredHtml, formatColoredPlain } from '~/utils/minecraft-text'

const props = defineProps<{
  value: string
}>()

const html = computed(() => formatColoredHtml(props.value))
const plain = computed(() => formatColoredPlain(props.value))
</script>

<template>
  <span
    class="mc-chat-text inline-block max-w-full truncate align-middle"
    :title="value"
    :aria-label="plain"
    v-html="html"
  />
</template>

<style scoped>
.mc-chat-text {
  white-space: pre;
  text-shadow: 0 1px 2px rgb(0 0 0 / 55%);
}
</style>
