"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Topbar() {
    const { userId, logout } = useAuth();

    return (
        <header className="fixed top-0 left-0 right-0 h-12 bg-primary z-50 flex items-center px-4 gap-2 shadow-md">
            <div className="flex items-center gap-2 h-7 pr-3 border-r border-white/20 mr-1">
                <div className="w-[26px] h-[26px] bg-white rounded flex items-center justify-center text-primary text-[11px] font-extrabold flex-shrink-0">
                    TT
                </div>
                <span className="text-white font-bold text-sm tracking-tight">TicketTriage</span>
            </div>

            <nav className="flex items-center gap-0.5">
                <Link
                    href="/"
                    className="h-8 px-2.5 rounded text-white/85 hover:text-white hover:bg-white/12 text-[13px] inline-flex items-center transition-colors"
                >
                    Your work
                </Link>
                <Link
                    href="/dashboard"
                    className="h-8 px-2.5 rounded text-white/85 hover:text-white hover:bg-white/12 text-[13px] inline-flex items-center transition-colors"
                >
                    Dashboard
                </Link>
            </nav>

            <div className="ml-auto flex items-center gap-3">
                <span className="text-white/85 text-xs">{userId}</span>
                <button
                    onClick={logout}
                    className="h-7 px-2.5 rounded border border-white/25 text-white/85 hover:text-white hover:bg-white/12 text-xs transition-colors"
                >
                    Sign out
                </button>
            </div>
        </header>
    );
}
