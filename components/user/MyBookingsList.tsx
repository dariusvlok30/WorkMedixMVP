"use client";

import Link from "next/link";
import { ChevronRight, FileText, CalendarDays, ClipboardList } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Booking, BookingStatus } from "@/types";

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLES[status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default function MyBookingsList({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#e5e5e5] flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-10 h-10 bg-[#f5f5f5] rounded-full flex items-center justify-center mb-3">
          <ClipboardList className="w-5 h-5 text-[#bbb]" />
        </div>
        <p className="text-[14px] font-semibold text-black">No bookings yet</p>
        <p className="text-[13px] text-[#888] mt-1">Submit your first screening request to get started.</p>
        <Link
          href="/book"
          className="mt-5 h-8 px-4 text-[13px] font-medium bg-black text-white rounded-md hover:bg-[#222] transition-colors inline-flex items-center"
        >
          Book a Screening
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
      {/* Desktop table */}
      <table className="w-full hidden sm:table">
        <thead>
          <tr className="border-b border-[#f0f0f0]">
            <th className="text-left px-5 py-3 text-[11px] font-medium text-[#888] uppercase tracking-wide">Company</th>
            <th className="text-left px-5 py-3 text-[11px] font-medium text-[#888] uppercase tracking-wide">Screening</th>
            <th className="text-left px-5 py-3 text-[11px] font-medium text-[#888] uppercase tracking-wide">Date</th>
            <th className="text-left px-5 py-3 text-[11px] font-medium text-[#888] uppercase tracking-wide">Status</th>
            <th className="text-left px-5 py-3 text-[11px] font-medium text-[#888] uppercase tracking-wide">Docs</th>
            <th className="px-5 py-3 w-8" />
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} className="border-b border-[#f9f9f9] last:border-0 hover:bg-[#fafafa] transition-colors">
              <td className="px-5 py-3.5">
                <p className="text-[13px] font-medium text-black">{b.company_name}</p>
                <p className="text-[12px] text-[#888]">Submitted {formatDate(b.created_at)}</p>
              </td>
              <td className="px-5 py-3.5 text-[13px] text-[#555]">{b.screening_type}</td>
              <td className="px-5 py-3.5 text-[13px] text-[#555]">
                {b.preferred_dates?.[0] ? formatDate(b.preferred_dates[0]) : "—"}
              </td>
              <td className="px-5 py-3.5">
                <StatusBadge status={b.status as BookingStatus} />
              </td>
              <td className="px-5 py-3.5">
                <span className="inline-flex items-center gap-1 text-[12px] text-[#888]">
                  <FileText className="w-3.5 h-3.5" />
                  {b.documents?.length ?? 0}
                </span>
              </td>
              <td className="px-5 py-3.5">
                <Link href={`/my-bookings/${b.id}`}>
                  <ChevronRight className="w-4 h-4 text-[#bbb] hover:text-black transition-colors" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-[#f0f0f0]">
        {bookings.map((b) => (
          <Link key={b.id} href={`/my-bookings/${b.id}`} className="flex items-start justify-between p-4 hover:bg-[#fafafa] transition-colors">
            <div className="space-y-1.5 min-w-0">
              <p className="text-[13px] font-semibold text-black truncate">{b.company_name}</p>
              <p className="text-[12px] text-[#666]">{b.screening_type}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={b.status as BookingStatus} />
                {b.preferred_dates?.[0] && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#888]">
                    <CalendarDays className="w-3 h-3" />
                    {formatDate(b.preferred_dates[0])}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#bbb] flex-shrink-0 mt-1" />
          </Link>
        ))}
      </div>
    </div>
  );
}
