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

slighltly more secure includes session state:
``` mermaid
sequenceDiagram
    participant U as User's Browser
    participant A as FastAPI App
    participant G as GitHub

    Note over U,G: Step 1: Initial Login Request
    U->>A: Click "Login with GitHub"
    A->>A: Generate secure state token
    A->>U: Set state cookie
    A->>G: Redirect to GitHub OAuth page<br/>with client_id, scope, state

    Note over U,G: Step 2: User Authorization
    U->>G: User logs in to GitHub
    G->>U: Show permissions screen
    U->>G: User approves permissions

    Note over U,G: Step 3: Authorization Code Exchange
    G->>U: Redirect to app callback URL<br/>with authorization code
    U->>A: Send code + state
    A->>A: Verify state matches cookie
    A->>G: Exchange code for access token<br/>using client_secret
    G->>A: Return access token

    Note over U,G: Step 4: User Data & Session
    A->>G: Request user data<br/>using access token
    G->>A: Return user info
    A->>A: Generate JWT session token
    A->>U: Set JWT cookie & redirect to home
    
    Note over U,A: Step 5: Subsequent Requests
    U->>A: Make API requests<br/>with JWT token
    A->>U: Return protected resources

```

