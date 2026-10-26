import { setEditorRouteLocale } from '~/utils/editor-routes'
import { splitLocalePrefix } from '~/utils/tool-routes'

export default defineNuxtPlugin(() => {
  setEditorRouteLocale(() => splitLocalePrefix(useRoute().path).locale)
})
