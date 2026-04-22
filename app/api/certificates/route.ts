import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const worker_id = searchParams.get("worker_id");
  const company_id = searchParams.get("company_id");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const supabase = createAdminClient();

  let query = supabase
    .from("fitness_certificates")
    .select(
      `*,
      worker:workers(id, id_number, first_name, last_name),
      appointment:worker_appointments(
        id, session_id,
        session:screening_sessions(id, session_date, company:companies(id, name))
      )`,
      { count: "exact" }
    )
    .order("issued_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (worker_id) query = query.eq("worker_id", worker_id);
  if (company_id) {
    // Filter via appointment → session → company
    query = query.eq("appointment.session.company_id", company_id);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ certificates: data, total: count });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await currentUser();
    const issuerName = user
      ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.emailAddresses[0]?.emailAddress
      : "Unknown";

    const body = await req.json();
    const { appointment_id, fitness_status, valid_until, restrictions, remarks } = body;

    if (!appointment_id || !fitness_status) {
      return NextResponse.json({ error: "appointment_id and fitness_status are required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get worker_id from appointment
    const { data: appt } = await supabase
      .from("worker_appointments")
      .select("worker_id")
      .eq("id", appointment_id)
      .single();

    if (!appt) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

    // Generate unique certificate number
    const { data: certNumRow } = await supabase
      .rpc("generate_certificate_number")
      .single();

    const certificate_number = (certNumRow as string | null) ?? `WM-${Date.now()}`;

    const { data, error } = await supabase
      .from("fitness_certificates")
      .insert({
        appointment_id,
        worker_id: appt.worker_id,
        certificate_number,
        fitness_status,
        valid_until: valid_until ?? null,
        restrictions: restrictions ?? [],
        remarks: remarks ?? null,
        issued_by: userId,
        issued_by_name: issuerName ?? "Unknown",
      })
      .select(`
        *,
        worker:workers(*),
        appointment:worker_appointments(
          id, session_id,
          session:screening_sessions(id, session_date, company:companies(id, name))
        )
      `)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Mark appointment as completed
    await supabase
      .from("worker_appointments")
      .update({ status: "completed" })
      .eq("id", appointment_id);

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
