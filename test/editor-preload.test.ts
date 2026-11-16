import { describe, expect, it } from 'vitest'
import { bytebinPreloadHref, editorSessionPreloadId, escapeHtmlAttr, metadataPreloadHref } from '../app/utils/editor-preload'

describe('editor data preloads', () => {
  it('keeps real session ids and drops demo, legacy, and unsafe values', () => {
    expect(editorSessionPreloadId('/editor/abc123')).toBe('abc123')
    expect(editorSessionPreloadId('/editor/abc123/groups/staff')).toBe('abc123')
    expect(editorSessionPreloadId('/de/editor/session_id-1')).toBe('session_id-1')
    expect(editorSessionPreloadId('/zh-CN/editor/AbC')).toBe('AbC')
    expect(editorSessionPreloadId('/editor/demo')).toBeNull()
    expect(editorSessionPreloadId('/de/editor/demo/users')).toBeNull()
    expect(editorSessionPreloadId('/editor')).toBeNull()
    expect(editorSessionPreloadId('/editor/?legacy')).toBeNull()
    expect(editorSessionPreloadId('/wiki/getting-started')).toBeNull()
    expect(editorSessionPreloadId('/editor/<script>')).toBeNull()
    expect(editorSessionPreloadId('/editor/a/../../etc')).toBe('a')
    expect(editorSessionPreloadId(`/editor/${'a'.repeat(129)}`)).toBeNull()
  })

  it('builds fetch preload URLs', () => {
    expect(metadataPreloadHref('https://metadata.luckperms.net')).toBe('https://metadata.luckperms.net/data/all')
    expect(bytebinPreloadHref('https://usercontent.luckperms.net/', 'abc123')).toBe('https://usercontent.luckperms.net/abc123')
    expect(escapeHtmlAttr(`https://example.test/a?b="c"&d='e'`)).toBe('https://example.test/a?b=&quot;c&quot;&amp;d=&#39;e&#39;')
  })
})
