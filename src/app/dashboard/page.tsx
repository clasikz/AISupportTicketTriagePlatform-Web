"use client";

import dynamic from "next/dynamic";
import { useDashboard } from "@/hooks/useDashboard";
import ColdStartBanner from "@/components/ui/ColdStartBanner";
import StatCardSkeleton from "@/components/skeletons/StatCardSkeleton";

const DashboardGrid = dynamic(() => import("@/components/dashboard/DashboardGrid"), {
    loading: () => (
        <div className="px-6 py-6 space-y-4">
            <div className="grid grid-cols-5 gap-3">
                {Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)}
            </div>
            <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white border border-[#dfe1e6] rounded p-4 h-[284px] animate-pulse" />
                ))}
            </div>
        </div>
    ),
    ssr: false,
});

export default function DashboardPage() {
    const { stats, loading, isSlowLoad, error } = useDashboard();

    return (
        <>
            <div className="sticky top-12 z-20 px-6 bg-white border-b border-[#dfe1e6] flex flex-col justify-center" style={{ minHeight: 64 }}>
                <h1 className="text-xl font-semibold text-[#172b4d] leading-tight">Dashboard</h1>
                <p className="text-[12px] text-[#5e6c84] mt-0.5">
                    Overview of all tickets · cached every 30s
                </p>
            </div>

            {isSlowLoad && <ColdStartBanner />}

            <DashboardGrid stats={stats} loading={loading || !!error} />

            {!loading && (
                <p className="px-6 text-[11px] text-[#97a0af]">
                    Dashboard data is cached for 30 seconds per user session.
                </p>
            )}
        </>
    );
}
