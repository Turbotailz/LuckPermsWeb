import { execFileSync, execSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { wikiBranchName, wikiRepoUrl } from './wiki-source'

export interface WikiContributor {
  name: string
  username?: string
  avatar?: string
}

const GITHUB_NOREPLY = /^(?:\d+\+)?([A-Za-z0-9-]+)@users\.noreply\.github\.com$/i

const KNOWN_EMAILS: Record<string, { username: string, name: string }> = {
  'git@lucko.me': { username: 'lucko', name: 'Luck' },
  'hey@laarryy.dev': { username: 'Laarryy', name: 'Larry' },
  'larrydblomme@hotmail.com': { username: 'Laarryy', name: 'Larry' },
  'sam@goodger.dev': { username: 'Turbotailz', name: 'Sam Goodger' },
  'sam@goodger.nz': { username: 'Turbotailz', name: 'Sam Goodger' }
}

const KNOWN_NAMES: Record<string, { username: string, name: string }> = {
  luck: { username: 'lucko', name: 'Luck' },
  lucko: { username: 'lucko', name: 'Luck' },
  larry: { username: 'Laarryy', name: 'Larry' },
  'sam goodger': { username: 'Turbotailz', name: 'Sam Goodger' },
  powercas_gamer: { username: 'powercasgamer', name: 'powercas_gamer' },
  powercasgamer: { username: 'powercasgamer', name: 'powercas_gamer' }
}

let dates: Map<string, string> | null = null
let contributors: Map<string, WikiContributor[]> | null = null

function loadWikiGitDates(wikiPath: string): Map<string, string> {
  if (dates) {
    return dates
  }
  dates = new Map()
  if (!wikiPath || !existsSync(resolve(wikiPath, '.git'))) {
    return dates
  }
  try {
    const output = execSync('git log --pretty=format:COMMIT:%cI --name-only -- en', {
      cwd: wikiPath,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    })
    let current: string | undefined
    for (const line of output.split('\n')) {
      if (line.startsWith('COMMIT:')) {
        current = line.slice('COMMIT:'.length)
        continue
      }
      const file = line.trim()
      if (!file || !current || dates.has(file)) {
        continue
      }
      dates.set(file, current)
    }
  } catch {
    dates = new Map()
  }
  return dates
}

export function wikiRelativeFromRoute(wikiPath: string, routePath: string): string {
  const slug = routePath.replace(/^\/wiki\/?/, '').replace(/\/$/, '')
  const candidates = slug
    ? [`en/${slug}.md`, `en/${slug}/index.md`]
    : ['en/index.md']
  if (wikiPath) {
    const found = candidates.find(rel => existsSync(join(wikiPath, rel)))
    if (found) {
      return found
    }
  }
  return candidates[0]
}

export function wikiContentRelative(wikiPath: string, filePath?: string): string | undefined {
  if (!filePath) {
    return
  }
  const rel = wikiPath && filePath.startsWith(wikiPath)
    ? relative(wikiPath, filePath).replaceAll('\\', '/')
    : filePath.replaceAll('\\', '/').replace(/^\.\//, '')
  return rel.startsWith('en/') ? rel : `en/${rel}`
}

export function wikiFileUpdatedAt(wikiPath: string, filePath?: string): string | undefined {
  if (!wikiPath) {
    return
  }
  const key = wikiContentRelative(wikiPath, filePath)
  return key ? loadWikiGitDates(wikiPath).get(key) : undefined
}

function isBot(name: string, email: string, username?: string) {
  const hay = `${name} ${email} ${username || ''}`.toLowerCase()
  return hay.includes('[bot]')
    || email === 'noreply@github.com'
    || name === 'GitHub'
    || name === 'web-flow'
}

function contributorIdentity(name: string, email: string) {
  const trimmedName = name.trim()
  const normalizedEmail = email.trim().toLowerCase()
  const knownEmail = KNOWN_EMAILS[normalizedEmail]
  if (knownEmail) {
    return { key: knownEmail.username.toLowerCase(), ...knownEmail }
  }
  const noreply = normalizedEmail.match(GITHUB_NOREPLY)
  if (noreply) {
    const username = noreply[1]
    return {
      key: username.toLowerCase(),
      username,
      name: trimmedName || username
    }
  }
  const knownName = KNOWN_NAMES[trimmedName.toLowerCase()]
  if (knownName) {
    return { key: knownName.username.toLowerCase(), ...knownName }
  }
  return {
    key: normalizedEmail || trimmedName.toLowerCase(),
    name: trimmedName,
    username: undefined as string | undefined
  }
}

function contributorsForFile(wikiPath: string, rel: string): WikiContributor[] {
  let output = ''
  try {
    output = execFileSync('git', ['log', '--follow', '--pretty=format:%aN\t%aE', '--', rel], {
      cwd: wikiPath,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    })
  } catch {
    return []
  }
  const counts = new Map<string, { name: string, username?: string, commits: number }>()
  for (const line of output.split('\n')) {
    const tab = line.indexOf('\t')
    if (tab === -1) {
      continue
    }
    const name = line.slice(0, tab)
    const email = line.slice(tab + 1)
    const identity = contributorIdentity(name, email)
    if (!identity.key || isBot(identity.name, email, identity.username)) {
      continue
    }
    const current = counts.get(identity.key)
    if (current) {
      current.commits += 1
      if (!current.username && identity.username) {
        current.username = identity.username
        current.name = identity.name
      }
      continue
    }
    counts.set(identity.key, {
      name: identity.name,
      username: identity.username,
      commits: 1
    })
  }
  const merged = new Map<string, { name: string, username?: string, commits: number }>()
  for (const person of counts.values()) {
    const nameKey = person.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    const current = merged.get(nameKey)
    if (!current) {
      merged.set(nameKey, person)
      continue
    }
    current.commits += person.commits
    if (!current.username && person.username) {
      current.username = person.username
      current.name = person.name
    }
  }
  return [...merged.values()]
    .sort((a, b) => b.commits - a.commits || a.name.localeCompare(b.name))
    .map(({ name, username }) => ({
      name,
      ...(username
        ? { username, avatar: `https://github.com/${username}.png?size=80` }
        : {})
    }))
}

function markdownFilesUnderEn(wikiPath: string): string[] {
  const root = join(wikiPath, 'en')
  if (!existsSync(root)) {
    return []
  }
  const files: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(relative(wikiPath, full).replaceAll('\\', '/'))
      }
    }
  }
  walk(root)
  return files
}

function loadWikiContributors(wikiPath: string): Map<string, WikiContributor[]> {
  if (contributors) {
    return contributors
  }
  contributors = new Map()
  if (!wikiPath || !existsSync(resolve(wikiPath, '.git'))) {
    return contributors
  }
  for (const rel of markdownFilesUnderEn(wikiPath)) {
    contributors.set(rel, contributorsForFile(wikiPath, rel))
  }
  return contributors
}

export function wikiFileContributors(wikiPath: string, filePath?: string): WikiContributor[] {
  if (!wikiPath) {
    return []
  }
  const key = wikiContentRelative(wikiPath, filePath)
  return key ? (loadWikiContributors(wikiPath).get(key) || []) : []
}

export function wikiEditUrl(relativePath: string, branch = wikiBranchName(), repo = wikiRepoUrl()): string {
  return `${repo}/edit/${branch}/${relativePath}`
}
