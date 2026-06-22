import { describe, it, expect } from "vitest";
import { getCSPString, SECURE_HEADERS } from "@/lib/security";

describe("Security Headers", () => {
  it("includes all required security headers", () => {
    expect(SECURE_HEADERS).toHaveProperty("X-Content-Type-Options");
    expect(SECURE_HEADERS).toHaveProperty("X-Frame-Options");
    expect(SECURE_HEADERS).toHaveProperty("X-XSS-Protection");
    expect(SECURE_HEADERS).toHaveProperty("Referrer-Policy");
    expect(SECURE_HEADERS).toHaveProperty("Permissions-Policy");
    expect(SECURE_HEADERS).toHaveProperty("Strict-Transport-Security");
    expect(SECURE_HEADERS).toHaveProperty("Content-Security-Policy");
  });

  it("sets proper HSTS value", () => {
    expect(SECURE_HEADERS["Strict-Transport-Security"]).toContain("max-age=63072000");
    expect(SECURE_HEADERS["Strict-Transport-Security"]).toContain("includeSubDomains");
    expect(SECURE_HEADERS["Strict-Transport-Security"]).toContain("preload");
  });

  it("denies framing", () => {
    expect(SECURE_HEADERS["X-Frame-Options"]).toBe("DENY");
  });

  it("restricts permissions", () => {
    expect(SECURE_HEADERS["Permissions-Policy"]).toContain("camera=()");
    expect(SECURE_HEADERS["Permissions-Policy"]).toContain("microphone=()");
  });
});

describe("CSP", () => {
  it("generates a valid CSP string", () => {
    const csp = getCSPString();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src");
    expect(csp).toContain("style-src");
    expect(csp).toContain("img-src");
    expect(csp).toContain("connect-src");
    expect(csp).toContain("frame-src 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
  });

  it("does not allow unsafe-inline in default-src", () => {
    const csp = getCSPString();
    expect(csp).toContain("default-src 'self'");
  });
});
