import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: company, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  // Worker count
  const { count: workerCount } = await supabase
    .from("company_workers")
    .select("id", { count: "exact", head: true })
    .eq("company_id", id)
    .eq("is_active", true);

  // Recent sessions
  const { data: sessions } = await supabase
    .from("screening_sessions")
    .select("*, package:screening_packages(id, name, code)")
    .eq("company_id", id)
    .order("session_date", { ascending: false })
    .limit(10);

  return NextResponse.json({ company: { ...company, worker_count: workerCount ?? 0 }, sessions: sessions ?? [] });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { name, registration_number, industry_type, contact_person, email, phone, address, notes, is_active } = body;

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("companies")
      .update({
        ...(name && { name }),
        registration_number: registration_number ?? null,
        industry_type: industry_type ?? null,
        ...(contact_person && { contact_person }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(address && { address }),
        notes: notes ?? null,
        ...(is_active !== undefined && { is_active }),
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

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createAdminClient();

  // Soft delete
  const { error } = await supabase
    .from("companies")
    .update({ is_active: false })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
