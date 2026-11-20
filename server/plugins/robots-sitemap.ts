export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('robots:robots-txt', (ctx) => {
    const siteUrl = String(useRuntimeConfig().public.siteUrl || '').replace(/\/+$/, '')
    if (!siteUrl || ctx.robotsTxt.includes('Sitemap:')) {
      return
    }
    ctx.robotsTxt = `${ctx.robotsTxt.trim()}\n\nSitemap: ${siteUrl}/sitemap.xml\n`
  })
})
