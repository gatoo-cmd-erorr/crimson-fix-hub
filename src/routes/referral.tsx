import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";
import { Card, Button, Skeleton, EmptyState } from "@/components/ui-bits";
import { BottomSheet } from "@/components/BottomSheet";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tgHaptic } from "@/lib/telegram";

export const Route = createFileRoute("/referral")({
  component: ReferralPage,
});

interface RefData {
  link: string;
  coin_balance: number;
  total_coins_earned: number;
  total_coins_spent: number;
  confirmed_referrals: number;
  pending_referrals?: number;
}

interface LeaderRow {
  user_id: string;
  username: string;
  total_coins_earned: number;
}

interface CoinTx {
  _id: string;
  type: "earn" | "spend";
  amount: number;
  reason: string;
  timestamp: string;
}

const REDEEM_COST = 3;
const PREMIUM_PACKS = [
  { days: 1, coins: 5, label: "1 Hari" },
  { days: 3, coins: 12, label: "3 Hari" },
  { days: 7, coins: 20, label: "7 Hari" },
  { days: 30, coins: 50, label: "30 Hari" },
] as const;

function ReferralPage() {
  const { user } = useAuth();
  const [confirm, setConfirm] = useState<
    | { kind: "redeem" }
    | { kind: "premium"; days: number; coins: number }
    | null
  >(null);
  const [busy, setBusy] = useState(false);

  const my = useQuery<RefData>({
    queryKey: ["referral-my"],
    queryFn: async () => (await api.get("/referral/my")).data,
  });

  const lb = useQuery<LeaderRow[]>({
    queryKey: ["referral-lb"],
    queryFn: async () => (await api.get("/referral/leaderboard")).data,
  });

  const txs = useQuery<CoinTx[]>({
    queryKey: ["referral-tx"],
    queryFn: async () => (await api.get("/referral/transactions")).data,
  });

  const balance = my.data?.coin_balance ?? 0;

  const copy = async () => {
    if (!my.data) return;
    try {
      await navigator.clipboard.writeText(my.data.link);
      toast.success("Link disalin");
      tgHaptic("success");
    } catch {
      toast.error("Gagal menyalin");
    }
  };

  const share = async () => {
    if (!my.data) return;
    try {
      const tg = (window as any)?.Telegram?.WebApp;
      if (tg?.openTelegramLink) {
        tg.openTelegramLink(
          `https://t.me/share/url?url=${encodeURIComponent(my.data.link)}&text=${encodeURIComponent("Yuk gabung Fix Merah!")}`,
        );
        return;
      }
      await (navigator as any).share?.({
        title: "Fix Merah",
        text: "Yuk gabung Fix Merah!",
        url: my.data.link,
      });
    } catch {
      copy();
    }
  };

  const doRedeem = async () => {
    setBusy(true);
    try {
      await api.post("/referral/redeem-fix");
      toast.success("✅ +1 Fix bonus ditambahkan!");
      tgHaptic("success");
      my.refetch();
      txs.refetch();
      setConfirm(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Gagal redeem");
      tgHaptic("error");
    } finally {
      setBusy(false);
    }
  };

  const doBuyPremium = async (days: number) => {
    setBusy(true);
    try {
      const { data } = await api.post("/referral/buy-premium", {
        duration_days: days,
      });
      toast.success(
        `✅ Premium aktif! Berakhir: ${data?.expiry ? new Date(data.expiry).toLocaleDateString("id-ID") : days + " hari"}`,
      );
      tgHaptic("success");
      my.refetch();
      txs.refetch();
      setConfirm(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Gagal beli premium");
      tgHaptic("error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header title="Program Referral" />

      {/* Card 1 — Coin Balance */}
      <Card glow className="mb-3 text-center">
        <div className="mb-2 text-4xl">🪙</div>
        {my.isLoading ? (
          <Skeleton className="mx-auto h-10 w-32" />
        ) : (
          <motion.div
            key={balance}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 280 }}
            className="text-4xl font-black tabular-nums text-primary"
          >
            {balance.toLocaleString("id-ID")}
            <span className="ml-2 text-sm font-bold text-white/65">Koin</span>
          </motion.div>
        )}
        <p className="mt-2 text-[11px] text-white/55">
          Total earned: <span className="text-success">+{my.data?.total_coins_earned ?? 0}</span>{" "}
          · Spent:{" "}
          <span className="text-warning">−{my.data?.total_coins_spent ?? 0}</span>
        </p>
      </Card>

      {/* Card 2 — Referral Link */}
      <Card className="mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
          Link Referral
        </p>
        {my.isLoading ? (
          <Skeleton className="mt-2 h-5 w-full" />
        ) : (
          <p className="mt-1 break-all font-mono text-xs text-white">
            {my.data?.link}
          </p>
        )}
        <div className="mt-3 flex gap-2">
          <Button variant="ghost" full onClick={copy}>
            📋 Salin
          </Button>
          <Button full onClick={share}>
            📤 Bagikan
          </Button>
        </div>
        <div className="mt-3 rounded-xl bg-white/5 px-3 py-2 text-xs">
          <p className="font-semibold text-white">
            {my.data?.confirmed_referrals ?? 0} teman valid ✓
          </p>
          <p className="mt-0.5 text-[11px] text-white/50">
            Koin diberikan setelah teman melakukan fix pertama
          </p>
        </div>
      </Card>

      {/* Card 3 — Redeem Fix */}
      <Card className="mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15 text-2xl">
            🔧
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold">Tukar Koin → Fix Bonus</p>
            <p className="text-[11px] text-white/55">
              {REDEEM_COST} koin = 1 fix bonus
            </p>
          </div>
        </div>
        <Button
          full
          className="mt-3"
          disabled={balance < REDEEM_COST}
          onClick={() => {
            tgHaptic("light");
            setConfirm({ kind: "redeem" });
          }}
        >
          🔧 Tukar {REDEEM_COST} Koin → +1 Fix
        </Button>
        {balance < REDEEM_COST && (
          <p className="mt-2 text-center text-[11px] text-warning">
            Butuh {REDEEM_COST - balance} koin lagi
          </p>
        )}
      </Card>

      {/* Card 4 — Beli Premium */}
      <Card className="mb-3">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/55">
          💎 Beli Premium dengan Koin
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PREMIUM_PACKS.map((p) => {
            const ok = balance >= p.coins;
            return (
              <button
                key={p.days}
                disabled={!ok}
                onClick={() => {
                  tgHaptic("light");
                  setConfirm({ kind: "premium", days: p.days, coins: p.coins });
                }}
                className={`press flex flex-col items-center justify-center gap-1 rounded-xl border p-3 text-center transition-all ${
                  ok
                    ? "border-primary/40 bg-[linear-gradient(135deg,rgba(10,132,255,0.18),rgba(10,132,255,0.05))] text-white shadow-[0_4px_14px_rgba(10,132,255,0.25)]"
                    : "border-white/8 bg-white/5 text-white/40 cursor-not-allowed"
                }`}
              >
                <span className="text-base font-bold">{p.label}</span>
                <span className="text-[11px] font-semibold">
                  🪙 {p.coins} Koin
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Card 5 — Riwayat Koin */}
      <Card className="mb-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/55">
          Riwayat Koin
        </p>
        {txs.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : !txs.data?.length ? (
          <EmptyState icon="📭" title="Belum ada transaksi" />
        ) : (
          <ul className="divide-y divide-divider">
            {txs.data.slice(0, 5).map((t) => (
              <li
                key={t._id}
                className="flex items-center justify-between gap-2 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-base">
                    {t.type === "earn" ? "📥" : "📤"}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{t.reason}</p>
                    <p className="text-[10px] text-white/45">
                      {new Date(t.timestamp).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
                <span
                  className={`flex-shrink-0 text-sm font-bold tabular-nums ${
                    t.type === "earn" ? "text-success" : "text-warning"
                  }`}
                >
                  {t.type === "earn" ? "+" : "−"}
                  {t.amount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Card 6 — Leaderboard */}
      <Card>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/55">
          🏆 Top 5 Leaderboard
        </p>
        {lb.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9" />
            ))}
          </div>
        ) : !lb.data?.length ? (
          <EmptyState icon="🏆" title="Belum ada data" />
        ) : (
          <ul className="divide-y divide-divider">
            {lb.data.slice(0, 5).map((row, i) => {
              const self = row.user_id === user?._id;
              return (
                <li
                  key={row.user_id}
                  className={`flex items-center justify-between py-2.5 ${self ? "rounded-lg bg-primary/10 px-2" : ""}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-6 text-center text-sm font-bold tabular-nums text-white/60">
                      {i === 0 ? "👑" : i + 1}
                    </span>
                    <span className="truncate text-sm font-semibold">
                      {row.username}
                      {self && (
                        <span className="ml-1 text-xs text-primary">(kamu)</span>
                      )}
                    </span>
                  </div>
                  <span className="flex-shrink-0 text-sm font-bold tabular-nums text-primary">
                    🪙 {row.total_coins_earned}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Confirm modal */}
      <BottomSheet
        open={!!confirm}
        onClose={() => !busy && setConfirm(null)}
        title="Konfirmasi"
      >
        {confirm?.kind === "redeem" && (
          <div className="text-center">
            <div className="mb-3 text-4xl">🔧</div>
            <p className="text-base font-bold">Tukar {REDEEM_COST} koin → 1 fix bonus?</p>
            <p className="mt-1 text-xs text-white/55">
              Saldo akan menjadi {balance - REDEEM_COST} koin
            </p>
            <div className="mt-5 flex gap-2">
              <Button variant="ghost" full onClick={() => setConfirm(null)}>
                Batal
              </Button>
              <Button full loading={busy} onClick={doRedeem}>
                Tukar
              </Button>
            </div>
          </div>
        )}
        {confirm?.kind === "premium" && (
          <div className="text-center">
            <div className="mb-3 text-4xl">💎</div>
            <p className="text-base font-bold">
              Beli premium {confirm.days} hari seharga {confirm.coins} koin?
            </p>
            <p className="mt-1 text-xs text-white/55">
              Saldo akan menjadi {balance - confirm.coins} koin
            </p>
            <div className="mt-5 flex gap-2">
              <Button variant="ghost" full onClick={() => setConfirm(null)}>
                Batal
              </Button>
              <Button
                full
                loading={busy}
                onClick={() => doBuyPremium(confirm.days)}
              >
                Beli
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
