import type { UseSeoMetaInput } from '@unhead/vue'

export function usePageSeo(opts: {
  title: string
  description?: string
  path?: string
  titleTemplate?: string | null
  eyebrow?: string
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}) {
  const { siteUrl, selfHosted } = useLpConfig()
  const route = useRoute()
  const path = opts.path ?? route.path
  const url = path === '/' ? `${siteUrl}/` : `${siteUrl}${path}`
  const description = opts.description || ''
  const seo: UseSeoMetaInput = {
    title: opts.title,
    description,
    ogTitle: opts.title,
    ogDescription: description,
    ogUrl: url,
    ogType: 'website',
    ogSiteName: 'LuckPerms',
    ogLocale: 'en_GB',
    twitterCard: 'summary_large_image',
    twitterTitle: opts.title,
    twitterDescription: description
  }
  if (opts.titleTemplate !== undefined) {
    seo.titleTemplate = opts.titleTemplate
  }
  useSeoMeta(seo)

  useHead({
    link: [{ rel: 'canonical', href: url }]
  })

  if (opts.jsonLd) {
    const payload = Array.isArray(opts.jsonLd)
      ? { '@context': 'https://schema.org', '@graph': opts.jsonLd }
      : opts.jsonLd
    useHead({
      script: [{
        type: 'application/ld+json',
        innerHTML: JSON.stringify(payload)
      }]
    })
  }

  if (!selfHosted) {
    defineOgImage('LuckPerms.takumi', {
      title: opts.title,
      description,
      eyebrow: opts.eyebrow ?? 'LuckPerms'
    }, {
      alt: opts.title === 'LuckPerms' ? 'LuckPerms — permissions plugin for Minecraft' : `${opts.title} — LuckPerms`,
      width: 1200,
      height: 630
    })
  }
}
