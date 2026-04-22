import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: session, error } = await supabase
    .from("screening_sessions")
    .select("*, company:companies(*), package:screening_packages(*)")
    .eq("id", id)
    .single();

  if (error || !session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const { data: appointments } = await supabase
    .from("worker_appointments")
    .select(`
      *,
      worker:workers(*),
      results:screening_results(*),
      certificate:fitness_certificates(id, certificate_number, fitness_status, valid_until, issued_at)
    `)
    .eq("session_id", id)
    .order("scheduled_time", { ascending: true, nullsFirst: true });

  return NextResponse.json({ session, appointments: appointments ?? [] });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { status, session_date, location, notes, package_id } = body;

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("screening_sessions")
      .update({
        ...(status && { status }),
        ...(session_date && { session_date }),
        ...(location && { location }),
        ...(notes !== undefined && { notes }),
        ...(package_id && { package_id }),
      })
      .eq("id", id)
      .select("*, company:companies(id, name), package:screening_packages(id, name, code)")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("screening_sessions")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
