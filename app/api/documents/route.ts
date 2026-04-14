import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/documents — upload a file to Supabase Storage and record in DB
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const bookingId = formData.get("booking_id") as string | null;

  if (!file || !bookingId) {
    return NextResponse.json(
      { error: "file and booking_id are required" },
      { status: 400 }
    );
  }

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Only PDF, JPEG, PNG, and WebP files are allowed" },
      { status: 400 }
    );
  }

  const maxSize = 10 * 1024 * 1024; // 10 MB
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "File size exceeds 10 MB limit" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const ext = file.name.split(".").pop() ?? "bin";
  const storagePath = `${bookingId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Store the path (not public URL) — we'll generate signed URLs on demand
  const { data, error: dbError } = await supabase
    .from("documents")
    .insert({
      booking_id: bookingId,
      file_name: file.name,
      file_url: storagePath,
      file_type: ext.toUpperCase(),
      file_size: file.size,
    })
    .select()
    .single();

  if (dbError) {
    // Clean up storage if DB insert fails
    await supabase.storage.from("documents").remove([storagePath]);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
