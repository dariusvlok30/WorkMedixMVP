import { createAdminClient } from "@/lib/supabase/admin";
import BookingsTable from "@/components/admin/BookingsTable";
import type { Booking } from "@/types";

export const dynamic = "force-dynamic";

async function getBookings(params: Record<string, string>): Promise<Booking[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("bookings")
    .select("*, documents(id)")
    .order("created_at", { ascending: false });

  if (params.status && params.status !== "all") query = query.eq("status", params.status);
  if (params.search) {
    query = query.or(
      `company_name.ilike.%${params.search}%,contact_person.ilike.%${params.search}%,email.ilike.%${params.search}%`
    );
  }

  const { data } = await query;
  return (data ?? []) as Booking[];
}

export default async function BookingsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const bookings = await getBookings(params);

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-[18px] font-semibold text-black">Bookings</h1>
        <p className="text-[13px] text-[#888] mt-0.5">{bookings.length} booking{bookings.length !== 1 ? "s" : ""}</p>
      </div>
      <BookingsTable bookings={bookings} />
    </div>
  );
}
