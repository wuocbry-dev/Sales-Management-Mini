(function () {
  "use strict";

  /**
   * Dev: Vite proxy /api → backend (vite.config). Production: cùng origin hoặc
   * chèn trước khi load: <script>window.__API_BASE__="https://api.example.com";</script>
   */
  var API_BASE =
    typeof window.__API_BASE__ === "string" ? window.__API_BASE__.replace(/\/$/, "") : "";

  var LOGIN_URL = API_BASE + "/api/auth/login";
  var STORAGE_PREFIX = "retailops.";

  function $(id) {
    return document.getElementById(id);
  }

  function clearSessionStorage() {
    try {
      sessionStorage.removeItem(STORAGE_PREFIX + "session");
    } catch (e) {
      /* ignore */
    }
    try {
      localStorage.removeItem(STORAGE_PREFIX + "session");
    } catch (e) {
      /* ignore */
    }
  }

  function saveSession(data, useLocal) {
    var payload = JSON.stringify(data);
    clearSessionStorage();
    try {
      if (useLocal) {
        localStorage.setItem(STORAGE_PREFIX + "session", payload);
      } else {
        sessionStorage.setItem(STORAGE_PREFIX + "session", payload);
      }
    } catch (e) {
      sessionStorage.setItem(STORAGE_PREFIX + "session", payload);
    }
  }

  function showError(msg) {
    var box = $("login-error");
    var text = $("login-error-msg");
    if (!box || !text) return;
    text.textContent = msg || "Đăng nhập thất bại.";
    box.classList.remove("hidden");
    box.setAttribute("aria-live", "polite");
  }

  function hideError() {
    var box = $("login-error");
    if (box) {
      box.classList.add("hidden");
    }
  }

  function setLoading(loading) {
    var btn = $("login-submit");
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? "Đang đăng nhập…" : "Đăng nhập";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = $("login-form");
    var userInput = $("username");
    var passInput = $("password");
    var remember = $("remember-me");
    var toggleBtn = $("toggle-password");

    if (toggleBtn && passInput) {
      toggleBtn.addEventListener("click", function () {
        var isPwd = passInput.getAttribute("type") === "password";
        passInput.setAttribute("type", isPwd ? "text" : "password");
        var icon = toggleBtn.querySelector(".material-symbols-outlined");
        if (icon) {
          icon.textContent = isPwd ? "visibility_off" : "visibility";
        }
      });
    }

    if (!form || !userInput || !passInput) return;

    try {
      var q = new URLSearchParams(window.location.search);
      if (q.get("registered") === "1") {
        var info = $("login-info");
        if (info) info.classList.remove("hidden");
      }
    } catch (e1) {
      /* ignore */
    }

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      hideError();
      var infoEl = $("login-info");
      if (infoEl) infoEl.classList.add("hidden");

      var username = userInput.value.trim();
      var password = passInput.value;

      if (!username || !password) {
        showError("Vui lòng nhập tên đăng nhập/email và mật khẩu.");
        return;
      }

      setLoading(true);

      try {
        var res = await fetch(LOGIN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ username: username, password: password }),
        });

        var data = null;
        var raw = await res.text();
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch (parseErr) {
          data = {};
        }

        if (!res.ok) {
          var errMsg = (data && data.message) || "";
          if (!errMsg) {
            if (res.status === 401) {
              errMsg = "Sai tên đăng nhập hoặc mật khẩu.";
            } else if (res.status === 403) {
              errMsg =
                "Đăng nhập bị từ chối (403): tài khoản khóa/inactive, hoặc origin trình duyệt không được CORS cho phép.";
            } else {
              errMsg = "Không thể đăng nhập (mã " + res.status + ").";
            }
          }
          showError(errMsg);
          return;
        }

        if (!data.accessToken) {
          showError("Phản hồi máy chủ không hợp lệ (thiếu token).");
          return;
        }

        saveSession(data, remember && remember.checked);
        window.location.href = "dashboard.html";
      } catch (err) {
        showError(
          "Không kết nối được máy chủ. Hãy chạy backend và kiểm tra proxy /api (Vite) hoặc __API_BASE__."
        );
      } finally {
        setLoading(false);
      }
    });
  });
})();
