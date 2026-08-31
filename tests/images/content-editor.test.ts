import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findFirst: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({ getDb: mocks.getDb }));

import { getActiveContentEditor } from "@/lib/auth/contentEditor";

function session(role: "admin" | "editor" | "author" | "reader", isActive = true) {
  return {
    user: {
      id: "7",
      email: "editor@example.com",
      role,
      isActive,
    },
  };
}

describe("getActiveContentEditor", () => {
  beforeEach(() => {
    mocks.getDb.mockReturnValue({
      query: { users: { findFirst: mocks.findFirst } },
    });
  });

  it.each([
    null,
    session("editor", false),
    session("author"),
    session("reader"),
  ])("rejects missing, inactive, or non-editor sessions", async (value) => {
    mocks.auth.mockResolvedValue(value);
    await expect(getActiveContentEditor()).resolves.toBeNull();
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it.each([
    null,
    { id: 7, role: "editor", isActive: false },
    { id: 7, role: "author", isActive: true },
  ])("rejects users whose current DB state is not authorized", async (dbUser) => {
    mocks.auth.mockResolvedValue(session("editor"));
    mocks.findFirst.mockResolvedValue(dbUser);
    await expect(getActiveContentEditor()).resolves.toBeNull();
  });

  it.each(["admin", "editor"] as const)("accepts an active %s in both session and DB", async (role) => {
    mocks.auth.mockResolvedValue(session(role));
    mocks.findFirst.mockResolvedValue({ id: 7, role, isActive: true });
    await expect(getActiveContentEditor()).resolves.toEqual({ id: 7, role });
  });

  it("fails closed when auth or DB access throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.auth.mockRejectedValue(new Error("configuration error"));
    await expect(getActiveContentEditor()).resolves.toBeNull();
  });
});
