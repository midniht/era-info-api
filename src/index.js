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
      // 查询 KV 数据库
      let game_info = undefined
      const game_info_json = await GAME_INFO_DB.get(game_slug)

      // 查询的条目不存在 返回 404
      if (game_info_json === null) {
        return newResponse(
          `{ "code": 404, "msg": "Game ${game_slug} Not Found" }`,
          404,
        )
      }

      // 将查询的条目解析为 JSON 格式
      try {
        game_info = JSON.parse(game_info_json)
      } catch (e) {
        // 解析失败 返回 400
        console.log(`Parse JSON data failed: ${e}\nRaw data: ${game_info_json}`)
        return newResponse(
          '{ "code": 400, "msg": "Parse JSON data string failed" }',
          400,
        )
      }

      // 判断 JSON 转对象是否成功
      if (typeof game_info === 'object' && game_info) {
        console.debug('game_info=', game_info)
      } else {
        // 获取对象失败 返回 500
        return newResponse(
          `{ "code": 500, "msg": "Parse Game ${game_slug} Info Failed" }`,
          500,
        )
      }

      // 处理 URL 格式参数
      switch (query_param[1].toLowerCase()) {
        case 'version':
          // 尝试获取版本信息 继续处理
          break
        case 'file':
          // 跳转到网盘的文件页面
          return Response.redirect(`${PREVIEW_URL}/${game_info.name}.zip`, 302)
          break
        case 'download':
          // 直接下载
          if (query_param.length > 2) {
            switch (query_param[2].toLowerCase()) {
              case 'debug':
                // 显示游戏名和 slug
                return newResponse(
                  `{ "code": 200, "msg": "Debugging", "slug": "${game_info.slug}", "name": "${game_info.name}" }`,
                  200,
                )
              case 'onedrive':
                // 跳转到网盘的下载直链
                return Response.redirect(
                  `${DOWNLOAD_URL}/${game_info.name}.zip`,
                  302,
                )
                break
              default:
                // 显示网盘的下载直链
                return newResponse(`${DOWNLOAD_URL}/${game_info.name}.zip`, 200)
                break
            }
          } else {
            // 直接从 R2 CDN 下载
            const game_file = await ERA_CDN.get(`${game_info.name}.zip`)
            if (game_file === null) {
              return newResponse(
                `{ "code": 404, "msg": "Object Not Found", "info": "如果你看到这条报错信息，请到 https://discord.gg/C97fHN8Rnk 反馈 ${game_info.name} 资源缺失" }`,
                404,
              )
            }
            const headers = new Headers()
            game_file.writeHttpMetadata(headers)
            headers.set('etag', game_file.httpEtag)
            headers.set(
              'Content-Disposition',
              `attachment; name="${game_info.name}"; filename="${game_info.name}.zip"`,
            )
            return new Response(game_file.body, {
              headers,
            })
          }
          break
        default:
          // 其他参数 继续处理
          break
      }

      // 访问 /游戏名/*/json 返回 JSON 格式版本信息
      if (query_param.length > 2 && query_param[2].toLowerCase() === 'json') {
        return newResponse(game_info_json, 200)
      }

      // 其他情况 一律返回标准的 plain 版本信息
      if (!Object.hasOwnProperty.call(game_info, 'slug')) {
        game_info.slug = game_info.name
      }
      if (!game_info.title) {
        game_info.title = game_info.name
      }
      return newResponse(
        `${game_info.version}
${API_URL}/${game_info.slug}/file

《${game_info.title}》
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
