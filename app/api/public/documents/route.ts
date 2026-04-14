import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

// POST /api/public/documents — no auth, used by the public booking form
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const bookingId = formData.get("booking_id") as string | null;

  if (!file || !bookingId) {
    return NextResponse.json({ error: "file and booking_id are required" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only PDF, JPEG, PNG, and WebP files are allowed" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File size exceeds 10 MB limit" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Verify booking exists before accepting upload
  const { error: bookingError } = await supabase
    .from("bookings")
    .select("id")
    .eq("id", bookingId)
    .single();

  if (bookingError) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const storagePath = `${bookingId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

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
    await supabase.storage.from("documents").remove([storagePath]);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
