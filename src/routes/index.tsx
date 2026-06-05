import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, Progress, Skeleton } from "@/components/ui-bits";
import { Header } from "@/components/Header";
import { tgHaptic } from "@/lib/telegram";
import { LimitExceededCard } from "@/components/LimitExceededCard";

export const Route = createFileRoute("/")({
  component: HomePage,
});

interface HomeStats {
  daily_used: number;
  daily_limit: number;
  remaining: number;
  unlimited: boolean;
  bonusChecks: number;
  totalInvited: number;
  total_fix: number;
  fix_this_month: number;
  status: "active" | "inactive";
  reset_label?: string;
}

function HomePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery<HomeStats>({
    queryKey: ["home-stats"],
    queryFn: async () => (await api.get("/user/home-stats")).data,
    enabled: !!user,
  });

  if (loading || !user) return null;

  const stagger = (i: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.06, duration: 0.35 },
  });

  return (
    <>
      <Header title="Beranda" />

      <motion.div {...stagger(0)} className="mb-4">
        <h2 className="text-2xl font-bold">
          Halo, {user.username} <span className="inline-block">👋</span>
        </h2>
        <p className="mt-0.5 text-sm text-white/55">
          Bergabung {user.created_at ? new Date(user.created_at).toLocaleDateString("id-ID") : "-"}
        </p>
      </motion.div>

      <motion.div {...stagger(1)}>
        <Card className="mb-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
                Fix Hari Ini
              </p>
              {isLoading ? (
                <Skeleton className="mt-2 h-5 w-24" />
              ) : data?.unlimited ? (
                <p className="mt-1 text-xl font-bold shimmer-text">∞ Unlimited</p>
              ) : (
                <p className="mt-1 text-xl font-bold">
                  {data?.daily_used ?? 0}{" "}
                  <span className="text-sm text-white/40">
                    / {data?.daily_limit ?? 0}
                  </span>
                </p>
              )}
            </div>
            <span className="text-2xl">🔧</span>
          </div>
          {!data?.unlimited && (
            <>
              <Progress
                value={data?.daily_used ?? 0}
                max={data?.daily_limit || 1}
              />
              <div className="mt-2 flex justify-between text-xs text-white/55">
                <span>Sisa: {data?.remaining ?? 0} fix</span>
                <span>Reset {data?.reset_label ?? "00:00 WIB"}</span>
              </div>
            </>
          )}
        </Card>
      </motion.div>

      {user.role === "free" &&
        data &&
        !data.unlimited &&
        data.remaining <= 0 && (
          <motion.div {...stagger(2)} className="mb-3">
            <LimitExceededCard resetLabel={data?.reset_label ?? "00:00 WIB"} />
          </motion.div>
        )}

      <motion.div {...stagger(2)}>
        <Card className="mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-2xl">
              🎁
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
                Bonus Fix
              </p>
              <p className="text-base font-bold">
                +{data?.bonusChecks ?? 0} fix tersedia
              </p>
              <p className="text-xs text-white/40">
                Dari {data?.totalInvited ?? 0} teman yang diajak
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div {...stagger(3)} className="mb-5 grid grid-cols-3 gap-2">
        <MiniStat label="Total" value={data?.total_fix ?? 0} icon="📊" />
        <MiniStat label="Bulan Ini" value={data?.fix_this_month ?? 0} icon="🗓" />
        <Card className="!p-3 flex flex-col items-center text-center">
          <span className="text-lg">⚡</span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/55">
            Status
          </span>
          <span
            className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${data?.status === "active" ? "bg-success/20 text-success" : "bg-white/10 text-white/60"}`}
          >
            {data?.status === "active" ? "AKTIF" : "NONAKTIF"}
          </span>
        </Card>
      </motion.div>

      <motion.button
        {...stagger(4)}
        onClick={() => {
          tgHaptic("medium");
          navigate({ to: "/fix" });
        }}
        className="press w-full animate-pulse-red rounded-xl bg-[linear-gradient(135deg,#0A84FF,#0060CC)] py-4 text-base font-bold text-white"
      >
        🔧 MULAI FIX
      </motion.button>

      {(user.role === "owner" || user.role === "superowner") && (
        <motion.div {...stagger(5)} className="mt-4">
          <Link
            to="/admin/dashboard"
            className="press glass flex items-center justify-between rounded-2xl p-4"
          >
            <span className="font-semibold">👑 Panel Owner</span>
            <span className="text-white/40">›</span>
          </Link>
        </motion.div>
      )}
    </>
  );
}

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <Card className="!p-3 flex flex-col items-center text-center">
      <span className="text-lg">{icon}</span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/55">
        {label}
      </span>
      <span className="mt-0.5 text-base font-bold tabular-nums">{value}</span>
    </Card>
  );
}
