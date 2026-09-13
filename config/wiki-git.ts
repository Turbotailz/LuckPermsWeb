import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { wikiBranchName, wikiRepoUrl } from './wiki-source'

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

export function wikiEditUrl(relativePath: string, branch = wikiBranchName(), repo = wikiRepoUrl()): string {
  return `${repo}/edit/${branch}/${relativePath}`
}
