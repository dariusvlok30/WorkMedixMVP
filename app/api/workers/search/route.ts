import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/workers/search?id_number=XXX — look up a worker by SA ID
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id_number = searchParams.get("id_number");

  if (!id_number) return NextResponse.json({ error: "id_number is required" }, { status: 400 });

  const supabase = createAdminClient();

  const { data: worker, error } = await supabase
    .from("workers")
    .select("*")
    .eq("id_number", id_number.trim().toUpperCase())
    .single();

  if (error || !worker) {
    return NextResponse.json({ worker: null, found: false });
  }

  // Get latest certificate
  const { data: latestCert } = await supabase
    .from("fitness_certificates")
    .select("*")
    .eq("worker_id", worker.id)
    .order("issued_at", { ascending: false })
    .limit(1)
    .single();

  // Get company memberships
  const { data: companies } = await supabase
    .from("company_workers")
    .select("*, company:companies(id, name)")
    .eq("worker_id", worker.id)
    .eq("is_active", true);

  return NextResponse.json({
    found: true,
    worker,
    latest_certificate: latestCert ?? null,
    companies: companies ?? [],
  });
}
