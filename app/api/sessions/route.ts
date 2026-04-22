import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const company_id = searchParams.get("company_id");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const supabase = createAdminClient();

  let query = supabase
    .from("screening_sessions")
    .select(
      `*,
      company:companies(id, name, contact_person, email),
      package:screening_packages(id, name, code, price_cents)`,
      { count: "exact" }
    )
    .order("session_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && status !== "all") query = query.eq("status", status);
  if (company_id) query = query.eq("company_id", company_id);
  if (from) query = query.gte("session_date", from);
  if (to) query = query.lte("session_date", to);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Append appointment counts
  if (data && data.length > 0) {
    const sessionIds = data.map((s) => s.id);
    const { data: counts } = await supabase
      .from("worker_appointments")
      .select("session_id, status")
      .in("session_id", sessionIds);

    const countsMap: Record<string, { total: number; completed: number }> = {};
    for (const row of counts ?? []) {
      if (!countsMap[row.session_id]) countsMap[row.session_id] = { total: 0, completed: 0 };
      countsMap[row.session_id].total++;
      if (row.status === "completed") countsMap[row.session_id].completed++;
    }

    const enriched = data.map((s) => ({
      ...s,
      appointment_count: countsMap[s.id]?.total ?? 0,
      completed_count: countsMap[s.id]?.completed ?? 0,
    }));

    return NextResponse.json({ sessions: enriched, total: count });
  }

  return NextResponse.json({ sessions: data ?? [], total: count });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { company_id, package_id, session_date, location, notes } = body;

    if (!company_id || !package_id || !session_date || !location) {
      return NextResponse.json(
        { error: "company_id, package_id, session_date, and location are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("screening_sessions")
      .insert({
        company_id,
        package_id,
        session_date,
        location: location.trim(),
        notes: notes ?? null,
        status: "scheduled",
        created_by: userId,
      })
      .select("*, company:companies(id, name), package:screening_packages(id, name, code)")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
