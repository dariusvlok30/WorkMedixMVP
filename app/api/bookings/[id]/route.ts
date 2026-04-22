import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/isAdmin";

// GET /api/bookings/[id] — admin OR booking owner
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, documents(*)")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  // Allow access if admin or owner
  const admin = await isAdmin();
  if (!admin && data.clerk_user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(data);
}

// PATCH /api/bookings/[id]
// Admins: can update status + notes
// Owners: can update notes, preferred_dates, contact_person, phone only
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createAdminClient();

  // Fetch booking to check ownership
  const { data: existing, error: fetchError } = await supabase
    .from("bookings")
    .select("clerk_user_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const admin = await isAdmin();
  const isOwner = existing.clerk_user_id === userId;

  if (!admin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (admin) {
    // Admins can update status and notes
    for (const field of ["status", "notes"]) {
      if (field in body) updates[field] = body[field];
    }
  }

  // Both admins and owners can update these fields
  for (const field of ["notes", "preferred_dates", "contact_person", "phone"]) {
    if (field in body) updates[field] = body[field];
  }

  const { data, error } = await supabase
    .from("bookings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// DELETE /api/bookings/[id] — admin only
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await isAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("bookings").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
