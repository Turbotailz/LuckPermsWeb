<script setup lang="ts">
import mark from '~/assets/images/logo.svg'
import lockupLight from '~/assets/brand/lockup-colour.svg'
import lockupDark from '~/assets/brand/lockup-on-dark.svg'

withDefaults(defineProps<{
  size?: string
  variant?: 'mark' | 'lockup'
}>(), {
  size: 'size-8',
  variant: 'mark'
})
</script>

<template>
  <span v-if="variant === 'lockup'" class="inline-flex items-center">
    <img
      :src="lockupLight"
      alt="LuckPerms"
      class="h-8 w-auto dark:hidden"
      width="168"
      height="32"
    >
    <img
      :src="lockupDark"
      alt="LuckPerms"
      class="hidden h-8 w-auto dark:block"
      width="168"
      height="32"
    >
  </span>
  <img
    v-else
    :src="mark"
    alt=""
    :class="size"
    width="32"
    height="32"
  >
</template>
