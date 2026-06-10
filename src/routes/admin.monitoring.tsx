import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";
import { Card, Button, Skeleton, EmptyState } from "@/components/ui-bits";
import { AdminSubNav } from "./admin.dashboard";
import { api } from "@/lib/api";

export const Route = createFileRoute("/admin/monitoring")({
  component: AdminMonitoring,
});

interface MonStats {
  total_premium: number;
  total_vip: number;
  expiring_h3: number;
  expiring_h1: number;
}

interface MonUser {
  _id: string;
  username: string;
  telegram_id?: string;
  role: "PREMIUM" | "VIP" | "OWNER" | string;
  total_fix?: number;
  coin_balance?: number;
  premium_expiry?: string | null;
}

type TabKey = "all" | "expiring" | "expired";
type RoleFilter = "ALL" | "PREMIUM" | "VIP" | "OWNER";

function fmtDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "medium",
      timeStyle: "short",
    }) + " WIB";
  } catch {
    return d;
  }
}

function daysDiff(d?: string | null) {
  if (!d) return null;
  const ms = new Date(d).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ expiry }: { expiry?: string | null }) {
  if (expiry === null || expiry === undefined) {
    return (
      <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
        🟢 Permanent
      </span>
    );
  }
  const d = daysDiff(expiry);
  if (d === null) return null;
  if (d < 0) {
    return (
      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/50">
        ⚫ Expired {fmtDate(expiry)}
      </span>
    );
  }
  if (d <= 1) {
    return (
      <span className="animate-pulse rounded-full bg-[#FF453A]/20 px-2 py-0.5 text-[10px] font-semibold text-[#FF453A]">
        🔴 H-1: {fmtDate(expiry)}
      </span>
    );
  }
  if (d <= 3) {
    return (
      <span className="animate-pulse rounded-full bg-[#FFB800]/20 px-2 py-0.5 text-[10px] font-semibold text-[#FFB800]">
        🟡 H-3: {fmtDate(expiry)}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
      🔵 Aktif hingga {fmtDate(expiry)}
    </span>
  );
}

function AdminMonitoring() {
  const [tab, setTab] = useState<TabKey>("all");
  const [role, setRole] = useState<RoleFilter>("ALL");
  const [checking, setChecking] = useState(false);

  const stats = useQuery<MonStats>({
    queryKey: ["mon-stats"],
    queryFn: async () => (await api.get("/monitoring/stats")).data,
  });

  const users = useQuery<MonUser[]>({
    queryKey: ["mon-users", tab],
    queryFn: async () => {
      const endpoint =
        tab === "expiring"
          ? "/monitoring/expiring"
          : tab === "expired"
          ? "/monitoring/expired"
          : "/monitoring/users";
      const r = await api.get(endpoint);
      return Array.isArray(r.data) ? r.data : r.data?.users ?? [];
    },
  });

  const filtered = useMemo(() => {
    const list = users.data ?? [];
    if (role === "ALL") return list;
    return list.filter((u) => (u.role ?? "").toUpperCase() === role);
  }, [users.data, role]);

  const checkExpiry = async () => {
    setChecking(true);
    try {
      const { data } = await api.post("/monitoring/check-expiry");
      toast.success(
        `${data?.h1_count ?? 0} user H-1, ${data?.h3_count ?? 0} user H-3, ${data?.downgraded_count ?? 0} user downgraded`,
      );
      stats.refetch();
      users.refetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Gagal mengecek expiry");
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <Header title="Monitoring" />
      <AdminSubNav />

      <div className="mb-3 grid grid-cols-2 gap-2">
        <Stat icon="💎" label="Premium" v={stats.data?.total_premium} loading={stats.isLoading} />
        <Stat icon="👑" label="VIP" v={stats.data?.total_vip} loading={stats.isLoading} accent="gold" />
        <Stat icon="⚠️" label="H-3 Expired" v={stats.data?.expiring_h3} loading={stats.isLoading} accent="warn" />
        <Stat icon="🚨" label="H-1 Expired" v={stats.data?.expiring_h1} loading={stats.isLoading} accent="red" />
      </div>

      <div className="mb-3 flex gap-2">
        {(["all", "expiring", "expired"] as TabKey[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`press flex-1 rounded-xl py-2 text-xs font-semibold ${
              tab === t ? "bg-primary text-white" : "bg-white/8 text-white/65"
            }`}
          >
            {t === "all" ? "Semua" : t === "expiring" ? "Akan Expired" : "Sudah Expired"}
          </button>
        ))}
      </div>

      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
        {(["ALL", "PREMIUM", "VIP", "OWNER"] as RoleFilter[]).map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`press shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold ${
              role === r ? "bg-primary text-white" : "bg-white/8 text-white/65"
            }`}
          >
            {r === "ALL" ? "Semua Role" : r}
          </button>
        ))}
      </div>

      <Button full variant="ghost" className="mb-3" loading={checking} onClick={checkExpiry}>
        🔄 Cek Expiry Sekarang
      </Button>

      {users.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : users.isError ? (
        <Card>
          <EmptyState
            icon="⚠️"
            title="Gagal memuat data"
            action={<Button onClick={() => users.refetch()}>Coba lagi</Button>}
          />
        </Card>
      ) : !filtered.length ? (
        <Card>
          <EmptyState icon="📭" title="Tidak ada user" />
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => {
            const d = daysDiff(u.premium_expiry);
            return (
              <Card key={u._id} className="!p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold">{u.username}</p>
                      <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        {u.role}
                      </span>
                    </div>
                    {u.telegram_id && (
                      <p className="text-[11px] text-white/45">ID: {u.telegram_id}</p>
                    )}
                    <div className="mt-1 flex gap-3 text-[11px] text-white/65">
                      <span>🔧 {u.total_fix ?? 0}</span>
                      <span>🪙 {u.coin_balance ?? 0}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <ExpiryBadge expiry={u.premium_expiry} />
                    {d !== null && u.premium_expiry !== null && (
                      <p className="mt-1 text-[10px] text-white/55">
                        {d >= 0 ? `Sisa ${d} hari` : `Expired ${Math.abs(d)} hari lalu`}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
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
  accent?: "gold" | "red" | "warn";
}) {
  const cls =
    accent === "gold"
      ? "text-[#FFB800]"
      : accent === "red"
      ? "text-[#FF453A]"
      : accent === "warn"
      ? "text-[#FFB800]"
      : "text-white";
  return (
    <Card className="!p-3">
      <span className="text-xl">{icon}</span>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/55">{label}</p>
      {loading ? (
        <Skeleton className="mt-1 h-6 w-12" />
      ) : (
        <p className={`text-2xl font-bold tabular-nums ${cls}`}>{v ?? 0}</p>
      )}
    </Card>
  );
}
