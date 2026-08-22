import { describe, expect, it, vi, afterEach } from "vitest";
import { execSync } from "node:child_process";

vi.mock("node:child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:child_process")>();
  return { ...actual, execSync: vi.fn(actual.execSync) };
});

import { verifyProjectIdentity, ProjectIdentityError, EXPECTED_REPO_SLUG, EXPECTED_PACKAGE_NAME } from "@/lib/project-guard";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const mockedExecSync = vi.mocked(execSync);

describe("project identity guard", () => {
  afterEach(() => {
    mockedExecSync.mockRestore();
    if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it("passes for the real Miloosh working directory (this repo)", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const report = verifyProjectIdentity();
    expect(report.repoSlug).toBe(EXPECTED_REPO_SLUG);
    expect(report.packageName).toBe(EXPECTED_PACKAGE_NAME);
  });

  it("treats a redacted [SENSITIVE] SITE_URL as unchecked, not a failure", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "[SENSITIVE]";
    const report = verifyProjectIdentity();
    expect(report.siteUrlChecked).toBe(false);
    expect(report.siteUrlDomain).toBeNull();
  });

  it("passes and checks siteUrlDomain when NEXT_PUBLIC_SITE_URL resolves to miloosh.com", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://miloosh.com";
    const report = verifyProjectIdentity();
    expect(report.siteUrlChecked).toBe(true);
    expect(report.siteUrlDomain).toBe("miloosh.com");
  });

  it("fails closed when NEXT_PUBLIC_SITE_URL resolves to a different known project's domain", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://needgohome.netlify.app";
    expect(() => verifyProjectIdentity()).toThrow(ProjectIdentityError);
    expect(() => verifyProjectIdentity()).toThrow(/known OTHER project/);
  });

  it("fails closed when NEXT_PUBLIC_SITE_URL resolves to an unrelated domain", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
    expect(() => verifyProjectIdentity()).toThrow(ProjectIdentityError);
    expect(() => verifyProjectIdentity()).toThrow(/expected "miloosh\.com"/);
  });

  it("fails closed when the git remote does not reference the Miloosh repo", () => {
    mockedExecSync.mockReturnValue("https://github.com/lahman00/need-go-home.git\n" as ReturnType<typeof execSync>);
    expect(() => verifyProjectIdentity()).toThrow(ProjectIdentityError);
    expect(() => verifyProjectIdentity()).toThrow(/known OTHER project/);
  });

  it("fails closed when the git remote references some unrelated repo", () => {
    mockedExecSync.mockReturnValue("https://github.com/someone-else/totally-different.git\n" as ReturnType<typeof execSync>);
    expect(() => verifyProjectIdentity()).toThrow(ProjectIdentityError);
    expect(() => verifyProjectIdentity()).toThrow(/expected it to reference/);
  });

  it("fails closed when git remote read itself fails (not a git working directory)", () => {
    mockedExecSync.mockImplementation(() => {
      throw new Error("not a git repository");
    });
    expect(() => verifyProjectIdentity()).toThrow(ProjectIdentityError);
    expect(() => verifyProjectIdentity()).toThrow(/could not read git remote/);
  });
});
