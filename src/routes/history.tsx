import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Card, EmptyState, Skeleton, Button } from "@/components/ui-bits";
import { BottomSheet } from "@/components/BottomSheet";
import { api } from "@/lib/api";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
});

interface HistItem {
  _id: string;
  nomor: string;
  template_name: string;
  gmail_sender: string;
  status: "sent" | "failed";
  reply_status?: "pending" | "replied" | "timeout";
  appeal_id?: string;
  timestamp_wib: string;
  error_message?: string;
  tracking_id?: string;
}

const FILTERS = [
  { k: "all", label: "Semua" },
  { k: "sent", label: "Berhasil ✅" },
  { k: "failed", label: "Gagal ❌" },
] as const;

function HistoryPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["k"]>("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<HistItem | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery<{
    items: HistItem[];
    hasMore: boolean;
  }>({
    queryKey: ["history", filter, page],
    queryFn: async () =>
      (
        await api.get("/fix/history", {
          params: { status: filter === "all" ? undefined : filter, page },
        })
      ).data,
    placeholderData: (prev) => prev,
  });

  return (
    <>
      <Header title="Riwayat Fix" />

      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.k}
            onClick={() => {
              setFilter(f.k);
              setPage(1);
            }}
            className={`press shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold ${filter === f.k ? "bg-primary text-white" : "bg-white/8 text-white/70"}`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={() => refetch()}
          className="press ml-auto shrink-0 rounded-full bg-white/8 px-3 py-1.5 text-xs"
        >
          {isFetching ? "↻" : "🔄"}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : !data?.items?.length ? (
        <EmptyState
          icon="📭"
          title="Belum ada riwayat fix"
          hint="Mulai fix pertama Anda untuk melihat riwayat di sini."
        />
      ) : (
        <ul className="space-y-2">
          {data.items.map((it, i) => (
            <motion.li
              key={it._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <button
                onClick={() => setOpen(it)}
                className="press w-full text-left"
              >
                <Card className="!p-3 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base ${it.status === "sent" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}
                  >
                    {it.status === "sent" ? "✅" : "❌"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{it.nomor}</p>
                    <p className="truncate text-xs text-white/55">
                      {it.template_name}
                    </p>
                    <p className="truncate text-[11px] text-white/40">
                      {it.gmail_sender}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 text-[11px] text-white/45">
                    <span>{it.timestamp_wib}</span>
                    <ReplyBadge status={it.reply_status} />
                    {it.appeal_id && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {it.appeal_id}
                      </span>
                    )}
                  </div>
                </Card>
              </button>
            </motion.li>
          ))}
        </ul>
      )}

      {data?.hasMore && (
        <Button
          variant="secondary"
          full
          className="mt-4"
          onClick={() => setPage((p) => p + 1)}
        >
          Muat Lebih Banyak
        </Button>
      )}

      <BottomSheet
        open={!!open}
        onClose={() => setOpen(null)}
        title="Detail Fix"
      >
        {open && (
          <div className="space-y-3 text-sm">
            <Detail k="Nomor" v={open.nomor} />
            <Detail k="Template" v={open.template_name} />
            <Detail k="Pengirim" v={open.gmail_sender} />
            <Detail k="Waktu" v={open.timestamp_wib} />
            <Detail
              k="Status"
              v={open.status === "sent" ? "Berhasil" : "Gagal"}
            />
            {open.tracking_id && <Detail k="Tracking" v={open.tracking_id} mono />}
            {open.appeal_id && <Detail k="Appeal ID" v={open.appeal_id} />}
            {open.error_message && (
              <Detail k="Error" v={open.error_message} />
            )}
            <div className="pt-2">
              <span className="text-white/50">Balasan: </span>
              <ReplyBadge status={open.reply_status} />
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  );
}

function ReplyBadge({ status }: { status?: HistItem["reply_status"] }) {
  if (status === "replied")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
        <span className="h-1.5 w-1.5 animate-[pulse-dot_1.4s_infinite] rounded-full bg-success" />
        📬 Ada Balasan!
      </span>
    );
  if (status === "timeout")
    return (
      <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">
        ⏰ Timeout
      </span>
    );
  return (
    <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-bold text-white/60">
      ⏳ Menunggu
    </span>
  );
}

function Detail({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-divider pb-2">
      <span className="text-white/50">{k}</span>
      <span className={`text-right ${mono ? "font-mono text-xs" : ""}`}>
        {v}
      </span>
    </div>
  );
}
