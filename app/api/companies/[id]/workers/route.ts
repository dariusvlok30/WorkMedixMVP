import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/companies/[id]/workers
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("company_workers")
    .select("*, worker:workers(*)")
    .eq("company_id", id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/companies/[id]/workers — add an existing worker to a company
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: company_id } = await params;

  try {
    const body = await req.json();
    const { worker_id, employee_number, department, job_title, occupation_class, date_of_employment } = body;

    if (!worker_id) return NextResponse.json({ error: "worker_id is required" }, { status: 400 });

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("company_workers")
      .upsert({
        company_id,
        worker_id,
        employee_number: employee_number ?? null,
        department: department ?? null,
        job_title: job_title ?? null,
        occupation_class: occupation_class ?? null,
        date_of_employment: date_of_employment ?? null,
        is_active: true,
      }, { onConflict: "company_id,worker_id" })
      .select("*, worker:workers(*)")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
