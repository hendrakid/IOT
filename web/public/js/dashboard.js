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
    userForm: { name: "", email: "", role: "member", access_point_ids: [] },
    userLoading: false,
    userError: "",
    userSuccess: "",
  // Access Points for user form
  accessPoints: [],

    // Attendance
    attendance: [],
    attendanceMeta: { total: 0 },
    attendancePage: 1,

    // Access Checker
    accessCheck: {
      card_uid: "",
      accessPoints: [],
      allowedIds: [],
      error: "",
      _resetTimer: null,
      _lastUid: ""
    },


    // SSE
    sseConnected: false,
    _eventSource: null,
    sseToast: "",
    sseToastType: "info", // "info" | "success"
    _toastTimer: null,
    // SSE filter state
    sseInclude: [1], // e.g. [1,2,3] for User Management
    sseExclude: [1], // e.g. [1,2,3] for Access Logs

    getSseAccessPointId() {
      const pickValidId = (items) => {
        if (!Array.isArray(items)) return null;
        for (const item of items) {
          const id = Number(item);
          if (Number.isInteger(id) && id > 0) return id;
        }
        return null;
      };

      return pickValidId(this.sseInclude) ?? pickValidId(this.sseExclude);
    },

    async init() {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/";
        return;
      }
      await Promise.all([this.loadUsers(), this.loadCards(), this.loadAccessPoints()]);
      this.connectSSE();
    },
    async loadAccessPoints() {
      const json = await apiFetch("/api/access-points");
      if (json?.accessPoints) {
        this.accessCheck.accessPoints = json.accessPoints;
        this.accessPoints = json.accessPoints;
      }
    },

    async checkCardAccess() {
      this.accessCheck.error = "";
      this.accessCheck.allowedIds = [];
      if (!this.accessCheck.card_uid) return;
      // Find card by UID
      let card = this.cards.find(c => c.card_uid === this.accessCheck.card_uid);
      if (!card) {
        // Try fetch from API if not in local list
        const json = await apiFetch(`/api/cards?uid=${this.accessCheck.card_uid}`);
        if (json?.data?.length) card = json.data[0];
      }
      if (!card) {
        this.accessCheck.error = "Kartu tidak ditemukan.";
        this._resetAccessCheckTimer();
        return;
      }
      // Fetch allowed access points
      const json = await apiFetch(`/api/access-points/card/${card.id}`);
      if (json?.accessPoints) {
        this.accessCheck.allowedIds = json.accessPoints.map(ap => ap.id);
        this.accessCheck._lastUid = this.accessCheck.card_uid;
        this._resetAccessCheckTimer();
      } else {
        this.accessCheck.error = "Gagal mengambil data akses.";
        this._resetAccessCheckTimer();
      }
    },

    _resetAccessCheckTimer() {
      // Reset highlight after 2 seconds if no new card tap
      if (this.accessCheck._resetTimer) clearTimeout(this.accessCheck._resetTimer);
      this.accessCheck._resetTimer = setTimeout(() => {
        // Only reset if card_uid hasn't changed
        if (this.accessCheck.card_uid === this.accessCheck._lastUid) {
          this.accessCheck.allowedIds = [];
          this.accessCheck.card_uid = "";
          this.accessCheck.error = "";
        }
      }, 2000);
    },


    connectSSE() {
      // Always close previous SSE connection if exists
      if (this._eventSource) {
        this._eventSource.close();
        this._eventSource = null;
      }
      const token = localStorage.getItem("token");
      if (!token) return;

      // Build SSE URL with location filter from sseInclude/sseExclude
      let params = [`token=${encodeURIComponent(token)}`];
      const accessPointId = this.getSseAccessPointId();
      if (!accessPointId) {
        this.sseConnected = false;
        return;
      }
      params.push(`access_point_id=${accessPointId}`);
      if (this.tab === "cards") {
        params.push(`include=${accessPointId}`);
      }
      if (this.tab === "access-logs") {
        params.push(`exclude=${accessPointId}`);
      }
      const url = `/api/scan/stream?${params.join("&")}`;
      const es = new EventSource(url);
      this._eventSource = es;

      es.onopen = () => { this.sseConnected = true; };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (!data.uid) return;

          if (this.tab === "access-check") {
            this.accessCheck.card_uid = data.uid;
            this.checkCardAccess();
            this.showToast(`Cek akses kartu (${data.uid})`, "info");
            return;
          }

          if (data.registered === false) {
            this.form.card_uid = data.uid;
            this.tab = "cards";
            this.showToast(`Kartu baru terdeteksi (${data.uid}) — lengkapi data registrasi`, "info");
          } else if (data.registered === true) {
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
    // Watch for tab changes and reconnect SSE
    setTab(tabName) {
      this.tab = tabName;
      this.connectSSE();
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
        this.userForm = { name: "", email: "", role: "member", access_point_ids: [] };
        await this.loadUsers();
      } catch (err) {
        this.userError = err.message;
      } finally {
        this.userLoading = false;
      }
    },

    // Toggle access point selection for user form
    toggleAccessPoint(id) {
      const idx = this.userForm.access_point_ids.indexOf(id);
      if (idx === -1) {
        this.userForm.access_point_ids.push(id);
      } else {
        this.userForm.access_point_ids.splice(idx, 1);
      }
    },

    // Select all/deselect all access points
    toggleSelectAllAccessPoints(event) {
      if (event.target.checked) {
        this.userForm.access_point_ids = this.accessPoints.map(ap => ap.id);
      } else {
        this.userForm.access_point_ids = [];
      }
    },

    // Computed: are all access points selected?
    get allAccessPointsSelected() {
      return this.accessPoints.length > 0 && this.userForm.access_point_ids.length === this.accessPoints.length;
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
