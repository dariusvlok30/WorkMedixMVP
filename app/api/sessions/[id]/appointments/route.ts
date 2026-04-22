import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/sessions/[id]/appointments
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
      results:screening_results(*),
      certificate:fitness_certificates(id, certificate_number, fitness_status, valid_until)
    `)
    .eq("session_id", id)
    .order("scheduled_time", { ascending: true, nullsFirst: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/sessions/[id]/appointments — add workers to a session
// Body: { workers: Array<{ worker_id, scheduled_time? }> }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: session_id } = await params;

  try {
    const body = await req.json();
    const { workers } = body; // Array of { worker_id, scheduled_time? }

    if (!Array.isArray(workers) || workers.length === 0) {
      return NextResponse.json({ error: "workers array is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const rows = workers.map((w: { worker_id: string; scheduled_time?: string }) => ({
      session_id,
      worker_id: w.worker_id,
      scheduled_time: w.scheduled_time ?? null,
      status: "scheduled" as const,
    }));

    const { data, error } = await supabase
      .from("worker_appointments")
      .upsert(rows, { onConflict: "session_id,worker_id" })
      .select("*, worker:workers(*)");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
