interface Props {
    label: string;
    value: number;
    sub?: string;
    valueColor?: string;
    icon?: React.ReactNode;
    iconBg?: string;
}

export default function StatCard({ label, value, sub, valueColor, icon, iconBg }: Props) {
    return (
        <div className="bg-white border border-[#dfe1e6] rounded px-6 py-4">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#5e6c84] uppercase tracking-[0.07em]">
                    {label}
                </span>
                {icon && (
                    <div
                        className={`w-10 h-10 rounded flex items-center border justify-center ${iconBg ?? "bg-gray-100"}`}
                    >
                        {icon}
                    </div>
                )}
            </div>
            <div
                className={`text-[26px] font-semibold leading-none ${valueColor ?? "text-[#172b4d]"}`}
            >
                {value}
            </div>
            {sub && <div className="text-[11px] text-[#5e6c84] mt-1.5">{sub}</div>}
        </div>
    );
}
