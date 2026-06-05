import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

export function Card({
  children,
  className = "",
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`glass rounded-2xl p-4 ${glow ? "shadow-[0_0_20px_rgba(232,25,44,0.25)] border-primary/40" : ""} ${className}`}
      style={glow ? undefined : { boxShadow: "var(--shadow-glass)" }}
    >
      {children}
    </div>
  );
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "secondary";
  full?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button(
  { variant = "primary", full, loading, className = "", children, ...rest },
  ref,
) {
  const base =
    "press inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-12 px-5 text-[15px]";
  const variants: Record<string, string> = {
    primary:
      "text-white bg-[linear-gradient(135deg,#E8192C,#B5001E)] shadow-[0_8px_24px_rgba(232,25,44,0.4)]",
    secondary: "text-white bg-white/10 border border-white/10",
    ghost: "text-primary border border-primary/60 bg-transparent",
    danger:
      "text-white bg-[linear-gradient(135deg,#FF453A,#B5001E)]",
  };
  return (
    <button
      ref={ref}
      {...rest}
      disabled={loading || rest.disabled}
      className={`${base} ${variants[variant]} ${full ? "w-full" : ""} ${className}`}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {children}
    </button>
  );
});

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...rest }, ref) {
    return (
      <input
        ref={ref}
        {...rest}
        className={`h-12 w-full rounded-xl border border-white/10 bg-white/7 px-4 text-[15px] text-white placeholder:text-white/35 outline-none transition-colors focus:border-primary ${className}`}
        style={{ background: "rgba(255,255,255,0.07)" }}
      />
    );
  },
);

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-white/55">
      {children}
    </label>
  );
}

export function Progress({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,#E8192C,#FF6B7A)] transition-[width] duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-white/5 ${className}`}
    />
  );
}

export function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition-colors ${checked ? "bg-success" : "bg-white/15"}`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`}
      />
    </button>
  );
}

export function EmptyState({
  icon = "📭",
  title,
  hint,
  action,
}: {
  icon?: string;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 text-5xl">{icon}</div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {hint && <p className="mt-1 text-sm text-white/55">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
