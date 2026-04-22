import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <header className="bg-white border-b border-[#e5e5e5] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between">
          <Link href="/portal" className="flex items-center gap-2">
            <div className="w-5 h-5 bg-black rounded flex items-center justify-center">
              <span className="text-[9px] font-black text-white">W</span>
            </div>
            <span className="text-[13px] font-semibold text-black tracking-tight">WorkMedix</span>
            <span className="text-[12px] text-[#888] ml-1">Client Portal</span>
          </Link>
          <UserButton appearance={{ elements: { avatarBox: "w-6 h-6" } }} />
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
