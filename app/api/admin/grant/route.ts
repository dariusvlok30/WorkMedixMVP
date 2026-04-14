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
    return NextResponse.json(
      { error: "No account found for that email. They must sign in with Google or Microsoft first." },
      { status: 404 }
    );
  }

  const target = users[0];
  await client.users.updateUser(target.id, {
    publicMetadata: { ...(target.publicMetadata ?? {}), role: "admin" },
  });

  const name = `${target.firstName ?? ""} ${target.lastName ?? ""}`.trim() || email;
  return NextResponse.json({ success: true, name });
}
