<script setup lang="ts">
const layoutUi = {
  root: 'flex flex-col lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]! lg:gap-8 xl:gap-10',
  left: 'lg:col-span-1! min-w-0',
  center: 'lg:col-span-1! min-w-0'
}
</script>

<template>
  <UContainer>
    <UPage :ui="layoutUi">
      <template #left>
        <UPageAside>
          <WikiNav />
        </UPageAside>
      </template>
      <slot />
    </UPage>
  </UContainer>
</template>
