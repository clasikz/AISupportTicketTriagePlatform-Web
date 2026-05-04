"use client";

import { useState, useCallback, useRef, useLayoutEffect } from "react";
import { Ticket, TicketFilters } from "@/types";
import { useStats } from "@/hooks/useStats";
import { useTickets } from "@/hooks/useTickets";
import StatCard from "@/components/dashboard/StatCard";
import StatCardSkeleton from "@/components/skeletons/StatCardSkeleton";
import TicketTable from "@/components/tickets/TicketTable";
import TicketSlideOver from "@/components/tickets/TicketSlideOver";
import CreateTicketModal from "@/components/tickets/CreateTicketModal";
import ColdStartBanner from "@/components/ui/ColdStartBanner";

const DEFAULT_FILTERS: TicketFilters = {
    page: 1,
    pageSize: 10,
    sortBy: "createdAt",
    sortOrder: "Desc",
};

export default function BoardPage() {
    const [filters, setFilters] = useState<TicketFilters>(DEFAULT_FILTERS);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    const stickyHeaderRef = useRef<HTMLDivElement>(null);
    const [stickyHeaderH, setStickyHeaderH] = useState(0);

    useLayoutEffect(() => {
        const el = stickyHeaderRef.current;
        if (!el) return;
        setStickyHeaderH(el.offsetHeight);
        const ro = new ResizeObserver(() => setStickyHeaderH(el.offsetHeight));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useStats();
    const { data, loading, isSlowLoad, error: ticketsError, refetch } = useTickets(filters);

    const handleFiltersChange = useCallback((partial: Partial<TicketFilters>) => {
        setFilters((prev) => ({ ...prev, ...partial }));
    }, []);

    const handleSelect = useCallback((ticket: Ticket) => {
        setSelectedTicket((prev) => (prev?.id === ticket.id ? null : ticket));
    }, []);

    const handleTicketUpdated = useCallback(() => {
        refetch();
        refetchStats();
        setSelectedTicket(null);
    }, [refetch, refetchStats]);

    return (
        <>
            <div ref={stickyHeaderRef} className="sticky top-12 z-20 bg-[#f4f5f7]">
                <div
                    className="px-6 bg-white border-b border-[#dfe1e6] flex flex-col justify-center"
                    style={{ minHeight: 64 }}
                >
                    <h1 className="text-xl font-semibold text-[#172b4d] leading-tight">TT Board</h1>
                    <p className="text-[12px] text-[#5e6c84] mt-0.5">
                        {data
                            ? `${data.count} tickets · AI-triaged by Groq / Llama 3.1`
                            : "Loading..."}
                    </p>
                </div>

                {isSlowLoad && <ColdStartBanner />}

                <div className="grid grid-cols-4 gap-3 px-6 py-3.5">
                    {statsLoading || !!statsError ? (
                        Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
                    ) : stats ? (
                        <>
                            <StatCard
                                label="Total Open"
                                value={stats.open}
                                sub="Active tickets"
                                iconBg="bg-blue-50"
                                icon={
                                    <svg width="24" height="24" viewBox="0 0 16 16" fill="#0052cc">
                                        <rect x="1" y="1" width="6" height="6" rx="1" />
                                        <rect x="9" y="1" width="6" height="6" rx="1" />
                                        <rect x="1" y="9" width="6" height="6" rx="1" />
                                        <rect x="9" y="9" width="6" height="6" rx="1" />
                                    </svg>
                                }
                            />
                            <StatCard
                                label="Critical"
                                value={stats.highPriority}
                                sub="Requires immediate action"
                                valueColor="text-red-600"
                                iconBg="bg-red-50"
                                icon={
                                    <svg width="24" height="24" viewBox="0 0 16 16" fill="#bf2600">
                                        <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v4a.75.75 0 01-1.5 0v-4A.75.75 0 018 4zm0 8a1 1 0 110-2 1 1 0 010 2z" />
                                    </svg>
                                }
                            />
                            <StatCard
                                label="In Progress"
                                value={stats.inProgress}
                                sub="Across all agents"
                                iconBg="bg-green-50"
                                icon={
                                    <svg width="24" height="24" viewBox="0 0 16 16" fill="#006644">
                                        <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.28 5.28l-4 4a.75.75 0 01-1.06 0l-2-2a.75.75 0 011.06-1.06L6.75 8.69l3.47-3.47a.75.75 0 011.06 1.06z" />
                                    </svg>
                                }
                            />
                            <StatCard
                                label="Resolved"
                                value={stats.resolved}
                                sub="Total resolved"
                                valueColor="text-green-700"
                                iconBg="bg-green-50"
                                icon={
                                    <svg width="24" height="24" viewBox="0 0 16 16" fill="#006644">
                                        <rect x="1" y="8" width="3" height="7" rx="1" />
                                        <rect x="6" y="5" width="3" height="10" rx="1" />
                                        <rect x="11" y="2" width="3" height="13" rx="1" />
                                    </svg>
                                }
                            />
                        </>
                    ) : null}
                </div>
            </div>

            <TicketTable
                tickets={data?.results ?? []}
                total={data?.count ?? 0}
                page={filters.page ?? 1}
                pageSize={filters.pageSize ?? 10}
                loading={loading}
                error={ticketsError}
                filters={filters}
                selectedId={selectedTicket?.id ?? null}
                onSelect={handleSelect}
                onFiltersChange={handleFiltersChange}
                onCreateClick={() => setShowCreate(true)}
                toolbarTop={48 + stickyHeaderH}
            />

            {selectedTicket && (
                <TicketSlideOver
                    ticket={selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                    onUpdated={handleTicketUpdated}
                    onMutated={() => { refetch(); refetchStats(); }}
                />
            )}

            {showCreate && (
                <CreateTicketModal
                    onClose={() => setShowCreate(false)}
                    onCreated={() => {
                        setShowCreate(false);
                        refetch();
                        refetchStats();
                    }}
                />
            )}
        </>
    );
}
