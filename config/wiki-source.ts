const DEFAULT_WIKI_REPO = 'https://github.com/Turbotailz/wiki'
const DEFAULT_WIKI_BRANCH = 'v3-structure'

export function wikiRepoUrl() {
  return (process.env.WIKI_REPO || DEFAULT_WIKI_REPO).replace(/\/+$/, '').replace(/\.git$/, '')
}

export function wikiBranchName() {
  return process.env.WIKI_BRANCH || DEFAULT_WIKI_BRANCH
}

export function wikiGithubSlug(repo = wikiRepoUrl()) {
  return repo.replace(/^https:\/\/github\.com\//i, '')
}

export function wikiContentRepository(repo = wikiRepoUrl(), branch = wikiBranchName()) {
  return `${repo}/tree/${branch}`
}

export function wikiRawUrl(relativePath: string, repo = wikiRepoUrl(), branch = wikiBranchName()) {
  return `https://raw.githubusercontent.com/${wikiGithubSlug(repo)}/${branch}/${relativePath}`
}

export { DEFAULT_WIKI_REPO, DEFAULT_WIKI_BRANCH }
