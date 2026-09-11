<script setup lang="ts">
const { gitHash, selfHosted, siteUrl } = useLpConfig()
const year = new Date().getFullYear()
const creditsTo = selfHosted ? `${siteUrl}/wiki/about/credits` : '/wiki/about/credits'
</script>

<template>
  <UFooter>
    <template #left>
      <p class="flex items-center gap-1 text-sm text-muted">
        <UIcon name="i-lucide-git-branch" class="size-4 text-primary" />
        <ULink to="https://github.com/LuckPerms/LuckPermsWeb" target="_blank">LuckPermsWeb</ULink>
        @
        <ULink :to="`https://github.com/LuckPerms/LuckPermsWeb/commit/${gitHash}`" target="_blank">{{ gitHash }}</ULink>
      </p>
    </template>
    <template #right>
      <ULink :to="creditsTo" class="text-sm text-muted">
        Copyright © 2017-{{ year }} LuckPerms contributors
      </ULink>
    </template>
  </UFooter>
</template>
