import type { EditorPayload } from '~/types/editor'

const modules = import.meta.glob<EditorPayload>('./*.json', { eager: true, import: 'default' })

/** Local-only snapshots (gitignored JSON). Key = original bytebin code. */
export const editorSamples: Record<string, EditorPayload> = Object.fromEntries(
  Object.entries(modules).map(([path, payload]) => [
    path.replace(/^\.\//, '').replace(/\.json$/, ''),
    payload
  ])
)

export function editorSample(id: string) {
  return editorSamples[id]
}

export function isLocalEditorSession(id: string | null | undefined) {
  return id === 'demo' || Boolean(id && editorSamples[id])
}
