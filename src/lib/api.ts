import axios from "axios";
import { getCachedFingerprint } from "./fingerprint";

export const API_BASE = "https://web-production-e5414.up.railway.app";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("fm_token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Device fingerprint header (anti-cheat)
  try {
    const fp = getCachedFingerprint();
    if (fp) config.headers["x-device-fp"] = fp;
  } catch {
    // ignore
  }

  try {
    const tg = (window as any)?.Telegram?.WebApp;
    if (tg?.initData) config.headers["x-tg-init-data"] = tg.initData;
  } catch {
    // ignore
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status;
    const data = err?.response?.data;

    // Mandatory join required → broadcast event so global gate can show modal
    if (status === 403 && data?.message === "mandatory_join_required") {
      try {
        window.dispatchEvent(
          new CustomEvent("mandatory-join-required", {
            detail: { missing: data.missing_channels ?? [] },
          }),
        );
      } catch {
        // ignore
      }
    }

    if (status === 401) {
      localStorage.removeItem("fm_token");
      localStorage.removeItem("fm_user");
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.endsWith("/login")
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);
