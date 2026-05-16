/* dashboard.js — Alpine.js data + SSE client for Smart Lock Admin */

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
  if (!iso) return "";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function dashboard() {
  return {
    tab: "cards",

    // Cards
    cards: [],
    cardsMeta: { total: 0 },
    cardsPage: 1,
    cardsLimit: 20,
    form: { card_uid: "", label: "", user_id: "" },
    cardLoading: false,
    cardError: "",
    cardSuccess: "",

    // Users
    users: [],
    userForm: { name: "", email: "", role: "member" },
    userLoading: false,
    userError: "",
    userSuccess: "",

    // Attendance
    attendance: [],
    attendanceMeta: { total: 0 },
    attendancePage: 1,

    // SSE
    sseConnected: false,
    _eventSource: null,
    sseToast: "",
    sseToastType: "info", // "info" | "success"
    _toastTimer: null,

    async init() {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/";
        return;
      }
      await Promise.all([this.loadUsers(), this.loadCards()]);
      this.connectSSE();
    },

    connectSSE() {
      const token = localStorage.getItem("token");
      if (!token) return;

      // SSE doesn't support custom headers; pass token as query param
      const es = new EventSource(`/api/scan/stream?token=${encodeURIComponent(token)}`);
      this._eventSource = es;

      es.onopen = () => { this.sseConnected = true; };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (!data.uid) return;

          if (data.registered === false) {
            // Unregistered card: pre-fill registration form and switch to cards tab
            this.form.card_uid = data.uid;
            this.tab = "cards";
            this.showToast(`Kartu baru terdeteksi (${data.uid}) — lengkapi data registrasi`, "info");
          } else if (data.registered === true) {
            // Known card: show attendance notification
            const who = data.user_name ? ` — ${data.user_name}` : "";
            this.showToast(`Kehadiran tercatat${who} (${data.uid})`, "success");
          }
        } catch (_) { /* ignore malformed events */ }
      };

      es.onerror = () => {
        this.sseConnected = false;
        es.close();
        // Reconnect after 5 seconds
        setTimeout(() => this.connectSSE(), 5000);
      };
    },

    showToast(message, type = "info") {
      this.sseToast = message;
      this.sseToastType = type;
      if (this._toastTimer) clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => { this.sseToast = ""; }, 5000);
    },

    async loadCards() {
      const json = await apiFetch(`/api/cards?page=${this.cardsPage}&limit=${this.cardsLimit}`);
      if (json?.success) {
        this.cards = json.data;
        this.cardsMeta = json.meta;
      }
    },

    async registerCard() {
      this.cardLoading = true;
      this.cardError = "";
      this.cardSuccess = "";

      try {
        const json = await apiFetch("/api/cards", {
          method: "POST",
          body: JSON.stringify({
            card_uid: this.form.card_uid,
            label: this.form.label,
            user_id: parseInt(this.form.user_id, 10),
          }),
        });

        if (!json?.success) {
          this.cardError = json?.error ?? "Gagal mendaftarkan kartu";
          return;
        }

        this.cardSuccess = `Kartu ${this.form.card_uid} berhasil didaftarkan!`;
        this.form = { card_uid: "", label: "", user_id: "" };
        await this.loadCards();
      } catch (err) {
        this.cardError = err.message;
      } finally {
        this.cardLoading = false;
      }
    },

    async deleteCard(id, uid) {
      if (!confirm(`Hapus kartu ${uid}? Tindakan ini tidak dapat dibatalkan.`)) return;

      const json = await apiFetch(`/api/cards/${id}`, { method: "DELETE" });
      if (json?.success) {
        await this.loadCards();
      } else {
        alert(json?.error ?? "Gagal menghapus kartu");
      }
    },

    async loadUsers() {
      const json = await apiFetch("/api/users");
      if (json?.success) {
        this.users = json.data;
      }
    },

    async createUser() {
      this.userLoading = true;
      this.userError = "";
      this.userSuccess = "";

      try {
        const json = await apiFetch("/api/users", {
          method: "POST",
          body: JSON.stringify(this.userForm),
        });

        if (!json?.success) {
          this.userError = json?.error ?? "Gagal menambah pengguna";
          return;
        }

        this.userSuccess = `Pengguna ${this.userForm.name} berhasil ditambahkan!`;
        this.userForm = { name: "", email: "", role: "member" };
        await this.loadUsers();
      } catch (err) {
        this.userError = err.message;
      } finally {
        this.userLoading = false;
      }
    },

    async loadAttendance() {
      const json = await apiFetch(`/api/attendance?page=${this.attendancePage}&limit=20`);
      if (json?.success) {
        this.attendance = json.data;
        this.attendanceMeta = json.meta;
      }
    },

    formatDate,
  };
}
