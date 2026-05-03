"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const SLOW_MS = 2000;

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [userId, setUserId] = useState("");
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
        if (!userId.trim()) return;

        setLoading(true);
        setError("");

        try {
            await login(userId.trim());
            router.push("/");
        } catch {
            setError("Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full max-w-sm">
            {isWarmingUp && (
                <div className="flex items-center gap-2.5 mb-3 px-3.5 py-2.5 bg-yellow-50 border border-yellow-300 rounded text-[13px] text-yellow-800">
                    <div className="w-4 h-4 border-2 border-yellow-300 border-t-yellow-600 rounded-full animate-spin flex-shrink-0" />
                    <span>
                        Waking up the server — this may take up to 30 seconds on first load.
                    </span>
                </div>
            )}
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
                <p className="text-sm text-gray-500 mb-6">Enter your user ID to continue</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="userId"
                            className="block text-xs font-semibold text-[#5e6c84] uppercase tracking-wide mb-1.5"
                        >
                            User ID
                        </label>
                        <input
                            id="userId"
                            type="text"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            placeholder="e.g. support_agent"
                            className="w-full h-9 px-3 border border-gray-300 rounded text-sm text-[#172b4d] placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                            autoFocus
                            autoComplete="off"
                        />
                    </div>

                    {error && (
                        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !userId.trim()}
                        className="w-full h-9 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">
                Any user ID string is valid — this is a portfolio demo
            </p>
        </div>
    );
}
