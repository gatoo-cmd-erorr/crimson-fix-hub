import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";
import { Card, Button, Input, Label, Switch, Skeleton } from "@/components/ui-bits";
import { AdminSubNav } from "./admin.dashboard";
import { api } from "@/lib/api";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

interface Settings {
  bot_name: string;
  maintenance_mode: boolean;
  fix_cooldown_ms: number;
  free_daily_limit: number;
  reset_hour_wib: number;
  fix_gratis_open: boolean;
  referral_count_needed: number;
  referral_bonus_fix: number;
  api_url: string;
  api_key: string;
}

const DEFAULT: Settings = {
  bot_name: "Fix Merah",
  maintenance_mode: false,
  fix_cooldown_ms: 180000,
  free_daily_limit: 3,
  reset_hour_wib: 0,
  fix_gratis_open: true,
  referral_count_needed: 3,
  referral_bonus_fix: 2,
  api_url: "https://botfixred.vercel.app/api/send-email",
  api_key: "",
};

function AdminSettings() {
  const [s, setS] = useState<Settings>(DEFAULT);
  const [showKey, setShowKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testRes, setTestRes] = useState<{ ok: boolean; msg: string } | null>(null);

  const { isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data } = await api.get("/admin/settings");
      setS({ ...DEFAULT, ...data });
      return data;
    },
  });

  const save = async () => {
    setBusy(true);
    try {
      await api.post("/admin/settings", s);
      toast.success("Tersimpan");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Gagal");
    } finally {
      setBusy(false);
    }
  };

  const testApi = async () => {
    setTesting(true);
    setTestRes(null);
    try {
      const { data } = await api.post("/admin/settings/test-api");
      setTestRes({ ok: !!data.ok, msg: data.message ?? "OK" });
    } catch (e: any) {
      setTestRes({ ok: false, msg: e?.response?.data?.message ?? "Error" });
    } finally {
      setTesting(false);
    }
  };

  if (isLoading)
    return (
      <>
        <Header title="Pengaturan" />
        <AdminSubNav />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </>
    );

  return (
    <>
      <Header title="Pengaturan" />
      <AdminSubNav />

      <Section title="Bot">
        <Field label="Bot Name">
          <Input value={s.bot_name} onChange={(e) => setS({ ...s, bot_name: e.target.value })} />
        </Field>
        <ToggleRow
          label="Maintenance Mode"
          checked={s.maintenance_mode}
          onChange={(v) => setS({ ...s, maintenance_mode: v })}
        />
      </Section>

      <Section title="Fix Config">
        <Field label="Fix Cooldown (ms)" hint="180000 = 3 menit">
          <Input
            type="number"
            value={s.fix_cooldown_ms}
            onChange={(e) => setS({ ...s, fix_cooldown_ms: +e.target.value })}
          />
        </Field>
        <Field label="FREE Daily Limit">
          <Input
            type="number"
            value={s.free_daily_limit}
            onChange={(e) => setS({ ...s, free_daily_limit: +e.target.value })}
          />
        </Field>
        <Field label="Reset Hour WIB (0-23)">
          <Input
            type="number"
            value={s.reset_hour_wib}
            onChange={(e) => setS({ ...s, reset_hour_wib: +e.target.value })}
          />
        </Field>
        <ToggleRow
          label="Fix Gratis"
          checked={s.fix_gratis_open}
          onChange={(v) => setS({ ...s, fix_gratis_open: v })}
        />
      </Section>

      <Section title="Referral">
        <Field label="Referral Count Needed">
          <Input
            type="number"
            value={s.referral_count_needed}
            onChange={(e) => setS({ ...s, referral_count_needed: +e.target.value })}
          />
        </Field>
        <Field label="Referral Bonus Fix">
          <Input
            type="number"
            value={s.referral_bonus_fix}
            onChange={(e) => setS({ ...s, referral_bonus_fix: +e.target.value })}
          />
        </Field>
      </Section>

      <Section title="API Email">
        <Field label="API URL">
          <Input value={s.api_url} onChange={(e) => setS({ ...s, api_url: e.target.value })} />
        </Field>
        <Field label="API Key">
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              value={s.api_key}
              onChange={(e) => setS({ ...s, api_key: e.target.value })}
            />
            <button
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/55"
            >
              {showKey ? "🙈" : "👁"}
            </button>
          </div>
        </Field>
        <Button variant="secondary" full loading={testing} onClick={testApi}>
          🧪 Test Koneksi API
        </Button>
        {testRes && (
          <div
            className={`rounded-xl px-3 py-2 text-xs ${testRes.ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}
          >
            {testRes.msg}
          </div>
        )}
      </Section>

      <MandatoryJoinSection />



      <button
        onClick={save}
        disabled={busy}
        className="press fixed bottom-24 right-5 z-30 h-14 rounded-full bg-primary px-5 font-bold text-white shadow-[0_8px_24px_rgba(10,132,255,0.5)] disabled:opacity-60"
      >
        {busy ? "..." : "💾 Simpan"}
      </button>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-white/45">
        {title}
      </p>
      <Card className="space-y-3">{children}</Card>
    </div>
  );
}
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-white/40">{hint}</p>}
    </div>
  );
}
function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}
