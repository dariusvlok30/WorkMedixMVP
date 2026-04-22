import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("fitness_certificates")
    .select(`
      *,
      worker:workers(*),
      appointment:worker_appointments(
        *,
        session:screening_sessions(
          *, company:companies(*), package:screening_packages(*)
        ),
        results:screening_results(*)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  return NextResponse.json(data);
}
