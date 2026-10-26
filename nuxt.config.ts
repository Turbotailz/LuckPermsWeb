import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cloudflareRedirectLines, mergeRedirectFile, wikiRouteRules } from './config/wiki-redirects'
import { wikiEditUrl, wikiFileUpdatedAt, wikiFileContributors, wikiContentRelative } from './config/wiki-git'
import { resolveWikiGitDir } from './config/wiki-clone'
import { wikiBranchName, wikiRepoUrl } from './config/wiki-source'
import { rewriteWikiImageMarkdown } from './config/wiki-markdown'
import { loadLocalesMeta, localizedRouteRules, sitePrerenderRoutes } from './config/i18n-locales'
import { cloudflarePagesRoutes } from './config/cloudflare-pages'

function gitHash() {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'dev'
  }
}

const wikiPath = process.env.WIKI_PATH
const wikiGitDir = resolveWikiGitDir()
const wikiImgDir = resolve(wikiGitDir || wikiPath || '', 'img')
const selfHosted = process.env.NUXT_PUBLIC_SELF_HOSTED === 'true'
const siteUrl = (
  process.env.NUXT_PUBLIC_SITE_URL
  || process.env.NUXT_SITE_URL
  || process.env.CF_PAGES_URL
  || process.env.DEPLOY_PRIME_URL
  || 'https://luckperms.net'
).replace(/\/+$/, '')

