import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import { wikiBranchName, wikiRepoUrl } from './wiki-source'

const CLONE_DIR = resolve(process.cwd(), '.data', 'wiki')

let resolved: string | undefined

export function resolveWikiGitDir(): string {
  if (resolved !== undefined) {
    return resolved
  }
  const fromEnv = process.env.WIKI_PATH?.trim()
  if (fromEnv) {
    const abs = resolve(fromEnv)
    if (existsSync(join(abs, '.git'))) {
      resolved = abs
      return resolved
    }
  }
  resolved = cloneWikiRepo()
  return resolved
}

function git(args: string[], cwd?: string) {
  execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
  })
}

function cloneWikiRepo(): string {
  const branch = wikiBranchName()
  const url = `${wikiRepoUrl()}.git`
  try {
    if (existsSync(join(CLONE_DIR, '.git'))) {
      git(['fetch', '--quiet', 'origin', branch], CLONE_DIR)
      git(['checkout', '-q', '-B', branch, `origin/${branch}`], CLONE_DIR)
      return CLONE_DIR
    }
    return freshClone(url, branch)
  } catch {
    rmSync(CLONE_DIR, { recursive: true, force: true })
    try {
      return freshClone(url, branch)
    } catch (error) {
      console.warn(
        `[wiki] Could not clone ${url} (${branch}); contributors and last-updated will be missing.`,
        error instanceof Error ? error.message : error
      )
      return ''
    }
  }
}

function freshClone(url: string, branch: string) {
  mkdirSync(resolve(CLONE_DIR, '..'), { recursive: true })
  git(['clone', '--quiet', '--single-branch', '--branch', branch, url, CLONE_DIR])
  return CLONE_DIR
}
