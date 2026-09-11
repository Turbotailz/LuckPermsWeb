import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { wikiRouteRules } from './config/wiki-redirects'
import { wikiFileUpdatedAt } from './config/wiki-git'
import { wikiBranchName, wikiRepoUrl } from './config/wiki-source'

function gitHash() {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'dev'
  }
}

const wikiPath = process.env.WIKI_PATH
const selfHosted = process.env.NUXT_PUBLIC_SELF_HOSTED === 'true'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: [
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxt/fonts',
    '@nuxtjs/i18n',
    '@nuxtjs/sitemap',
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
      siteUrl: 'https://luckperms.net',
      gitHash: gitHash(),
      wikiRepo: wikiRepoUrl(),
      wikiBranch: wikiBranchName()
    }
  },
  app: {
    head: {
      title: 'LuckPerms',
      titleTemplate: '%s | LuckPerms',
      htmlAttrs: { lang: 'en' },
      link: [
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/logo.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }
      ],
      meta: [
        { name: 'theme-color', content: '#94df03' },
        { name: 'description', content: 'LuckPerms is a permissions plugin for Minecraft servers. It allows server admins to control what features players can use by creating groups and assigning permissions.' },
        { name: 'twitter:card', content: 'summary' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: 'https://luckperms.net/logo.png' },
        { property: 'og:site_name', content: 'LuckPerms - A permissions plugin for Minecraft servers.' }
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
  routeRules: {
    '/': { prerender: true },
    '/download': selfHosted ? { redirect: '/' } : { prerender: true },
    '/sponsor': selfHosted ? { redirect: '/' } : { prerender: true },
    '/wiki': selfHosted ? { redirect: '/' } : { prerender: true },
    '/wiki/**': selfHosted ? { redirect: '/' } : { prerender: true },
    '/editor': { ssr: false },
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
      routes: selfHosted ? ['/'] : ['/', '/download', '/sponsor', '/wiki']
    },
    publicAssets: wikiPath && existsSync(resolve(wikiPath, 'img'))
      ? [{ baseURL: '/wiki-img', dir: resolve(wikiPath, 'img'), maxAge: 60 * 60 * 24 * 7 }]
      : []
  },
  site: {
    url: 'https://luckperms.net'
  },
  sitemap: {
    exclude: ['/editor/**', '/verbose/**', '/treeview/**']
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
      const updatedAt = wikiFileUpdatedAt(wikiPath || '', ctx.file.path)
      if (updatedAt) {
        ctx.content.updatedAt = updatedAt
      }
    }
  },
  eslint: {
    config: {
      stylistic: true
    }
  }
})

