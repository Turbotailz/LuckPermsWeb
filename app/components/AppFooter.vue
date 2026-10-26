<script setup lang="ts">
import type { FooterColumn } from '@nuxt/ui'

const { t } = useI18n()
const localePath = useLocalePath()
const { gitHash, selfHosted, siteUrl } = useLpConfig()
const year = new Date().getFullYear()

const columns = computed<FooterColumn[]>(() => {
  const tools: FooterColumn = {
    label: t('footer.tools'),
    children: [
      { label: t('links.editor'), to: localePath('/editor') },
      { label: t('links.verbose'), to: localePath('/verbose') },
      { label: t('links.tree'), to: localePath('/treeview') }
    ]
  }

  if (selfHosted) {
    return [tools]
  }

  return [
    {
      label: t('footer.product'),
      children: [
        { label: t('links.home'), to: localePath('/') },
        { label: t('links.download'), to: localePath('/download') },
        { label: t('links.wiki'), to: localePath('/wiki') },
        { label: t('footer.gettingStarted'), to: localePath('/wiki/getting-started') },
        { label: t('sponsorPage.title'), to: localePath('/sponsor') }
      ]
    },
    tools,
    {
      label: t('footer.community'),
      children: [
        { label: 'GitHub', to: 'https://github.com/LuckPerms/LuckPerms', target: '_blank' },
        { label: 'Discord', to: 'https://discord.gg/luckperms', target: '_blank' },
        { label: t('footer.credits'), to: selfHosted ? `${siteUrl}/wiki/about/credits` : localePath('/wiki/about/credits') },
        { label: t('home.why.why'), to: localePath('/wiki/about/why-luckperms') }
      ]
    }
  ]
})
</script>

<template>
  <UFooter class="border-t border-default">
    <template #top>
      <UContainer>
        <UFooterColumns :columns="columns" :ui="{ linkLabelExternalIcon: 'hidden' }">
          <template #left>
            <div class="flex flex-col items-center gap-3 sm:items-start">
              <ULink :to="localePath('/')" class="flex items-center gap-2 text-lg font-bold text-highlighted">
                <BrandLogo size="size-8" />
                LuckPerms
              </ULink>
              <p class="max-w-xs text-center text-sm text-muted sm:text-start">
                {{ t('description') }}
              </p>
            </div>
          </template>
        </UFooterColumns>
      </UContainer>
    </template>

    <template #left>
      <p class="flex items-center gap-1 text-sm text-muted">
        <UIcon name="i-lucide-git-branch" class="size-4 text-primary" />
        <ULink to="https://github.com/LuckPerms/LuckPermsWeb" target="_blank">LuckPermsWeb</ULink>
        @
        <ULink :to="`https://github.com/LuckPerms/LuckPermsWeb/commit/${gitHash}`" target="_blank">{{ gitHash }}</ULink>
      </p>
    </template>

    <template #right>
      <UButton
        v-if="!selfHosted"
        icon="i-simple-icons-github"
        color="neutral"
        variant="ghost"
        to="https://github.com/LuckPerms/LuckPerms"
        target="_blank"
        aria-label="GitHub"
      />
      <UButton
        v-if="!selfHosted"
        icon="i-simple-icons-discord"
        color="neutral"
        variant="ghost"
        to="https://discord.gg/luckperms"
        target="_blank"
        aria-label="Discord"
      />
      <ULink :to="creditsTo" class="text-sm text-muted">
        {{ t('footer.copyright', { year }) }}
      </ULink>
    </template>
  </UFooter>
</template>
