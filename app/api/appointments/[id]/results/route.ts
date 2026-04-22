import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/appointments/[id]/results
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("screening_results")
    .select("*")
    .eq("appointment_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/appointments/[id]/results — save or update a test result
// Body: { test_type, result_data, result_status, device_serial_number? }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: appointment_id } = await params;

  try {
    const body = await req.json();
    const { test_type, result_data, result_status, device_serial_number } = body;

    if (!test_type || !result_data || !result_status) {
      return NextResponse.json({ error: "test_type, result_data, and result_status are required" }, { status: 400 });
    }

    // Look up worker_id from appointment
    const supabase = createAdminClient();
    const { data: appt } = await supabase
      .from("worker_appointments")
      .select("worker_id")
      .eq("id", appointment_id)
      .single();

    if (!appt) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

    // Upsert — one result per test_type per appointment
    const { data, error } = await supabase
      .from("screening_results")
      .upsert(
        {
          appointment_id,
          worker_id: appt.worker_id,
          test_type,
          result_data,
          result_status,
          measured_by: userId,
          device_serial_number: device_serial_number ?? null,
        },
        { onConflict: "appointment_id,test_type" }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Auto-set appointment status to in_progress
    await supabase
      .from("worker_appointments")
      .update({ status: "in_progress", clinician_id: userId })
      .eq("id", appointment_id)
      .eq("status", "scheduled");

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
