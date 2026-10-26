import { splitLocalePrefix, withLocalePrefix } from '~/utils/tool-routes'

export function useToolPath() {
  const route = useRoute()

  function toolPath(path: string) {
    return withLocalePrefix(path, splitLocalePrefix(route.path).locale)
  }

  return { toolPath }
}
