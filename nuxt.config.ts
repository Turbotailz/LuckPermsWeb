import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { wikiRouteRules } from './config/wiki-redirects'
import { wikiEditUrl, wikiFileUpdatedAt, wikiFileContributors, wikiContentRelative } from './config/wiki-git'
import { resolveWikiGitDir } from './config/wiki-clone'
import { wikiBranchName, wikiRepoUrl } from './config/wiki-source'

function gitHash() {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'dev'
  }
}

const wikiPath = process.env.WIKI_PATH
const wikiGitDir = resolveWikiGitDir()
const selfHosted = process.env.NUXT_PUBLIC_SELF_HOSTED === 'true'
const siteUrl = (
  process.env.NUXT_PUBLIC_SITE_URL
  || process.env.NUXT_SITE_URL
  || process.env.CF_PAGES_URL
  || process.env.DEPLOY_PRIME_URL
  || 'https://luckperms.net'
).replace(/\/+$/, '')

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
    families: [
      { name: 'Inter', provider: 'google', weights: [400, 500, 600, 700] },
      { name: 'JetBrains Mono', provider: 'google', weights: [400, 500, 700] }
    ]
  },
  runtimeConfig: {
    wikiPath: wikiPath || '',
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
    locales: [
      { code: 'en', language: 'en-GB', name: 'English', file: 'en.json', dir: 'ltr' }
    ],
    defaultLocale: 'en',
    langDir: 'locales',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: false,
    customRoutes: 'config',
    pages: {
      editor: false,
      'editor/[id]': false,
      'editor/[id]/index': false,
      'editor/[id]/groups/index': false,
      'editor/[id]/groups/[groupId]': false,
      'editor/[id]/users/index': false,
      'editor/[id]/users/[userId]': false,
      'editor/[id]/tracks/index': false,
      'editor/[id]/tracks/[trackId]': false,
      verbose: false,
      'verbose/[id]': false,
      treeview: false,
      'treeview/[id]': false
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
    ...(selfHosted ? {} : wikiRouteRules())
  },
  nitro: {
    prerender: {
      crawlLinks: !selfHosted,
      autoSubfolderIndex: false,
      routes: selfHosted ? ['/', '/editor'] : ['/', '/download', '/sponsor', '/wiki', '/editor']
    },
    publicAssets: wikiPath && existsSync(resolve(wikiPath, 'img'))
      ? [{ baseURL: '/wiki-img', dir: resolve(wikiPath, 'img'), maxAge: 60 * 60 * 24 * 7 }]
      : []
  },
  site: {
    url: siteUrl,
    trailingSlash: false
  },
  sitemap: {
    exclude: ['/editor/**', '/verbose/**', '/treeview/**']
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

