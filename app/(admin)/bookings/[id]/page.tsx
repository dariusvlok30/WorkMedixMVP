import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import BookingDetailView from "@/components/admin/BookingDetailView";
import { ArrowLeft } from "lucide-react";
import type { Booking } from "@/types";

export const dynamic = "force-dynamic";

async function getBooking(id: string): Promise<Booking | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, documents(*)")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as Booking;
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await getBooking(id);

  if (!booking) notFound();

  return (
    <div className="space-y-4 animate-fade-in max-w-4xl">
      <Link
        href="/bookings"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Bookings
      </Link>
      <BookingDetailView booking={booking} />
    </div>
  );
}
