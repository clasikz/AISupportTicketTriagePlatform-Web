"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
    Ticket,
    TicketFilters,
    TicketPriority,
    TicketStatus,
    TicketCategory,
    STATUS_LABELS,
} from "@/types";
import TicketTableRow from "./TicketTableRow";
import TableSkeleton from "@/components/skeletons/TableSkeleton";

interface Props {
    tickets: Ticket[];
    total: number;
    page: number;
    pageSize: number;
    loading: boolean;
    error?: string | null;
    filters: TicketFilters;
    selectedId: string | null;
    onSelect: (ticket: Ticket) => void;
    onFiltersChange: (f: Partial<TicketFilters>) => void;
    onCreateClick?: () => void;
    toolbarTop?: number;
}

const COLUMNS = [
    "ID",
    "Title",
    "Status",
    "Priority",
    "Category",
    "Assigned To",
    "Due Date",
    "Created",
    "AI",
];
const DEFAULT_COL_WIDTHS = [84, 260, 130, 88, 110, 132, 112, 110, 72];
const COLUMN_SORT_KEYS: (string | null)[] = [
    null,
    "title",
    "status",
    "priority",
    "category",
    "assignedTo",
    "dueDate",
    "createdAt",
    null,
];

const SORT_OPTIONS: { label: string; value: string }[] = [
    { label: "Created", value: "createdAt" },
    { label: "Updated", value: "updatedAt" },
    { label: "Due Date", value: "dueDate" },
    { label: "Priority", value: "priority" },
    { label: "Status", value: "status" },
];

function loadColWidths(): number[] {
    try {
        const saved = localStorage.getItem("ticket-col-widths");
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length === DEFAULT_COL_WIDTHS.length) return parsed;
        }
    } catch {}
    return DEFAULT_COL_WIDTHS;
}

