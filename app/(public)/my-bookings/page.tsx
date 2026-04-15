import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import MyBookingsList from "@/components/user/MyBookingsList";
import type { Booking } from "@/types";

export const metadata = { title: "My Bookings — WorkMedix" };

async function getUserBookings(token: string): Promise<Booking[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/user/bookings`, {
    headers: { Cookie: `__session=${token}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function MyBookingsPage() {
  const { userId, getToken } = await auth();
  if (!userId) redirect("/");

  // Fetch directly via admin client to avoid cookie-forwarding complexity
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("bookings")
    .select("*, documents(*)")
    .eq("clerk_user_id", userId)
    .order("created_at", { ascending: false });

  const bookings: Booking[] = data ?? [];

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-black">My Bookings</h1>
          <p className="text-[13px] text-[#888] mt-0.5">View and manage your screening requests.</p>
        </div>
        <MyBookingsList bookings={bookings} />
      </div>
    </div>
  );
}
