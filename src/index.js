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
  const query_param = pathname.replace(/^\//, '').split('/')
  const game_slug = query_param[0]
  switch (request.method) {
    case 'GET':
      let game_info = undefined
      try {
        const game_info_json = await GAME_INFO_DB.get(game_slug)
        if (game_info_json === null) {
          return newResponse(
            `{ "code": 404, "msg": "Game ${game_slug} Not Found" }`,
            404,
          )
        }
        game_info = JSON.parse(game_info_json)
      } catch (e) {
        console.log(`Parse JSON data failed: ${e}\nRaw data: ${game_info_json}`)
        return newResponse(
          '{ "code": 400, "msg": "Parse JSON data string failed" }',
          400,
        )
      }
      let game_file = undefined
      if (typeof game_info === 'object' && game_info) {
        game_file =
          Object.hasOwnProperty.call(game_info, 'name') && game_info.name !== ''
            ? `${game_info.name}.zip`
            : `${game_info.slug}.zip`
      } else {
        return newResponse(
          `{ "code": 500, "msg": "Parse Game ${game_slug} Info Failed" }`,
          500,
        )
      }
      switch (query_param[1].toLowerCase()) {
        case 'version':
          break
        case 'file':
          return Response.redirect(`${CDN_URL}/${game_file}`, 302)
          break
        case 'download':
          return Response.redirect(`${DOWNLOAD_URL}/${game_file}`, 302)
          break
        default:
          break
      }
      if (query_param.length > 2 && query_param[2].toLowerCase() === 'json') {
        return newResponse(game_info_json, 200)
      }
      const game_title =
        Object.hasOwnProperty.call(game_info, 'title') && game_info.title !== ''
          ? game_info.title
          : game_info.name
      return newResponse(
        `${game_info.version}
${API_URL}/${game_info.name}/file

《${game_title}》
「${game_info.author}」

${game_info.description}

最后更新于 ${game_info.update_at}
文件大小: ${game_info.size}
文件哈希值: ${game_info.hash.toUpperCase()} (SHA1)

详细改动: ${game_info.message.trim()}`,
        200,
      )
      break
    case 'POST':
      if (request.headers.get('X-Custom-PSK') === API_TOKEN) {
        const body = await readRequestBody(request)
        await GAME_INFO_DB.put(game_slug, body.replaceAll('\r', ''))
        return newResponse(
          '{ "code": 200, "msg": "Update Game Information Success" }',
          200,
        )
      }
      return newResponse('{ "code": 401, "msg": "Unauthorized" }', 401)
      break
    default:
      return newResponse('{ "code": 405, "msg": "Method Not Allowed" }', 405)
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
        : 'text/plain;charset=UTF-8',
    },
    status: respCode,
  })
}
