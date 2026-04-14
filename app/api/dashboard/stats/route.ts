import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { addDays, startOfDay, endOfDay } from "date-fns";

// GET /api/dashboard/stats
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, status, created_at, preferred_dates");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = new Date();
  const weekStart = startOfDay(now).toISOString();
  const weekEnd = endOfDay(addDays(now, 7)).toISOString();

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    thisWeek: bookings.filter((b) => {
      const dates = b.preferred_dates as string[];
      return dates.some((d) => d >= weekStart && d <= weekEnd);
    }).length,
  };

  return NextResponse.json(stats);
}
