import { createHmac, randomBytes } from "node:crypto";

/**
 * Minimal OAuth 1.0a request signing (RFC 5849, HMAC-SHA1) — X's v2 API
 * still requires OAuth 1.0a User Context (or OAuth 2.0 Authorization Code
 * with PKCE) for POST /2/tweets; an app-only Bearer token is explicitly
 * not sufficient (confirmed against docs.x.com, 2026-08-16). OAuth 1.0a
 * with a single pre-generated Access Token + Secret is the standard
 * "bot posts as itself" pattern and needs no interactive redirect flow,
 * unlike the PKCE alternative — the right fit for one unattended account.
 *
 * This signs a request with a JSON body: per the OAuth 1.0a spec, only
 * oauth_* parameters and URL query parameters are included in the
 * signature base string for a non-form-encoded body (a JSON POST body is
 * never part of the signature).
 */

function percentEncode(value: string): string {
  return encodeURIComponent(value).replace(/[!*'()]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

export type OAuth1Credentials = {
  consumerKey: string;
  consumerSecret: string;
  accessToken: string;
  accessTokenSecret: string;
};

export function buildOAuth1Header(method: string, url: string, credentials: OAuth1Credentials, queryParams: Record<string, string> = {}): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: credentials.consumerKey,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: credentials.accessToken,
    oauth_version: "1.0",
  };

  const allParams = { ...oauthParams, ...queryParams };
  const paramString = Object.keys(allParams)
    .sort()
    .map((key) => `${percentEncode(key)}=${percentEncode(allParams[key])}`)
    .join("&");

  const baseString = [method.toUpperCase(), percentEncode(url), percentEncode(paramString)].join("&");
  const signingKey = `${percentEncode(credentials.consumerSecret)}&${percentEncode(credentials.accessTokenSecret)}`;
  const signature = createHmac("sha1", signingKey).update(baseString).digest("base64");

  const headerParams: Record<string, string> = { ...oauthParams, oauth_signature: signature };
  const header = Object.keys(headerParams)
    .sort()
    .map((key) => `${percentEncode(key)}="${percentEncode(headerParams[key])}"`)
    .join(", ");

  return `OAuth ${header}`;
}
