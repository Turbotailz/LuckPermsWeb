<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  description?: string
  eyebrow?: string
}>(), {
  title: 'LuckPerms',
  description: 'A permissions plugin for Minecraft servers.',
  eyebrow: 'LuckPerms'
})
</script>

<template>
  <div
    class="flex h-full w-full flex-col justify-between"
    style="background: #0b1221; color: #f8fafc;"
  >
    <div
      class="flex items-center justify-between"
      style="padding: 56px 64px 0;"
    >
      <div class="flex items-center" style="gap: 20px;">
        <img
          src="/logo.png"
          alt=""
          width="72"
          height="72"
        >
        <span style="font-size: 36px; font-weight: 700; letter-spacing: -0.04em;">
          LuckPerms
        </span>
      </div>
      <span style="font-size: 28px; color: #94a3b8;">luckperms.net</span>
    </div>

    <div style="padding: 0 64px; display: flex; flex-direction: column; gap: 16px;">
      <span style="font-size: 26px; font-weight: 600; color: #94df03;">
        {{ eyebrow }}
      </span>
      <h1
        style="font-size: 64px; font-weight: 800; line-height: 1.08; letter-spacing: -0.04em; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;"
      >
        {{ title }}
      </h1>
      <p
        v-if="description"
        style="font-size: 28px; line-height: 1.35; color: #94a3b8; margin: 0; max-width: 980px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;"
      >
        {{ description }}
      </p>
    </div>

    <div style="height: 12px; background: #94df03;" />
  </div>
</template>
