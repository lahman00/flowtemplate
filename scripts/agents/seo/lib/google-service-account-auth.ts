import { createSign } from "node:crypto";

/**
 * Google service-account OAuth2 "server to server" flow — a self-signed
 * JWT exchanged for a short-lived access token, exactly as documented at
 * https://developers.google.com/identity/protocols/oauth2/service-account.
 * Implemented with only `node:crypto` (already a Node builtin) rather than
 * adding `googleapis` or `google-auth-library` as a dependency for what is,
 * underneath, about 40 lines of JWT construction — this is the entire
 * "credential adapter," reused by every Google-API-backed agent so none of
 * them reimplement auth.
 *
 * Real, working code — verified against the current Google OAuth2 docs
 * (JWT claims, RS256 signing, token endpoint) before writing it, not
 * assumed from memory. What it cannot do without a real credential is get
 * past `isConfigured()`/an actual token exchange — that needs a real
 * Google Cloud service-account JSON key, which this environment doesn't
 * have. See docs/agents-architecture.md "Turning on a blocked agent."
 */

export type GoogleServiceAccountKey = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

const DEFAULT_TOKEN_URI = "https://oauth2.googleapis.com/token";
const JWT_LIFETIME_SECONDS = 3600; // Google's own max for this flow

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Builds and RS256-signs the self-assertion JWT described in Google's server-to-server OAuth2 flow. */
export function buildSignedJwt(key: GoogleServiceAccountKey, scope: string, now = Math.floor(Date.now() / 1000)): string {
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iss: key.client_email,
      scope,
      aud: key.token_uri ?? DEFAULT_TOKEN_URI,
      exp: now + JWT_LIFETIME_SECONDS,
      iat: now,
    })
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  signer.end();
  const signature = base64url(signer.sign(key.private_key));
  return `${header}.${payload}.${signature}`;
}

export type AccessTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

/** Exchanges the signed JWT for a bearer access token. Real network call — never mocked at this layer, only in tests. */
export async function fetchAccessToken(key: GoogleServiceAccountKey, scope: string): Promise<AccessTokenResponse> {
  const jwt = buildSignedJwt(key, scope);
  const res = await fetch(key.token_uri ?? DEFAULT_TOKEN_URI, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google OAuth2 token exchange failed: HTTP ${res.status} — ${body.slice(0, 300)}`);
  }
  return (await res.json()) as AccessTokenResponse;
}

/** Parses the service-account JSON key from an env var. Accepts either raw JSON or base64-encoded JSON (base64 avoids shell/CI quoting issues with the private key's embedded newlines). */
export function parseServiceAccountEnv(raw: string): GoogleServiceAccountKey {
  const text = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8");
  const parsed = JSON.parse(text) as Partial<GoogleServiceAccountKey>;
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("Service account JSON is missing client_email or private_key.");
  }
  return { client_email: parsed.client_email, private_key: parsed.private_key, token_uri: parsed.token_uri };
}
