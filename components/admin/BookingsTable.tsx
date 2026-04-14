"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { formatDate } from "@/lib/utils";
import type { Booking, BookingStatus } from "@/types";
import { Search, ChevronRight, Users } from "lucide-react";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function BookingsTable({ bookings }: { bookings: Booking[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const activeStatus = searchParams.get("status") ?? "all";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function handleSearch(val: string) {
    setSearch(val);
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set("search", val);
    else params.delete("search");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#aaa]" />
          <input
            className="w-full pl-8 pr-3 h-8 text-[13px] border border-[#e5e5e5] rounded-md bg-white placeholder:text-[#aaa] focus:outline-none focus:ring-1 focus:ring-black/20"
            placeholder="Search company, contact, email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 bg-white border border-[#e5e5e5] rounded-md px-1 h-8">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => updateParam("status", f.value)}
              className={`px-2.5 py-0.5 rounded text-[12px] transition-colors ${
                activeStatus === f.value
                  ? "bg-black text-white font-medium"
                  : "text-[#666] hover:text-black"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-[#e5e5e5] overflow-hidden">
        {bookings.length === 0 ? (
          <div className="text-center py-12 text-[#888]">
            <p className="text-[13px] font-medium">No bookings found</p>
            <p className="text-[12px] mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#e5e5e5]">
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[#888] uppercase tracking-wide">Company</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[#888] uppercase tracking-wide hidden sm:table-cell">Screening</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[#888] uppercase tracking-wide hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[#888] uppercase tracking-wide hidden lg:table-cell">Employees</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[#888] uppercase tracking-wide">Status</th>
                <th className="px-4 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => (
                <tr
                  key={b.id}
                  className={`border-b border-[#f0f0f0] last:border-0 hover:bg-[#fafafa] cursor-pointer transition-colors ${i % 2 === 0 ? "" : ""}`}
                  onClick={() => router.push(`/bookings/${b.id}`)}
                >
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-black">{b.company_name}</p>
                    <p className="text-[12px] text-[#888]">{b.contact_person}</p>
                  </td>
                  <td className="px-4 py-2.5 text-[#555] hidden sm:table-cell">{b.screening_type}</td>
                  <td className="px-4 py-2.5 text-[#555] hidden md:table-cell">{formatDate(b.preferred_dates[0])}</td>
                  <td className="px-4 py-2.5 hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1 text-[#555]">
                      <Users className="w-3 h-3" />{b.employee_count}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={b.status as BookingStatus} />
                  </td>
                  <td className="px-4 py-2.5">
                    <Link href={`/bookings/${b.id}`} onClick={(e) => e.stopPropagation()}>
                      <ChevronRight className="w-3.5 h-3.5 text-[#bbb] hover:text-black" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
