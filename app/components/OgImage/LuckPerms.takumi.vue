<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  description?: string
  eyebrow?: string
  variant?: 'brand' | 'wiki' | 'editor'
}>(), {
  title: 'LuckPerms',
  description: 'A permissions plugin for Minecraft servers.',
  eyebrow: 'LuckPerms',
  variant: 'brand'
})
</script>

<template>
  <div
    class="flex h-full w-full flex-col justify-between"
    :style="{
      background: variant === 'wiki' ? '#FBF7EC' : variant === 'editor' ? '#0E1A13' : '#A6E81E',
      color: variant === 'editor' ? '#FBF7EC' : '#14261C',
      fontFamily: 'Figtree, sans-serif'
    }"
  >
    <img
      v-if="variant === 'brand'"
      src="/brand/clover-soft-lime.svg"
      alt=""
      width="420"
      height="420"
      style="position: absolute; top: 40px; right: -40px; opacity: 0.9;"
    >
    <img
      v-else-if="variant === 'wiki'"
      src="/brand/dots-soft-cream.svg"
      alt=""
      width="280"
      height="280"
      style="position: absolute; top: 48px; right: 48px; opacity: 0.9;"
    >
    <div
      class="flex items-center justify-between"
      style="padding: 56px 64px 0; position: relative;"
    >
      <div class="flex items-center" style="gap: 20px;">
        <img
          src="/logo.png"
          alt=""
          width="72"
          height="72"
          :style="variant === 'editor' ? 'background:#FBF7EC;border-radius:999px;padding:8px;' : ''"
        >
        <span style="font-family: 'Bricolage Grotesque', Figtree, sans-serif; font-size: 36px; font-weight: 800; letter-spacing: -0.04em;">
          LuckPerms
        </span>
      </div>
      <span :style="{ fontSize: '28px', color: variant === 'editor' ? '#9FB1A4' : '#14261C' }">luckperms.net</span>
    </div>

    <div style="padding: 0 64px; display: flex; flex-direction: column; gap: 16px; position: relative;">
      <span
        :style="{
          fontSize: '22px',
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: variant === 'editor' ? '#A6E81E' : '#14261C'
        }"
      >
        {{ eyebrow }}
      </span>
      <h1
        style="font-family: 'Bricolage Grotesque', Figtree, sans-serif; font-size: 64px; font-weight: 800; line-height: 1.05; letter-spacing: -0.045em; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;"
        :style="{ color: variant === 'editor' ? '#A6E81E' : '#14261C' }"
      >
        {{ title }}
      </h1>
      <p
        v-if="description"
        :style="{
          fontSize: '28px',
          lineHeight: 1.4,
          color: variant === 'editor' ? '#9FB1A4' : '#14261C',
          margin: 0,
          maxWidth: '900px',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }"
      >
        {{ description }}
      </p>
    </div>

    <div :style="{ height: '16px', background: variant === 'brand' ? '#14261C' : '#A6E81E' }" />
  </div>
</template>
