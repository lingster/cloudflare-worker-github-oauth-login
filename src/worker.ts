interface Env {
  CLIENT_ID: string
  CLIENT_SECRET: string
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // Handle favicon.ico requests
    if (request.url.endsWith('/favicon.ico')) {
      return new Response(null, { status: 404 })
    }
    
    return await handle(request, env)
  }
}

async function handle(request: Request, env: Env) {
  const client_id = env.CLIENT_ID
  const client_secret = env.CLIENT_SECRET

  // handle CORS pre-flight request
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  }

  // redirect GET requests to the OAuth login page
  if (request.method === "GET") {
    return Response.redirect(
      `https://github.com/login/oauth/authorize?client_id=${client_id}`,
      302
    )
  }

  try {
    const { code } = await request.json()
    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "user-agent": "cloudflare-worker-github-oauth-login-demo",
          accept: "application/json",
        },
        body: JSON.stringify({ client_id, client_secret, code }),
      }
    )
    
    const result = await response.json()
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    }

    if (result.error) {
      return new Response(JSON.stringify(result), { status: 401, headers })
    }
    
    return new Response(JSON.stringify({ token: result.access_token }), {
      status: 201,
      headers,
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    })
  }
}
