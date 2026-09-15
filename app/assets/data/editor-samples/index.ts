import type { EditorPayload } from '~/types/editor'
import pfskEmQs1B from './pfskEmQs1B.json'

/** Local editor snapshots. Key = original bytebin code. Socket metadata is stripped. */
export const editorSamples: Record<string, EditorPayload> = {
  pfskEmQs1B: pfskEmQs1B as EditorPayload
}

export function editorSample(id: string) {
  return editorSamples[id]
}

export function isLocalEditorSession(id: string | null | undefined) {
  return id === 'demo' || Boolean(id && editorSamples[id])
}
