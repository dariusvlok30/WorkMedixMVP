import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/workers/import — bulk import workers from CSV rows
// Body: { company_id: string, workers: Array<{id_number, first_name, last_name, ...}> }
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { company_id, workers } = await req.json();

    if (!company_id || !Array.isArray(workers) || workers.length === 0) {
      return NextResponse.json({ error: "company_id and workers array are required" }, { status: 400 });
    }

    if (workers.length > 500) {
      return NextResponse.json({ error: "Maximum 500 workers per import" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const results = { created: 0, updated: 0, linked: 0, errors: [] as string[] };

    for (const row of workers) {
      const { id_number, first_name, last_name, date_of_birth, gender, race, phone, email, employee_number, department, job_title, occupation_class, date_of_employment } = row;

      if (!id_number || !first_name || !last_name) {
        results.errors.push(`Row missing required fields: ${JSON.stringify(row)}`);
        continue;
      }

      const normalizedId = String(id_number).trim().toUpperCase();

      // Upsert worker
      const { data: worker, error: workerError } = await supabase
        .from("workers")
        .upsert(
          {
            id_number: normalizedId,
            id_type: normalizedId.length === 13 ? "sa_id" : "passport",
            first_name: String(first_name).trim(),
            last_name: String(last_name).trim(),
            date_of_birth: date_of_birth ?? null,
            gender: gender ?? null,
            race: race ?? null,
            phone: phone ?? null,
            email: email ?? null,
          },
          { onConflict: "id_number", ignoreDuplicates: false }
        )
        .select()
        .single();

      if (workerError || !worker) {
        results.errors.push(`Failed to upsert worker ${normalizedId}: ${workerError?.message}`);
        continue;
      }

      // Link to company
      const { error: linkError } = await supabase
        .from("company_workers")
        .upsert(
          {
            company_id,
            worker_id: worker.id,
            employee_number: employee_number ?? null,
            department: department ?? null,
            job_title: job_title ?? null,
            occupation_class: occupation_class ?? null,
            date_of_employment: date_of_employment ?? null,
            is_active: true,
          },
          { onConflict: "company_id,worker_id", ignoreDuplicates: false }
        );

      if (linkError) {
        results.errors.push(`Failed to link worker ${normalizedId} to company: ${linkError.message}`);
      } else {
        results.linked++;
      }

      results.created++;
    }

    return NextResponse.json(results, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
