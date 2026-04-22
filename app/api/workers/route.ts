import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/workers — list workers with optional search
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const company_id = searchParams.get("company_id");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const supabase = createAdminClient();

  if (company_id) {
    // Get workers for a specific company via company_workers join
    let query = supabase
      .from("company_workers")
      .select("*, worker:workers(*)")
      .eq("company_id", company_id)
      .order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  let query = supabase
    .from("workers")
    .select("*", { count: "exact" })
    .order("last_name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(
      `id_number.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ workers: data, total: count });
}

// POST /api/workers — create a new worker
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id_number, id_type, first_name, last_name, date_of_birth, gender, race, phone, email } = body;

    if (!id_number || !first_name || !last_name) {
      return NextResponse.json({ error: "id_number, first_name, and last_name are required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("workers")
      .insert({
        id_number: id_number.trim().toUpperCase(),
        id_type: id_type ?? "sa_id",
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        date_of_birth: date_of_birth ?? null,
        gender: gender ?? null,
        race: race ?? null,
        phone: phone ?? null,
        email: email ?? null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "A worker with this ID number already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
