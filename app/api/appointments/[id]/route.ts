import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("worker_appointments")
    .select(`
      *,
      worker:workers(*),
      session:screening_sessions(
        *, company:companies(id, name), package:screening_packages(*)
      ),
      results:screening_results(*),
      certificate:fitness_certificates(*)
    `)
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { status, scheduled_time, notes, clinician_id } = body;

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("worker_appointments")
      .update({
        ...(status && { status }),
        ...(scheduled_time !== undefined && { scheduled_time }),
        ...(notes !== undefined && { notes }),
        clinician_id: clinician_id ?? userId,
      })
      .eq("id", id)
      .select("*, worker:workers(*)")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
