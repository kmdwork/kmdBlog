// app/auth/login/page.tsx
import { signIn } from "@/auth";

export const metadata = {
  title: "login",
};


export default function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--app-bg)] px-4">
            <div className="
                w-full max-w-sm
                p-8 rounded-2xl
                bg-[var(--card-bg)]
                border border-[var(--border)]
                shadow-xl
            ">
                <h1 className="text-2xl font-bold text-center mb-4">
                    Sign In
                </h1>
                <p className="text-center text-sm text-[var(--muted)] mb-8">
                    管理者ページへアクセスするにはログインが必要です
                </p>

                <form
                    action={async () => {
                        "use server";
                        await signIn("google", { redirectTo: "/management" });
                    }}
                >
                    <button
                        type="submit"
                        className="
                            w-full py-3 px-4
                            rounded-xl
                            bg-white text-black
                            font-semibold
                            shadow
                            hover:shadow-lg
                            transition-all
                            flex items-center justify-center gap-2
                            border border-gray-200
                        "
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 48 48"
                            className="w-5 h-5"
                        >
                            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C34.8 32.5 30.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10.7 0 19.5-7.8 19.5-20 0-1.3-.1-2.7-.4-3.5z" />
                            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.6 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.2 0-13.4 3.8-17 9.5z" />
                            <path fill="#4CAF50" d="M24 44c6 0 11.1-2 14.9-5.3l-6.2-4.8c-2 1.5-4.5 2.4-7.4 2.4-5.9 0-10.9-3.9-12.7-9.3l-6.6 5C9.4 39 16 44 24 44z" />
                            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.4-3.6 6.1-6.8 7.7l6.2 4.8C38.5 36.6 42 31.1 42 24c0-1.3-.1-2.7-.4-3.5z" />
                        </svg>
                        Sign in with Google
                    </button>
                </form>
            </div>
        </div>
    );
}