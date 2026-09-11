import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const WIKI_REPO = 'https://github.com/LuckPerms/wiki'
const WIKI_BRANCH = 'v3-structure'

let dates: Map<string, string> | null = null

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

export function wikiFileUpdatedAt(wikiPath: string, filePath?: string): string | undefined {
  if (!wikiPath || !filePath) {
    return
  }
  const rel = filePath.startsWith(wikiPath)
    ? relative(wikiPath, filePath).replaceAll('\\', '/')
    : filePath.replaceAll('\\', '/').replace(/^\.\//, '')
  const key = rel.startsWith('en/') ? rel : `en/${rel}`
  return loadWikiGitDates(wikiPath).get(key)
}

export function wikiEditUrl(relativePath: string, branch = WIKI_BRANCH, repo = WIKI_REPO): string {
  return `${repo}/edit/${branch}/${relativePath}`
}

export { WIKI_REPO, WIKI_BRANCH }
