const AUTH_BASE_URL = 'http://localhost:3000';
const CLIENT_ID = 'threadpilled-editor';
const REDIRECT_URI = `${window.location.origin}/callback`;
const SCOPES = 'openid profile email diagrams:read diagrams:write';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function login(): Promise<void> {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = crypto.randomUUID();
  sessionStorage.setItem('tp_pkce_verifier', verifier);
  sessionStorage.setItem('tp_oauth_state', state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  window.location.href = `${AUTH_BASE_URL}/api/auth/oauth2/authorize?${params}`;
}

export async function handleCallback(code: string, state: string): Promise<AuthTokens> {
  const savedState = sessionStorage.getItem('tp_oauth_state');
  if (state !== savedState) throw new Error('State mismatch');
  const verifier = sessionStorage.getItem('tp_pkce_verifier');
  if (!verifier) throw new Error('Missing PKCE verifier');

  const res = await fetch(`${AUTH_BASE_URL}/api/auth/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: verifier,
    }),
  });

  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  const data = await res.json();

  sessionStorage.removeItem('tp_pkce_verifier');
  sessionStorage.removeItem('tp_oauth_state');

  const tokens: AuthTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  localStorage.setItem('tp_auth_tokens', JSON.stringify(tokens));
  return tokens;
}

export function getStoredTokens(): AuthTokens | null {
  const raw = localStorage.getItem('tp_auth_tokens');
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function getUser(accessToken: string): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${AUTH_BASE_URL}/api/auth/get-session`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user ?? null;
  } catch { return null; }
}

export function logout(): void {
  localStorage.removeItem('tp_auth_tokens');
}

export function isAuthenticated(): boolean {
  const tokens = getStoredTokens();
  return !!tokens && tokens.expiresAt > Date.now();
}
