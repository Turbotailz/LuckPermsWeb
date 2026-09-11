<script setup lang="ts">
definePageMeta({
  middleware: 'public-site'
})

const { t } = useI18n()

useSeoMeta({
  title: () => t('sponsorPage.title'),
  description: () => t('sponsorPage.intro')
})

function logClick() {
  trackPlausible('SponsorLinkOut')
}
</script>

<template>
  <div>
    <UPageHero :title="t('sponsorPage.heading')">
      <template #headline>
        <div class="flex items-center justify-center gap-6">
          <BrandLogo size="size-20" />
          <UIcon name="i-lucide-heart" class="size-10 text-error" />
          <span class="rounded-lg bg-inverted p-2">
            <img src="~/assets/images/bisect.svg" alt="BisectHosting" class="h-14">
          </span>
        </div>
      </template>
      <template #description>
        <p>{{ t('sponsorPage.intro') }}</p>
      </template>
      <template #links>
        <UButton size="xl" to="https://bisecthosting.com/luck" target="_blank" @click="logClick">
          {{ t('sponsorPage.ctaCreate') }}
        </UButton>
        <UButton
          size="xl"
          color="neutral"
          variant="subtle"
          to="https://www.bisecthosting.com/clients/submitticket.php?step=2&deptid=1"
          target="_blank"
          @click="logClick"
        >
          {{ t('sponsorPage.ctaSupport') }}
        </UButton>
      </template>
    </UPageHero>

    <UPageSection :title="t('sponsorPage.whyTitle')" orientation="horizontal">
      <ul class="space-y-4 text-default">
        <li class="flex gap-3">
          <UIcon name="i-lucide-circle-check" class="mt-0.5 size-5 shrink-0 text-primary" />
          <TrustedHtml :html="t('sponsorPage.why1')" />
        </li>
        <li class="flex gap-3">
          <UIcon name="i-lucide-circle-check" class="mt-0.5 size-5 shrink-0 text-primary" />
          <TrustedHtml :html="t('sponsorPage.why2')" />
        </li>
        <li class="flex gap-3">
          <UIcon name="i-lucide-circle-check" class="mt-0.5 size-5 shrink-0 text-primary" />
          <TrustedHtml :html="t('sponsorPage.why3')" />
        </li>
      </ul>
      <p class="mt-6 text-muted">{{ t('sponsorPage.thanks') }}</p>
    </UPageSection>

    <UPageSection :title="t('sponsorPage.offerTitle')" orientation="horizontal">
      <div class="space-y-3 text-default">
        <p><TrustedHtml :html="t('sponsorPage.offer1')" /></p>
        <p><TrustedHtml :html="t('sponsorPage.offer2')" /></p>
        <p><TrustedHtml :html="t('sponsorPage.offer3')" /></p>
        <p><TrustedHtml :html="t('sponsorPage.offer4')" /></p>
      </div>
    </UPageSection>
  </div>
</template>
