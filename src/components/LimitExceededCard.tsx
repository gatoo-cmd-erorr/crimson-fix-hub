import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { tgHaptic } from "@/lib/telegram";

function openTg(url: string) {
  try {
    const tg = (window as any)?.Telegram?.WebApp;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(url);
      return;
    }
  } catch {
    // noop
  }
  window.open(url, "_blank");
}

export function LimitExceededCard({ resetLabel }: { resetLabel?: string }) {
  const navigate = useNavigate();

  return (
    <div>
      {resetLabel && (
        <p className="mb-3 text-center text-xs text-white/55">
          Reset {resetLabel}
        </p>
      )}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="rounded-2xl p-6"
        style={{
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3xl"
            style={{
              background: "rgba(255,159,10,0.15)",
              animation: "pulse-warning 2.2s ease-in-out infinite",
            }}
          >
            ⚠️
          </div>
          <h3
            className="text-white"
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.5px",
            }}
          >
            LIMIT HABIS!!
          </h3>
          <p
            className="mt-2"
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.65)",
              lineHeight: 1.6,
            }}
          >
            Segera add limit pake referral atau beli PREMIUM/VIP ke owner
          </p>
        </div>

        <div
          className="my-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        />

        <div className="flex flex-col gap-[10px]">
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            onClick={() => {
              tgHaptic("medium");
              openTg("https://t.me/Inonlygabriell");
            }}
            className="press w-full rounded-xl text-[15px] font-bold text-white"
            style={{
              height: 52,
              background: "linear-gradient(135deg,#0A84FF,#0060CC)",
              boxShadow: "0 8px 20px rgba(10,132,255,0.4)",
            }}
          >
            👑 OWNER
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            onClick={() => {
              tgHaptic("light");
              openTg("https://t.me/allinformasibotgb");
            }}
            className="press w-full rounded-xl text-[15px] font-bold text-white"
            style={{
              height: 52,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            CHANNEL UPDATE 🌐
          </motion.button>
        </div>

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          onClick={() => {
            tgHaptic("light");
            navigate({ to: "/referral" });
          }}
          className="mx-auto mt-[14px] block text-center hover:underline"
          style={{ fontSize: 12, color: "#0A84FF" }}
        >
          Atau dapatkan bonus fix gratis via 👥 Referral →
        </motion.button>
      </motion.div>
    </div>
  );
}
