import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { startOfDay } from "date-fns";

export const dynamic = "force-dynamic";

const SESSION_STATUS_COLOR: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
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
    supabase
      .from("screening_results")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart),
    supabase.from("fitness_certificates").select("id", { count: "exact", head: true }),
    supabase
      .from("screening_sessions")
      .select("id, session_date, status, companies(name)")
      .order("session_date", { ascending: false })
      .limit(10),
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
  const { totalWorkers, activeSessions, todayScreenings, totalCerts, recentSessions } =
    await getData();

  const stats = [
    { label: "Total Workers", value: totalWorkers, href: "/workers" },
    { label: "Active Sessions", value: activeSessions, href: "/sessions" },
    { label: "Screenings Today", value: todayScreenings, href: "/sessions" },
    { label: "Certs Issued", value: totalCerts, href: "/certificates" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[18px] font-semibold text-black">Dashboard</h1>
        <p className="text-[13px] text-[#888] mt-0.5">Occupational health screening overview.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white border border-[#e5e5e5] rounded-xl p-5 hover:border-[#ccc] transition-colors"
          >
            <p className="text-[28px] font-bold text-black leading-none">{value}</p>
            <p className="text-[12px] text-[#888] mt-1">{label}</p>
          </Link>
        ))}
      </div>

      {/* Recent sessions */}
      <div>
        <h2 className="text-[14px] font-semibold text-black mb-3">Recent Sessions</h2>
        {recentSessions.length === 0 ? (
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-8 text-center">
            <p className="text-[13px] text-[#888]">No sessions yet.</p>
            <Link
              href="/sessions/new"
              className="mt-3 inline-block text-[13px] font-medium text-black underline underline-offset-2"
            >
              Create first session →
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-[#e5e5e5] rounded-xl divide-y divide-[#f0f0f0] overflow-hidden">
            {recentSessions.map((s) => {
              const co = s.companies as unknown as { name: string } | { name: string }[] | null;
              const company = (Array.isArray(co) ? co[0]?.name : co?.name) ?? "—";
              const dateStr = s.session_date
                ? new Date(s.session_date).toLocaleDateString("en-ZA", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—";
              return (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-[#fafafa] transition-colors"
                >
                  <div>
                    <p className="text-[13px] font-medium text-black">{company}</p>
                    <p className="text-[12px] text-[#888]">{dateStr}</p>
                  </div>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${
                      SESSION_STATUS_COLOR[s.status] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {s.status.replace("_", " ")}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
