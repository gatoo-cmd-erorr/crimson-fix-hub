import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Header } from "@/components/Header";
import { Card, Switch, Skeleton } from "@/components/ui-bits";
import { api } from "@/lib/api";
import { useState } from "react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

interface Dash {
  total_users: number;
  premium_users: number;
  fix_today: number;
  gmail_active: number;
  chart_7d: { day: string; count: number }[];
  bot_status: { maintenance: boolean; updated_at?: string };
}

function AdminDashboard() {
  const { data, isLoading, refetch } = useQuery<Dash>({
    queryKey: ["admin-dash"],
    queryFn: async () => (await api.get("/admin/dashboard")).data,
  });
  const [tog, setTog] = useState(false);

  const toggleMaint = async (v: boolean) => {
    setTog(true);
    try {
      await api.post("/admin/settings", { maintenance_mode: v });
      toast.success(v ? "Maintenance ON" : "Maintenance OFF");
      refetch();
    } catch {
      toast.error("Gagal");
    } finally {
      setTog(false);
    }
  };

  return (
    <>
      <Header title="Dashboard" />

      <AdminSubNav />

      <div className="mb-3 grid grid-cols-2 gap-2">
        <Stat icon="👥" label="Total User" v={data?.total_users} loading={isLoading} />
        <Stat
          icon="💎"
          label="Premium"
          v={data?.premium_users}
          loading={isLoading}
          accent="gold"
        />
        <Stat
          icon="🔧"
          label="Fix Hari Ini"
          v={data?.fix_today}
          loading={isLoading}
          accent="red"
        />
        <Stat
          icon="📧"
          label="Gmail Aktif"
          v={data?.gmail_active}
          loading={isLoading}
          accent="green"
        />
      </div>

      <Card className="mb-3">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/55">
          Fix 7 Hari Terakhir
        </p>
        <div className="h-44">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer>
              <LineChart data={data?.chart_7d ?? []}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(10,10,10,0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#E8192C"
                  strokeWidth={2.5}
                  dot={{ fill: "#E8192C", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
              Status Bot
            </p>
            <p className="mt-1 text-base font-bold">
              {data?.bot_status?.maintenance ? "🔴 Maintenance" : "🟢 Aktif"}
            </p>
            {data?.bot_status?.updated_at && (
              <p className="mt-0.5 text-[11px] text-white/40">
                Update: {new Date(data.bot_status.updated_at).toLocaleString("id-ID")}
              </p>
            )}
          </div>
          <Switch
            checked={!!data?.bot_status?.maintenance}
            onChange={(v) => !tog && toggleMaint(v)}
          />
        </div>
      </Card>
    </>
  );
}

function Stat({
  icon,
  label,
  v,
  loading,
  accent,
}: {
  icon: string;
  label: string;
  v?: number;
  loading?: boolean;
  accent?: "gold" | "red" | "green";
}) {
  const accentCls =
    accent === "gold"
      ? "text-[#FFB800]"
      : accent === "red"
        ? "text-primary"
        : accent === "green"
          ? "text-success"
          : "text-white";
  return (
    <Card className="!p-3">
      <div className="flex items-center justify-between">
        <span className="text-xl">{icon}</span>
      </div>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/55">
        {label}
      </p>
      {loading ? (
        <Skeleton className="mt-1 h-6 w-12" />
      ) : (
        <p className={`text-2xl font-bold tabular-nums ${accentCls}`}>{v ?? 0}</p>
      )}
    </Card>
  );
}

export function AdminSubNav() {
  const links = [
    { to: "/admin/dashboard", label: "Dash" },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/gmail", label: "Gmail" },
    { to: "/admin/templates", label: "Template" },
    { to: "/admin/premium", label: "Premium" },
    { to: "/admin/owner", label: "Owner" },
    { to: "/admin/broadcast", label: "Broadcast" },
    { to: "/admin/settings", label: "Settings" },
  ] as const;
  return (
    <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          activeProps={{ className: "bg-primary text-white" }}
          inactiveProps={{ className: "bg-white/8 text-white/65" }}
          className="press shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold"
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
