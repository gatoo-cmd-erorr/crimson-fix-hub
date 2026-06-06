import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";
import { Card, Button, Input, Label } from "@/components/ui-bits";
import { BottomSheet } from "@/components/BottomSheet";
import { api } from "@/lib/api";
import { tgHaptic } from "@/lib/telegram";
import { LimitExceededCard } from "@/components/LimitExceededCard";

export const Route = createFileRoute("/fix")({
  component: FixPage,
});

interface Template {
  _id: string;
  name: string;
  to_email: string;
  subject: string;
  body: string;
}

function normalizeNomor(raw: string) {
  let n = raw.replace(/\D/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  if (n.startsWith("62")) return "+" + n;
  return n ? "+" + n : "";
}

function FixPage() {
  const navigate = useNavigate();
  const [nomor, setNomor] = useState("");
  const [random, setRandom] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<
    | { ok: true; tracking_id: string; sender: string; ts: string }
    | { ok: false; error: string }
    | null
  >(null);
  const [cooldown, setCooldown] = useState(0);

  const limits = useQuery<{
    remaining: number;
    unlimited: boolean;
    reset_label?: string;
  }>({
    queryKey: ["fix-limits"],
    queryFn: async () => (await api.get("/user/home-stats")).data,
    refetchOnWindowFocus: false,
  });

  const tpl = useQuery<Template>({
    queryKey: ["template-random", random],
    queryFn: async () => (await api.get("/template/random")).data,
    enabled: random,
  });

  const cdQ = useQuery<{ ms: number }>({
    queryKey: ["fix-cooldown"],
    queryFn: async () => (await api.get("/fix/cooldown")).data,
    refetchInterval: cooldown > 0 ? 1000 : false,
  });

  useEffect(() => {
    if (cdQ.data?.ms != null) setCooldown(Math.max(0, Math.floor(cdQ.data.ms / 1000)));
  }, [cdQ.data]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const normalized = useMemo(() => normalizeNomor(nomor), [nomor]);
  const isValid = normalized.length >= 11;

  const preview = useMemo(() => {
    if (!tpl.data) return null;
    const sample = normalized || "+62xxxxxxxxxx";
    return {
      to: tpl.data.to_email,
      subject: tpl.data.subject.replaceAll("{nomor}", sample),
      nomor: sample,
    };
  }, [tpl.data, normalized]);

  const submit = async () => {
    if (!isValid) return toast.error("Nomor tidak valid");
    if (cooldown > 0) return;
    if (limits.data && !limits.data.unlimited && limits.data.remaining <= 0) {
      tgHaptic("error");
      toast.error("⚠️ Limit habis! Hubungi owner untuk upgrade.", {
        duration: 4000,
        style: { background: "#FF9F0A", color: "#fff" },
      });
      return;
    }
    setSending(true);
    try {
      const { data } = await api.post("/fix/send", {
        nomor: normalized,
        template_id: tpl.data?._id,
        random,
      });
      tgHaptic("success");
      setResult({
        ok: true,
        tracking_id: data.tracking_id,
        sender: data.gmail_sender,
        ts: data.timestamp_wib,
      });
      setCooldown(Math.floor((data.cooldown_ms ?? 180000) / 1000));
      limits.refetch();
    } catch (err: any) {
      tgHaptic("error");
      setResult({
        ok: false,
        error:
          err?.response?.data?.message ||
          err?.message ||
          "Gagal mengirim",
      });
    } finally {
      setSending(false);
    }
  };

  const limitOut = limits.data && !limits.data.unlimited && limits.data.remaining <= 0;

  const mm = Math.floor(cooldown / 60)
    .toString()
    .padStart(2, "0");
  const ss = (cooldown % 60).toString().padStart(2, "0");

  return (
    <>
      <Header title="Fix Nomor" />

      {limitOut ? (
        <LimitExceededCard resetLabel={limits.data?.reset_label ?? "00:00 WIB"} />
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="space-y-5">
            <div>
              <Label>Nomor yang ingin difix</Label>
              <Input
                type="tel"
                placeholder="08xxxxxxxxxx"
                value={nomor}
                onChange={(e) => setNomor(e.target.value)}
                inputMode="tel"
              />
              {nomor && !isValid && (
                <p className="mt-1 text-xs text-danger">Nomor terlalu pendek</p>
              )}
              {isValid && (
                <p className="mt-1 text-xs text-white/45">
                  Akan dikirim sebagai {normalized}
                </p>
              )}
            </div>

            <div>
              <Label>Template Email</Label>
              <button
                onClick={() => {
                  setRandom(true);
                  tpl.refetch();
                  tgHaptic("light");
                }}
                className={`press h-11 rounded-xl border px-4 text-sm font-semibold ${random ? "border-primary bg-primary text-white" : "border-white/10 bg-white/5 text-white/70"}`}
              >
                🎲 RANDOM
              </button>
              {tpl.data && (
                <Card className="mt-3 !bg-white/3 text-xs">
                  <div className="mb-1 font-semibold text-white/55">
                    {tpl.data.name}
                  </div>
                  <div className="space-y-1 text-white/70">
                    <div>
                      <span className="text-white/40">To:</span> {preview?.to}
                    </div>
                    <div>
                      <span className="text-white/40">Subject:</span>{" "}
                      {preview?.subject}
                    </div>
                    <div className="mt-2 whitespace-pre-wrap rounded-lg bg-black/30 p-2 text-white/65">
                      {preview?.body}
                    </div>
                  </div>
                </Card>
              )}
            </div>

            <div>
              <Label>Gmail Pengirim</Label>
              <p className="text-xs text-white/55">
                Dipilih otomatis (round-robin) saat dikirim
              </p>
            </div>

            {cooldown > 0 && (
              <div className="rounded-xl bg-warning/10 px-3 py-2 text-center text-sm font-semibold text-warning">
                Cooldown: {mm}:{ss}
              </div>
            )}

            <Button
              full
              loading={sending}
              disabled={cooldown > 0 || !isValid}
              onClick={submit}
            >
              📤 KIRIM FIX
            </Button>
          </Card>
        </motion.div>
      )}

      <BottomSheet
        open={!!result}
        onClose={() => setResult(null)}
        title={result?.ok ? "Fix Berhasil" : "Fix Gagal"}
      >
        {result?.ok ? (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 320 }}
              className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-3xl"
            >
              ✅
            </motion.div>
            <h3 className="text-lg font-bold">Fix Berhasil!</h3>
            <div className="mt-4 space-y-2 text-left text-sm">
              <Row k="Tracking ID" v={result.tracking_id} mono />
              <Row k="Pengirim" v={result.sender} />
              <Row k="Waktu" v={result.ts} />
            </div>
            <Button full className="mt-5" onClick={() => setResult(null)}>
              Selesai
            </Button>
          </div>
        ) : result ? (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-danger/20 text-3xl"
            >
              ❌
            </motion.div>
            <h3 className="text-lg font-bold">Gagal</h3>
            <p className="mt-2 text-sm text-white/65">{result.error}</p>
            <Button
              variant="ghost"
              full
              className="mt-5"
              onClick={() => setResult(null)}
            >
              Coba Lagi
            </Button>
          </div>
        ) : null}
      </BottomSheet>
    </>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-divider pb-2">
      <span className="text-white/50">{k}</span>
      <span className={`text-right ${mono ? "font-mono text-xs" : ""}`}>
        {v}
      </span>
    </div>
  );
}
