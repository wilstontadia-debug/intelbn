/**
 * Couche API — backend réel (fetch /api)
 * Tokens: localStorage intelng_token / intelng_admin_token
 */
(function (g) {
  "use strict";

  var USER_TOKEN_KEY = "intelng_token";
  var ADMIN_TOKEN_KEY = "intelng_admin_token";

  function apiBase() {
    /* Hébergement portable: même origine par défaut (Node sert front+API).
       Override: __INTEL_NG_CONFIG__.apiBase ou localStorage intelng_api_base */
    var cfg = (typeof window !== "undefined" && window.__INTEL_NG_CONFIG__) || {};
    if (cfg.apiBase) return String(cfg.apiBase).replace(/\/$/, "");
    try {
      var ls = localStorage.getItem("intelng_api_base");
      if (ls) return String(ls).replace(/\/$/, "");
    } catch (e) {}
    if (typeof location === "undefined") return "";
    /* Dev split: Vite/autre port → backend local 8787 */
    if ((location.hostname === "localhost" || location.hostname === "127.0.0.1") &&
        location.port && location.port !== "8787" && location.port !== "80" && location.port !== "443") {
      return "http://127.0.0.1:8787";
    }
    /* Même domaine (VPS, Render, Railway, Caddy, Nginx) → chemins /api relatifs */
    return "";
  }

  function apiBaseDebug() {
    var b = apiBase();
    return b || (typeof location !== "undefined" ? location.origin : "(relative)");
  }

  function getToken(admin) {
    try {
      return localStorage.getItem(admin ? ADMIN_TOKEN_KEY : USER_TOKEN_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function setToken(token, admin) {
    try {
      if (token) localStorage.setItem(admin ? ADMIN_TOKEN_KEY : USER_TOKEN_KEY, token);
      else localStorage.removeItem(admin ? ADMIN_TOKEN_KEY : USER_TOKEN_KEY);
    } catch (e) {}
  }

  function ok(data) {
    return { ok: true, status: 200, data: data };
  }
  function fail(status, message) {
    return { ok: false, status: status || 400, error: message || "error" };
  }

  function isOnline() {
    try {
      return typeof navigator === "undefined" || navigator.onLine !== false;
    } catch (e) {
      return true;
    }
  }

  async function request(method, path, body, opts) {
    opts = opts || {};
    var headers = { Accept: "application/json" };
    if (body != null) headers["Content-Type"] = "application/json";
    var token = getToken(!!opts.admin);
    if (token) headers.Authorization = "Bearer " + token;
    var url = apiBase() + path;
    var attempts = opts.retry === false ? 1 : 2;
    var lastErr = "network:" + url;

    if (!isOnline()) {
      try {
        if (g.UI && g.UI.toast) g.UI.toast("Pas de connexion Internet", "error");
      } catch (e) {}
      return fail(0, "offline");
    }

    for (var i = 0; i < attempts; i++) {
      try {
        var fetchOpts = { method: method, headers: headers, credentials: "include" };
        if (body != null && method !== "GET" && method !== "DELETE") {
          fetchOpts.body = JSON.stringify(body);
        }
        if (typeof AbortController !== "undefined") {
          var ctrl = new AbortController();
          fetchOpts.signal = ctrl.signal;
          setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, opts.timeout || 20000);
        }
        var res = await fetch(url, fetchOpts);
        var json = null;
        try {
          json = await res.json();
        } catch (e) {
          lastErr = "network";
          if (i < attempts - 1) {
            await new Promise(function (r) { setTimeout(r, 600); });
            continue;
          }
          return fail(res.status || 0, "network:" + url);
        }
        if (!json || json.ok === false) {
          return fail(res.status, (json && json.error) || "error");
        }
        return ok(json.data);
      } catch (e) {
        lastErr = e && e.name === "AbortError" ? "timeout:" + url : "network:" + url;
        if (i < attempts - 1) {
          await new Promise(function (r) { setTimeout(r, 700); });
          continue;
        }
      }
    }
    return fail(0, lastErr);
  }

  function applyUser(user) {
    if (!user) return;
    g.Store.update(function (st) {
      st.user = Object.assign({}, st.user, user, { loggedIn: true });
    });
  }

  function clearUser() {
    setToken("", false);
    g.Store.update(function (st) {
      st.user = Object.assign({}, st.user, {
        loggedIn: false,
        balance: 0,
        income: 0,
        owned: [],
        phone: "",
        referrals: [],
        referralEarnings: 0,
      });
    });
  }

  g.API = {
    apiBase: apiBase,
    apiBaseDebug: apiBaseDebug,
    getToken: function () { return getToken(false); },
    getAdminToken: function () { return getToken(true); },

    getHonor: async function () {
      var res = await request("GET", "/api/honor");
      if (!res.ok) return res;
      var d = res.data || {};
      g.Store.update(function (st) {
        if (d.honorTop && d.honorTop.length) st.honorTop = d.honorTop;
        if (d.withdrawals && d.withdrawals.length) st.withdrawals = d.withdrawals;
        else if (d.honorWithdrawals && d.honorWithdrawals.length) st.withdrawals = d.honorWithdrawals;
      });
      return res;
    },

    bootstrap: async function () {
      var res = await request("GET", "/api/bootstrap");
      if (!res.ok) return res;
      var d = res.data || {};
      g.Store.update(function (st) {
        if (d.products) st.products = d.products;
        if (d.settings) st.settings = Object.assign({}, st.settings, d.settings);
        if (d.paymentMethods) st.paymentMethods = d.paymentMethods;
        if (d.notice) st.notice = d.notice;
        if (d.user) st.user = Object.assign({}, st.user, d.user, { loggedIn: true });
        if (d.honorTop && d.honorTop.length) st.honorTop = d.honorTop;
        if (d.honorWithdrawals && d.honorWithdrawals.length) st.withdrawals = d.honorWithdrawals;
      });
      return res;
    },

    forgotPassword: async function (phone, channel) {
      return request("POST", "/api/auth/forgot", { phone: phone, channel: channel || "sms" });
    },
    resetPassword: async function (phone, code, password) {
      return request("POST", "/api/auth/reset", { phone: phone, code: code, password: password });
    },
    login: async function (phone, password) {

      var res = await request("POST", "/api/auth/login", { phone: phone, password: password });
      if (!res.ok) return res;
      if (res.data && res.data.token) setToken(res.data.token, false);
      if (res.data && res.data.user) applyUser(res.data.user);
      return ok(res.data);
    },

    register: async function (phone, code, password) {
      var res = await request("POST", "/api/auth/register", {
        phone: phone,
        invite: code,
        code: code,
        password: password,
        name: "Utilisateur",
      });
      if (!res.ok) return res;
      if (res.data && res.data.token) setToken(res.data.token, false);
      if (res.data && res.data.user) applyUser(res.data.user);
      return ok(res.data);
    },

    logout: async function () {
      clearUser();
      return ok({});
    },

    refreshMe: async function () {
      var res = await request("GET", "/api/me");
      if (!res.ok) {
        if (res.status === 401) clearUser();
        return res;
      }
      if (res.data && res.data.user) applyUser(res.data.user);
      return res;
    },

    purchase: async function (product) {
      var res = await request("POST", "/api/purchase", product);
      if (res.ok) await g.API.refreshMe();
      return res;
    },

    requestDeposit: async function (payload) {
      return request("POST", "/api/wallet/deposit", payload);
    },

    requestWithdraw: async function (payload) {
      var res = await request("POST", "/api/wallet/withdraw", payload);
      if (res.ok) await g.API.refreshMe();
      return res;
    },

    claimDailyIncome: async function () {
      var res = await request("POST", "/api/wallet/claim", {});
      if (res.ok) await g.API.refreshMe();
      return res;
    },

    walletHistory: async function () {
      return request("GET", "/api/wallet/history");
    },

    submitSupport: async function (payload) {
      return request("POST", "/api/support", payload);
    },

    myTickets: async function () {
      return request("GET", "/api/support/mine");
    },

    completeOnboard: async function () {
      g.Store.update(function (st) {
        st.onboardDone = true;
      });
      return ok({});
    },

    markNotifRead: async function (id) {
      var res = await request("POST", "/api/notifications/read", { id: id || null });
      if (res.ok) {
        g.Store.update(function (st) {
          st.notifications = st.notifications || [];
          if (!id) {
            st.notifications.forEach(function (n) { n.read = true; });
          } else {
            st.notifications.forEach(function (n) {
              if (n.id === id) n.read = true;
            });
          }
        });
      }
      return res.ok ? res : ok({});
    },

    fetchNotifications: async function () {
      var res = await request("GET", "/api/notifications");
      if (res.ok && res.data) {
        g.Store.update(function (st) {
          st.notifications = (res.data.notifications || []).map(function (n) {
            return {
              id: n.id,
              title: n.title,
              body: n.body,
              text: n.body || n.title,
              type: n.type,
              read: !!n.read,
              at: n.at,
            };
          });
        });
      }
      return res;
    },

    adminListProducts: async function () {
      return request("GET", "/api/admin/products", null, { admin: true });
    },
    adminAddProduct: async function (payload) {
      return request("POST", "/api/admin/products", payload, { admin: true });
    },
    adminUpdateProduct: async function (id, payload) {
      return request("PUT", "/api/admin/products/" + encodeURIComponent(id), payload, { admin: true });
    },
    adminDeleteProduct: async function (id) {
      return request("DELETE", "/api/admin/products/" + encodeURIComponent(id), null, { admin: true });
    },

    updateProfile: async function (payload) {
      payload = payload || {};
      var name = String(payload.name || "").trim();
      if (name && name.length < 2) return fail(400, "name");
      /* Mise à jour locale immédiate; sync serveur si disponible */
      var res = await request("PUT", "/api/me", { name: name });
      if (res.ok && res.data && res.data.user) {
        applyUser(res.data.user);
        return res;
      }
      if (name) {
        g.Store.update(function (st) {
          if (st.user) st.user.name = name;
        });
      }
      /* si réseau KO, on garde quand même le nom local */
      if (!res.ok && res.error === "network") return ok({ local: true });
      if (!res.ok && res.status === 404) return ok({ local: true });
      return res.ok ? res : ok({ local: true });
    },

    adminLogin: async function (email, password) {
      var res = await request("POST", "/api/admin/login", { email: email, password: password });
      if (!res.ok) return res;
      if (res.data && res.data.token) setToken(res.data.token, true);
      var adm = (res.data && res.data.admin) || { email: email, role: "super" };
      if (g.Store && g.Store.setAdminSession) {
        g.Store.setAdminSession({
          email: adm.email,
          name: adm.name || adm.email,
          role: adm.role || "super",
          at: Date.now(),
        });
      }
      return ok(res.data);
    },

    adminLogout: async function () {
      setToken("", true);
      if (g.Store && g.Store.setAdminSession) g.Store.setAdminSession(null);
      return ok({});
    },

    approveDeposit: async function (id) {
      return request("POST", "/api/admin/deposits/" + encodeURIComponent(id) + "/approve", {}, { admin: true });
    },

    rejectDeposit: async function (id, reason) {
      return request("POST", "/api/admin/deposits/" + encodeURIComponent(id) + "/reject", { reason: reason || "" }, { admin: true });
    },

    resubmitDeposit: async function (id, screenshot) {
      return request("POST", "/api/wallet/deposit/" + encodeURIComponent(id) + "/resubmit", {
        screenshot: screenshot,
        clientAt: new Date().toISOString(),
      });
    },

    adminAudit: async function () {
      return request("GET", "/api/admin/audit", null, { admin: true });
    },

    approveWithdraw: async function (id) {
      return request("POST", "/api/admin/withdrawals/" + encodeURIComponent(id) + "/approve", {}, { admin: true });
    },

    rejectWithdraw: async function (id, reason) {
      return request("POST", "/api/admin/withdrawals/" + encodeURIComponent(id) + "/reject", { reason: reason || "" }, { admin: true });
    },

    replySupportTicket: async function (id, reply) {
      return request("POST", "/api/admin/tickets/" + encodeURIComponent(id) + "/reply", { reply: reply || "" }, { admin: true });
    },

    adminListDeposits: async function () {
      return request("GET", "/api/admin/deposits", null, { admin: true });
    },

    adminListWithdrawals: async function () {
      return request("GET", "/api/admin/withdrawals", null, { admin: true });
    },

    adminListUsers: async function () {
      return request("GET", "/api/admin/users", null, { admin: true });
    },

    adminListTickets: async function () {
      return request("GET", "/api/admin/tickets", null, { admin: true });
    },

    adminAddAccount: async function (emailOrObj, password, name) {
      var email = emailOrObj;
      var pass = password;
      var nm = name;
      if (emailOrObj && typeof emailOrObj === "object") {
        email = emailOrObj.email;
        pass = emailOrObj.password;
        nm = emailOrObj.name;
      }
      return request(
        "POST",
        "/api/admin/admins",
        { email: email, password: pass || "ChangeMe@2026", name: nm || email },
        { admin: true }
      );
    },

    adminRemoveAccount: async function (idOrEmail) {
      /* Backend DELETE by id; si email fourni, on résout via liste */
      var key = String(idOrEmail || "");
      if (key.indexOf("@") >= 0) {
        var list = await request("GET", "/api/admin/admins", null, { admin: true });
        if (list.ok && list.data && list.data.admins) {
          var found = list.data.admins.find(function (a) {
            return String(a.email).toLowerCase() === key.toLowerCase();
          });
          if (!found) return fail(404, "not_found");
          key = found.id;
        }
      }
      return request("DELETE", "/api/admin/admins/" + encodeURIComponent(key), null, { admin: true });
    },
  };
})(window);
