import { AGENT_COLORS, AGENT_DISPLAY_NAMES, getHumanColor } from "@/lib/utils";

interface Props {
  agent: string | null;
  resolveUserName?: (id: string) => string;
}

export default function AgentChip({ agent, resolveUserName }: Props) {
  if (!agent) return <span className="text-[12px] text-gray-400">Unassigned</span>;

  const aiColors = AGENT_COLORS[agent];

  if (aiColors) {
    const label = AGENT_DISPLAY_NAMES[agent] ?? agent;
    return (
      <div className="inline-flex items-center gap-1.5">
        <div
          className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
          style={{ backgroundColor: aiColors.backgroundColor, color: aiColors.color }}
        >
          {aiColors.initials}
        </div>
        <span className="text-[12px] text-[#172b4d]">{label}</span>
      </div>
    );
  }

  const name = resolveUserName ? resolveUserName(agent) : agent;
  const parts = name.trim().split(" ");
  const initials = parts.length >= 2
    ? `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`
    : name.slice(0, 2);
  const humanStyle = getHumanColor(agent);
  return (
    <div className="inline-flex items-center gap-1.5">
      <div style={humanStyle} className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0">
        {initials.toUpperCase()}
      </div>
      <span className="text-[12px] text-[#172b4d]">{name}</span>
    </div>
  );
}
