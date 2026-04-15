import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { addDays, startOfDay, endOfDay } from "date-fns";
import StatsCards from "@/components/admin/StatsCards";
import BookingsMasterList from "@/components/admin/BookingsMasterList";
import type { Booking, DashboardStats } from "@/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

async function getData(params: Record<string, string>) {
  const supabase = createAdminClient();

  const page   = Math.max(1, parseInt(params.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;
  const status = params.status;
  const search = params.search;
  const from   = params.from;
  const to     = params.to;

  // ── Stats: always unfiltered counts ──────────────────────────────
  const { data: allRows } = await supabase
    .from("bookings")
    .select("id, status, preferred_dates");

  const all = allRows ?? [];
  const now       = new Date();
  const weekStart = startOfDay(now).toISOString().split("T")[0];
  const weekEnd   = endOfDay(addDays(now, 7)).toISOString().split("T")[0];

  const stats: DashboardStats = {
    total:     all.length,
    pending:   all.filter((b) => b.status === "pending").length,
    confirmed: all.filter((b) => b.status === "confirmed").length,
    completed: all.filter((b) => b.status === "completed").length,
    cancelled: all.filter((b) => b.status === "cancelled").length,
    thisWeek:  all.filter((b) =>
      (b.preferred_dates as string[]).some((d) => d >= weekStart && d <= weekEnd)
    ).length,
  };

  // ── Filtered + paginated bookings ────────────────────────────────
  let query = supabase
    .from("bookings")
    .select("*, documents(id, file_name, file_type, file_size)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (status && status !== "all") query = query.eq("status", status);
  if (from) query = query.gte("created_at", from);
  if (to)   query = query.lte("created_at", to + "T23:59:59");
  if (search) {
    query = query.or(
      `company_name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  const { data, count } = await query;
  const total      = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return { stats, bookings: (data ?? []) as Booking[], total, page, totalPages };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const { stats, bookings, total, page, totalPages } = await getData(params);

  const statusLabel = params.status
    ? params.status.charAt(0).toUpperCase() + params.status.slice(1)
    : null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[18px] font-semibold text-black">
          {statusLabel ? `${statusLabel} Bookings` : "Dashboard"}
        </h1>
        <p className="text-[13px] text-[#888] mt-0.5">
          {statusLabel
            ? `Filtered to ${statusLabel.toLowerCase()} — click a card to change.`
            : "Click a status card to filter the list below."}
        </p>
      </div>

      {/* Stats cards — client component needs Suspense for useSearchParams */}
      <Suspense fallback={<div className="h-[76px] rounded-xl bg-[#f5f5f5] animate-pulse" />}>
        <StatsCards stats={stats} />
      </Suspense>

      {/* Master bookings list */}
      <Suspense fallback={<div className="h-64 rounded-xl bg-[#f5f5f5] animate-pulse" />}>
        <BookingsMasterList
          bookings={bookings}
          total={total}
          page={page}
          totalPages={totalPages}
          pageSize={PAGE_SIZE}
        />
      </Suspense>
    </div>
  );
}
