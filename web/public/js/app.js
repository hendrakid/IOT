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
