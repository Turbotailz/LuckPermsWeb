<script setup lang="ts">
import bisect from '~/assets/images/bisect.svg'

definePageMeta({
  middleware: 'public-site'
})

const { t } = useI18n()

useSeoMeta({
  title: () => t('sponsorPage.title'),
  description: () => t('sponsorPage.intro')
})

const heroUi = {
  root: 'relative overflow-hidden',
  container: 'py-10 sm:py-14 lg:py-16 gap-10 lg:gap-12',
  title: 'text-4xl sm:text-6xl lg:text-7xl text-pretty tracking-tight font-bold text-highlighted',
  description: 'mt-6 text-lg sm:text-xl/8 text-muted text-pretty max-w-xl',
  links: 'flex flex-wrap items-center gap-3'
}

const sectionUi = {
  container: 'py-12 sm:py-16 lg:py-20 gap-8 sm:gap-10',
  body: 'mt-10',
  footer: 'mt-8'
}

const whyCards = computed(() => [
  { title: t('sponsorPage.whyTrustedTitle'), description: t('sponsorPage.whyTrustedDescription'), icon: 'i-lucide-shield-check' },
  { title: t('sponsorPage.whyServiceTitle'), description: t('sponsorPage.whyServiceDescription'), icon: 'i-lucide-sparkles' },
  { title: t('sponsorPage.whySupportTitle'), description: t('sponsorPage.whySupportDescription'), icon: 'i-lucide-heart' }
])

const offerCards = computed(() => [
  { title: t('sponsorPage.offerDiscountTitle'), description: t('sponsorPage.offerDiscountDescription'), icon: 'i-lucide-badge-percent' },
  { title: t('sponsorPage.offerTransferTitle'), description: t('sponsorPage.offerTransferDescription'), icon: 'i-lucide-arrow-left-right' },
  { title: t('sponsorPage.offerCodeTitle'), description: t('sponsorPage.offerCodeDescription'), icon: 'i-lucide-ticket' }
])

function logClick() {
  trackPlausible('SponsorLinkOut')
}
</script>

<template>
  <div>
    <UPageHero
      orientation="horizontal"
      :title="t('sponsorPage.heading')"
      :description="t('sponsorPage.intro')"
      :ui="heroUi"
    >
      <template #headline>
        <span class="font-semibold text-primary">{{ t('sponsorPage.eyebrow') }}</span>
      </template>
      <template #links>
        <UButton size="xl" to="https://bisecthosting.com/luck" target="_blank" @click="logClick">
          {{ t('sponsorPage.ctaCreate') }}
        </UButton>
        <UButton
          size="xl"
          color="neutral"
          variant="outline"
          to="https://www.bisecthosting.com/clients/submitticket.php?step=2&deptid=1"
          target="_blank"
          @click="logClick"
        >
          {{ t('sponsorPage.ctaSupport') }}
        </UButton>
      </template>
      <div class="relative mx-auto flex w-full items-center justify-center gap-5 py-6 lg:justify-end lg:py-0">
        <div class="absolute size-48 rounded-full bg-primary/20 blur-3xl sm:size-64" />
        <BrandLogo size="size-20 sm:size-24" class="relative" />
        <span class="relative text-3xl font-light text-muted sm:text-4xl">×</span>
        <span class="relative rounded-2xl bg-inverted p-4 sm:p-5">
          <img :src="bisect" alt="BisectHosting" class="h-10 w-auto sm:h-12">
        </span>
      </div>
    </UPageHero>

    <UPageSection :title="t('sponsorPage.whyTitle')" :ui="sectionUi">
      <template #body>
        <UPageGrid>
          <UPageCard
            v-for="card in whyCards"
            :key="card.title"
            :icon="card.icon"
            :title="card.title"
            :description="card.description"
            variant="subtle"
          />
        </UPageGrid>
      </template>
      <template #footer>
        <p class="text-center text-muted">{{ t('sponsorPage.thanks') }}</p>
      </template>
    </UPageSection>

    <UPageSection :title="t('sponsorPage.offerTitle')" :ui="sectionUi">
      <template #body>
        <UPageGrid>
          <UPageCard
            v-for="(card, index) in offerCards"
            :key="card.title"
            :icon="card.icon"
            :title="card.title"
            :description="card.description"
            variant="subtle"
            :highlight="index === 0"
            highlight-color="primary"
          />
        </UPageGrid>
      </template>
      <template #footer>
        <div class="flex justify-center">
          <UButton size="xl" to="https://bisecthosting.com/luck" target="_blank" @click="logClick">
            {{ t('sponsorPage.ctaCreate') }}
          </UButton>
        </div>
      </template>
    </UPageSection>
  </div>
</template>
