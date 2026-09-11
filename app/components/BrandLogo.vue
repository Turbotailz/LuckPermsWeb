<script setup lang="ts">
import logo from '~/assets/images/logo.svg'

withDefaults(defineProps<{
  size?: string
}>(), {
  size: 'size-8'
})
</script>

<template>
  <img
    :src="logo"
    alt=""
    :class="size"
    width="32"
    height="32"
  >
</template>
