import { describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({
    auth: (handler: unknown) => handler,
}));

import { proxy } from "@/proxy";

type AuthState =
    | null
    | undefined
    | Error
    | { user?: { role?: string } | null };

type ProxyHandler = (req: {
    nextUrl: URL;
    auth: AuthState;
}) => Response | undefined;

const handler = proxy as unknown as ProxyHandler;

function request(pathname: string, auth: AuthState) {
    return {
        nextUrl: new URL(pathname, "https://example.com"),
        auth,
    };
}

describe("management proxy authorization", () => {
    it.each([
        ["missing auth", undefined],
        ["null auth", null],
        ["auth without user", {}],
        ["auth with null user", { user: null }],
        ["truthy error-like auth", new Error("auth failed")],
    ])("redirects %s to login", (_label, auth) => {
        const response = handler(request("/management/posts", auth));

        expect(response?.status).toBe(302);
        expect(response?.headers.get("location")).toBe(
            "https://example.com/login?from=%2Fmanagement%2Fposts",
        );
    });

    it("allows an authenticated user to access management routes", () => {
        expect(
            handler(request("/management/posts", { user: { role: "editor" } })),
        ).toBeUndefined();
    });

    it("returns 403 for a non-admin user on admin routes", async () => {
        const response = handler(
            request("/management/admin", { user: { role: "editor" } }),
        );

        expect(response?.status).toBe(403);
        await expect(response?.text()).resolves.toBe("Forbidden");
    });

    it("allows an admin user to access admin routes", () => {
        expect(
            handler(request("/management/admin", { user: { role: "admin" } })),
        ).toBeUndefined();
    });
});
