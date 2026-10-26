const TOOL_PREFIXES = ['/editor', '/verbose', '/treeview']

export function isToolRoute(path: string) {
  const bare = path.replace(/^\/[a-z]{2}(?:-[A-Z]{2})?(?=\/)/, '') || path
  return TOOL_PREFIXES.some(prefix => bare === prefix || bare.startsWith(`${prefix}/`))
}
