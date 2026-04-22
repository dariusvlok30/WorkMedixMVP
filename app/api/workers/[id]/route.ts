import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/workers/[id] — full worker profile with history
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: worker, error } = await supabase
    .from("workers")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !worker) return NextResponse.json({ error: "Worker not found" }, { status: 404 });

  // Fetch company memberships
  const { data: companies } = await supabase
    .from("company_workers")
    .select("*, company:companies(id, name, industry_type)")
    .eq("worker_id", id)
    .eq("is_active", true);

  // Fetch appointment history with session and results
  const { data: appointments } = await supabase
    .from("worker_appointments")
    .select(`
      *,
      session:screening_sessions(
        id, session_date, location, status,
        company:companies(id, name),
        package:screening_packages(id, name, code)
      ),
      results:screening_results(*),
      certificate:fitness_certificates(*)
    `)
    .eq("worker_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ worker, companies: companies ?? [], appointments: appointments ?? [] });
}

// PATCH /api/workers/[id] — update worker details
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { first_name, last_name, date_of_birth, gender, race, phone, email } = body;

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("workers")
      .update({
        ...(first_name && { first_name }),
        ...(last_name && { last_name }),
        date_of_birth: date_of_birth ?? null,
        gender: gender ?? null,
        race: race ?? null,
        phone: phone ?? null,
        email: email ?? null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// DELETE /api/workers/[id] — soft delete (only if no appointments)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createAdminClient();

  // Check for existing appointments
  const { count } = await supabase
    .from("worker_appointments")
    .select("id", { count: "exact", head: true })
    .eq("worker_id", id);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "Cannot delete worker with existing appointment history" },
      { status: 409 }
    );
  }

  const { error } = await supabase.from("workers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
