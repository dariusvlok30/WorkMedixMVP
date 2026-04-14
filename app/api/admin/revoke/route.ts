import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caller = await currentUser();
  if ((caller?.publicMetadata as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const client = await clerkClient();
  const { data: users } = await client.users.getUserList({ emailAddress: [email] });

  if (!users.length) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const target = users[0];
  if (target.id === userId) {
    return NextResponse.json({ error: "You cannot revoke your own admin access." }, { status: 400 });
  }

  const meta = { ...(target.publicMetadata ?? {}) } as Record<string, unknown>;
  delete meta.role;
  await client.users.updateUser(target.id, { publicMetadata: meta });

  return NextResponse.json({ success: true });
}
