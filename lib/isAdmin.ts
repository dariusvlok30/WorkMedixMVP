import { currentUser } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function isAdmin(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;

  // Check Clerk publicMetadata first (legacy / Clerk-dashboard grants)
  if ((user.publicMetadata as { role?: string })?.role === "admin") return true;

  // Check Supabase admins table — manageable via SQL
  const email = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;
  if (!email) return false;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admins")
    .select("email")
    .eq("email", email)
    .single();

  return Boolean(data);
}
