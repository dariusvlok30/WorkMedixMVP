"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { LayoutList, Clock, CircleCheck, CheckCircle2, XCircle, CalendarDays } from "lucide-react";
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
      icon: LayoutList,
      iconActiveClass: "text-white/70",
      iconIdleClass: "text-[#aaa]",
      activeClass: "bg-black border-black",
      numberActive: "text-white",
      labelActive: "text-white/60",
      numberIdle: "text-black",
      isActive: activeStatus === null,
    },
    {
      label: "Pending",
      value: stats.pending,
      status: "pending",
      icon: Clock,
      iconActiveClass: "text-amber-500",
      iconIdleClass: "text-amber-300",
      activeClass: "bg-amber-50 border-amber-300",
      numberActive: "text-amber-700",
      labelActive: "text-amber-500",
      numberIdle: "text-amber-600",
      isActive: activeStatus === "pending",
    },
    {
      label: "Confirmed",
      value: stats.confirmed,
      status: "confirmed",
      icon: CircleCheck,
      iconActiveClass: "text-blue-500",
      iconIdleClass: "text-blue-300",
      activeClass: "bg-blue-50 border-blue-300",
      numberActive: "text-blue-700",
      labelActive: "text-blue-500",
      numberIdle: "text-blue-600",
      isActive: activeStatus === "confirmed",
    },
    {
      label: "Completed",
      value: stats.completed,
      status: "completed",
      icon: CheckCircle2,
      iconActiveClass: "text-green-500",
      iconIdleClass: "text-green-300",
      activeClass: "bg-green-50 border-green-300",
      numberActive: "text-green-700",
      labelActive: "text-green-500",
      numberIdle: "text-green-600",
      isActive: activeStatus === "completed",
    },
    {
      label: "Cancelled",
      value: stats.cancelled,
      status: "cancelled",
      icon: XCircle,
      iconActiveClass: "text-red-400",
      iconIdleClass: "text-red-300",
      activeClass: "bg-red-50 border-red-300",
      numberActive: "text-red-600",
      labelActive: "text-red-400",
      numberIdle: "text-red-500",
      isActive: activeStatus === "cancelled",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Link
            key={c.label}
            href={statusHref(c.status)}
            className={`rounded-xl border px-4 py-3.5 transition-all select-none block group
              ${c.isActive
                ? `${c.activeClass} ring-1 ring-inset ring-black/5`
                : "bg-white border-[#e5e5e5] hover:border-[#ccc] hover:shadow-sm cursor-pointer"
              }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className={`w-4 h-4 transition-colors ${c.isActive ? c.iconActiveClass : c.iconIdleClass}`} />
              {!c.isActive && (
                <span className="text-[9px] font-medium text-[#ccc] group-hover:text-[#aaa] uppercase tracking-wider transition-colors">
                  filter
                </span>
              )}
              {c.isActive && (
                <span className={`text-[9px] font-semibold uppercase tracking-wider ${c.labelActive}`}>
                  active
                </span>
              )}
            </div>
            <p className={`text-[22px] font-bold tabular-nums leading-none ${c.isActive ? c.numberActive : c.numberIdle}`}>
              {c.value}
            </p>
            <p className={`text-[11px] mt-1 font-medium ${c.isActive ? c.labelActive : "text-[#888]"}`}>
              {c.label}
            </p>
          </Link>
        );
      })}

      {/* This Week — display only, not a filter */}
      <div className="rounded-xl border border-[#e5e5e5] bg-white px-4 py-3.5 select-none">
        <div className="flex items-center justify-between mb-2">
          <CalendarDays className="w-4 h-4 text-[#ccc]" />
          <span className="text-[9px] text-[#ddd] uppercase tracking-wider">info</span>
        </div>
        <p className="text-[22px] font-bold tabular-nums leading-none text-black">{stats.thisWeek}</p>
        <p className="text-[11px] mt-1 font-medium text-[#888]">This Week</p>
      </div>
    </div>
  );
}
