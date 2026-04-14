import { NextResponse } from "next/server";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caller = await currentUser();
  if ((caller?.publicMetadata as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = await clerkClient();
  const { data: users } = await client.users.getUserList({ limit: 200, orderBy: "-created_at" });

  const formatted = users.map((u) => ({
    id: u.id,
    name: [u.firstName, u.lastName].filter(Boolean).join(" ") || "—",
    email: u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ?? "—",
    imageUrl: u.imageUrl,
    role: (u.publicMetadata as { role?: string })?.role ?? "user",
    createdAt: u.createdAt,
    lastSignInAt: u.lastSignInAt,
  }));

  return NextResponse.json(formatted);
}
