import { createAdminClient } from "@/lib/supabase/admin";
import StatsCards from "@/components/admin/StatsCards";
import UpcomingBookings from "@/components/admin/UpcomingBookings";
import RecentBookings from "@/components/admin/RecentBookings";
import { addDays, startOfDay, endOfDay } from "date-fns";
import type { Booking, DashboardStats } from "@/types";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("bookings")
    .select("id, status, created_at, preferred_dates, company_name, contact_person, screening_type, email, phone, address, employee_count, notes, updated_at")
    .order("created_at", { ascending: false });

  const all = (data ?? []) as Booking[];
  const now = new Date();
  const weekStart = startOfDay(now).toISOString().split("T")[0];
  const weekEnd = endOfDay(addDays(now, 7)).toISOString().split("T")[0];

  const stats: DashboardStats = {
    total: all.length,
    pending: all.filter((b) => b.status === "pending").length,
    confirmed: all.filter((b) => b.status === "confirmed").length,
    completed: all.filter((b) => b.status === "completed").length,
    cancelled: all.filter((b) => b.status === "cancelled").length,
    thisWeek: all.filter((b) => b.preferred_dates.some((d) => d >= weekStart && d <= weekEnd)).length,
  };

  const upcoming = all
    .filter((b) =>
      (b.status === "pending" || b.status === "confirmed") &&
      b.preferred_dates.some((d) => d >= weekStart && d <= weekEnd)
    )
    .slice(0, 6);

  return { stats, upcoming, recent: all.slice(0, 8) };
}

export default async function DashboardPage() {
  const { stats, upcoming, recent } = await getDashboardData();

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-[18px] font-semibold text-black">Dashboard</h1>
        <p className="text-[13px] text-[#888] mt-0.5">Overview of your bookings.</p>
      </div>
      <StatsCards stats={stats} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UpcomingBookings bookings={upcoming} />
        <RecentBookings bookings={recent} />
      </div>
    </div>
  );
}
