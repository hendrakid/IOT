/* app.js — Shared auth utilities for all admin pages */

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/";
}

function authHeaders() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/";
    return {};
  }
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers ?? {}) },
  });
  if (res.status === 401) {
    logout();
    return null;
  }
  return res.json();
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function requireAuth() {
  const token = localStorage.getItem("token");
  if (!token) window.location.href = "/";
  return !!token;
}

let _sseConfigCache = null;

async function loadSseConfig() {
  if (!_sseConfigCache) {
    const res = await fetch("/api/config");
    const json = await res.json();
    if (!json?.success) throw new Error("Failed to load SSE config");
    _sseConfigCache = json.data;
  }
  return _sseConfigCache;
}

/**
 * Build GET /api/scan/stream URL with token and access-point filters.
 * @param {string} token JWT
 * @param {{ accessPointId: number, include?: number[], exclude?: number[] }} opts
 */
function buildScanStreamUrl(token, { accessPointId, include, exclude }) {
  const params = new URLSearchParams();
  params.set("token", token);
  params.set("access_point_id", String(accessPointId));
  if (include?.length) params.set("include", include.join(","));
  if (exclude?.length) params.set("exclude", exclude.join(","));
  return `/api/scan/stream?${params.toString()}`;
}

/** Build GET /api/hardware/stream URL (token in query for EventSource). */
function buildHardwareStreamUrl(token) {
  const params = new URLSearchParams();
  params.set("token", token);
  return `/api/hardware/stream?${params.toString()}`;
}

/** Consider node offline if last_seen_at is older than thresholdMs (default 2 min). */
function isNodeOnline(status, thresholdMs = 120_000) {
  if (!status) return false;
  if (!status.online) return false;
  if (!status.last_seen_at) return false;
  return Date.now() - new Date(status.last_seen_at).getTime() < thresholdMs;
}

// Highlight active nav link based on current path
document.addEventListener("DOMContentLoaded", () => {
  requireAuth();
  const path = window.location.pathname;
  document.querySelectorAll("[data-nav]").forEach((el) => {
    if (el.dataset.nav === path) {
      el.classList.add("bg-slate-700", "text-white");
      el.classList.remove("text-slate-400");
    }
  });
});
