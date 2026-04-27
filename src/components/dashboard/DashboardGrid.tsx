"use client";

import { DashboardStats } from "@/types";
import StatCard from "./StatCard";
import StatCardSkeleton from "@/components/skeletons/StatCardSkeleton";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
} from "recharts";

interface Props {
    stats: DashboardStats | null;
    loading: boolean;
}

const CHART_COLORS = {
    open: "#0052cc",
    inProgress: "#00875a",
    resolved: "#36b37e",
    other: "#dfe1e6",
    critical: "#bf2600",
    high: "#f4820a",
    lower: "#dfe1e6",
    technical: "#5e35b1",
    support: "#0077b6",
    billing: "#c2410c",
    general: "#97a0af",
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white border border-[#dfe1e6] rounded p-4">
            <div className="text-[12px] font-semibold text-[#5e6c84] uppercase tracking-[0.06em] mb-4">
                {title}
            </div>
            {children}
        </div>
    );
}

function CustomTooltip({
    active,
    payload,
}: {
    active?: boolean;
    payload?: { name: string; value: number }[];
}) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-[#dfe1e6] rounded shadow px-3 py-2 text-[12px] text-[#172b4d]">
            <span className="font-semibold">{payload[0].name}</span>: {payload[0].value}
        </div>
    );
}

export default function DashboardGrid({ stats, loading }: Props) {
    if (loading) {
        return (
            <div className="px-6 py-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <StatCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const other = Math.max(0, stats.total - stats.open - stats.inProgress - stats.resolved);
    const lowerPriority = Math.max(0, stats.total - stats.critical - stats.high);
    const generalOther = Math.max(0, stats.total - stats.tech - stats.support - stats.billing);

    const statusData = [
        { name: "Open", value: stats.open, color: CHART_COLORS.open },
        { name: "In Progress", value: stats.inProgress, color: CHART_COLORS.inProgress },
        { name: "Resolved", value: stats.resolved, color: CHART_COLORS.resolved },
        { name: "Other", value: other, color: CHART_COLORS.other },
    ].filter((d) => d.value > 0);

    const priorityData = [
        { name: "Critical", value: stats.critical, fill: CHART_COLORS.critical },
        { name: "High", value: stats.high, fill: CHART_COLORS.high },
        { name: "Other", value: lowerPriority, fill: CHART_COLORS.lower },
    ];

    const categoryData = [
        { name: "Technical", value: stats.tech, fill: CHART_COLORS.technical },
        { name: "Support", value: stats.support, fill: CHART_COLORS.support },
        { name: "Billing", value: stats.billing, fill: CHART_COLORS.billing },
        { name: "Other", value: generalOther, fill: CHART_COLORS.general },
    ].filter((d) => d.value >= 0);

    const blueGrid = (
        <svg width="24" height="24" viewBox="0 0 16 16" fill="#0052cc">
            <rect x="1" y="1" width="6" height="6" rx="1" />
            <rect x="9" y="1" width="6" height="6" rx="1" />
            <rect x="1" y="9" width="6" height="6" rx="1" />
            <rect x="9" y="9" width="6" height="6" rx="1" />
        </svg>
    );
    const greenCheck = (
        <svg width="24" height="24" viewBox="0 0 16 16" fill="#006644">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.28 5.28l-4 4a.75.75 0 01-1.06 0l-2-2a.75.75 0 011.06-1.06L6.75 8.69l3.47-3.47a.75.75 0 011.06 1.06z" />
        </svg>
    );
    const greenBar = (
        <svg width="24" height="24" viewBox="0 0 16 16" fill="#006644">
            <rect x="1" y="8" width="3" height="7" rx="1" />
            <rect x="6" y="5" width="3" height="10" rx="1" />
            <rect x="11" y="2" width="3" height="13" rx="1" />
        </svg>
    );
    const redAlert = (
        <svg width="24" height="24" viewBox="0 0 16 16" fill="#bf2600">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v4a.75.75 0 01-1.5 0v-4A.75.75 0 018 4zm0 8a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
    );
    const orangeAlert = (
        <svg width="24" height="24" viewBox="0 0 16 16" fill="#974f0c">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v4a.75.75 0 01-1.5 0v-4A.75.75 0 018 4zm0 8a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
    );

    return (
        <div className="px-6 pt-4 pb-8 space-y-5">
            <div className="grid grid-cols-5 gap-3">
                <StatCard
                    label="Total"
                    value={stats.total}
                    sub="All tickets"
                    iconBg="bg-blue-50"
                    icon={blueGrid}
                />
                <StatCard
                    label="Open"
                    value={stats.open}
                    sub="Awaiting action"
                    iconBg="bg-blue-50"
                    icon={blueGrid}
                />
                <StatCard
                    label="In Progress"
                    value={stats.inProgress}
                    sub="Being worked on"
                    iconBg="bg-green-50"
                    icon={greenCheck}
                />
                <StatCard
                    label="Resolved"
                    value={stats.resolved}
                    sub="Completed"
                    iconBg="bg-green-50"
                    icon={greenBar}
                    valueColor="text-green-700"
                />
                <StatCard
                    label="Critical"
                    value={stats.critical}
                    sub="Immediate action needed"
                    iconBg="bg-red-50"
                    icon={redAlert}
                    valueColor="text-red-600"
                />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <ChartCard title="Status Breakdown">
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={85}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {statusData.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                iconType="circle"
                                iconSize={8}
                                formatter={(value) => (
                                    <span className="text-[11px] text-[#42526e]">{value}</span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Priority Distribution">
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                            data={priorityData}
                            barSize={32}
                            margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#f4f5f7"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11, fill: "#5e6c84" }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: "#97a0af" }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f4f5f7" }} />
                            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                                {priorityData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Category Breakdown">
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                            data={categoryData}
                            barSize={32}
                            margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#f4f5f7"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11, fill: "#5e6c84" }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: "#97a0af" }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f4f5f7" }} />
                            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                                {categoryData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <StatCard
                    label="High Priority"
                    value={stats.high}
                    sub="High + Critical combined"
                    iconBg="bg-orange-50"
                    icon={orangeAlert}
                />
                <StatCard
                    label="Technical"
                    value={stats.tech}
                    sub="Tech category"
                    iconBg="bg-purple-50"
                    icon={
                        <svg width="24" height="24" viewBox="0 0 16 16" fill="#5e35b1">
                            <path d="M2 2h5.5l6.5 6.5-5.5 5.5L2 7.5V2zm3 2a1 1 0 100 2 1 1 0 000-2z" />
                        </svg>
                    }
                />
                <StatCard
                    label="Billing"
                    value={stats.billing}
                    sub="Billing category"
                    iconBg="bg-orange-50"
                    icon={
                        <svg width="24" height="24" viewBox="0 0 16 16" fill="#c2410c">
                            <path d="M2 2h5.5l6.5 6.5-5.5 5.5L2 7.5V2zm3 2a1 1 0 100 2 1 1 0 000-2z" />
                        </svg>
                    }
                />
            </div>
        </div>
    );
}
