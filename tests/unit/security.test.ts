import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  deleteMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: dbMocks.transaction,
    loginAttempt: {
      count: dbMocks.count,
      create: dbMocks.create,
      deleteMany: dbMocks.deleteMany,
    },
  },
}));

import {
  assertSameOrigin,
  enforceWriteRateLimit,
  hashIp,
  hashToken,
  hashVisitorToken,
  isSafeExternalUrl,
  newSessionToken,
  newVisitorToken,
  normalizeEmail,
  requestIpFromHeaders,
  safeEqual,
  safeRedirectPath,
} from "@/lib/security";

describe("security primitives", () => {
  it("hashes session tokens with SHA-256", () => {
    const token = "a-sensitive-session-token";

    expect(hashToken(token)).toBe(
      createHash("sha256").update(token).digest("hex"),
    );
    expect(hashToken(token)).not.toContain(token);
  });

  it("generates unique URL-safe session tokens with sufficient entropy", () => {
    const first = newSessionToken();
    const second = newSessionToken();

    expect(first).not.toBe(second);
    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(second).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("generates an independent signed visitor identity without exposing it", () => {
    const first = newVisitorToken();
    const second = newVisitorToken();

    expect(first).not.toBe(second);
    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(hashVisitorToken(first)).toHaveLength(64);
    expect(hashVisitorToken(first)).toBe(hashVisitorToken(first));
    expect(hashVisitorToken(first)).not.toContain(first);
  });

  it("normalizes emails without locale-dependent casing", () => {
    expect(normalizeEmail("  Admin@EXAMPLE.COM ")).toBe(
      "admin@example.com",
    );
  });

  it("hashes IP addresses deterministically without exposing the address", () => {
    const first = hashIp("203.0.113.10");
    const second = hashIp("203.0.113.10");

    expect(first).toBe(second);
    expect(first).toHaveLength(64);
    expect(first).not.toContain("203.0.113.10");
  });

  it("trusts x-real-ip first and otherwise uses the rightmost proxy address", () => {
    expect(
      requestIpFromHeaders(
        new Headers({
          "x-real-ip": "203.0.113.9",
          "x-forwarded-for": "198.51.100.1, 198.51.100.2",
        }),
      ),
    ).toBe("203.0.113.9");
    expect(
      requestIpFromHeaders(
        new Headers({
          "x-forwarded-for": "198.51.100.1, 198.51.100.2",
        }),
      ),
    ).toBe("198.51.100.2");
    expect(requestIpFromHeaders(new Headers())).toBe("unknown");
  });

  it("compares equal values safely and rejects different lengths", () => {
    expect(safeEqual("same-value", "same-value")).toBe(true);
    expect(safeEqual("same-value", "different")).toBe(false);
    expect(safeEqual("short", "a-longer-value")).toBe(false);
  });
});

describe("redirect and external URL policy", () => {
  it.each([
    ["/admin/posts", "/admin/posts"],
    ["/admin/posts?q=java", "/admin/posts?q=java"],
    ["https://evil.example", "/admin"],
    ["//evil.example", "/admin"],
    ["admin/posts", "/admin"],
    [null, "/admin"],
  ])("normalizes redirect %s to %s", (input, expected) => {
    expect(safeRedirectPath(input)).toBe(expected);
  });

  it("supports a custom redirect fallback", () => {
    expect(safeRedirectPath("https://evil.example", "/admin/login")).toBe(
      "/admin/login",
    );
  });

  it("allows HTTPS URLs and rejects dangerous protocols", () => {
    expect(isSafeExternalUrl("https://example.com/path")).toBe(true);
    expect(isSafeExternalUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeExternalUrl("data:text/html,unsafe")).toBe(false);
    expect(isSafeExternalUrl("not a url")).toBe(false);
    expect(isSafeExternalUrl("")).toBe(true);
    expect(isSafeExternalUrl(null)).toBe(true);
  });
});

describe("same-origin protection", () => {
  it("accepts a request whose Origin and Host match", async () => {
    const request = new Request("http://localhost:3000/api/contact", {
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
      method: "POST",
    });

    await expect(assertSameOrigin(request)).resolves.toBeUndefined();
  });

  it("accepts the configured host through a reverse proxy", async () => {
    const request = new Request("http://internal/api/contact", {
      headers: {
        host: "internal:3000",
        origin: "http://localhost:3000",
        "x-forwarded-host": "localhost:3000",
      },
      method: "POST",
    });

    await expect(assertSameOrigin(request)).resolves.toBeUndefined();
  });

  it("rejects missing source metadata", async () => {
    const request = new Request("http://localhost:3000/api/contact", {
      method: "POST",
    });

    await expect(assertSameOrigin(request)).rejects.toThrow("来源");
  });

  it("rejects malformed and cross-site origins", async () => {
    const malformed = new Request("http://localhost:3000/api/contact", {
      headers: { host: "localhost:3000", origin: "not-a-url" },
      method: "POST",
    });
    const crossSite = new Request("http://localhost:3000/api/contact", {
      headers: {
        host: "localhost:3000",
        origin: "https://evil.example",
      },
      method: "POST",
    });

    await expect(assertSameOrigin(malformed)).rejects.toThrow("来源");
    await expect(assertSameOrigin(crossSite)).rejects.toThrow("来源");
  });
});

describe("write rate limiting", () => {
  beforeEach(() => {
    dbMocks.transaction.mockReset();
    dbMocks.count.mockReset();
    dbMocks.create.mockReset();
    dbMocks.deleteMany.mockReset();
    dbMocks.deleteMany.mockResolvedValue({ count: 0 });
    dbMocks.transaction.mockImplementation(
      (
        callback: (transaction: {
          loginAttempt: {
            count: typeof dbMocks.count;
            create: typeof dbMocks.create;
            deleteMany: typeof dbMocks.deleteMany;
          };
        }) => unknown,
      ) =>
        callback({
          loginAttempt: {
            count: dbMocks.count,
            create: dbMocks.create,
            deleteMany: dbMocks.deleteMany,
          },
        }),
    );
  });

  it("records an allowed write attempt", async () => {
    dbMocks.count.mockResolvedValue(2);
    dbMocks.create.mockResolvedValue({ id: "attempt-id" });

    await expect(
      enforceWriteRateLimit({
        key: "comment:ip-hash",
        limit: 5,
        windowMs: 600_000,
      }),
    ).resolves.toBeUndefined();

    expect(dbMocks.count).toHaveBeenCalledWith({
      where: {
        key: "comment:ip-hash",
        createdAt: { gte: expect.any(Date) },
      },
    });
    expect(dbMocks.create).toHaveBeenCalledWith({
      data: { key: "comment:ip-hash", succeeded: false },
    });
    expect(dbMocks.transaction).toHaveBeenCalledOnce();
  });

  it("rejects a write at the configured limit without recording another row", async () => {
    dbMocks.count.mockResolvedValue(5);

    await expect(
      enforceWriteRateLimit({
        key: "comment:ip-hash",
        limit: 5,
        windowMs: 600_000,
      }),
    ).rejects.toThrow("频繁");

    expect(dbMocks.create).not.toHaveBeenCalled();
  });
});
