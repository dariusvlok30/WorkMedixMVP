import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { startOfDay } from "date-fns";

export const dynamic = "force-dynamic";

const SESSION_STATUS_COLOR: Record<string, string> = {
  scheduled:   "text-blue-400 bg-blue-400/10 border-blue-400/20",
  in_progress: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  completed:   "text-green-400 bg-green-400/10 border-green-400/20",
  cancelled:   "text-red-400 bg-red-400/10 border-red-400/20",
};

async function getData() {
  const supabase = createAdminClient();
  const todayStart = startOfDay(new Date()).toISOString();

  const [
    { count: totalWorkers },
    { data: sessions },
    { count: todayScreenings },
    { count: totalCerts },
    { data: recentSessions },
  ] = await Promise.all([
    supabase.from("workers").select("id", { count: "exact", head: true }),
    supabase.from("screening_sessions").select("id, status"),
    supabase.from("screening_results").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
    supabase.from("fitness_certificates").select("id", { count: "exact", head: true }),
    supabase.from("screening_sessions")
      .select("id, session_date, status, companies(name)")
      .order("session_date", { ascending: false })
      .limit(8),
  ]);

  const activeSessions = (sessions ?? []).filter((s) =>
    ["scheduled", "in_progress"].includes(s.status)
  ).length;

  return {
    totalWorkers: totalWorkers ?? 0,
    activeSessions,
    todayScreenings: todayScreenings ?? 0,
    totalCerts: totalCerts ?? 0,
    recentSessions: recentSessions ?? [],
  };
}

export default async function DashboardPage() {
  const { totalWorkers, activeSessions, todayScreenings, totalCerts, recentSessions } = await getData();

  const stats = [
    { label: "Total Workers",     value: totalWorkers,     href: "/workers" },
    { label: "Active Sessions",   value: activeSessions,   href: "/sessions" },
    { label: "Screenings Today",  value: todayScreenings,  href: "/sessions" },
    { label: "Certificates",      value: totalCerts,       href: "/certificates" },
  ];

  return (
    <div className="space-y-7 max-w-5xl">
      <div>
        <h1 className="text-[20px] font-semibold text-white">Dashboard</h1>
        <p className="text-[13px] text-[#555] mt-0.5">Occupational health overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ label, value, href }) => (
          <Link key={label} href={href} className="group bg-[#111] border border-[#1a1a1a] rounded-xl p-5 hover:border-[#2a2a2a] transition-colors">
            <p className="text-[32px] font-bold text-white leading-none">{value}</p>
            <p className="text-[12px] text-[#555] mt-1.5 group-hover:text-[#777] transition-colors">{label}</p>
          </Link>
        ))}
      </div>

      {/* Recent sessions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold text-white">Recent Sessions</h2>
          <Link href="/sessions" className="text-[12px] text-[#555] hover:text-white transition-colors">View all →</Link>
        </div>

        {recentSessions.length === 0 ? (
          <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-10 text-center">
            <p className="text-[13px] text-[#555]">No sessions yet.</p>
            <Link href="/sessions/new" className="mt-3 inline-block text-[13px] text-white underline underline-offset-2">
              Create first session →
            </Link>
          </div>
        ) : (
          <div className="bg-[#111] border border-[#1a1a1a] rounded-xl overflow-hidden">
            {recentSessions.map((s, i) => {
              const co = s.companies as unknown as { name: string } | { name: string }[] | null;
              const company = (Array.isArray(co) ? co[0]?.name : co?.name) ?? "—";
              const dateStr = s.session_date
                ? new Date(s.session_date).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })
                : "—";
              return (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className={`flex items-center justify-between px-5 py-3.5 hover:bg-[#161616] transition-colors ${i > 0 ? "border-t border-[#1a1a1a]" : ""}`}
                >
                  <div>
                    <p className="text-[13px] font-medium text-white">{company}</p>
                    <p className="text-[12px] text-[#555] mt-0.5">{dateStr}</p>
                  </div>
                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border capitalize ${SESSION_STATUS_COLOR[s.status] ?? "text-[#777] bg-[#1a1a1a] border-[#2a2a2a]"}`}>
                    {s.status.replace("_", " ")}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "New Session", href: "/sessions/new", desc: "Start a screening at a company" },
          { label: "Add Worker",  href: "/workers",      desc: "Register a new employee" },
          { label: "Companies",   href: "/companies",    desc: "Manage client companies" },
        ].map(({ label, href, desc }) => (
          <Link key={label} href={href} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 hover:border-[#2a2a2a] transition-colors">
            <p className="text-[13px] font-semibold text-white">{label}</p>
            <p className="text-[12px] text-[#555] mt-1">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
