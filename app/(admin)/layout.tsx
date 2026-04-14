import { Toaster } from "@/components/ui/toaster";
import AdminNav from "@/components/admin/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <AdminNav />
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      <Toaster />
    </div>
  );
}
