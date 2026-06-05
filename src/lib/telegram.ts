export function initTelegram() {
  if (typeof window === "undefined") return;
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;
    tg.ready?.();
    tg.expand?.();
    tg.setHeaderColor?.("#000000");
    tg.setBackgroundColor?.("#000000");
  } catch {
    // noop
  }
}

export function tgHaptic(
  type: "light" | "medium" | "heavy" | "success" | "warning" | "error" = "light",
) {
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.HapticFeedback) return;
    if (["success", "warning", "error"].includes(type)) {
      tg.HapticFeedback.notificationOccurred(type);
    } else {
      tg.HapticFeedback.impactOccurred(type);
    }
  } catch {
    // noop
  }
}
