// const GITHUB_REPO_URL = ''

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Handle Request
 * @param {Request} request
 */
async function handleRequest(request) {
  const pathname = new URL(request.url).pathname
  if (pathname === '/') {
    return Response.redirect(GITHUB_REPO_URL, 301)
  }
  switch (request.method) {
    case 'GET':
      return newResponse(`Hello era! ${pathname}`)
      break
    case 'POST':
      const psk = request.headers.get('X-Custom-PSK')
      if (psk === API_TOKEN) {
        const body = await readRequestBody(request)
        return newResponse(`todo: update game info\n${body}`)
      }
      return newResponse('{ code: 401, msg: "Unauthorized" }', 401)
      break
    default:
      return newResponse('{ code: 405, msg: "Method Not Allowed" }', 405)
      break
  }
}

/**
 * readRequestBody reads in the incoming request body
 * Use await readRequestBody(..) in an async function to get the string
 * @param {Request} request the incoming request to read from
 */
async function readRequestBody(request) {
  const { headers } = request
  const contentType = headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return JSON.stringify(await request.json())
  } else if (contentType.includes('application/text')) {
    return request.text()
  } else if (contentType.includes('text/html')) {
    return request.text()
  } else if (contentType.includes('form')) {
    const formData = await request.formData()
    const body = {}
    for (const entry of formData.entries()) {
      body[entry[0]] = entry[1]
    }
    return JSON.stringify(body)
  } else {
    // Perhaps some other type of data was submitted in the form
    // like an image, or some other binary data.
    return 'a file'
  }
}

function isJSON(text) {
  if (typeof text == 'string') {
    try {
      const obj = JSON.parse(text)
      if (typeof obj == 'object' && obj) {
        return true
      } else {
        return false
      }
    } catch (e) {
      console.debug(`error: ${text}!\n${e}`)
      return false
    }
  }
  return false
}

function newResponse(data, respCode = 200) {
  return new Response(data, {
    headers: {
      'content-type': isJSON(data)
        ? 'application/json;charset=UTF-8'
        : 'text/plain',
    },
    status: respCode,
  })
}
