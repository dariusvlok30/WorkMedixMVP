import { currentUser } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import Annexure3Page from "@/app/(admin)/certificates/[id]/annexure3/page";

async function verifyAccess(certId: string, email: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("email", email)
    .single();
  if (!company) return false;

  const { data: cert } = await supabase
    .from("fitness_certificates")
    .select("worker_id")
    .eq("id", certId)
    .single();
  if (!cert) return false;

  const { data: link } = await supabase
    .from("company_workers")
    .select("worker_id")
    .eq("company_id", company.id)
    .eq("worker_id", cert.worker_id)
    .single();

  return Boolean(link);
}

export default async function ClientAnnexure3Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  const email = user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress;
  if (!email) redirect("/sign-in");

  const allowed = await verifyAccess(id, email);
  if (!allowed) notFound();

  return Annexure3Page({ params: Promise.resolve({ id }) });
}
