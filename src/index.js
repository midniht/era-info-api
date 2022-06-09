addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  return new Response('Hello era!\n@6.10\n#2', {
    headers: { 'content-type': 'text/plain' },
  })
}
