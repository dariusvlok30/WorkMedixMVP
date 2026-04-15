import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentUser } from "@clerk/nextjs/server";
import MyBookingDetail from "@/components/user/MyBookingDetail";
import type { Booking } from "@/types";

export const metadata = { title: "Booking Detail — WorkMedix" };

export default async function MyBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const { id } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, documents(*)")
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  // Check ownership or admin
  const user = await currentUser();
  const isAdmin = (user?.publicMetadata as { role?: string })?.role === "admin";

  if (!isAdmin && data.clerk_user_id !== userId) notFound();

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <MyBookingDetail booking={data as Booking} />
      </div>
    </div>
  );
}
