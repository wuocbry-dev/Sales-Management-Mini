(function () {
  "use strict";

  var API_BASE =
    typeof window.__API_BASE__ === "string" ? window.__API_BASE__.replace(/\/$/, "") : "";
  var REGISTER_URL = API_BASE + "/api/auth/register";

  function $(id) {
    return document.getElementById(id);
  }

  function showError(msg) {
    var box = $("register-error");
    var text = $("register-error-msg");
    if (!box || !text) return;
    text.textContent = msg || "Đăng ký thất bại.";
    box.classList.remove("hidden");
  }

  function hideError() {
    var box = $("register-error");
    if (box) box.classList.add("hidden");
  }

  function setLoading(loading) {
    var btn = $("register-submit");
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? "Đang tạo tài khoản…" : "Đăng ký";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = $("register-form");
    var toggleBtn = $("toggle-password");
    var passInput = $("password");
    if (toggleBtn && passInput) {
      toggleBtn.addEventListener("click", function () {
        var isPwd = passInput.getAttribute("type") === "password";
        passInput.setAttribute("type", isPwd ? "text" : "password");
        var icon = toggleBtn.querySelector(".material-symbols-outlined");
        if (icon) icon.textContent = isPwd ? "visibility_off" : "visibility";
      });
    }

    if (!form) return;

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      hideError();

      var username = $("reg-username").value.trim();
      var email = $("reg-email").value.trim();
      var password = $("password").value;
      var fullName = $("reg-fullname").value.trim();
      var phone = $("reg-phone").value.trim();

      if (!username || !email || !password || !fullName) {
        showError("Vui lòng điền đủ: tên đăng nhập, email, họ tên, mật khẩu.");
        return;
      }
      if (password.length < 6) {
        showError("Mật khẩu tối thiểu 6 ký tự.");
        return;
      }

      setLoading(true);
      try {
        var body = {
          username: username,
          email: email,
          password: password,
          fullName: fullName,
        };
        if (phone) body.phone = phone;

        var res = await fetch(REGISTER_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(body),
        });

        var raw = await res.text();
        var data = {};
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch (x) {
          /* ignore */
        }

        if (!res.ok) {
          showError(data.message || "Không thể đăng ký (mã " + res.status + ").");
          return;
        }

        if (data.accessToken) {
          try {
            sessionStorage.setItem(
              "retailops.session",
              JSON.stringify(data)
            );
          } catch (x) {
            /* ignore */
          }
          window.location.href = "dashboard.html";
          return;
        }

        window.location.href = "login.html?registered=1";
      } catch (err) {
        showError(
          "Không kết nối được máy chủ. Kiểm tra backend và proxy /api (Vite)."
        );
      } finally {
        setLoading(false);
      }
    });
  });
})();
