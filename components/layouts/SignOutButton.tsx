"use client"

import { signOut } from "next-auth/react"

export default function SignOutButton() {
    return (
        <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full text-left px-2 py-2 rounded hover:bg-[var(--bg)] text-[var(--accent-pink)]"
        >
            サインアウト
        </button>
    )
}
