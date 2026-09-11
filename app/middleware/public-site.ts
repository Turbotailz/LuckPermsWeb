export default defineNuxtRouteMiddleware(() => {
  if (useRuntimeConfig().public.selfHosted) {
    return navigateTo('/')
  }
})
