import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";
import { Card, Progress, Skeleton, Button } from "@/components/ui-bits";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/referral")({
  component: ReferralPage,
});

interface RefData {
  link: string;
  totalInvited: number;
  needed: number;
  bonusFix: number;
  bonusChecks: number;
}
interface LeaderRow {
  user_id: string;
  username: string;
  total_invited: number;
}

function ReferralPage() {
  const { user } = useAuth();
  const my = useQuery<RefData>({
    queryKey: ["referral-my"],
    queryFn: async () => (await api.get("/referral/my")).data,
  });
  const lb = useQuery<LeaderRow[]>({
    queryKey: ["referral-lb"],
    queryFn: async () => (await api.get("/referral/leaderboard")).data,
  });

  const copy = async () => {
    if (!my.data) return;
    try {
      await navigator.clipboard.writeText(my.data.link);
      toast.success("Link disalin");
    } catch {
      toast.error("Gagal menyalin");
    }
  };
  const share = async () => {
    if (!my.data) return;
    try {
      await (navigator as any).share?.({
        title: "Fix Merah",
        text: "Yuk gabung Fix Merah!",
        url: my.data.link,
      });
    } catch {
      copy();
    }
  };

  return (
    <>
      <Header title="Program Referral" />

      <Card glow className="mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
          Link Referral
        </p>
        {my.isLoading ? (
          <Skeleton className="mt-2 h-5 w-full" />
        ) : (
          <p className="mt-1 break-all font-mono text-sm text-white">
            {my.data?.link}
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <Button variant="ghost" full onClick={copy}>
            📋 Salin
          </Button>
          <Button full onClick={share}>
            📤 Bagikan
          </Button>
        </div>
      </Card>

      <Card className="mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
          Progress
        </p>
        {my.isLoading ? (
          <Skeleton className="mt-2 h-8" />
        ) : (
          <>
            <p className="mt-1 text-3xl font-bold tabular-nums">
              {my.data?.totalInvited ?? 0}
              <span className="ml-1 text-sm text-white/45">teman bergabung</span>
            </p>
            <div className="mt-3">
              <Progress
                value={(my.data?.totalInvited ?? 0) % (my.data?.needed || 1)}
                max={my.data?.needed || 1}
              />
              <p className="mt-1 text-xs text-white/55">
                {(my.data?.totalInvited ?? 0) % (my.data?.needed || 1)}/
                {my.data?.needed ?? 0} untuk +{my.data?.bonusFix ?? 0} bonus fix
              </p>
            </div>
          </>
        )}
      </Card>

      <Card className="mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-2xl">
            🎁
          </div>
          <div className="flex-1">
            <p className="text-base font-bold">
              +{my.data?.bonusChecks ?? 0} Fix Bonus Tersedia
            </p>
            <p className="text-xs text-white/55">
              Ajak {my.data?.needed ?? 3} teman → +{my.data?.bonusFix ?? 2} fix gratis
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/55">
          Top 5 Leaderboard
        </p>
        {lb.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9" />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-divider">
            {lb.data?.map((row, i) => {
              const self = row.user_id === user?._id;
              return (
                <li
                  key={row.user_id}
                  className={`flex items-center justify-between py-2.5 ${self ? "rounded-lg bg-primary/10 px-2" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-sm font-bold tabular-nums text-white/60">
                      {i === 0 ? "👑" : i + 1}
                    </span>
                    <span className="text-sm font-semibold">
                      {row.username}
                      {self && <span className="ml-1 text-xs text-primary">(kamu)</span>}
                    </span>
                  </div>
                  <span className="text-sm font-bold tabular-nums">
                    {row.total_invited}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
