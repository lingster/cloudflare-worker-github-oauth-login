``` mermaid
sequenceDiagram
    participant B as Browser
    participant W as Cloudflare Worker<br/>(github-oauth-login.techarge.workers.dev)
    participant G as GitHub API

    Note over B,G: Step 1: Initial Login Flow
    B->>W: GET /
    W->>B: 302 Redirect to GitHub OAuth<br/>https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}
    B->>G: GET /login/oauth/authorize
    G->>B: Show GitHub login page
    
    Note over B,G: Step 2: Authorization
    B->>G: User authorizes app
    G->>B: 302 Redirect to app<br/>with ?code=xyz

    Note over B,G: Step 3: Token Exchange
    B->>W: POST /<br/>Body: { "code": "xyz" }
    W->>G: POST /login/oauth/access_token<br/>Body: { client_id, client_secret, code }<br/>Headers: accept: application/json
    G->>W: Returns access_token
    W->>B: 201 { "token": "access_token" }<br/>Headers: CORS enabled

    Note over B,G: Step 4: User Data
    B->>G: GET /user<br/>Headers: authorization: token ${access_token}<br/>accept: application/vnd.github.v3+json
    G->>B: Returns user data { login, ... }
    
    Note over B: Step 5: UI Update
    B->>B: Update UI with username<br/>Set state to "signed-in"

    Note over B,G: Error Handling
    rect rgb(255, 240, 240)
        W->>B: 401 { error } if token exchange fails
        W->>B: 500 { error } for other errors
    end
```
