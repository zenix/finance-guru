const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata'
const REDIRECT_URI = `${location.origin}/auth/callback`
const TOKEN_KEY = '__gat'

let _token: string | null = null

function b64url(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function sha256(plain: string) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain))
}

async function generatePKCE() {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)).buffer)
  const challenge = b64url(await sha256(verifier))
  return { verifier, challenge }
}

export async function startLogin() {
  const { verifier, challenge } = await generatePKCE()
  sessionStorage.setItem('pkce_verifier', verifier)
  const state = b64url(crypto.getRandomValues(new Uint8Array(16)).buffer)
  sessionStorage.setItem('oauth_state', state)

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
    access_type: 'offline',
    prompt: 'consent',
  })
  location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function handleCallback(code: string, state: string): Promise<string> {
  const savedState = sessionStorage.getItem('oauth_state')
  if (state !== savedState) throw new Error('OAuth state mismatch')
  const verifier = sessionStorage.getItem('pkce_verifier')
  if (!verifier) throw new Error('Missing PKCE verifier')

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      code,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
  })
  if (!res.ok) throw new Error('Token exchange failed')
  const data = await res.json()
  _token = data.access_token

  if (data.refresh_token) {
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ refresh: data.refresh_token, expires: Date.now() + data.expires_in * 1000 }))
  }
  sessionStorage.removeItem('pkce_verifier')
  sessionStorage.removeItem('oauth_state')
  return _token!
}

export async function getToken(): Promise<string | null> {
  if (_token) return _token
  const raw = sessionStorage.getItem(TOKEN_KEY)
  if (!raw) return null
  const { refresh, expires } = JSON.parse(raw)
  if (Date.now() < expires - 60_000) {
    // Token should still be valid but we lost it from memory — need to refresh
  }
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      refresh_token: refresh,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) { sessionStorage.removeItem(TOKEN_KEY); return null }
  const data = await res.json()
  _token = data.access_token
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ refresh, expires: Date.now() + data.expires_in * 1000 }))
  return _token
}

export function clearToken() {
  _token = null
  sessionStorage.removeItem(TOKEN_KEY)
}

export async function getUserInfo(token: string) {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json() as Promise<{ email: string; name: string; picture: string }>
}
