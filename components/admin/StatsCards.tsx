"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import type { DashboardStats } from "@/types";

interface Props { stats: DashboardStats; }

export default function StatsCards({ stats }: Props) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeStatus = searchParams.get("status");

  function statusHref(status: string | null) {
    const p = new URLSearchParams(searchParams.toString());
    if (status) { p.set("status", status); } else { p.delete("status"); }
    p.delete("page");
    return `${pathname}?${p.toString()}`;
  }

  const cards = [
    {
      label: "All",
      value: stats.total,
      status: null,
      activeClass: "bg-black text-white border-black",
      numberClass: "text-black",
      isActive: activeStatus === null,
    },
    {
      label: "Pending",
      value: stats.pending,
      status: "pending",
      activeClass: "bg-amber-50 border-amber-300",
      numberClass: "text-amber-600",
      isActive: activeStatus === "pending",
    },
    {
      label: "Confirmed",
      value: stats.confirmed,
      status: "confirmed",
      activeClass: "bg-blue-50 border-blue-300",
      numberClass: "text-blue-600",
      isActive: activeStatus === "confirmed",
    },
    {
      label: "Completed",
      value: stats.completed,
      status: "completed",
      activeClass: "bg-green-50 border-green-300",
      numberClass: "text-green-600",
      isActive: activeStatus === "completed",
    },
    {
      label: "This Week",
      value: stats.thisWeek,
      status: null,
      activeClass: "",
      numberClass: "text-black",
      isActive: false,
      noFilter: true,
    },
    {
      label: "Cancelled",
      value: stats.cancelled,
      status: "cancelled",
      activeClass: "bg-red-50 border-red-300",
      numberClass: "text-red-500",
      isActive: activeStatus === "cancelled",
    },
  ];

  return (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c) => {
        const base = "rounded-xl border px-4 py-3.5 transition-all select-none";
        if (c.noFilter) {
          // This Week — display only, not a filter
          return (
            <div key={c.label} className={`${base} bg-white border-[#e5e5e5]`}>
              <p className="text-xl font-semibold tabular-nums text-black">{c.value}</p>
              <p className="text-[12px] text-[#888] mt-0.5">{c.label}</p>
            </div>
          );
        }
        return (
          <Link
            key={c.label}
            href={statusHref(c.status)}
            className={`${base} block ${
              c.isActive
                ? `${c.activeClass} ring-1 ring-inset ${c.status ? "ring-current/20" : "ring-white/10"}`
                : "bg-white border-[#e5e5e5] hover:border-[#ccc] hover:bg-[#fafafa]"
            }`}
          >
            <p className={`text-xl font-semibold tabular-nums ${c.isActive && !c.status ? "text-white" : c.numberClass}`}>
              {c.value}
            </p>
            <p className={`text-[12px] mt-0.5 ${c.isActive && !c.status ? "text-white/70" : "text-[#888]"}`}>
              {c.label}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
