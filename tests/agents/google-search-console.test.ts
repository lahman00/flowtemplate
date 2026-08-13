import { describe, it, expect, vi, afterEach } from "vitest";
import { generateKeyPairSync, createVerify } from "node:crypto";
import { buildSignedJwt, parseServiceAccountEnv } from "@/scripts/agents/seo/lib/google-service-account-auth";
import { GoogleSearchConsoleClient } from "@/scripts/agents/seo/lib/google-search-console-client";

/**
 * Real cryptographic and HTTP-shape tests for the Search Console adapter
 * — no live Google API access, since this environment has no real
 * credentials, but everything that CAN be verified without one is: the
 * JWT this code produces is signed with a real RSA keypair and actually
 * verifies with node:crypto (proving the signing logic is correct, not
 * just "doesn't throw"), and the API client sends the exact request shape
 * Google's documented endpoints expect (verified against
 * developers.google.com before writing the client).
 */

const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const TEST_KEY = {
  client_email: "test-service-account@test-project.iam.gserviceaccount.com",
  private_key: privateKey.export({ type: "pkcs1", format: "pem" }).toString(),
};

function decodeJwtPart(part: string): unknown {
  return JSON.parse(Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8"));
}

describe("buildSignedJwt", () => {
  it("produces a JWT whose signature actually verifies against the matching public key", () => {
    const jwt = buildSignedJwt(TEST_KEY, "https://www.googleapis.com/auth/webmasters.readonly", 1_700_000_000);
    const [header, payload, signature] = jwt.split(".");

    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${header}.${payload}`);
    verifier.end();
    const signatureBuffer = Buffer.from(signature.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    const valid = verifier.verify(publicKey.export({ type: "spki", format: "pem" }), signatureBuffer);

    expect(valid).toBe(true);
  });

  it("includes the exact claims Google's service-account flow requires", () => {
    const jwt = buildSignedJwt(TEST_KEY, "https://www.googleapis.com/auth/webmasters.readonly", 1_700_000_000);
    const [, payloadPart] = jwt.split(".");
    const payload = decodeJwtPart(payloadPart) as Record<string, unknown>;

    expect(payload.iss).toBe(TEST_KEY.client_email);
    expect(payload.scope).toBe("https://www.googleapis.com/auth/webmasters.readonly");
    expect(payload.aud).toBe("https://oauth2.googleapis.com/token");
    expect(payload.iat).toBe(1_700_000_000);
    expect(payload.exp).toBe(1_700_000_000 + 3600);
  });

  it("signals RS256 in the header, as Google's flow requires", () => {
    const jwt = buildSignedJwt(TEST_KEY, "scope", 0);
    const header = decodeJwtPart(jwt.split(".")[0]) as Record<string, unknown>;
    expect(header.alg).toBe("RS256");
  });
});

describe("parseServiceAccountEnv", () => {
  it("parses a raw JSON env value", () => {
    const raw = JSON.stringify(TEST_KEY);
    const parsed = parseServiceAccountEnv(raw);
    expect(parsed.client_email).toBe(TEST_KEY.client_email);
  });

  it("parses a base64-encoded JSON env value", () => {
    const encoded = Buffer.from(JSON.stringify(TEST_KEY)).toString("base64");
    const parsed = parseServiceAccountEnv(encoded);
    expect(parsed.client_email).toBe(TEST_KEY.client_email);
  });

  it("throws a clear error when required fields are missing", () => {
    expect(() => parseServiceAccountEnv(JSON.stringify({ client_email: "x" }))).toThrow(/private_key/);
  });

  it("throws an actionable error (not a raw JSON.parse SyntaxError) for a value with an extra wrapping layer of quotes — regression: confirmed live in production on 2026-08-10, where this exact shape decoded to garbled bytes and failed with an opaque native error", () => {
    const wrappedInExtraQuotes = JSON.stringify(JSON.stringify(TEST_KEY));
    expect(() => parseServiceAccountEnv(wrappedInExtraQuotes)).toThrow(/extra layer of escaping|wrapping layer of quotes/);
  });

  it("throws an actionable error for a value that is neither raw JSON nor valid base64 JSON", () => {
    expect(() => parseServiceAccountEnv("not json and not base64 either !!!")).toThrow(/wrapping layer of quotes\/escaping/);
  });
});

describe("GoogleSearchConsoleClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockFetchSequence(responses: Array<{ ok: boolean; json: unknown; status?: number }>) {
    let call = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        const r = responses[call];
        call += 1;
        return { ok: r.ok, status: r.status ?? (r.ok ? 200 : 400), json: async () => r.json, text: async () => JSON.stringify(r.json) } as Response;
      })
    );
  }

  it("queries the real searchAnalytics endpoint shape and parses rows", async () => {
    mockFetchSequence([
      { ok: true, json: { access_token: "fake-token", expires_in: 3600, token_type: "Bearer" } },
      { ok: true, json: { rows: [{ keys: ["notion review"], clicks: 12, impressions: 400, ctr: 0.03, position: 8.2 }] } },
    ]);

    const client = new GoogleSearchConsoleClient(TEST_KEY, "https://miloosh.com/");
    const rows = await client.querySearchAnalytics({ startDate: "2026-07-01", endDate: "2026-07-28", dimensions: ["query"] });

    expect(rows).toHaveLength(1);
    expect(rows[0].clicks).toBe(12);

    const secondCall = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[1];
    expect(secondCall[0]).toContain("searchAnalytics/query");
    expect(secondCall[0]).toContain(encodeURIComponent("https://miloosh.com/"));
  });

  it("inspects a URL against the real URL Inspection endpoint shape", async () => {
    mockFetchSequence([
      { ok: true, json: { access_token: "fake-token", expires_in: 3600, token_type: "Bearer" } },
      {
        ok: true,
        json: { inspectionResult: { indexStatusResult: { verdict: "PASS", coverageState: "Submitted and indexed", indexingState: "INDEXING_ALLOWED", lastCrawlTime: "2026-08-01T00:00:00Z" } } },
      },
    ]);

    const client = new GoogleSearchConsoleClient(TEST_KEY, "https://miloosh.com/");
    const result = await client.inspectUrl("https://miloosh.com/software/notion");

    expect(result.verdict).toBe("PASS");
    expect(result.coverageState).toBe("Submitted and indexed");

    const secondCall = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[1];
    expect(secondCall[0]).toContain("urlInspection/index:inspect");
  });

  it("throws with a clear, truncated error on a failed API response rather than silently returning empty data", async () => {
    mockFetchSequence([
      { ok: true, json: { access_token: "fake-token", expires_in: 3600, token_type: "Bearer" } },
      { ok: false, json: { error: { message: "User does not have sufficient permission for site 'https://miloosh.com/'." } } },
    ]);

    const client = new GoogleSearchConsoleClient(TEST_KEY, "https://miloosh.com/");
    await expect(client.querySearchAnalytics({ startDate: "2026-07-01", endDate: "2026-07-28", dimensions: ["query"] })).rejects.toThrow(/Search Analytics query failed/);
  });

  it("encodes a domain property's colon exactly as Google's documented siteUrl path parameter expects", async () => {
    mockFetchSequence([
      { ok: true, json: { access_token: "fake-token", expires_in: 3600, token_type: "Bearer" } },
      { ok: true, json: { rows: [] } },
    ]);
    const client = new GoogleSearchConsoleClient(TEST_KEY, "sc-domain:miloosh.com");
    await client.querySearchAnalytics({ startDate: "2026-07-01", endDate: "2026-07-28", dimensions: ["query"] });

    const secondCall = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[1];
    expect(secondCall[0]).toContain("sites/sc-domain%3Amiloosh.com/searchAnalytics/query");
  });

  it("returns real, undecorated empty results for a property with no data rather than throwing", async () => {
    mockFetchSequence([
      { ok: true, json: { access_token: "fake-token", expires_in: 3600, token_type: "Bearer" } },
      { ok: true, json: {} }, // Google omits `rows` entirely when there's nothing to report
    ]);
    const client = new GoogleSearchConsoleClient(TEST_KEY, "https://miloosh.com/");
    const rows = await client.querySearchAnalytics({ startDate: "2026-07-01", endDate: "2026-07-28", dimensions: ["query"] });
    expect(rows).toEqual([]);
  });

  it("rejects a rowLimit outside Google's documented 1-25,000 range before making any network call", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const client = new GoogleSearchConsoleClient(TEST_KEY, "https://miloosh.com/");
    await expect(client.querySearchAnalytics({ startDate: "2026-07-01", endDate: "2026-07-28", dimensions: ["query"], rowLimit: 25_001 })).rejects.toThrow(/rowLimit/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("retries a real 429 (quota exceeded) response with backoff and succeeds if a later attempt is accepted", async () => {
    mockFetchSequence([
      { ok: true, json: { access_token: "fake-token", expires_in: 3600, token_type: "Bearer" }, status: 200 },
      { ok: false, json: { error: { message: "Quota exceeded" } }, status: 429 },
      { ok: true, json: { rows: [{ keys: ["a"], clicks: 1, impressions: 10, ctr: 0.1, position: 5 }] }, status: 200 },
    ]);
    const client = new GoogleSearchConsoleClient(TEST_KEY, "https://miloosh.com/");
    const rows = await client.querySearchAnalytics({ startDate: "2026-07-01", endDate: "2026-07-28", dimensions: ["query"] });
    expect(rows).toHaveLength(1);
  }, 10_000);

  it("gives up after repeated 429s rather than retrying forever", async () => {
    mockFetchSequence([
      { ok: true, json: { access_token: "fake-token", expires_in: 3600, token_type: "Bearer" }, status: 200 },
      { ok: false, json: { error: { message: "Quota exceeded" } }, status: 429 },
      { ok: false, json: { error: { message: "Quota exceeded" } }, status: 429 },
      { ok: false, json: { error: { message: "Quota exceeded" } }, status: 429 },
    ]);
    const client = new GoogleSearchConsoleClient(TEST_KEY, "https://miloosh.com/");
    await expect(client.querySearchAnalytics({ startDate: "2026-07-01", endDate: "2026-07-28", dimensions: ["query"] })).rejects.toThrow(/429/);
  }, 15_000);

  it("paginates via startRow until a page returns fewer rows than requested (Google's documented end-of-results signal)", async () => {
    const page1 = Array.from({ length: 3 }, (_, i) => ({ keys: [`q${i}`], clicks: 1, impressions: 10, ctr: 0.1, position: 5 }));
    const page2 = [{ keys: ["q-last"], clicks: 1, impressions: 10, ctr: 0.1, position: 5 }];
    mockFetchSequence([
      { ok: true, json: { access_token: "fake-token", expires_in: 3600, token_type: "Bearer" } },
      { ok: true, json: { rows: page1 } },
      { ok: true, json: { rows: page2 } }, // shorter than pageSize -> stop. No second token fetch: the client caches it for its lifetime.
    ]);
    const client = new GoogleSearchConsoleClient(TEST_KEY, "https://miloosh.com/");
    const rows = await client.queryAllSearchAnalytics({ startDate: "2026-07-01", endDate: "2026-07-28", dimensions: ["query"], rowLimit: 3 });
    expect(rows).toHaveLength(4);
    expect(rows.map((r) => r.keys[0])).toEqual(["q0", "q1", "q2", "q-last"]);
  });

  it("stops pagination at maxRows even if the API would return more (bounded, not unbounded)", async () => {
    const fullPage = Array.from({ length: 3 }, (_, i) => ({ keys: [`q${i}`], clicks: 1, impressions: 10, ctr: 0.1, position: 5 }));
    mockFetchSequence([
      { ok: true, json: { access_token: "fake-token", expires_in: 3600, token_type: "Bearer" } },
      { ok: true, json: { rows: fullPage } },
      { ok: true, json: { rows: fullPage } }, // no second token fetch: cached across both pages.
    ]);
    const client = new GoogleSearchConsoleClient(TEST_KEY, "https://miloosh.com/");
    const rows = await client.queryAllSearchAnalytics({ startDate: "2026-07-01", endDate: "2026-07-28", dimensions: ["query"], rowLimit: 3 }, 5);
    expect(rows).toHaveLength(5); // 6 fetched across 2 pages, capped to maxRows=5
  });

  it("caches the access token across multiple calls on the same client instead of re-fetching it every time — regression: a ~65-call real batch hit Vercel's function timeout because every single call paid for its own OAuth round-trip", async () => {
    const fetchMock = vi.fn<(url: string) => Promise<Response>>(async (url: string) => {
      if (url.includes("oauth2.googleapis.com")) {
        return { ok: true, status: 200, json: async () => ({ access_token: "fake-token", expires_in: 3600, token_type: "Bearer" }) } as Response;
      }
      return { ok: true, status: 200, json: async () => ({ rows: [] }) } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new GoogleSearchConsoleClient(TEST_KEY, "https://miloosh.com/");
    await client.querySearchAnalytics({ startDate: "2026-07-01", endDate: "2026-07-28", dimensions: ["query"] });
    await client.querySearchAnalytics({ startDate: "2026-07-01", endDate: "2026-07-28", dimensions: ["page"] });
    await client.inspectUrl("https://miloosh.com/software/notion");

    const tokenCalls = fetchMock.mock.calls.filter(([url]) => url.includes("oauth2.googleapis.com"));
    expect(tokenCalls).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(4); // 1 token fetch + 3 real API calls
  });

  it("parses the full IndexStatusInspectionResult field set, including canonical and robots state", async () => {
    mockFetchSequence([
      { ok: true, json: { access_token: "fake-token", expires_in: 3600, token_type: "Bearer" } },
      {
        ok: true,
        json: {
          inspectionResult: {
            indexStatusResult: {
              verdict: "NEUTRAL",
              coverageState: "Crawled - currently not indexed",
              indexingState: "INDEXING_ALLOWED",
              lastCrawlTime: "2026-08-01T00:00:00Z",
              robotsTxtState: "ALLOWED",
              pageFetchState: "SUCCESSFUL",
              googleCanonical: "https://miloosh.com/software/notion",
              userCanonical: "https://miloosh.com/software/notion",
              crawledAs: "MOBILE",
            },
          },
        },
      },
    ]);
    const client = new GoogleSearchConsoleClient(TEST_KEY, "https://miloosh.com/");
    const result = await client.inspectUrl("https://miloosh.com/software/notion");
    expect(result.coverageState).toBe("Crawled - currently not indexed");
    expect(result.googleCanonical).toBe("https://miloosh.com/software/notion");
    expect(result.userCanonical).toBe("https://miloosh.com/software/notion");
    expect(result.robotsTxtState).toBe("ALLOWED");
    expect(result.crawledAs).toBe("MOBILE");
  });

  it("handles a partial/malformed response (missing inspectionResult) without throwing — falls back to UNKNOWN", async () => {
    mockFetchSequence([
      { ok: true, json: { access_token: "fake-token", expires_in: 3600, token_type: "Bearer" } },
      { ok: true, json: {} },
    ]);
    const client = new GoogleSearchConsoleClient(TEST_KEY, "https://miloosh.com/");
    const result = await client.inspectUrl("https://miloosh.com/software/notion");
    expect(result.verdict).toBe("UNKNOWN");
    expect(result.googleCanonical).toBeNull();
  });

  it("surfaces a real auth failure (bad/expired service-account key) clearly, rather than a confusing downstream error", async () => {
    mockFetchSequence([{ ok: false, json: { error: "invalid_grant", error_description: "Invalid JWT Signature." }, status: 401 }]);
    const client = new GoogleSearchConsoleClient(TEST_KEY, "https://miloosh.com/");
    await expect(client.querySearchAnalytics({ startDate: "2026-07-01", endDate: "2026-07-28", dimensions: ["query"] })).rejects.toThrow(/Google OAuth2 token exchange failed/);
  });

  it("throws a clear error on a failed URL Inspection call rather than returning a fabricated result", async () => {
    mockFetchSequence([
      { ok: true, json: { access_token: "fake-token", expires_in: 3600, token_type: "Bearer" } },
      { ok: false, json: { error: { message: "Site not verified" } }, status: 403 },
    ]);
    const client = new GoogleSearchConsoleClient(TEST_KEY, "https://miloosh.com/");
    await expect(client.inspectUrl("https://miloosh.com/software/notion")).rejects.toThrow(/URL Inspection failed/);
  });
});
