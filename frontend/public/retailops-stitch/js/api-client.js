(function (global) {
  "use strict";

  var STORAGE_KEY = "retailops.session";

  function apiBase() {
    return typeof global.__API_BASE__ === "string"
      ? global.__API_BASE__.replace(/\/$/, "")
      : "";
  }

  function readRawSession() {
    try {
      return sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function getSession() {
    var raw = readRawSession();
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function getToken() {
    var s = getSession();
    return s && s.accessToken ? s.accessToken : null;
  }

  function redirectLogin() {
    global.location.href = "login.html";
  }

  function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Số nguyên (chuỗi hoặc số) → "1.234.567 ₫" */
  function formatVndDigits(n) {
    var t = String(n == null ? "0" : n).replace(/\D/g, "") || "0";
    return t.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " ₫";
  }

  /** BigDecimal / số thực từ JSON → làm tròn VND hiển thị */
  function formatVndMoney(v) {
    var n = typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""), 10);
    if (isNaN(n)) n = 0;
    var r = Math.round(n);
    return String(r).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " ₫";
  }

  function formatIsoDate(iso) {
    if (!iso) return "—";
    var d = String(iso).slice(0, 10).split("-");
    if (d.length !== 3) return "—";
    return d[2] + "/" + d[1] + "/" + d[0];
  }

  async function apiFetch(path, opts) {
    opts = opts || {};
    var headers = Object.assign({ Accept: "application/json" }, opts.headers || {});
    var token = getToken();
    if (!token) {
      redirectLogin();
      throw new Error("Chưa đăng nhập.");
    }
    headers.Authorization = "Bearer " + token;
    if (
      opts.body &&
      typeof opts.body === "object" &&
      !(opts.body instanceof FormData) &&
      !(opts.body instanceof Blob)
    ) {
      headers["Content-Type"] = "application/json";
      opts = Object.assign({}, opts, { body: JSON.stringify(opts.body) });
    }
    var url = path.indexOf("http") === 0 ? path : apiBase() + path;
    var res = await fetch(url, Object.assign({}, opts, { headers: headers }));
    if (res.status === 401) {
      redirectLogin();
      throw new Error("Phiên đăng nhập hết hạn.");
    }
    return res;
  }

  async function apiJson(path, opts) {
    var res = await apiFetch(path, opts);
    var text = await res.text();
    var data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      var msg =
        (data && (data.message || data.error)) || res.statusText || "Lỗi " + res.status;
      var err = new Error(msg);
      err.status = res.status;
      err.body = data;
      throw err;
    }
    return data;
  }

  var meCache = null;

  function clearMeCache() {
    meCache = null;
  }

  async function fetchMe() {
    if (meCache) return meCache;
    meCache = await apiJson("/api/auth/me", { method: "GET" });
    return meCache;
  }

  async function fetchAllPages(pathBuilder) {
    var out = [];
    var page = 0;
    for (;;) {
      var data = await apiJson(pathBuilder(page), { method: "GET" });
      var c = data.content || [];
      out = out.concat(c);
      if (data.last === true || !c.length) break;
      page += 1;
      if (page > 500) break;
    }
    return out;
  }

  global.RetailOpsApi = {
    apiBase: apiBase,
    getSession: getSession,
    getToken: getToken,
    apiFetch: apiFetch,
    apiJson: apiJson,
    fetchMe: fetchMe,
    clearMeCache: clearMeCache,
    fetchAllPages: fetchAllPages,
    escapeHtml: escapeHtml,
    formatVndDigits: formatVndDigits,
    formatVndMoney: formatVndMoney,
    formatIsoDate: formatIsoDate,
  };
})(typeof window !== "undefined" ? window : globalThis);
