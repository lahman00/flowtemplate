/**
 * Real IndexNow client. Unlike every other blocked-agent adapter in this
 * system, IndexNow needs no account, no signup, and no API key issued by
 * anyone — the protocol is "generate your own key, host it, submit URLs
 * that mention the key." Endpoint, request shape, and status codes
 * verified against the current indexnow.org documentation before writing
 * this (not assumed from memory): POST https://api.indexnow.org/indexnow,
 * JSON body {host, key, keyLocation, urlList}, up to 10,000 URLs per call.
 *
 * The key itself (public/<key>.txt, served at https://miloosh.com/<key>.txt
 * by Next.js's static-file convention) is committed to this repo — that's
 * correct and expected for IndexNow: the key's entire purpose is proving
 * domain ownership by being publicly retrievable, not being a secret.
 */

export const INDEXNOW_KEY = "64571916632587e2f714c221fb8ccc42";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

export type IndexNowSubmitResult = {
  status: number;
  ok: boolean;
  detail: string;
};

function hostFromUrl(url: string): string {
  return new URL(url).host;
}

function keyLocationFor(siteUrl: string, key: string): string {
  return `${siteUrl.replace(/\/$/, "")}/${key}.txt`;
}

/** Real POST to the IndexNow bulk endpoint. Never mocked outside tests. */
export async function submitUrlsToIndexNow(urls: string[], siteUrl: string, key: string = INDEXNOW_KEY): Promise<IndexNowSubmitResult> {
  if (urls.length === 0) {
    return { status: 0, ok: true, detail: "Nothing to submit." };
  }
  if (urls.length > 10_000) {
    throw new Error(`IndexNow accepts at most 10,000 URLs per submission; got ${urls.length}.`);
  }

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: hostFromUrl(siteUrl),
      key,
      keyLocation: keyLocationFor(siteUrl, key),
      urlList: urls,
    }),
  });

  const detail = STATUS_MEANINGS[res.status] ?? `HTTP ${res.status}`;
  return { status: res.status, ok: res.status === 200 || res.status === 202, detail };
}

const STATUS_MEANINGS: Record<number, string> = {
  200: "URL submitted successfully.",
  202: "URL received; key validation pending.",
  400: "Invalid format.",
  403: "Key validation failed — check the key file is live at keyLocation.",
  422: "URLs don't match host, or key not found/schema violation.",
  429: "Too many requests — treated as potential spam.",
};
