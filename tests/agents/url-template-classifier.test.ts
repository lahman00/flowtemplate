import { describe, it, expect } from "vitest";
import { classifyUrlTemplate } from "@/scripts/agents/seo/lib/url-template-classifier";

describe("classifyUrlTemplate", () => {
  it("classifies the homepage", () => {
    expect(classifyUrlTemplate("/")).toBe("homepage");
    expect(classifyUrlTemplate("https://miloosh.com/")).toBe("homepage");
  });

  it("classifies a software page", () => {
    expect(classifyUrlTemplate("/software/notion")).toBe("software");
    expect(classifyUrlTemplate("https://miloosh.com/software/notion")).toBe("software");
  });

  it("classifies a category page", () => {
    expect(classifyUrlTemplate("/category/crm")).toBe("category");
  });

  it("classifies a comparison page", () => {
    expect(classifyUrlTemplate("/compare/notion-vs-clickup")).toBe("comparison");
  });

  it("classifies the /compare index and other static pages as 'other'", () => {
    expect(classifyUrlTemplate("/compare")).toBe("other");
    expect(classifyUrlTemplate("/about")).toBe("other");
    expect(classifyUrlTemplate("/privacy")).toBe("other");
  });

  it("handles a bare path without throwing on invalid URL parsing", () => {
    expect(classifyUrlTemplate("/software/x-y-z")).toBe("software");
  });
});
