<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div class="flex w-full flex-col items-center gap-3">
    <p class="text-sm text-muted">
      {{ t('editor.start') }}
    </p>
    <div class="flex flex-col items-center gap-2">
      <CommandCode value="/lp editor" copyable />
      <CommandCode value="/lp user <user> editor" copyable />
      <CommandCode value="/lp group <group> editor" copyable />
    </div>
  </div>
</template>
