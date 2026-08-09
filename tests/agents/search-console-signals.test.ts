import { describe, it, expect } from "vitest";
import { classify } from "@/scripts/agents/seo/search-console-signals";
import type { UrlInspectionResult } from "@/scripts/agents/seo/lib/google-search-console-client";

function inspection(overrides: Partial<UrlInspectionResult>): UrlInspectionResult {
  return {
    url: "x",
    verdict: "NEUTRAL",
    coverageState: null,
    indexingState: null,
    lastCrawlTime: null,
    robotsTxtState: null,
    pageFetchState: null,
    googleCanonical: null,
    userCanonical: null,
    crawledAs: null,
    ...overrides,
  };
}

describe("classify (Section C: indexation states are not automatically failures)", () => {
  it("classifies a genuinely indexed page as INDEXED, info severity", () => {
    const result = classify(inspection({ verdict: "PASS", coverageState: "Submitted and indexed" }));
    expect(result).toEqual({ severity: "info", label: "INDEXED" });
  });

  it("classifies 'Crawled - currently not indexed' as CRAWLED_NOT_INDEXED, info severity — not a failure", () => {
    const result = classify(inspection({ verdict: "NEUTRAL", coverageState: "Crawled - currently not indexed" }));
    expect(result).toEqual({ severity: "info", label: "CRAWLED_NOT_INDEXED" });
  });

  it("classifies a real Google-rejected page as EXCLUDED, warning severity", () => {
    const result = classify(inspection({ verdict: "FAIL", coverageState: "Not found (404)" }));
    expect(result).toEqual({ severity: "warning", label: "EXCLUDED" });
  });

  it("classifies an unrecognized/not-yet-crawled state as UNKNOWN, warning severity", () => {
    const result = classify(inspection({ verdict: "NEUTRAL", coverageState: "Discovered - currently not indexed" }));
    expect(result).toEqual({ severity: "warning", label: "UNKNOWN" });
  });

  it("does not misclassify 'Crawled - currently not indexed' as INDEXED just because it contains the substring 'indexed'", () => {
    // Regression guard for a real, easy-to-write bug: naive `.includes("indexed")` alone would misclassify this.
    const result = classify(inspection({ verdict: "PASS", coverageState: "Crawled - currently not indexed" }));
    expect(result.label).not.toBe("INDEXED");
  });
});
