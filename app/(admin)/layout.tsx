import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import Sidebar from "@/components/admin/Sidebar";
import { isAdmin } from "@/lib/isAdmin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();

  if (!user) redirect("/admin");
  if (!(await isAdmin())) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[15px] font-semibold text-white">Access Denied</p>
          <p className="text-[13px] text-[#555] mt-1">You don&apos;t have admin access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-[#0a0a0a] p-8">{children}</main>
      <Toaster />
    </div>
  );
}
