// Device fingerprint utility — collected client-side, validated server-side.
// Stable per browser/device. Stored in localStorage to be consistent across reloads.

const KEY = "fm_device_fp";

async function sha256Hex(input: string): Promise<string> {
  try {
    const buf = new TextEncoder().encode(input);
    const hash = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    // Fallback simple hash
    let h = 0;
    for (let i = 0; i < input.length; i++) {
      h = (h << 5) - h + input.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h).toString(16);
  }
}

function canvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "no-canvas";
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(0, 0, 200, 50);
    ctx.fillStyle = "#069";
    ctx.fillText("FixMerah-FP-🔧", 2, 2);
    ctx.fillStyle = "rgba(102,204,0,0.7)";
    ctx.fillText("FixMerah-FP-🔧", 4, 4);
    return canvas.toDataURL().slice(-64);
  } catch {
    return "no-canvas-err";
  }
}

export async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === "undefined") return "ssr";
  const cached = localStorage.getItem(KEY);
  if (cached) return cached;

  const parts = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency ?? 0,
    (navigator as any).deviceMemory ?? 0,
    canvasFingerprint(),
  ].join("|");

  const fp = await sha256Hex(parts);
  localStorage.setItem(KEY, fp);
  return fp;
}

// Sync getter (returns cached only, empty string if not cached yet)
export function getCachedFingerprint(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(KEY) ?? "";
}

// Initialize early so the cache is populated for sync access
export function initFingerprint() {
  getDeviceFingerprint().catch(() => {});
}
