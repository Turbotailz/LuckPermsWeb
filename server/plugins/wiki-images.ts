export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('content:file:beforeParse', (file: { body?: string, path?: string }) => {
    if (typeof file.body === 'string') {
      file.body = file.body.replace(/\]\((?:\.\.\/)+img\//g, '](/wiki-img/')
    }
  })
})
