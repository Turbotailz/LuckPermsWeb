<script setup lang="ts">
import type { LocaleSelectItem } from '~/utils/locale'
import { emojiFlag } from '~/utils/locale'

const props = withDefaults(defineProps<{
  locales: LocaleSelectItem[]
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  class?: string
}>(), {
  size: 'sm'
})

const model = defineModel<string>({ required: true })

function resolveFlag(item: LocaleSelectItem | undefined) {
  if (!item) {
    return { kind: 'empty' as const }
  }
  if (item.flag === 'pirate' || item.code === 'en-PT') {
    return { kind: 'pirate' as const }
  }
  const emoji = emojiFlag(item.flag)
  return emoji
    ? { kind: 'emoji' as const, emoji }
    : { kind: 'empty' as const }
}

const selectedFlag = computed(() => resolveFlag(props.locales.find(item => item.code === model.value)))
</script>

<template>
  <USelectMenu
    v-model="model"
    :items="locales"
    value-key="code"
    label-key="name"
    :search-input="locales.length > 8"
    :size="size"
    :class="props.class"
    :ui="{ content: 'min-w-48' }"
  >
    <template #leading>
      <span class="flex size-5 items-center justify-center overflow-hidden">
        <img
          v-if="selectedFlag.kind === 'pirate'"
          src="/twemoji-pirate-flag.png"
          alt=""
          class="size-5 object-contain"
        >
        <span v-else-if="selectedFlag.kind === 'emoji'" class="text-center text-base leading-none">
          {{ selectedFlag.emoji }}
        </span>
      </span>
    </template>

    <template #item-leading="{ item }">
      <span class="flex size-5 items-center justify-center overflow-hidden">
        <template v-for="flag in [resolveFlag(item)]" :key="item.code">
          <img
            v-if="flag.kind === 'pirate'"
            src="/twemoji-pirate-flag.png"
            alt=""
            class="size-5 object-contain"
          >
          <span v-else-if="flag.kind === 'emoji'" class="text-center text-base leading-none">
            {{ flag.emoji }}
          </span>
        </template>
      </span>
    </template>
  </USelectMenu>
</template>
