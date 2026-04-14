import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sendManualEmail } from "@/lib/resend";

// POST /api/send-email — admin sends a manual email from booking detail
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { to, subject, body } = await req.json();

  if (!to || !subject || !body) {
    return NextResponse.json(
      { error: "to, subject, and body are required" },
      { status: 400 }
    );
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  await sendManualEmail(to, subject, body);

  return NextResponse.json({ success: true });
}
