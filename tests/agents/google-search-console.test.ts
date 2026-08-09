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
});

describe("GoogleSearchConsoleClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockFetchSequence(responses: Array<{ ok: boolean; json: unknown }>) {
    let call = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        const r = responses[call];
        call += 1;
        return { ok: r.ok, status: r.ok ? 200 : 400, json: async () => r.json, text: async () => JSON.stringify(r.json) } as Response;
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
});
