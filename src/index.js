addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  return new Response('Hello era #1! @6.10', {
    headers: { 'content-type': 'text/plain' },
  })
}
