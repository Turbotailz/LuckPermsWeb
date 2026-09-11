<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div>
    <UContainer class="pt-4">
      <UAlert
        color="neutral"
        variant="subtle"
        icon="i-lucide-info"
        :title="t('wikiLocaleWarning')"
      />
    </UContainer>
    <slot />
  </div>
</template>
