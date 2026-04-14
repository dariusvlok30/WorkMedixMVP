import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/documents/[id] — returns a 1-hour signed download URL
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("file_url, file_name")
    .eq("id", id)
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.file_url, 3600); // 1 hour

  if (signedError || !signedData) {
    return NextResponse.json(
      { error: "Could not generate download URL" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: signedData.signedUrl, file_name: doc.file_name });
}

// DELETE /api/documents/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("file_url")
    .eq("id", id)
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Remove from storage
  await supabase.storage.from("documents").remove([doc.file_url]);

  // Remove from DB
  const { error } = await supabase.from("documents").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
