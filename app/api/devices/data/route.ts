import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Receives normalized device data from the local bridge service running on the clinic laptop.
// Auth: shared secret header X-Bridge-Token checked against env var BRIDGE_SECRET.
export async function POST(req: NextRequest) {
  const token = req.headers.get("x-bridge-token");
  const secret = process.env.BRIDGE_SECRET;

  if (secret && token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { appointment_id, device_type, normalized } = body as {
    appointment_id: string;
    device_type: string;
    normalized: Record<string, unknown>;
  };

  if (!appointment_id || !device_type || !normalized) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Map device_type to test_type
  const deviceToTest: Record<string, string> = {
    spirometer: "spirometry",
    audiometer: "audiometry",
    keystone: "vision",
    bp_monitor: "blood_pressure",
  };

  const test_type = deviceToTest[device_type];
  if (!test_type) {
    return NextResponse.json({ error: `Unknown device_type: ${device_type}` }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Upsert result — one result per test type per appointment
  const { data, error } = await supabase
    .from("screening_results")
    .upsert(
      {
        appointment_id,
        test_type,
        result_data: normalized,
        result_status: "normal",
        device_source: device_type,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "appointment_id,test_type" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, result: data });
}
