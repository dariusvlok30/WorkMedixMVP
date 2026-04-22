import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { name, description, price_cents, tests_included, is_active } = body;

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("screening_packages")
      .update({
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price_cents !== undefined && { price_cents }),
        ...(tests_included && { tests_included }),
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
