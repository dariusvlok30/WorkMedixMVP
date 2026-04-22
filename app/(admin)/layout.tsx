import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import AdminNav from "@/components/admin/AdminNav";
import { isAdmin } from "@/lib/isAdmin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();

  if (!user) redirect("/admin");
  if (!(await isAdmin())) {
    // Signed in but not an admin — show access denied
    return (
      <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[15px] font-semibold text-black">Access Denied</p>
          <p className="text-[13px] text-[#888] mt-1">You don&apos;t have admin access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <AdminNav />
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      <Toaster />
    </div>
  );
}