const i18nLocales = loadLocalesMeta()
const localeCodes = i18nLocales.map(locale => locale.code)
const prerenderRoutes = sitePrerenderRoutes(i18nLocales, selfHosted)
const pagesRoutes = cloudflarePagesRoutes(localeCodes)

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: [
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxt/fonts',
    '@nuxtjs/i18n',
    '@nuxtjs/sitemap',
    'nuxt-og-image',
    '@pinia/nuxt',
    '@nuxt/eslint'
  ],
  css: ['~/assets/css/main.css'],
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
    classSuffix: '',
    storage: 'localStorage',
    storageKey: 'lp-color-mode'
  },
  fonts: {
    // Italic faces are unused and were doubling the font CSS.
    defaults: {
      styles: ['normal']
    },
    families: [
      { name: 'Inter', provider: 'google', weights: [400, 500, 600, 700], styles: ['normal'] },
      { name: 'JetBrains Mono', provider: 'google', weights: [400, 500, 700], styles: ['normal'] }
    ]
  },
  runtimeConfig: {
    wikiPath: wikiGitDir || wikiPath || '',
    wikiBranch: wikiBranchName(),
    wikiRepo: wikiRepoUrl(),
    public: {
      bytebinUrl: 'https://usercontent.luckperms.net/',
      bytesocksHost: 'usersockets.luckperms.net',
      bytesocksUrl: 'wss://usersockets.luckperms.net/',
      apiUrl: 'https://metadata.luckperms.net/',
      selfHosted,
      siteUrl,
      gitHash: gitHash(),
      wikiRepo: wikiRepoUrl(),
      wikiBranch: wikiBranchName()
    }
  },
  app: {
    head: {
      title: 'LuckPerms',
      titleTemplate: '%s | LuckPerms',
      htmlAttrs: { lang: 'en-GB' },
      link: [
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/logo.png' },
        { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }
      ],
      meta: [
        { name: 'theme-color', content: '#94df03' },
        { name: 'description', content: 'LuckPerms is a permissions plugin for Minecraft servers. It allows server admins to control what features players can use by creating groups and assigning permissions.' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'LuckPerms' },
        { property: 'og:locale', content: 'en_GB' }
      ],
      script: selfHosted
        ? []
        : [
            { defer: true, 'data-domain': 'luckperms.net', src: 'https://pl.luckperms.net/js/pl.js' },
            { innerHTML: 'window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }' }
          ]
    }
  },
  i18n: {
    // Locales are generated at build time from metadata.luckperms.net
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    locales: i18nLocales.map(locale => ({
      code: locale.code,
      language: locale.language,
      name: locale.name,
      file: locale.file,
      dir: locale.dir,
      flag: locale.flag
    })) as any,
    defaultLocale: 'en',
    langDir: 'locales',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'lp-lang',
      redirectOn: 'root',
      alwaysRedirect: false,
      fallbackLocale: 'en'
    },
    compilation: {
      strictMessage: false
    }
  },
  experimental: {
    defaults: {
      nuxtLink: {
        trailingSlash: 'remove'
      }
    }
  },
  routeRules: {
    '/': { prerender: true },
    '/download': selfHosted ? { redirect: '/' } : { prerender: true },
    '/sponsor': selfHosted ? { redirect: '/' } : { prerender: true },
    '/wiki': selfHosted ? { redirect: '/' } : { prerender: true },
    '/wiki/**': selfHosted ? { redirect: '/' } : { prerender: true },
    '/editor': { prerender: true, ssr: true },
    '/editor/**': { ssr: false },
    '/verbose': { ssr: false },
    '/verbose/**': { ssr: false },
    '/treeview': { ssr: false },
    '/treeview/**': { ssr: false },
    ...localizedRouteRules(i18nLocales, selfHosted),
    ...(selfHosted ? {} : wikiRouteRules())
  },
  nitro: {
    // Pages sets CF_PAGES=1. Pin the preset so `npm run build` keeps writing `dist`.
    ...(process.env.CF_PAGES ? { preset: 'cloudflare-pages' as const } : {}),
    cloudflare: {
      pages: {
        // Nitro's generated excludes are truncated at 100 rules, which drops
        // localized HTML and makes the worker 404 those URLs.
        defaultRoutes: false,
        routes: pagesRoutes
      }
    },
    prerender: {
      crawlLinks: !selfHosted,
      autoSubfolderIndex: false,
      routes: prerenderRoutes
    },
    publicAssets: existsSync(wikiImgDir)
      ? [{ baseURL: '/wiki-img', dir: wikiImgDir, maxAge: 60 * 60 * 24 * 7 }]
      : [],
    hooks: {
      close() {
        if (process.env.CF_PAGES !== '1') {
          return
        }
        const file = resolve(process.cwd(), 'dist/_redirects')
        if (!existsSync(file)) {
          return
        }
        writeFileSync(file, mergeRedirectFile(readFileSync(file, 'utf8'), cloudflareRedirectLines(localeCodes)))
      }
    }
  },
  site: {
    url: siteUrl,
    trailingSlash: false
  },
  sitemap: {
    exclude: [
      '/editor/**',
      '/verbose/**',
      '/treeview/**',
      '/**/editor/**',
      '/**/verbose/**',
      '/**/treeview/**'
    ]
  },
  ogImage: {
    enabled: !selfHosted,
    zeroRuntime: true,
    defaults: {
      alt: 'LuckPerms',
      width: 1200,
      height: 630
    }
  },
  content: {
    experimental: { nativeSqlite: true },
    build: {
      markdown: {
        toc: {
          depth: 3,
          searchDepth: 3
        }
      }
    }
  },
  hooks: {
    'build:manifest'(manifest) {
      for (const item of Object.values(manifest)) {
        // Async chunks (search, non-active locales, demo data) load on demand.
        item.dynamicImports = []
        item.prefetch = false
      }
    },
    'content:file:beforeParse'(ctx) {
      if (ctx.collection.name !== 'wiki_en' || typeof ctx.file.body !== 'string') {
        return
      }
      ctx.file.body = rewriteWikiImageMarkdown(ctx.file.body)
    },
    'content:file:afterParse'(ctx) {
      if (ctx.collection.name !== 'wiki_en') {
        return
      }
      const relative = wikiContentRelative(wikiGitDir || wikiPath || '', ctx.file.path)
      const updatedAt = wikiFileUpdatedAt(wikiGitDir, ctx.file.path)
      if (updatedAt) {
        ctx.content.updatedAt = updatedAt
      }
      if (relative) {
        ctx.content.editUrl = wikiEditUrl(relative)
        const pageContributors = wikiFileContributors(wikiGitDir, ctx.file.path)
        if (pageContributors.length) {
          ctx.content.contributors = pageContributors
        }
      }
    }
  },
  eslint: {
    config: {
      stylistic: true
    }
  },
  vite: {
    resolve: {
      alias: {
        // Package "main" is CJS named .cjs.js under "type": "module".
        'minimessage-js': resolve(fileURLToPath(new URL('.', import.meta.url)), 'node_modules/minimessage-js/dist/minimessage.esm.js')
      }
    }
  }
})

