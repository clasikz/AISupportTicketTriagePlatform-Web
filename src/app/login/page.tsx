"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ColdStartBanner from "@/components/ui/ColdStartBanner";

const SLOW_MS = 2000;

const DEMO_USERS = [
    { name: "Admin", masterId: "2000000", game: "Admin" },
    { name: "Arthur Morgan", masterId: "2000001", game: "Red Dead Redemption 2" },
    { name: "Dutch Van der Linde", masterId: "2000002", game: "Red Dead Redemption 2" },
    { name: "John Marston", masterId: "2000003", game: "Red Dead Redemption 2" },
    { name: "Deacon St. John", masterId: "2000004", game: "Days Gone" },
    { name: "Sarah Whitaker", masterId: "2000005", game: "Days Gone" },
    { name: "Joel Miller", masterId: "2000006", game: "The Last of Us" },
    { name: "Ellie Williams", masterId: "2000007", game: "The Last of Us" },
    { name: "Tommy Miller", masterId: "2000008", game: "The Last of Us" },
    { name: "Abby Anderson", masterId: "2000009", game: "The Last of Us Part II" },
    { name: "Kratos", masterId: "2000010", game: "God of War" },
    { name: "Aloy", masterId: "2000011", game: "Horizon Zero Dawn" },
] as const;

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isWarmingUp, setIsWarmingUp] = useState(false);

    useEffect(() => {
        const slow = setTimeout(() => setIsWarmingUp(true), SLOW_MS);
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/health`)
            .then(() => setIsWarmingUp(false))
            .catch(() => setIsWarmingUp(false))
            .finally(() => clearTimeout(slow));
        return () => clearTimeout(slow);
    }, []);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!username.trim() || !password) return;

        setLoading(true);
        setError("");

        try {
            await login(username.trim(), password);
            router.push("/");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full max-w-sm">
            {isWarmingUp && <ColdStartBanner className="mb-3" />}
            <div className="bg-white border border-gray-200 rounded shadow-sm p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-9 h-9 bg-primary rounded-md flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        TT
                    </div>
                    <div>
                        <div className="font-semibold text-[#172b4d] text-base leading-tight">
                            TT Desk
                        </div>
                        <div className="text-xs text-gray-500">AI Support Platform</div>
                    </div>
                </div>

                <h1 className="text-lg font-semibold text-[#172b4d] mb-1">Sign in</h1>
                <p className="text-sm text-gray-500 mb-6">Enter your email or Master ID</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="username"
                            className="block text-xs font-semibold text-[#5e6c84] uppercase tracking-wide mb-1.5"
                        >
                            Email or Master ID
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="you@example.com or 123456"
                            className="w-full h-9 px-3 border border-gray-300 rounded text-sm text-[#172b4d] placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                            autoFocus
                            autoComplete="username"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-xs font-semibold text-[#5e6c84] uppercase tracking-wide mb-1.5"
                        >
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full h-9 px-3 pr-9 border border-gray-300 rounded text-sm text-[#172b4d] placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    >
                                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" />
                                    </svg>
                                ) : (
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    >
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !username.trim() || !password}
                        className="w-full h-9 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>
            </div>

            <div className="mt-3 bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#5e6c84] uppercase tracking-wide">
                        Demo accounts
                    </span>
                    <span className="text-xs text-gray-400 font-mono">Secret1!</span>
                </div>
                <div className="divide-y divide-gray-50 max-h-52 overflow-y-auto">
                    {DEMO_USERS.map((u) => (
                        <button
                            key={u.masterId}
                            type="button"
                            onClick={() => {
                                setUsername(u.masterId);
                                setPassword("Secret1!");
                            }}
                            className="w-full flex items-center justify-between gap-3 px-4 py-2 hover:bg-[#f4f5f7] text-left transition-colors"
                        >
                            <span className="text-[13px] font-medium text-[#172b4d] truncate">
                                {u.name}
                            </span>
                            <span className="text-[11px] text-gray-400 flex-shrink-0">
                                {u.game}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
