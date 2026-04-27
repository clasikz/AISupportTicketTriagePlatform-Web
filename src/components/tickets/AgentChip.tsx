import { AGENT_COLORS, AgentOption } from "@/lib/utils";

export default function AgentChip({ agent }: { agent: string | null }) {
  if (!agent) return <span className="text-[12px] text-gray-400">Unassigned</span>;

  const colors = AGENT_COLORS[agent as AgentOption] ?? {
    bg: "bg-gray-400",
    text: "text-white",
    initials: agent.slice(0, 2).toUpperCase(),
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${colors.bg} ${colors.text}`}>
        {colors.initials}
      </div>
      <span className="text-[12px] text-[#172b4d]">{agent}</span>
    </div>
  );
}