export default function TicketTable({
    tickets,
    total,
    page,
    pageSize,
    loading,
    error,
    filters,
    selectedId,
    onSelect,
    onFiltersChange,
    onCreateClick,
    toolbarTop = 48,
}: Props) {
    const [searchValue, setSearchValue] = useState(filters.search ?? "");
    const [filterOpen, setFilterOpen] = useState(false);
    const [sortOpen, setSortOpen] = useState(false);
    const [colWidths, setColWidths] = useState<number[]>(DEFAULT_COL_WIDTHS);
    const [hasManualResize, setHasManualResize] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);
    const sortRef = useRef<HTMLDivElement>(null);
    const tableRef = useRef<HTMLTableElement>(null);
    const colWidthsRef = useRef(colWidths);
    colWidthsRef.current = colWidths;
    const totalPages = Math.ceil(total / pageSize);

    useEffect(() => {
        setColWidths(loadColWidths());
    }, []);

    useEffect(() => {
        function handleOutsideClick(e: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(e.target as Node))
                setFilterOpen(false);
            if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
        }
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const handleSearch = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            onFiltersChange({ search: searchValue || undefined, page: 1 });
        },
        [searchValue, onFiltersChange],
    );

    const removeStatusFilter = () => onFiltersChange({ status: undefined, page: 1 });
    const removePriorityFilter = () => onFiltersChange({ priority: undefined, page: 1 });

    const currentSortLabel =
        SORT_OPTIONS.find((o) => o.value === (filters.sortBy ?? "createdAt"))?.label ?? "Created";
    const sortOrder = filters.sortOrder ?? "Desc";

    function handleSortField(value: string) {
        onFiltersChange({ sortBy: value, page: 1 });
        setSortOpen(false);
    }

    function toggleSortOrder() {
        onFiltersChange({ sortOrder: sortOrder === "Desc" ? "Asc" : "Desc", page: 1 });
    }

    function handleColumnSort(sortKey: string) {
        const currentSortBy = filters.sortBy ?? "createdAt";
        if (currentSortBy === sortKey) {
            onFiltersChange({ sortOrder: sortOrder === "Asc" ? "Desc" : "Asc", page: 1 });
        } else {
            onFiltersChange({ sortBy: sortKey, sortOrder: "Desc", page: 1 });
        }
    }

    function startColResize(colIndex: number, e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();

        let activeWidths = colWidthsRef.current;
        if (!hasManualResize && tableRef.current) {
            const ths = Array.from(tableRef.current.querySelectorAll("thead th")) as HTMLElement[];
            activeWidths = ths.map((th) => th.offsetWidth);
            colWidthsRef.current = activeWidths;
            setColWidths(activeWidths);
            setHasManualResize(true);
        }

        const startX = e.clientX;
        const startW = activeWidths[colIndex];

        function onMove(ev: MouseEvent) {
            const newW = Math.max(50, startW + ev.clientX - startX);
            setColWidths((prev) => {
                const next = [...prev];
                next[colIndex] = newW;
                colWidthsRef.current = next;
                return next;
            });
        }

        function onUp() {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            localStorage.setItem("ticket-col-widths", JSON.stringify(colWidthsRef.current));
        }

        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    }

    return (
        <div className="flex flex-col" style={{ height: `calc(100vh - ${toolbarTop}px - 41px)` }}>
            <div className="relative flex items-center gap-2 px-6 py-3 bg-white border-b border-[#dfe1e6] flex-wrap flex-shrink-0 z-20">
                <button
                    onClick={onCreateClick}
                    className="h-8 px-3 bg-primary hover:bg-primary-dark text-white text-[13px] font-medium rounded transition-colors flex items-center gap-1.5"
                >
                    <svg
                        width="11"
                        height="11"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                    >
                        <path d="M6 1v10M1 6h10" />
                    </svg>
                    Create ticket
                </button>

                <form onSubmit={handleSearch} className="flex">
                    <div className="h-8 flex items-center gap-1.5 px-2.5 bg-white border border-[#dfe1e6] rounded text-[13px] text-[#5e6c84] min-w-[210px]">
                        <svg
                            width="13"
                            height="13"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="#97a0af"
                            strokeWidth="1.6"
                        >
                            <circle cx="6.5" cy="6.5" r="5" />
                            <path d="M10.5 10.5l3.5 3.5" />
                        </svg>
                        <input
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="Search tickets..."
                            className="flex-1 bg-transparent outline-none text-[#172b4d] placeholder:text-[#97a0af]"
                        />
                    </div>
                </form>

                {filters.status !== undefined && (
                    <button
                        onClick={removeStatusFilter}
                        className="h-8 flex items-center gap-1.5 px-2.5 bg-blue-50 text-primary border border-blue-200 rounded text-[12px] font-medium animate-fade-in"
                    >
                        Status: {STATUS_LABELS[filters.status]}{" "}
                        <span className="text-blue-400 text-[11px]">✕</span>
                    </button>
                )}
                {filters.priority && (
                    <button
                        onClick={removePriorityFilter}
                        className="h-8 flex items-center gap-1.5 px-2.5 bg-blue-50 text-primary border border-blue-200 rounded text-[12px] font-medium animate-fade-in"
                    >
                        Priority: {filters.priority}{" "}
                        <span className="text-blue-400 text-[11px]">✕</span>
                    </button>
                )}

                <div ref={filterRef} className="relative">
                    <button
                        onClick={() => {
                            setFilterOpen((o) => !o);
                            setSortOpen(false);
                        }}
                        className="h-8 px-3 bg-white border border-[#dfe1e6] text-[#42526e] text-[13px] font-medium rounded hover:bg-[#f4f5f7] transition-colors flex items-center gap-1.5"
                    >
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                        >
                            <path d="M1 4h14M4 8h8M7 12h2" />
                        </svg>
                        Filter
                        <svg
                            width="10"
                            height="10"
                            viewBox="0 0 10 10"
                            fill="none"
                            className={`transition-transform duration-150 ${filterOpen ? "rotate-180" : ""}`}
                        >
                            <path
                                d="M2 3.5l3 3 3-3"
                                stroke="#42526e"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                fill="none"
                            />
                        </svg>
                    </button>
                    <div
                        className={`absolute top-full left-0 mt-1 w-48 bg-white border border-[#dfe1e6] rounded shadow-lg z-50 transition-all duration-150 origin-top ${filterOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-1 pointer-events-none"}`}
                    >
                        <div className="py-1 text-[12px]">
                            <div className="px-3 py-1.5 text-[11px] font-semibold text-[#5e6c84] uppercase tracking-wide">
                                Status
                            </div>
                            {Object.entries(STATUS_LABELS).map(([val, label]) => (
                                <button
                                    key={val}
                                    onClick={() => {
                                        onFiltersChange({
                                            status: Number(val) as TicketStatus,
                                            page: 1,
                                        });
                                        setFilterOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-[#f4f5f7] text-[#172b4d] transition-colors"
                                >
                                    {label}
                                </button>
                            ))}
                            <div className="border-t border-[#f4f5f7] my-1" />
                            <div className="px-3 py-1.5 text-[11px] font-semibold text-[#5e6c84] uppercase tracking-wide">
                                Priority
                            </div>
                            {Object.values(TicketPriority).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => {
                                        onFiltersChange({ priority: p, page: 1 });
                                        setFilterOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-[#f4f5f7] text-[#172b4d] transition-colors"
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="ml-auto flex items-center gap-1.5">
                    <div ref={sortRef} className="relative">
                        <button
                            onClick={() => {
                                setSortOpen((o) => !o);
                                setFilterOpen(false);
                            }}
                            className="h-8 px-3 bg-white border border-[#dfe1e6] text-[#42526e] text-[13px] font-medium rounded hover:bg-[#f4f5f7] transition-colors flex items-center gap-1.5"
                        >
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                            >
                                <path d="M2 5h12M4 8h8M6 11h4" />
                            </svg>
                            Sort: {currentSortLabel}
                            <svg
                                width="10"
                                height="10"
                                viewBox="0 0 10 10"
                                fill="none"
                                className={`transition-transform duration-150 ${sortOpen ? "rotate-180" : ""}`}
                            >
                                <path
                                    d="M2 3.5l3 3 3-3"
                                    stroke="#42526e"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                            </svg>
                        </button>
                        <div
                            className={`absolute top-full right-0 mt-1 w-44 bg-white border border-[#dfe1e6] rounded shadow-lg z-50 transition-all duration-150 origin-top-right  z-50 ${sortOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-1 pointer-events-none"}`}
                        >
                            <div className="py-1">
                                {SORT_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleSortField(opt.value)}
                                        className={`w-full text-left px-3 py-1.5 text-[13px] transition-colors flex items-center justify-between ${
                                            filters.sortBy === opt.value ||
                                            (!filters.sortBy && opt.value === "createdAt")
                                                ? "text-primary font-medium bg-blue-50"
                                                : "text-[#172b4d] hover:bg-[#f4f5f7]"
                                        }`}
                                    >
                                        {opt.label}
                                        {(filters.sortBy === opt.value ||
                                            (!filters.sortBy && opt.value === "createdAt")) && (
                                            <svg
                                                width="10"
                                                height="10"
                                                viewBox="0 0 10 10"
                                                fill="#0052cc"
                                            >
                                                <path
                                                    d="M1.5 5l2.5 2.5 4.5-4.5"
                                                    stroke="#0052cc"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    fill="none"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={toggleSortOrder}
                        title={
                            sortOrder === "Desc"
                                ? "Descending — click for ascending"
                                : "Ascending — click for descending"
                        }
                        className="h-8 w-8 bg-white border border-[#dfe1e6] text-[#42526e] rounded hover:bg-[#f4f5f7] transition-colors flex items-center justify-center"
                    >
                        {sortOrder === "Desc" ? (
                            <svg
                                width="13"
                                height="13"
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                            >
                                <path d="M4 3v10M4 13l-2.5-2.5M4 13l2.5-2.5M8 5h7M8 8h5M8 11h3" />
                            </svg>
                        ) : (
                            <svg
                                width="13"
                                height="13"
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                            >
                                <path d="M4 13V3M4 3L1.5 5.5M4 3L6.5 5.5M8 11h7M8 8h5M8 5h3" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            <div className="overflow-hidden flex flex-col px-6 py-3.5 min-h-0">
                {loading || !!error ? (
                    <TableSkeleton />
                ) : (
                    <>
                        <div className="flex-1 overflow-auto min-h-0 rounded border border-[#dfe1e6]">
                            <table
                                ref={tableRef}
                                className="bg-white border-separate border-spacing-0 table-fixed w-full"
                                style={{
                                    minWidth: colWidths
                                        .filter((_, i) => {
                                            if (i === COLUMNS.length - 1) return false;
                                            if (!hasManualResize && i === 1) return false;
                                            return true;
                                        })
                                        .reduce((a, b) => a + b, 0),
                                }}
                            >
                                <colgroup>
                                    {colWidths.map((w, i) => (
                                        <col
                                            key={i}
                                            style={
                                                i === COLUMNS.length - 1
                                                    ? {}
                                                    : !hasManualResize && i === 1
                                                      ? {}
                                                      : { width: w }
                                            }
                                        />
                                    ))}
                                </colgroup>
                                <thead>
                                    <tr>
                                        {COLUMNS.map((col, i) => {
                                            const sortKey = COLUMN_SORT_KEYS[i];
                                            const currentSortBy = filters.sortBy ?? "createdAt";
                                            const isActive =
                                                sortKey !== null && currentSortBy === sortKey;
                                            return (
                                                <th
                                                    key={i}
                                                    onClick={
                                                        sortKey
                                                            ? () => handleColumnSort(sortKey)
                                                            : undefined
                                                    }
                                                    className={`sticky top-0 z-10 h-9 px-3 bg-[#f4f5f7] text-left text-[11px] font-semibold text-[#5e6c84] uppercase tracking-[0.07em] border-b border-[#dfe1e6] whitespace-nowrap align-middle relative select-none ${sortKey ? "cursor-pointer hover:bg-[#ebecf0]" : ""} ${isActive ? "text-primary" : ""}`}
                                                >
                                                    <span className="flex items-center gap-1">
                                                        {col}
                                                        {sortKey && (
                                                            <svg
                                                                width="10"
                                                                height="10"
                                                                viewBox="0 0 10 14"
                                                                fill="none"
                                                                className={
                                                                    isActive
                                                                        ? "opacity-100"
                                                                        : "opacity-30"
                                                                }
                                                            >
                                                                {isActive && sortOrder === "Asc" ? (
                                                                    <path
                                                                        d="M5 1L1 6h8L5 1z"
                                                                        fill={
                                                                            isActive
                                                                                ? "#0052cc"
                                                                                : "#5e6c84"
                                                                        }
                                                                    />
                                                                ) : isActive &&
                                                                  sortOrder === "Desc" ? (
                                                                    <path
                                                                        d="M5 13L1 8h8L5 13z"
                                                                        fill="#0052cc"
                                                                    />
                                                                ) : (
                                                                    <>
                                                                        <path
                                                                            d="M5 1L1 5h8L5 1z"
                                                                            fill="#5e6c84"
                                                                        />
                                                                        <path
                                                                            d="M5 13L1 9h8L5 13z"
                                                                            fill="#5e6c84"
                                                                        />
                                                                    </>
                                                                )}
                                                            </svg>
                                                        )}
                                                    </span>
                                                    {i < COLUMNS.length - 1 && (
                                                        <div
                                                            onMouseDown={(e) =>
                                                                startColResize(i, e)
                                                            }
                                                            className="absolute top-0 right-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center group"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <div className="w-px h-4 bg-[#dfe1e6] group-hover:bg-primary/50 group-hover:w-0.5 transition-all" />
                                                        </div>
                                                    )}
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="h-32 text-center text-[13px] text-[#5e6c84]"
                                            >
                                                No tickets found
                                            </td>
                                        </tr>
                                    ) : (
                                        tickets.map((t) => (
                                            <TicketTableRow
                                                key={t.id}
                                                ticket={t}
                                                selected={selectedId === t.id}
                                                onClick={() => onSelect(t)}
                                            />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {total > pageSize && (
                            <div className="flex items-center justify-between mt-3 px-1 flex-shrink-0">
                                <span className="text-[12px] text-[#5e6c84]">
                                    Showing {(page - 1) * pageSize + 1}–
                                    {Math.min(page * pageSize, total)} of {total} tickets
                                </span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => onFiltersChange({ page: page - 1 })}
                                        disabled={page <= 1}
                                        className="w-7 h-7 rounded border border-[#dfe1e6] bg-white text-[#97a0af] text-[12px] flex items-center justify-center disabled:opacity-40 hover:bg-[#f4f5f7] transition-colors"
                                    >
                                        ←
                                    </button>
                                    {Array.from(
                                        { length: Math.min(totalPages, 5) },
                                        (_, i) => i + 1,
                                    ).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => onFiltersChange({ page: p })}
                                            className={`w-7 h-7 rounded border text-[12px] font-medium flex items-center justify-center transition-colors ${
                                                p === page
                                                    ? "bg-primary-light border-blue-300 text-primary font-semibold"
                                                    : "border-[#dfe1e6] bg-white text-[#42526e] hover:bg-[#f4f5f7]"
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => onFiltersChange({ page: page + 1 })}
                                        disabled={page >= totalPages}
                                        className="w-7 h-7 rounded border border-[#dfe1e6] bg-white text-[#97a0af] text-[12px] flex items-center justify-center disabled:opacity-40 hover:bg-[#f4f5f7] transition-colors"
                                    >
                                        →
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
