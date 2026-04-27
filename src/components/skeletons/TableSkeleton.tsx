function Skel({ className, style }: { className: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded ${className}`}
      style={style}
    />
  );
}

const ROW_WIDTHS = [
  { title: "72%", meta: "38%" },
  { title: "85%", meta: "32%" },
  { title: "60%", meta: "44%" },
  { title: "78%", meta: "30%" },
  { title: "66%", meta: "40%" },
  { title: "55%", meta: "42%" },
];

export default function TableSkeleton() {
  return (
    <table className="w-full bg-white border border-[#dfe1e6] rounded border-separate border-spacing-0 overflow-hidden">
      <thead>
        <tr>
          {["84px", undefined, "130px", "88px", "110px", "132px", "112px", "72px"].map(
            (w, i) => (
              <th
                key={i}
                style={{ width: w }}
                className="h-9 px-3 bg-[#f4f5f7] text-left border-b border-[#dfe1e6]"
              >
                <Skel className="h-2.5 w-3/4" />
              </th>
            )
          )}
        </tr>
      </thead>
      <tbody>
        {ROW_WIDTHS.map((widths, i) => (
          <tr key={i} className={i < ROW_WIDTHS.length - 1 ? "border-b border-[#f4f5f7]" : ""}>
            <td className="h-[52px] px-3">
              <Skel className="w-13 h-3" />
            </td>
            <td className="h-[52px] px-3">
              <Skel className={`h-3 mb-1.5`} style={{ width: widths.title } as React.CSSProperties} />
              <Skel className="h-2.5" style={{ width: widths.meta } as React.CSSProperties} />
            </td>
            <td className="h-[52px] px-3">
              <Skel className="w-20 h-5 rounded" />
            </td>
            <td className="h-[52px] px-3">
              <Skel className="w-14 h-5 rounded" />
            </td>
            <td className="h-[52px] px-3">
              <Skel className="w-16 h-5 rounded" />
            </td>
            <td className="h-[52px] px-3">
              <div className="flex items-center gap-1.5">
                <Skel className="w-[22px] h-[22px] rounded-full flex-shrink-0" />
                <Skel className="w-20 h-3" />
              </div>
            </td>
            <td className="h-[52px] px-3">
              <Skel className="w-20 h-3" />
            </td>
            <td className="h-[52px] px-3 text-center">
              <Skel className="w-11 h-5 rounded-full mx-auto" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
