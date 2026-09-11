export function useAnnounce() {
  function announce(message: string) {
    if (!import.meta.client) {
      return
    }
    try {
      const announcer = useNuxtApp().$nuxtAnnouncer as { polite?: (msg: string) => void } | undefined
      if (announcer?.polite) {
        announcer.polite(message)
        return
      }
    } catch {
      // NuxtAnnouncer is optional
    }
    const live = document.getElementById('lp-announcer')
    if (live) {
      live.textContent = message
    }
  }

  return { announce }
}
