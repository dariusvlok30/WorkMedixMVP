"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search, X, ChevronRight, ChevronLeft, FileText,
  Clock, CheckCircle2, XCircle, Circle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Booking, BookingStatus } from "@/types";

const STATUS_CONFIG: Record<BookingStatus, { label: string; dot: string; text: string; icon: React.ElementType }> = {
  pending:   { label: "Pending",   dot: "bg-amber-400",  text: "text-amber-700",  icon: Clock         },
  confirmed: { label: "Confirmed", dot: "bg-blue-500",   text: "text-blue-700",   icon: Circle        },
  completed: { label: "Completed", dot: "bg-green-500",  text: "text-green-700",  icon: CheckCircle2  },
  cancelled: { label: "Cancelled", dot: "bg-red-400",    text: "text-red-600",    icon: XCircle       },
};

interface Props {
  bookings: Booking[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
}

export default function BookingsMasterList({ bookings, total, page, totalPages, pageSize }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  // Debounce search → update URL
  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams(searchParams.toString());
      if (search.trim()) { p.set("search", search.trim()); } else { p.delete("search"); }
      p.delete("page");
      router.push(`${pathname}?${p.toString()}`);
    }, 350);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Sync search state when URL changes externally (e.g. stats card click)
  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
  }, [searchParams]);

  function setParam(key: string, value: string | null) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) { p.set(key, value); } else { p.delete(key); }
    p.delete("page");
    router.push(`${pathname}?${p.toString()}`);
  }

  function clearFilters() {
    setSearch("");
    router.push(pathname);
  }

  function pageHref(n: number) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("page", String(n));
    return `${pathname}?${p.toString()}`;
  }

  const from    = searchParams.get("from") ?? "";
  const to      = searchParams.get("to")   ?? "";
  const hasFilters = !!(searchParams.get("search") || searchParams.get("status") || from || to);
  const offset  = (page - 1) * pageSize;

  return (
    <div className="space-y-3">
      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-[280px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#bbb] pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, contact, email..."
            className="w-full h-8 pl-8 pr-3 text-[13px] border border-[#e5e5e5] rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-black/20 placeholder:text-[#bbb]"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[#aaa] shrink-0">From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setParam("from", e.target.value || null)}
            className="h-8 px-2.5 text-[12px] border border-[#e5e5e5] rounded-md bg-white text-[#555] focus:outline-none focus:ring-1 focus:ring-black/20 w-[130px]"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[#aaa] shrink-0">To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setParam("to", e.target.value || null)}
            className="h-8 px-2.5 text-[12px] border border-[#e5e5e5] rounded-md bg-white text-[#555] focus:outline-none focus:ring-1 focus:ring-black/20 w-[130px]"
          />
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="h-8 px-3 text-[12px] text-[#888] hover:text-black border border-[#e5e5e5] rounded-md flex items-center gap-1.5 bg-white transition-colors"
          >
            <X className="w-3 h-3" /> Clear filters
          </button>
        )}

        <span className="ml-auto text-[12px] text-[#aaa] shrink-0">
          {total} result{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
        {bookings.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[14px] font-medium text-black">No bookings found</p>
            <p className="text-[13px] text-[#888] mt-1">Try adjusting your filters.</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-4 h-8 px-4 text-[13px] border border-[#e5e5e5] rounded-md bg-white hover:bg-[#f5f5f5] transition-colors">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f0f0] bg-[#fafafa]">
                <th className="text-left px-4 py-2.5 text-[10.5px] font-semibold text-[#999] uppercase tracking-wider">Company</th>
                <th className="text-left px-4 py-2.5 text-[10.5px] font-semibold text-[#999] uppercase tracking-wider hidden sm:table-cell">Contact</th>
                <th className="text-left px-4 py-2.5 text-[10.5px] font-semibold text-[#999] uppercase tracking-wider hidden md:table-cell">Screening</th>
                <th className="text-left px-4 py-2.5 text-[10.5px] font-semibold text-[#999] uppercase tracking-wider hidden lg:table-cell">Pref. Date</th>
                <th className="text-left px-4 py-2.5 text-[10.5px] font-semibold text-[#999] uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-2.5 text-[10.5px] font-semibold text-[#999] uppercase tracking-wider hidden sm:table-cell">Docs</th>
                <th className="w-10 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f5]">
              {bookings.map((b) => {
                const cfg = STATUS_CONFIG[b.status as BookingStatus];
                return (
                  <tr
                    key={b.id}
                    onClick={() => router.push(`/bookings/${b.id}`)}
                    className="hover:bg-[#fafafa] transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-black truncate max-w-[200px] group-hover:text-black">
                        {b.company_name}
                      </p>
                      <p className="text-[11px] text-[#bbb] mt-0.5">{formatDate(b.created_at)}</p>
                    </td>

                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-[13px] text-[#555] truncate max-w-[150px]">{b.contact_person}</p>
                      <p className="text-[11px] text-[#bbb] truncate max-w-[150px]">{b.email}</p>
                    </td>

                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-[13px] text-[#555]">{b.screening_type}</p>
                    </td>

                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-[13px] text-[#555]">
                        {b.preferred_dates?.[0] ? formatDate(b.preferred_dates[0]) : <span className="text-[#ccc]">—</span>}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${cfg?.dot ?? "bg-gray-300"}`} />
                        <span className={`text-[12px] font-medium ${cfg?.text ?? "text-gray-600"}`}>
                          {cfg?.label ?? b.status}
                        </span>
                      </span>
                    </td>

                    <td className="px-4 py-3 hidden sm:table-cell">
                      {(b.documents?.length ?? 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[12px] text-[#777]">
                          <FileText className="w-3.5 h-3.5 text-[#bbb]" />
                          {b.documents!.length}
                        </span>
                      ) : (
                        <span className="text-[12px] text-[#ddd]">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <ChevronRight className="w-4 h-4 text-[#ccc] group-hover:text-[#888] transition-colors" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-0.5">
          <p className="text-[12px] text-[#888]">
            Showing {offset + 1}–{Math.min(offset + pageSize, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Link
              href={page > 1 ? pageHref(page - 1) : "#"}
              aria-disabled={page <= 1}
              className={`h-7 px-2.5 flex items-center gap-1 text-[12px] rounded border border-[#e5e5e5] bg-white transition-colors
                ${page <= 1 ? "opacity-40 pointer-events-none text-[#aaa]" : "text-[#555] hover:bg-[#f5f5f5]"}`}
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </Link>
            <span className="px-3 text-[12px] text-[#666]">
              {page} / {totalPages}
            </span>
            <Link
              href={page < totalPages ? pageHref(page + 1) : "#"}
              aria-disabled={page >= totalPages}
              className={`h-7 px-2.5 flex items-center gap-1 text-[12px] rounded border border-[#e5e5e5] bg-white transition-colors
                ${page >= totalPages ? "opacity-40 pointer-events-none text-[#aaa]" : "text-[#555] hover:bg-[#f5f5f5]"}`}
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
