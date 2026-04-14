import type { DashboardStats } from "@/types";

interface Props { stats: DashboardStats; }

const cards = (s: DashboardStats) => [
  { label: "Total", value: s.total },
  { label: "Pending", value: s.pending, accent: "text-amber-600" },
  { label: "Confirmed", value: s.confirmed, accent: "text-blue-600" },
  { label: "Completed", value: s.completed, accent: "text-green-600" },
  { label: "This Week", value: s.thisWeek },
  { label: "Cancelled", value: s.cancelled, accent: "text-red-500" },
];

export default function StatsCards({ stats }: Props) {
  return (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
      {cards(stats).map((c) => (
        <div key={c.label} className="bg-white rounded-lg border border-[#e5e5e5] px-4 py-3.5">
          <p className={`text-xl font-semibold tabular-nums ${c.accent ?? "text-black"}`}>
            {c.value}
          </p>
          <p className="text-[12px] text-[#888] mt-0.5">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
