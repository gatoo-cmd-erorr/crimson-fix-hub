import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
  label?: string;
  className?: string;
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const normalized = status.trim().toLowerCase();

  const toneClass =
    normalized === "ok" || normalized === "active" || normalized === "success"
      ? "border-success/30 bg-success/15 text-success"
      : normalized === "error" || normalized === "inactive" || normalized === "expired"
        ? "border-danger/30 bg-danger/15 text-danger"
        : "border-white/10 bg-white/8 text-white/70";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        toneClass,
        className,
      )}
    >
      {label ?? status}
    </span>
  );
}