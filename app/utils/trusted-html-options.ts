/** Tags Crowdin copy is allowed to use. No attributes: event handlers and style cannot survive. */
export const TRUSTED_HTML_TAGS = ['b', 'br', 'code', 'em', 'i', 'span', 'strong'] as const

export const TRUSTED_HTML_OPTIONS = {
  ALLOWED_TAGS: [...TRUSTED_HTML_TAGS],
  ALLOWED_ATTR: [] as string[],
  ALLOW_DATA_ATTR: false
}
