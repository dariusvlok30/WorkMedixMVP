import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("screening_packages")
    .select("*")
    .eq("is_active", true)
    .order("price_cents", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { code, name, description, price_cents, tests_included } = body;

    if (!code || !name || price_cents === undefined || !tests_included?.length) {
      return NextResponse.json({ error: "code, name, price_cents, and tests_included are required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("screening_packages")
      .insert({ code: code.toUpperCase(), name, description: description ?? null, price_cents, tests_included })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "Package code already exists" }, { status: 409 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
