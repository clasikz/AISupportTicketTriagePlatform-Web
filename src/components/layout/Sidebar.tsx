"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    {
        label: "Board",
        href: "/",
        icon: (
            <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="1" width="6" height="6" rx="1.2" />
                <rect x="9" y="1" width="6" height="6" rx="1.2" />
                <rect x="1" y="9" width="6" height="6" rx="1.2" />
                <rect x="9" y="9" width="6" height="6" rx="1.2" />
            </svg>
        ),
    },
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: (
            <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="8" width="3" height="7" rx="1" />
                <rect x="6" y="5" width="3" height="10" rx="1" />
                <rect x="11" y="2" width="3" height="13" rx="1" />
            </svg>
        ),
    },
];

interface Props {
    width: number;
    onStartDrag: (e: React.MouseEvent) => void;
}

export default function Sidebar({ width, onStartDrag }: Props) {
    const pathname = usePathname();

    return (
        <aside
            style={{ width }}
            className="fixed top-12 left-0 bottom-0 bg-[#f4f5f7] border-r border-[#dfe1e6] flex flex-col overflow-y-auto z-0"
        >
            <div
                className="px-4 border-b border-[#dfe1e6] flex items-center"
                style={{ minHeight: 64 }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-primary rounded flex items-center justify-center text-white text-[11px] font-extrabold flex-shrink-0">
                        TT
                    </div>
                    <div className="overflow-hidden">
                        <div className="text-[13px] font-semibold text-[#172b4d] leading-tight truncate">
                            TicketTriage
                        </div>
                        <div className="text-[11px] text-[#5e6c84] mt-0.5">Support Project</div>
                    </div>
                </div>
            </div>

            <nav className="py-2">
                <div className="px-4 py-2 pb-1 text-[11px] font-semibold text-[#5e6c84] uppercase tracking-[0.07em]">
                    Planning
                </div>
                {navItems.map((item) => {
                    const active = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 h-10 px-3 mx-4 rounded text-[13px] transition-colors ${
                                active
                                    ? "bg-primary-light text-primary font-medium"
                                    : "text-[#172b4d] hover:bg-[#ebecf0]"
                            }`}
                        >
                            <span
                                className={`flex-shrink-0 ${active ? "opacity-100" : "opacity-60"}`}
                            >
                                {item.icon}
                            </span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div
                onMouseDown={onStartDrag}
                className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize group"
            >
                <div className="absolute inset-0 group-hover:bg-primary/25 transition-colors" />
            </div>
        </aside>
    );
}
