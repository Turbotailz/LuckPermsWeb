import { ungzip } from 'pako'
import { describe, expect, it } from 'vitest'
import { BYTEBIN_POST_HEADERS, bytebinGetUrl, bytebinPostUrl, encodeBytebinBody } from '../app/utils/bytebin'

describe('bytebin protocol', () => {
  it('builds the GET and POST urls the plugin expects', () => {
    expect(bytebinGetUrl('https://usercontent.luckperms.net/', 'abc')).toBe('https://usercontent.luckperms.net/abc')
    expect(bytebinGetUrl('https://usercontent.luckperms.net', 'abc')).toBe('https://usercontent.luckperms.net/abc')
    expect(bytebinPostUrl('https://usercontent.luckperms.net/')).toBe('https://usercontent.luckperms.net/post')
  })

  it('gzips a JSON body and labels it application/json', () => {
    const payload = { sessionId: 'abc', changes: [] }
    const decoded = JSON.parse(new TextDecoder().decode(ungzip(encodeBytebinBody(payload))))
    expect(decoded).toEqual(payload)
    expect(BYTEBIN_POST_HEADERS).toEqual({
      'Content-Type': 'application/json',
      'Content-Encoding': 'gzip'
    })
  })
})
