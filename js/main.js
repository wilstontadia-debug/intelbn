/**
 * Routeur + boot + bindings pages
 */
(function (g) {
  "use strict";

  var rendering = false;
  var first = true;
  var lastPath = null;
  var renderGen = 0;

  var TITLES = {
    "/": "Intel NG",
    "/login": "Login — Intel NG",
    "/register": "Register — Intel NG",
    "/product": "Produits — Intel NG",
    "/wallet": "Wallet — Intel NG",
    "/honor": "Honneur — Intel NG",
    "/my": "Mon compte — Intel NG",
    "/admin": "Admin — Intel NG",
    "/design": "Design system — Intel NG",
  };

  function getPath() {
    var h = location.hash.replace(/^#/, "") || "/";
    if (h.indexOf("?") !== -1) h = h.split("?")[0];
    return h.charAt(0) === "/" ? h : "/" + h;
  }

  function setPageLoading(on) {
    var el = document.getElementById("page-loader");
    if (!el) return;
    el.classList.toggle("is-hidden", !on);
  }

  function toastApiError(err, fallback) {
    var e = String(err || "");
    var map = {
      balance: g.I18n.t("insufficient"),
      max_buys: g.I18n.t("errMaxBuys"),
      friday_only: g.I18n.lang() === "en" ? "Friday specials are only available on Fridays" : "Les offres Vendredi sont disponibles uniquement le vendredi",
      min_amount: g.I18n.t("errMinAmount"),
      max_amount: g.I18n.t("errMaxAmount"),
      maintenance: g.I18n.t("maintenance"),
      credentials: g.I18n.t("credentials"),
      locked: g.I18n.t("rateLimit"),
      rate_limit: g.I18n.t("rateLimit"),
      exists: g.I18n.lang() === "en" ? "This number is already registered" : "Ce numéro est déjà inscrit",
      no_income: g.I18n.t("noIncome"),
      not_found: g.I18n.lang() === "en" ? "Not found" : "Élément introuvable",
      forbidden: g.I18n.t("forbidden"),
      unauthorized: g.I18n.lang() === "en" ? "Please sign in" : "Veuillez vous connecter",
      proof_required: g.I18n.t("proofRequired"),
      proof_too_large: g.I18n.t("proofTooLarge"),
      proof_type: g.I18n.t("proofType"),
      duplicate_proof: g.I18n.t("proofDuplicate"),
      too_many_pending: g.I18n.t("tooManyPending"),
      invalid_amount: g.I18n.t("invalidAmount"),
      invalid_code: g.I18n.t("invalidCode"),
      step_amount: g.I18n.t("stepAmount"),
    };
    if (e.indexOf("cooldown:") === 0) {
      g.UI.toast("Prochaine récolte dans ~" + e.split(":")[1] + " h", "info");
      return;
    }
    g.UI.toast(map[e] || fallback || g.I18n.t("errGeneric"), "error");
  }

  async function render(force) {
    var path = getPath();
    if (!force && !first && path === lastPath && path !== "/admin") return;
    var gen = ++renderGen;
    rendering = true;
    lastPath = path;

    g.Store.reload();
    g.UI.applyTheme((g.Store.get().settings && g.Store.get().settings.theme) || "light");

    if (!first) {
      setPageLoading(true);
      await g.UI.delay(40);
    }
    if (gen !== renderGen) return;
    await g.UI.nextFrame();
    if (gen !== renderGen) return;

    // skeleton flash optionnel
    var root = document.getElementById("app");
    var html;
    try {
      var maintOn = !!(g.Store.get().settings && g.Store.get().settings.maintenance);
      var isAdminPath = path === "/admin";
      if (maintOn && !isAdminPath && path !== "/cgu" && path !== "/privacy") {
        html = g.Pages.maintenance ? g.Pages.maintenance() : g.Pages.error({ title: "Maintenance", message: "Service temporairement indisponible." });
      } else if (path === "/admin") {
        if (g.Admin && typeof g.Admin.page === "function") {
          html = g.Admin.page();
        } else {
          html = g.Pages.error
            ? g.Pages.error({ title: "Admin indisponible", message: "Rechargez la page (Ctrl+F5) pour vider le cache." })
            : '<main class="main"><div class="card card-pad"><p>Admin indisponible</p></div></main>';
        }
      } else if (path === "/design") html = g.Pages.design();
      else if (path === "/login") html = g.Pages.login();
      else if (path === "/forgot") html = g.Pages.forgot ? g.Pages.forgot() : g.Pages.login();
      else if (path === "/register") html = g.Pages.register();
      else if (path === "/product") html = g.Pages.product();
      else if (path === "/wallet") html = g.Pages.wallet();
      else if (path === "/investments") html = g.Pages.investments();
      else if (path === "/honor") {
        try {
          if (g.API && g.API.getHonor) {
            /* non-blocking: will re-render if data changes on next visit */
            g.API.getHonor().then(function (r) {
              if (r && r.ok) {
                var el = document.getElementById("app");
                if (el && location.hash.indexOf("honor") >= 0) {
                  try {
                    el.innerHTML = g.Pages.honor();
                    if (typeof bind === "function") bind("/honor");
                  } catch (e) {}
                }
              }
            });
          }
        } catch (e) {}
        html = g.Pages.honor();
      }
      else if (path === "/my") html = g.Pages.my();
      else if (path === "/support") html = g.Pages.support();
      else if (path === "/notifications") html = g.Pages.notifications();
      else if (path === "/profile") html = g.Pages.profile();
      else if (path === "/cgu") html = g.Pages.cgu();
      else if (path === "/privacy") html = g.Pages.privacy();
      else html = g.Pages.home();
    } catch (err) {
      html = g.Pages && g.Pages.error
        ? g.Pages.error({ title: "Erreur d\'affichage", message: "Une erreur est survenue. Rechargez la page ou revenez à l\'accueil." })
        : '<main class="main"><div class="card card-pad"><p>Erreur</p><button onclick="location.reload()">Recharger</button></div></main>';
    }

    if (gen !== renderGen) return;
    root.innerHTML = html;
    var shell = root.firstElementChild;
    if (shell) shell.classList.add("page-enter");
    if (g.UI.bindMediaLoading) g.UI.bindMediaLoading(root);
    document.title = TITLES[path] || g.Store.get().settings.siteName;

    try {
      bind(path);
    } catch (bindErr) {
      /* évite spinner bloqué si un handler plante */
    } finally {
      if (gen === renderGen) {
        setPageLoading(false);
        rendering = false;
      }
      if (first) {
        first = false;
        var boot = document.getElementById("boot-loader");
        if (boot) boot.remove();
      }
    }
  }

  function bind(path) {
    var mr = document.getElementById("btn-maint-retry");
    if (mr) {
      mr.onclick = function () {
        if (g.API && g.API.bootstrap) {
          g.API.bootstrap().then(function () { render(true); });
        } else {
          location.reload();
        }
      };
    }
    var app = document.getElementById("app");
    app.onclick = function (e) {
      var link = e.target.closest("[data-link]");
      if (link) {
        var href = link.getAttribute("href");
        if (href && href.charAt(0) === "#") {
          e.preventDefault();
          location.hash = href.slice(1) || "/";
        }
        return;
      }
      var act = e.target.closest("[data-action]");
      if (!act) return;
      var a = act.getAttribute("data-action");
      if (a === "logout") handleLogout();
      if (a === "lang") toggleLang();
      if (a === "theme") toggleTheme();
    };

    if (path === "/login") bindLogin();
    if (path === "/forgot") bindForgot();
    if (path === "/register") bindRegister();
    if (path === "/product") bindProduct();
    if (path === "/wallet") bindWallet();
    if (path === "/investments") bindInvestments();
    if (path === "/admin") g.Admin.bind();
    if (path === "/my") bindMyTeam();
    if (path === "/support") bindSupport();
    if (path === "/notifications") bindNotifications();
    if (path === "/profile") bindProfile();
    maybeShowOnboard();
    if (path === "/design") {
      var b = document.getElementById("ds-toast");
      if (b)
        b.onclick = function () {
          g.UI.toast("Toast design system", "success");
          g.UI.toast("Info", "info");
          g.UI.toast("Erreur", "error");
        };
    }
  }

  async function handleLogout() {
    if (!(await g.UI.confirmModal("Déconnexion", "Confirmer ?", { danger: true, okText: "OK" }))) return;
    if (g.API && g.API.logout) await g.API.logout();
    else {
      g.Store.update(function (s) {
        s.user.loggedIn = false;
        s.user.phone = "";
      });
    }
    g.UI.toast(g.I18n.t("loggedOut"), "info");
    render(true);
  }

  function toggleTheme() {
    g.Store.update(function (s) {
      s.settings.theme = s.settings.theme === "light" ? "dark" : "light";
    });
    var th = g.Store.get().settings.theme || "light";
    g.UI.applyTheme(th);
    g.UI.toast(th === "light" ? g.I18n.t("modeLight") : g.I18n.t("modeDark"), "info");
    render(true);
  }

  function toggleLang() {
    g.Store.update(function (s) {
      s.settings.lang = s.settings.lang === "fr" ? "en" : "fr";
    });
    g.UI.toast("Lang: " + g.Store.get().settings.lang, "info");
    render(true);
  }



  function bindForgot() {
    var send = document.getElementById("forgot-send");
    var reset = document.getElementById("forgot-reset");
    if (send) {
      send.onclick = async function () {
        var phone = ((document.getElementById("fphone") || {}).value || "").trim();
        var digits = phone.replace(/\D/g, "");
        if (digits.length < 8) {
          g.UI.toast(g.I18n.t("invalidPhone"), "error");
          return;
        }
        if (digits.length === 9 && digits.charAt(0) === "6") phone = "+237" + digits;
        else if (phone.indexOf("+") !== 0 && digits.length >= 9) phone = "+" + digits;
        g.UI.setBtnLoading(send, true);
        var res = await g.API.forgotPassword(phone, "sms");
        g.UI.setBtnLoading(send, false);
        if (!res.ok) {
          toastApiError(res.error, "Échec envoi");
          return;
        }
        if (res.data && res.data.devCode) {
          g.UI.toast("Code dev: " + res.data.devCode, "info");
        } else {
          g.UI.toast(g.I18n.t("codeSent"), "success");
        }
        var s1 = document.getElementById("forgot-step1");
        var s2 = document.getElementById("forgot-step2");
        if (s1) s1.classList.add("is-hidden");
        if (s2) s2.classList.remove("is-hidden");
        window.__forgotPhone = phone;
      };
    }
    if (reset) {
      reset.onclick = async function () {
        var phone = window.__forgotPhone || ((document.getElementById("fphone") || {}).value || "").trim();
        var code = ((document.getElementById("fcode") || {}).value || "").trim();
        var pass = ((document.getElementById("fpass") || {}).value || "");
        var pass2 = ((document.getElementById("fpass2") || {}).value || "");
        if (pass !== pass2) {
          g.UI.toast(g.I18n.t("passMismatch"), "error");
          return;
        }
        if (pass.length < 6) {
          g.UI.toast(g.I18n.t("passShort"), "error");
          return;
        }
        g.UI.setBtnLoading(reset, true);
        var res = await g.API.resetPassword(phone, code, pass);
        g.UI.setBtnLoading(reset, false);
        if (!res.ok) {
          toastApiError(res.error === "invalid_code" ? "invalid_code" : res.error, "Code invalide ou expiré");
          return;
        }
        g.UI.toast(g.I18n.t("passUpdated"), "success");
        location.hash = "#/login";
      };
    }
  }

  function bindLogin() {
    try {
      var saved = localStorage.getItem("intelng_remember_phone");
      if (saved && document.getElementById("lphone")) document.getElementById("lphone").value = saved;
      if (saved && document.getElementById("remember-login")) document.getElementById("remember-login").checked = true;
    } catch (e) {}
    var lc = document.getElementById("login-country");
    var lp = document.getElementById("login-prefix");
    if (lc && lp) {
      lc.onchange = function () {
        lp.textContent = lc.value;
      };
    }

    var form = document.getElementById("login-form");
    var pw = document.getElementById("lpassword");
    var err = document.getElementById("login-error");
    var btn = document.getElementById("login-btn");
    var toggle = document.getElementById("l-toggle");
    if (toggle && pw) {
      toggle.onclick = function () {
        var show = pw.type === "password";
        pw.type = show ? "text" : "password";
        toggle.innerHTML = g.UI.icon(show ? "eye-off" : "eye", "icon icon-sm");
      };
    }
    if (!form) return;
    form.onsubmit = async function (e) {
      e.preventDefault();
      err.classList.add("is-hidden");
      var dial = (document.getElementById("login-country") && document.getElementById("login-country").value) || "+237";
      var local = (document.getElementById("lphone").value || "").replace(/\s+/g, "").replace(/^\+/, "");
      var dialDigits = dial.replace(/\D/g, "");
      if (local.indexOf(dialDigits) === 0) local = local.slice(dialDigits.length);
      if (local.charAt(0) === "0") local = local.slice(1);
      var phone = dial + local;
      var password = pw.value;
      var s = g.Store.get();
      var now = Date.now();
      if (s.loginAttempts.lockedUntil > now) {
        err.textContent = g.Validate.msg("locked");
        err.classList.remove("is-hidden");
        return;
      }
      var phoneEl = document.getElementById("lphone");
      var passEl = document.getElementById("lpassword");
      var e1 = g.Validate.phone(phone);
      var e2 = g.Validate.password(password, s.settings.minPassword);
      if (phoneEl) g.Validate.setFieldError(phoneEl, e1 ? g.Validate.msg(e1) : null);
      if (passEl) g.Validate.setFieldError(passEl, e2 ? g.Validate.msg(e2) : null);
      if (e1 || e2) {
        err.textContent = g.Validate.msg(e1 || e2);
        err.classList.remove("is-hidden");
        g.Store.update(function (st) {
          st.loginAttempts.count++;
          if (st.loginAttempts.count >= 5) {
            st.loginAttempts.lockedUntil = Date.now() + 60000;
            st.loginAttempts.count = 0;
          }
        });
        return;
      }
      g.UI.setBtnLoading(btn, true);
      var res = await g.API.login(phone, password);
      g.UI.setBtnLoading(btn, false);
      if (!res.ok) {
        var lmsg = "Identifiants incorrects";
        if (res.error === "maintenance") lmsg = g.I18n.t("maintenance");
        else if (res.error === "locked") lmsg = "Compte temporairement verrouillé";
        else if (String(res.error||"").indexOf("network")===0) lmsg = "Serveur injoignable — vérifiez backend & CORS";
        else if (res.error === "credentials") lmsg = "Téléphone ou mot de passe incorrect";
        err.textContent = lmsg;
        err.classList.remove("is-hidden");
        g.UI.toast(lmsg, "error");
        return;
      }
      try {
        if (document.getElementById("remember-login") && document.getElementById("remember-login").checked) {
          localStorage.setItem("intelng_remember_phone", (document.getElementById("lphone") || {}).value || "");
        } else {
          localStorage.removeItem("intelng_remember_phone");
        }
      } catch (e) {}
      form.classList.add("is-hidden");
      document.getElementById("login-success").classList.remove("is-hidden");
      document.getElementById("login-phone-display").textContent = phone;
      g.UI.toast(g.I18n.t("successLogin"), "success");
    };
  }

  function bindRegister() {
    var form = document.getElementById("register-form");
    var country = document.getElementById("country");
    var prefixEl = document.getElementById("phone-prefix");
    var phoneEl = document.getElementById("phone");

    function dialOf() {
      if (!country) return "+237";
      var opt = country.options[country.selectedIndex];
      return (opt && opt.getAttribute("data-dial")) || "+237";
    }

    function syncPrefix() {
      var dial = dialOf();
      if (prefixEl) prefixEl.textContent = dial;
      if (phoneEl) {
        phoneEl.setAttribute("data-dial", dial);
        phoneEl.placeholder = dial === "+237" ? "6XX XX XX XX" : "Numéro local";
      }
    }

    if (country) {
      country.onchange = syncPrefix;
      syncPrefix();
    }

    var codeEl = document.getElementById("code");
    if (codeEl) {
      var q = (location.hash.split("?")[1] || "");
      var params = {};
      q.split("&").forEach(function (p) {
        var kv = p.split("=");
        if (kv[0]) params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || "");
      });
      if (params.ref) codeEl.value = String(params.ref).toUpperCase();
    }

    if (!form) return;
    form.onsubmit = async function (e) {
      e.preventDefault();
      var err = document.getElementById("register-error");
      if (err) {
        err.classList.add("is-hidden");
        err.textContent = "";
      }
      var dial = dialOf();
      var local = (phoneEl && phoneEl.value || "").replace(/\s+/g, "").replace(/^\+/, "");
      /* Retirer l'indicatif s'il a été saisi dans le champ */
      var dialDigits = dial.replace(/\D/g, "");
      if (local.indexOf(dialDigits) === 0) local = local.slice(dialDigits.length);
      if (local.charAt(0) === "0") local = local.slice(1);
      if (!local || local.length < 8) {
        if (err) {
          err.textContent = "Numéro invalide pour " + dial;
          err.classList.remove("is-hidden");
        }
        g.UI.toast(g.I18n.t("invalidPhone"), "error");
        return;
      }
      var fullPhone = dial + local;
      var code = (document.getElementById("code") && document.getElementById("code").value) || "";
      var password = document.getElementById("password").value;
      var confirm = document.getElementById("confirm").value;
      if (g.Validate && g.Validate.password) {
        var pe = g.Validate.password(password);
        if (pe) {
          if (err) {
            err.textContent = g.Validate.msg(pe);
            err.classList.remove("is-hidden");
          }
          g.UI.toast(g.Validate.msg(pe), "error");
          return;
        }
      }
      if (password !== confirm) {
        if (err) {
          err.textContent = "Les mots de passe ne correspondent pas";
          err.classList.remove("is-hidden");
        }
        g.UI.toast("Confirmation incorrecte", "error");
        return;
      }
      var btn = document.getElementById("register-btn");
      g.UI.setBtnLoading(btn, true);
      var res = await g.API.register(fullPhone, code, password);
      g.UI.setBtnLoading(btn, false);
      if (!res.ok) {
        var msg = "Inscription impossible";
        if (res.error === "exists") msg = "Ce numéro est déjà inscrit";
        else if (res.error === "phone") msg = "Numéro invalide";
        else if (res.error === "password") msg = "Mot de passe trop court";
        else if (String(res.error||"").indexOf("network")===0) msg = "Serveur injoignable — vérifiez backend & CORS";
        else if (res.error === "maintenance") msg = "Service temporairement indisponible";
        if (err) {
          err.textContent = msg;
          err.classList.remove("is-hidden");
        }
        g.UI.toast(msg, "error");
        return;
      }
      g.Store.update(function (st) {
        st.user.country = country ? country.value : "CM";
        st.user.dial = dial;
        st.user.phone = fullPhone;
      });
      g.UI.toast("Compte créé — " + fullPhone, "success");
      var succ = document.getElementById("register-success");
      var disp = document.getElementById("reg-phone-display");
      if (disp) disp.textContent = fullPhone;
      if (succ) succ.classList.remove("is-hidden");
      form.classList.add("is-hidden");
    };
  }

  function bindProduct() {
    var tabs = document.querySelectorAll("#product-tabs .tab");
    var list = document.getElementById("product-list");
    function activeTab() {
      var a = document.querySelector("#product-tabs .tab.is-active");
      return a ? a.getAttribute("data-tab") : Object.keys(g.Store.get().products || {})[0];
    }
    function paintList() {
      if (!list) return;
      var raw = (g.Store.get().products && g.Store.get().products[activeTab()]) || [];
      var items = raw.slice();
      var maxP = Number((document.getElementById("product-maxprice") || {}).value) || 0;
      if (maxP > 0) items = items.filter(function (p) { return Number(p.price) <= maxP; });
      var sort = ((document.getElementById("product-sort") || {}).value) || "default";
      if (sort === "price-asc") items.sort(function (a, b) { return Number(a.price) - Number(b.price); });
      if (sort === "price-desc") items.sort(function (a, b) { return Number(b.price) - Number(a.price); });
      if (sort === "daily-desc") items.sort(function (a, b) { return Number(b.daily) - Number(a.daily); });
      if (sort === "roi-desc") {
        items.sort(function (a, b) {
          var ra = Number(a.price) > 0 ? (Number(a.daily) * Number(a.days) - Number(a.price)) / Number(a.price) : 0;
          var rb = Number(b.price) > 0 ? (Number(b.daily) * Number(b.days) - Number(b.price)) / Number(b.price) : 0;
          return rb - ra;
        });
      }
      list.innerHTML = g.Pages.renderProductCards(items);
      bindPurchase();
      if (g.UI && g.UI.bindMediaLoading) g.UI.bindMediaLoading(list);
    }
    tabs.forEach(function (tab) {
      tab.onclick = function () {
        tabs.forEach(function (x) { x.classList.remove("is-active"); });
        tab.classList.add("is-active");
        paintList();
      };
    });
    var sortEl = document.getElementById("product-sort");
    var maxEl = document.getElementById("product-maxprice");
    if (sortEl) sortEl.onchange = paintList;
    if (maxEl) maxEl.onchange = paintList;
    paintList();
  }

  function bindPurchase() {
    document.querySelectorAll(".purchase-btn").forEach(function (btn) {
      btn.onclick = async function () {
        var product = {
          id: btn.getAttribute("data-id") || "",
          name: btn.getAttribute("data-name"),
          price: Number(btn.getAttribute("data-price")),
          daily: Number(btn.getAttribute("data-daily")),
          days: Number(btn.getAttribute("data-days")),
          image: btn.getAttribute("data-image") || "",
          maxBuys: btn.getAttribute("data-max-buys") ? Number(btn.getAttribute("data-max-buys")) : null,
        };

        /* 1) Pas connecté → connexion / inscription */
        var u = (g.Store.get() && g.Store.get().user) || {};
        var logged = !!(u.loggedIn || (g.API && g.API.getToken && g.API.getToken()));
        if (!logged) {
          var goLogin = await g.UI.confirmModal(
            g.I18n.lang() === "en" ? "Sign in required" : "Connexion requise",
            g.I18n.lang() === "en"
              ? "Create an account or sign in to buy this machine."
              : "Créez un compte ou connectez-vous pour acheter cette machine.",
            {
              okText: g.I18n.lang() === "en" ? "Sign in" : "Se connecter",
              cancelText: g.I18n.lang() === "en" ? "Sign up" : "S'inscrire",
            }
          );
          if (goLogin) location.hash = "#/login";
          else location.hash = "#/register";
          return;
        }

        /* 2) Solde insuffisant → portefeuille / recharge */
        var bal = Number(u.balance) || 0;
        if (bal < (Number(product.price) || 0)) {
          var goWallet = await g.UI.confirmModal(
            g.I18n.t("insufficient"),
            (g.I18n.lang() === "en"
              ? "Balance: " + g.UI.cfa(bal) + "\nRequired: " + g.UI.cfa(product.price) + "\n\nTop up your wallet to continue."
              : "Solde : " + g.UI.cfa(bal) + "\nMontant requis : " + g.UI.cfa(product.price) + "\n\nRechargez votre portefeuille pour continuer."),
            {
              okText: g.I18n.t("recharge"),
              cancelText: g.I18n.t("close"),
            }
          );
          if (goWallet) location.hash = "#/wallet";
          return;
        }

        var totalG = (product.daily || 0) * (product.days || 0);
        var activeN = (u.owned || []).filter(function (o) {
          return o.status !== "completed";
        }).length;
        var summary =
          product.name +
          "\nPrix : " + g.UI.cfa(product.price) +
          "\nGain/j : " + g.UI.cfa(product.daily) +
          " · " + (product.days || 0) + " j" +
          "\nTotal estimé : " + g.UI.cfa(totalG) +
          (product.maxBuys ? "\nLimite : max " + product.maxBuys + " achats" : "") +
          "\nFrais : 0 FCFA" +
          (activeN >= 5 ? "\n\n⚠ Vous avez déjà " + activeN + " machines actives." : "");
        if (
          !(await g.UI.confirmModal(
            g.I18n.t("confirmBuy"),
            summary,
            { okText: g.I18n.t("buy") }
          ))
        )
          return;
        g.UI.setBtnLoading(btn, true);
        var res = await g.API.purchase(product);
        g.UI.setBtnLoading(btn, false);
        if (!res.ok) {
          /* Sécurité : erreurs serveur (session expirée / solde) */
          if (res.error === "unauthorized" || res.status === 401) {
            g.UI.toast(
              g.I18n.lang() === "en" ? "Please sign in again" : "Veuillez vous reconnecter",
              "error"
            );
            location.hash = "#/login";
            return;
          }
          if (res.error === "balance") {
            g.UI.toast(g.I18n.t("insufficient"), "error");
            location.hash = "#/wallet";
            return;
          }
          if (typeof toastApiError === "function") {
            toastApiError(res.error, g.I18n.t("errGeneric"));
          } else {
            var msg = g.I18n.t("errGeneric");
            if (res.error === "max_buys") msg = g.I18n.t("errMaxBuys");
            else if (String(res.error || "").indexOf("network") === 0) msg = g.I18n.t("errNetwork");
            g.UI.toast(msg, "error");
          }
          return;
        }
        var label = btn.querySelector(".btn-label");
        var buyLabel = g.I18n.t("buy") + " · " + g.UI.cfa(product.price);
        if (label) label.textContent = g.I18n.t("bought");
        g.UI.toast(product.name + " OK", "success");
        setTimeout(function () {
          if (label) label.textContent = buyLabel;
        }, 1500);
      };
    });
  }

  function bindInvestments() {
    var filter = "all";
    function paint() {
      var list = (g.Pages.investmentHelpers
        ? g.Pages.investmentHelpers(g.Store.get().user.owned || [])
        : []) ;
      /* helpers may not be exported — recompute inline */
      var dayMs = 24 * 60 * 60 * 1000;
      var now = Date.now();
      list = (g.Store.get().user.owned || []).map(function (o) {
        var days = Number(o.days) || 0;
        var daily = Number(o.daily) || 0;
        var start = o.startedAt ? new Date(o.startedAt).getTime() : o.at || now;
        var elapsed = Math.max(0, now - start);
        var progress = days > 0 ? Math.min(100, Math.round((elapsed / (days * dayMs)) * 100)) : 0;
        var maxEarn = daily * days;
        var earned = Number(o.earned) || 0;
        if (maxEarn > 0 && earned >= maxEarn) progress = 100;
        var status = progress >= 100 || (maxEarn > 0 && earned >= maxEarn) ? "completed" : "active";
        var daysLeft = days > 0 ? Math.max(0, Math.ceil((start + days * dayMs - now) / dayMs)) : 0;
        return {
          name: o.name,
          price: o.price,
          daily: daily,
          days: days,
          earned: earned,
          maxEarn: maxEarn,
          progress: progress,
          status: status,
          daysLeft: daysLeft,
          startLabel: o.startedAt ? String(o.startedAt).slice(0, 10) : "—",
          image: o.image || "img/machines/cpu1.jpg",
        };
      });
      if (filter === "active") list = list.filter(function (x) { return x.status === "active"; });
      if (filter === "completed") list = list.filter(function (x) { return x.status === "completed"; });
      var box = document.getElementById("inv-list");
      if (!box) return;
      if (!list.length) {
        box.innerHTML =
          '<div class="empty-state"><strong>Aucun investissement</strong>Parcourez le catalogue pour commencer.' +
          '<div class="mt-2"><a href="#/product" class="btn-primary" data-link>Voir le catalogue</a></div></div>';
        return;
      }
      box.innerHTML = list
        .map(function (x) {
          return (
            '<div class="card product-card" style="margin-bottom:0.75rem">' +
            g.UI.mediaHtml(x.image, { className: "product-media media-wrap is-loading", alt: x.name }) +
            '<div class="card-pad">' +
            '<div class="flex items-center gap-2"><div class="flex-1">' +
            '<p class="text-sm font-semibold">' +
            x.name +
            '</p><p class="text-3xs text-muted">Début ' +
            x.startLabel +
            (x.status === "active" ? " · " + x.daysLeft + " j restants" : " · terminé") +
            '</p></div><span class="badge">' +
            (x.status === "active" ? "Actif" : "Terminé") +
            "</span></div>" +
            '<div class="admin-grid" style="margin-top:0.75rem">' +
            '<div class="kpi"><p class="k">Investi</p><p class="v" style="font-size:0.85rem">' +
            g.UI.cfa(x.price) +
            '</p></div>' +
            '<div class="kpi"><p class="k">Gain / jour</p><p class="v" style="font-size:0.85rem">' +
            g.UI.cfa(x.daily) +
            '</p></div>' +
            '<div class="kpi"><p class="k">Profit</p><p class="v" style="font-size:0.85rem">' +
            g.UI.cfa(x.earned) +
            '</p></div>' +
            '<div class="kpi"><p class="k">Total final</p><p class="v" style="font-size:0.85rem">' +
            g.UI.cfa(x.maxEarn) +
            "</p></div></div>" +
            '<p class="product-final mt-2">À la fin du contrat : <strong>' +
            g.UI.cfa(x.maxEarn) +
            "</strong></p>" +
            '<p class="text-3xs text-muted mt-2">Progression du contrat ' +
            x.progress +
            "%</p>" +
            '<div class="inv-progress"><div class="inv-progress-bar" style="width:' +
            x.progress +
            '%"></div></div></div></div>'
          );
        })
        .join("");
    }
    document.querySelectorAll("[data-inv-filter]").forEach(function (btn) {
      btn.onclick = function () {
        filter = btn.getAttribute("data-inv-filter");
        document.querySelectorAll("[data-inv-filter]").forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        paint();
      };
    });
    var claim = document.getElementById("btn-claim-daily-inv");
    if (claim)
      claim.onclick = async function () {
        g.UI.setBtnLoading(claim, true);
        var res = await g.API.claimDailyIncome();
        g.UI.setBtnLoading(claim, false);
        if (!res.ok) {
          var err = res.error || "";
          if (String(err).indexOf("cooldown") === 0)
            g.UI.toast("Revenez demain pour récolter", "info");
          else g.UI.toast("Aucun gain disponible", "error");
          return;
        }
        g.UI.toast("+" + g.UI.cfa(res.data.amount) + " crédités", "success");
        g.Router.render(true);
      };
    paint();
  }

  function bindWallet() {
    if (g.API && g.API.walletHistory) {
      g.API.walletHistory().then(function (res) {
        if (!res || !res.ok || !res.data) return;
        g.Store.update(function (st) {
          st.pendingDeposits = res.data.deposits || [];
          st.pendingWithdrawals = res.data.withdrawals || [];
          st.claimHistory = res.data.claims || [];
        });
        try { renderHistory(); } catch (e) {}
      });
    }
    var store = function () {
      return g.Store.get();
    };
    var selectedProvider = null;
    var screenshotData = null;
    var rcState = { phone: "", amount: 0 };

    function providers() {
      return ((store().paymentMethods || {}).mobileMoney || {}).providers || [];
    }

    function bindXafDial(selectId, prefixId) {
      var sel = document.getElementById(selectId);
      var pref = document.getElementById(prefixId);
      if (!sel || !pref) return;
      function sync() {
        var opt = sel.options[sel.selectedIndex];
        var dial = (opt && opt.getAttribute("data-dial")) || "+237";
        pref.textContent = dial;
      }
      sel.onchange = sync;
      sync();
    }
    bindXafDial("rc-country", "rc-dial-prefix");
    bindXafDial("wd-country", "wd-dial-prefix");

    var maxAmount = (g.Store.get().settings && g.Store.get().settings.maxDeposit) || 500000;
    g.Validate.bindAmountInput("rc-amount", function () {
      return {
        min: (g.Store.get().settings && g.Store.get().settings.minDeposit) || 2000,
        max: (g.Store.get().settings && g.Store.get().settings.maxDeposit) || 500000,
        step: 500,
      };
    });
    g.Validate.bindAmountInput("wd-amount", function () {
      return {
        min: (g.Store.get().settings && g.Store.get().settings.minWithdraw) || 2000,
        max: (g.Store.get().settings && g.Store.get().settings.maxWithdraw) || 500000,
        step: 500,
      };
    });

    function rcDial() {
      var sel = document.getElementById("rc-country");
      if (!sel) return "+237";
      var opt = sel.options[sel.selectedIndex];
      return (opt && opt.getAttribute("data-dial")) || "+237";
    }
    function wdDial() {
      var sel = document.getElementById("wd-country");
      if (!sel) return "+237";
      var opt = sel.options[sel.selectedIndex];
      return (opt && opt.getAttribute("data-dial")) || "+237";
    }


    var wdSelected = null;
    var WITHDRAW_OPS = [
      { id: "mtn", name: "MTN MoMo" },
      { id: "orange", name: "Orange Money" },
      { id: "wave", name: "Wave" },
    ];

    function renderProviders(containerId, mode) {
      var el = document.getElementById(containerId);
      if (!el) return;

      if (mode === "withdraw") {
        wdSelected = null;
        el.innerHTML = WITHDRAW_OPS.map(function (p, i) {
          return (
            '<button type="button" class="list-row provider-pick" data-idx="' +
            i +
            '"><span class="label">' +
            p.name +
            '</span><span class="text-xs text-muted">Mobile Money</span></button>'
          );
        }).join("");
        el.querySelectorAll(".provider-pick").forEach(function (btn) {
          btn.onclick = function () {
            el.querySelectorAll(".provider-pick").forEach(function (b) {
              b.classList.remove("is-active");
            });
            btn.classList.add("is-active");
            wdSelected = WITHDRAW_OPS[Number(btn.getAttribute("data-idx"))];
          };
        });
        return;
      }

      var list = providers();
      if (!list.length) {
        el.innerHTML =
          '<div class="empty-state">' + g.I18n.t("noDepositAccount") + '</div>';
        return;
      }
      el.innerHTML = list
        .map(function (p, i) {
          return (
            '<button type="button" class="list-row provider-pick' +
            (i === 0 ? " is-active" : "") +
            '" data-idx="' +
            i +
            '">' +
            '<span class="label">' +
            p.name +
            '</span><span class="text-xs text-muted">' +
            p.number +
            " · " +
            (p.accountName || "") +
            "</span></button>"
          );
        })
        .join("");
      selectedProvider = list[0];
      updateDepositBox();
      el.querySelectorAll(".provider-pick").forEach(function (btn) {
        btn.onclick = function () {
          el.querySelectorAll(".provider-pick").forEach(function (b) {
            b.classList.remove("is-active");
          });
          btn.classList.add("is-active");
          selectedProvider = list[Number(btn.getAttribute("data-idx"))];
          updateDepositBox();
        };
      });
    }

    function updateDepositBox() {
      var box = document.getElementById("rc-deposit-box");
      if (!box || !selectedProvider) return;
      box.classList.remove("is-hidden");
      document.getElementById("rc-dep-provider").textContent = selectedProvider.name;
      document.getElementById("rc-dep-number").textContent = selectedProvider.number;
      document.getElementById("rc-dep-holder").textContent = selectedProvider.accountName || "—";
      var copyBtn = document.getElementById("rc-copy");
      if (copyBtn) {
        copyBtn.onclick = async function () {
          try {
            await navigator.clipboard.writeText(String(selectedProvider.number || "").replace(/\s/g, ""));
            g.UI.toast("Numéro copié", "success");
          } catch (e) {
            g.UI.toast(selectedProvider.number, "info");
          }
        };
      }
    }

    function setRcStep(n) {
      document.querySelectorAll("#rc-steps [data-rc-step]").forEach(function (li) {
        var s = Number(li.getAttribute("data-rc-step"));
        li.classList.toggle("on", s <= n);
      });
      var s1 = document.getElementById("rc-step1");
      var s2 = document.getElementById("rc-step2");
      if (s1) s1.classList.toggle("is-hidden", n !== 1);
      if (s2) s2.classList.toggle("is-hidden", n !== 2);
    }

    function showRcStatus(type, html) {
      var box = document.getElementById("rc-status-box");
      if (!box) return;
      box.className = "status-box show " + (type || "pending");
      box.innerHTML = html;
      box.classList.remove("is-hidden");
    }

    function renderHistory() {
      var box = document.getElementById("tx-history");
      if (!box) return;
      var filter = box.getAttribute("data-filter") || "all";
      var q = (document.getElementById("tx-search") && document.getElementById("tx-search").value || "").trim().toLowerCase();
      var deps = (store().pendingDeposits || []).map(function (d) {
        return {
          kind: "recharge",
          provider: d.provider,
          phone: d.phone,
          amount: d.amount,
          status: d.status,
          at: d.createdAt,
          rejectReason: d.rejectReason || "",
        };
      });
      var wds = (store().pendingWithdrawals || []).map(function (d) {
        return {
          kind: "withdrawal",
          provider: d.mobileProvider || d.method,
          phone: d.mobileNumber || d.accountNumber,
          amount: d.amount,
          status: d.status,
          at: d.createdAt,
          rejectReason: d.rejectReason || "",
        };
      });
      var claims = (store().claimHistory || []).map(function (c) {
        return {
          kind: "claim",
          provider: "Récolte",
          phone: "",
          amount: c.amount,
          status: "approved",
          at: c.at,
          rejectReason: "",
        };
      });
      var all = deps.concat(wds).concat(claims).sort(function (a, b) {
        return String(b.at).localeCompare(String(a.at));
      });
      if (filter === "recharge") all = all.filter(function (x) { return x.kind === "recharge"; });
      if (filter === "withdrawal") all = all.filter(function (x) { return x.kind === "withdrawal"; });
      if (filter === "rejected") all = all.filter(function (x) { return x.status === "rejected"; });
      if (filter === "pending") all = all.filter(function (x) { return x.status === "pending"; });
      var provEl = document.getElementById("tx-provider");
      var prov = provEl ? String(provEl.value || "").toLowerCase() : "";
      if (prov) all = all.filter(function (x) { return String(x.provider || "").toLowerCase().indexOf(prov) >= 0; });
      if (q) {
        all = all.filter(function (x) {
          return String(x.amount).indexOf(q) >= 0 || String(x.at || "").toLowerCase().indexOf(q) >= 0 ||
            String(x.phone || "").toLowerCase().indexOf(q) >= 0;
        });
      }
      if (!all.length) {
        box.innerHTML =
          '<div class="empty-state"><strong>Aucune opération</strong><p class="text-xs text-muted mt-1">Rechargez pour commencer.</p><button type="button" class="btn-primary mt-3" id="btn-hist-recharge">Recharger</button></div>';
        var hr = document.getElementById("btn-hist-recharge");
        if (hr) hr.onclick = function () { var b = document.getElementById("btn-recharge"); if (b) b.click(); };
        return;
      }
      var statusLabel = { pending: g.I18n.t("statusPending"), approved: g.I18n.t("statusApproved"), rejected: g.I18n.t("statusRejected") };
      var kindLabel = { recharge: "Dépôt", withdrawal: "Retrait", claim: "Gain" };
      var pageSize = 8;
      var page = Number(box.getAttribute("data-page") || 0);
      var maxPage = Math.max(0, Math.ceil(all.length / pageSize) - 1);
      if (page > maxPage) page = maxPage;
      box.setAttribute("data-page", String(page));
      var slice = all.slice(page * pageSize, page * pageSize + pageSize);
      box.innerHTML = slice
        .map(function (item) {
          var isOut = item.kind === "withdrawal";
          var prefix = kindLabel[item.kind] || (isOut ? "Retrait" : "Recharge");
          var amt =
            (isOut ? "− " : item.status === "approved" || item.kind === "claim" ? "+ " : "") + g.UI.cfa(item.amount);
          return (
            '<div class="list-row"><div class="flex-1"><p class="label">' +
            prefix +
            " · " +
            (item.provider || "") +
            " — " +
            (item.phone || "—") +
            '</p><p class="text-3xs text-muted">' +
            (function () {
              var raw = String(item.at || "");
              var short = raw.slice(0, 16).replace("T", " ");
              if (!item.at) return short;
              var ms = Date.now() - new Date(item.at).getTime();
              if (isNaN(ms) || ms < 0) return short;
              var mins = Math.floor(ms / 60000);
              if (mins < 60) return short + " · il y a " + mins + " min";
              var hrs = Math.floor(mins / 60);
              if (hrs < 48) return short + " · il y a " + hrs + " h";
              return short;
            })() +
            '</p></div><div style="text-align:right"><p class="text-sm font-semibold ' +
            (isOut ? "text-muted" : "text-teal") +
            '">' +
            amt +
            '</p><span class="status-tag ' +
            (item.status || "") +
            '">' +
            (statusLabel[item.status] || item.status) +
            "</span>" +
            (item.rejectReason
              ? '<p class="text-3xs text-muted" style="max-width:9rem">Motif : ' + String(item.rejectReason).replace(/</g, "") + "</p>"
              : "") +
            (item.kind === "recharge" && item.status === "rejected" && item.id
              ? '<button type="button" class="btn-xs primary mt-1" data-resubmit-dep="' + item.id + '">Renvoyer preuve</button>' +
                '<input type="file" accept="image/*" class="is-hidden" id="resubmit-file-' + item.id + '" data-resubmit-file="' + item.id + '" />'
              : "") +
            "</div></div>"
          );
        })
        .join("") +
        (all.length > pageSize
          ? '<div class="flex gap-2 mt-3" style="justify-content:center">' +
            '<button type="button" class="btn-xs" id="tx-prev"' + (page <= 0 ? " disabled" : "") + '>← Préc.</button>' +
            '<span class="text-3xs text-muted" style="align-self:center">' + (page + 1) + " / " + (maxPage + 1) + "</span>" +
            '<button type="button" class="btn-xs" id="tx-next"' + (page >= maxPage ? " disabled" : "") + '>Suiv. →</button></div>'
          : "");
      var prev = document.getElementById("tx-prev");
      var next = document.getElementById("tx-next");
      if (prev)
        prev.onclick = function () {
          box.setAttribute("data-page", String(Math.max(0, page - 1)));
          renderHistory();
        };
      if (next)
        next.onclick = function () {
          box.setAttribute("data-page", String(Math.min(maxPage, page + 1)));
          renderHistory();
        };
      if (typeof bindResubmitProofs === "function") bindResubmitProofs();
    }

    // owned products
    var ownedBox = document.getElementById("owned-list");
    if (ownedBox) {
      var owned = (store().user.owned || []).slice();
      var dayMsO = 24 * 60 * 60 * 1000;
      var nowO = Date.now();
      var claimable = 0;
      owned.forEach(function (o) {
        var daily = Number(o.daily) || 0;
        var days = Number(o.days) || 0;
        var maxE = daily * days;
        var earned = Number(o.earned) || 0;
        if (o.status === "completed" || earned >= maxE) return;
        var last = o.lastClaimAt ? new Date(o.lastClaimAt).getTime() : 0;
        if (!last || nowO - last >= dayMsO) claimable += Math.min(daily, Math.max(0, maxE - earned));
      });
      // tri : actives d'abord, puis terminées
      owned.sort(function (a, b) {
        var ac = a.status === "completed" ? 1 : 0;
        var bc = b.status === "completed" ? 1 : 0;
        return ac - bc;
      });
      var claimLog = store().user.claimLog || [];
      var byDay = {};
      for (var di = 0; di < 7; di++) {
        var dt = new Date(nowO - di * dayMsO);
        byDay[dt.toISOString().slice(0, 10)] = 0;
      }
      claimLog.forEach(function (c) {
        var k = String(c.at || "").slice(0, 10);
        if (byDay[k] != null) byDay[k] += Number(c.amount) || 0;
      });
      var maxBar = 1;
      Object.keys(byDay).forEach(function (k) { if (byDay[k] > maxBar) maxBar = byDay[k]; });
      var chartHtml = '<div class="mini-chart" aria-label="Gains 7 jours">';
      Object.keys(byDay).sort().forEach(function (k) {
        var h = Math.round((byDay[k] / maxBar) * 40);
        chartHtml += '<div class="mini-bar" title="' + k + " : " + byDay[k] + '"><span style="height:' + Math.max(2, h) + 'px"></span></div>';
      });
      chartHtml += "</div>";
      var claimBanner =
        claimable > 0
          ? '<div class="notice mb-3" style="margin:0.5rem 0"><strong>Récoltable aujourd\'hui :</strong> ' +
            g.UI.cfa(claimable) +
            '</div>'
          : '<div class="text-3xs text-muted" style="padding:0.35rem 0.5rem">Aucun gain à récolter pour le moment.</div>';
      claimBanner += chartHtml;
      ownedBox.innerHTML =
        claimBanner +
        (!owned.length
        ? '<div class="empty-state"><strong>Aucun produit</strong><p class="text-xs text-muted mt-1">Achetez une machine pour générer des revenus.</p><a href="#/product" class="btn-primary mt-3" data-link style="display:inline-block">Voir le catalogue</a></div>'
        : owned
            .map(function (o) {
              var daily = Number(o.daily) || 0;
              var days = Number(o.days) || 0;
              var maxE = daily * days;
              var earned = Number(o.earned) || 0;
              var pct = maxE > 0 ? Math.min(100, Math.round((earned / maxE) * 100)) : 0;
              var dayMs = 24 * 60 * 60 * 1000;
              var last = o.lastClaimAt ? new Date(o.lastClaimAt).getTime() : 0;
              var remainH = last ? Math.max(0, Math.ceil((dayMs - (Date.now() - last)) / 3600000)) : 0;
              var claimInfo = !last
                ? "Récolte disponible"
                : remainH > 0
                  ? "Prochaine récolte ~" + remainH + " h"
                  : "Récolte disponible";
              var st = o.status === "completed" ? "Terminé" : claimInfo;
              var start = o.startedAt ? new Date(o.startedAt).getTime() : (o.at || nowO);
              var endAt = days > 0 ? start + days * dayMsO : 0;
              var daysLeft = endAt ? Math.ceil((endAt - nowO) / dayMsO) : null;
              var endSoon =
                o.status !== "completed" && daysLeft != null && daysLeft >= 0 && daysLeft <= 3
                  ? '<p class="text-3xs" style="color:#f59e0b">Fin dans ' + daysLeft + " j</p>"
                  : "";
              var maint = (store().settings && store().settings.maintenance)
                ? '<p class="text-3xs text-muted">Maintenance — affichage des gains temporairement suspendu</p>'
                : "";
              return (
                '<div class="list-row" style="flex-direction:column;align-items:stretch;gap:0.35rem">' +
                '<div class="flex" style="justify-content:space-between;gap:0.5rem"><div class="flex-1"><p class="label">' +
                o.name +
                '</p><p class="text-3xs text-muted">Quotidien ' +
                g.UI.cfa(daily) +
                (days ? " · " + days + " j" : "") +
                " · " + st +
                '</p>' + endSoon + maint + '</div><span class="text-xs text-teal">' +
                g.UI.cfa(o.price) +
                "</span></div>" +
                '<div class="progress-track" aria-hidden="true"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
                '<p class="text-3xs text-muted">Cumulé ' + g.UI.cfa(earned) + " / " + g.UI.cfa(maxE) + " (" + pct + "%)</p></div>"
              );
            })
            .join(""));
    }
    document.querySelectorAll("[data-tx-filter]").forEach(function (b) {
      b.onclick = function () {
        document.querySelectorAll("[data-tx-filter]").forEach(function (x) { x.classList.remove("primary"); });
        b.classList.add("primary");
        var box = document.getElementById("tx-history");
        if (box) box.setAttribute("data-filter", b.getAttribute("data-tx-filter") || "all");
        renderHistory();
      };
    });
    var txSearch = document.getElementById("tx-search");
    if (txSearch) {
      var tmrS;
      txSearch.oninput = function () {
        clearTimeout(tmrS);
        tmrS = setTimeout(renderHistory, 200);
      };
    }
    var expG = document.getElementById("btn-export-gains");
    if (expG) {
      expG.onclick = function () {
        var rows = [["nom", "prix", "daily", "jours", "cumule", "statut"]];
        (store().user.owned || []).forEach(function (o) {
          rows.push([o.name, o.price, o.daily, o.days, o.earned || 0, o.status || ""]);
        });
        var csv = rows.map(function (r) { return r.join(","); }).join("\n");
        var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "intel-ng-gains.csv";
        a.click();
        g.UI.toast("Export CSV téléchargé", "success");
      };
    }
    
    function bindResubmitProofs() {
      document.querySelectorAll("[data-resubmit-dep]").forEach(function (btn) {
        btn.onclick = function () {
          var id = btn.getAttribute("data-resubmit-dep");
          var file = document.getElementById("resubmit-file-" + id);
          if (file) file.click();
        };
      });
      document.querySelectorAll("[data-resubmit-file]").forEach(function (inp) {
        if (inp._boundResubmit) return;
        inp._boundResubmit = true;
        inp.onchange = async function () {
          var id = inp.getAttribute("data-resubmit-file");
          var f = inp.files && inp.files[0];
          if (!f || !id) return;
          if (f.size > 1.5 * 1024 * 1024) {
            g.UI.toast(g.I18n.t("proofTooLarge"), "error");
            return;
          }
          var reader = new FileReader();
          reader.onload = async function () {
            g.UI.toast("Envoi de la preuve…", "info");
            var res = await g.API.resubmitDeposit(id, reader.result);
            if (!res.ok) {
              toastApiError(res.error, g.I18n.t("errGeneric"));
              return;
            }
            g.UI.toast(g.I18n.t("proofReceived"), "success");
            try { if (g.API.refreshMe) await g.API.refreshMe(); } catch (e) {}
            try {
              var hist = await g.API.walletHistory();
              if (hist.ok && hist.data) {
                g.Store.update(function (st) {
                  if (hist.data.deposits) st.pendingDeposits = hist.data.deposits;
                  if (hist.data.withdrawals) st.pendingWithdrawals = hist.data.withdrawals;
                });
              }
            } catch (e2) {}
            try { await render(true); } catch (e3) { location.hash = "#/wallet"; }
          };
          reader.readAsDataURL(f);
        };
      });
    }
    bindResubmitProofs();

    var claimBtn = document.getElementById("btn-claim-daily");
    if (claimBtn) {
      claimBtn.onclick = async function () {
        g.UI.setBtnLoading(claimBtn, true);
        var res = await g.API.claimDailyIncome();
        g.UI.setBtnLoading(claimBtn, false);
        if (!res.ok) {
          var err = res.error || "";
          if (String(err).indexOf("cooldown:") === 0) {
            g.UI.toast("Prochaine récolte dans ~" + err.split(":")[1] + " h", "info");
          } else {
            g.UI.toast("Aucun gain à récolter", "error");
          }
          return;
        }
        g.UI.toast("+" + g.UI.cfa(res.data.amount) + " crédités", "success");
        g.Router.render(true);
      };
    }

    renderHistory();

    var rePanel = document.getElementById("recharge-panel");
    var wdPanel = document.getElementById("withdraw-panel");

    document.getElementById("btn-recharge").onclick = function () {
      if (wdPanel) wdPanel.classList.add("is-hidden");
      rePanel.classList.remove("is-hidden");
      setRcStep(1);
      renderProviders("rc-providers", "deposit");
      screenshotData = null;
    };
    function syncWdDestMode() {
      var selfR = document.getElementById("wd-dest-self");
      var otherBox = document.getElementById("wd-other-fields");
      var phoneEl = document.getElementById("wd-phone");
      var useOther = selfR && !selfR.checked;
      if (otherBox) otherBox.classList.toggle("is-hidden", !useOther);
      if (phoneEl && !useOther) {
        phoneEl.value = "";
        if (g.Validate && g.Validate.setFieldError) g.Validate.setFieldError(phoneEl, null);
      }
    }
    document.getElementById("btn-withdraw").onclick = function () {
      if (rePanel) rePanel.classList.add("is-hidden");
      wdPanel.classList.remove("is-hidden");
      renderProviders("wd-providers", "withdraw");
      var selfR = document.getElementById("wd-dest-self");
      var otherR = document.getElementById("wd-dest-other");
      if (selfR) {
        selfR.checked = true;
        selfR.onchange = syncWdDestMode;
      }
      if (otherR) otherR.onchange = syncWdDestMode;
      syncWdDestMode();
    };
    var rcCancel = document.getElementById("rc-cancel");
    if (rcCancel)
      rcCancel.onclick = function () {
        rePanel.classList.add("is-hidden");
      };
    var wdCancel = document.getElementById("wd-cancel");
    if (wdCancel)
      wdCancel.onclick = function () {
        wdPanel.classList.add("is-hidden");
      };

    document.querySelectorAll("[data-chip]").forEach(function (chip) {
      chip.onclick = function () {
        var elAmt = document.getElementById("rc-amount");
        elAmt.value = chip.getAttribute("data-chip");
        g.Validate.setFieldError(elAmt, null);
      };
    });

    var copyBtn = document.getElementById("rc-copy");
    if (copyBtn)
      copyBtn.onclick = async function () {
        if (!selectedProvider) return;
        var raw = String(selectedProvider.number).replace(/\s+/g, "");
        try {
          await navigator.clipboard.writeText(raw);
          g.UI.toast("Numéro copié : " + selectedProvider.number, "success");
        } catch (e) {
          g.UI.toast("Numéro : " + selectedProvider.number, "info");
        }
      };

    document.getElementById("rc-paid").onclick = function () {
      if (!selectedProvider) return g.UI.toast("Choisissez un compte de dépôt.", "error");
      var phoneEl = document.getElementById("rc-phone");
      var amountEl = document.getElementById("rc-amount");
      var dial = rcDial();
      var localPhone = g.UI.formatLocalPhone(phoneEl.value, dial);
      var phone = g.UI.fullPhone(localPhone, dial);
      var amount = Number(amountEl.value);
      var minDep = (g.Store.get().settings && g.Store.get().settings.minDeposit) || 2000;
      var maxDep = (g.Store.get().settings && g.Store.get().settings.maxDeposit) || 500000;
      var ok = true;
      var pe = localPhone.length < 8 ? "phone_invalid" : null;
      if (pe) {
        g.Validate.setFieldError(phoneEl, "Numéro invalide pour " + dial);
        ok = false;
      } else g.Validate.setFieldError(phoneEl, null);
      var amtRes = g.Validate.amount(amount, { min: minDep, max: maxDep, step: 500 });
      amount = amtRes.value;
      if (!amtRes.ok) {
        g.Validate.setFieldError(amountEl, amtRes.message);
        ok = false;
      } else g.Validate.setFieldError(amountEl, null);
      if (!ok) {
        g.UI.toast("Corrigez les champs en rouge", "error");
        return;
      }
      var countrySel = document.getElementById("rc-country");
      rcState = {
        phone: phone,
        amount: amount,
        dial: dial,
        country: countrySel ? countrySel.value : "CM",
      };
      document.getElementById("rc-summary").textContent =
        g.UI.cfa(amount) +
        " · expéditeur " +
        phone +
        " → " +
        selectedProvider.name +
        " " +
        selectedProvider.number +
        " (" +
        (selectedProvider.accountName || "") +
        ")";
      setRcStep(2);
    };

    document.getElementById("rc-back").onclick = function () {
      setRcStep(1);
    };

    var drop = document.getElementById("rc-file-drop");
    var fileInput = document.getElementById("rc-screenshot");
    if (drop && fileInput) {
      drop.onclick = function () {
        fileInput.click();
      };
      fileInput.onchange = function () {
        var file = fileInput.files && fileInput.files[0];
        if (!file) return;
        if (!file.type || file.type.indexOf("image/") !== 0) {
          g.UI.toast("Merci de choisir une image.", "error");
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          screenshotData = reader.result;
          document.getElementById("rc-preview").classList.remove("is-hidden");
          document.getElementById("rc-preview-img").src = screenshotData;
          document.getElementById("rc-preview-name").textContent = file.name;
        };
        reader.readAsDataURL(file);
      };
    }

    document.getElementById("rc-submit").onclick = async function () {
      var chk1 = document.getElementById("rc-chk-sent");
      var chk2 = document.getElementById("rc-chk-shot");
      var chk3 = document.getElementById("rc-chk-name");
      if ((chk1 && !chk1.checked) || (chk2 && !chk2.checked) || (chk3 && !chk3.checked)) {
        g.UI.toast("Cochez toute la checklist avant d'envoyer", "error");
        return;
      }
      var accEl = document.getElementById("rc-accname");
      var accountName = accEl.value.trim();
      if (!accountName || accountName.length < 2) {
        g.Validate.setFieldError(accEl, "Nom du titulaire requis");
        g.UI.toast("Indiquez le nom du titulaire du compte.", "error");
        return;
      }
      g.Validate.setFieldError(accEl, null);
      if (!screenshotData) {
        g.UI.toast("Joignez une capture d'écran du dépôt.", "error");
        return;
      }
      var btn = document.getElementById("rc-submit");
      g.UI.setBtnLoading(btn, true);
      var res = await g.API.requestDeposit({
        amount: rcState.amount,
        provider: selectedProvider.name,
        phone: rcState.phone,
        accountName: accountName,
        depositNumber: selectedProvider.number,
        screenshot: screenshotData,
        method: "momo",
        country: rcState.country || "",
        dial: rcState.dial || "",
        clientAt: new Date().toISOString(),
      });
      g.UI.setBtnLoading(btn, false);
      if (!res.ok) {
        if (res.error === "duplicate_proof") g.UI.toast(g.I18n.t("proofDuplicate"), "error");
        else if (res.error === "too_many_pending") g.UI.toast(g.I18n.t("tooManyPending"), "error");
        else toastApiError(res.error, res.error === "min_amount" ? ("Minimum " + ((g.Store.get().settings && g.Store.get().settings.minDeposit) || 2000) + " FCFA") : "Échec envoi");
        return;
      }
      var amt = rcState.amount;
      showRcStatus(
        "success",
        "✅ Justificatif reçu. Votre dépôt de <b>" +
          g.UI.cfa(amt) +
          "</b> est <b>en cours de traitement</b>. Votre demande sera validée en moins de 24&nbsp;h et le solde crédité dès validation. N'envoyez pas deux fois le même justificatif. Besoin d'aide ? Rubrique Support."
      );
      g.UI.toast(g.I18n.t("proofReceived"), "info");
      setRcStep(3);
      screenshotData = null;
      var prev = document.getElementById("rc-preview");
      if (prev) prev.classList.add("is-hidden");
      var acc = document.getElementById("rc-accname");
      if (acc) acc.value = "";
      var am = document.getElementById("rc-amount");
      if (am) am.value = "";
      /* revenir étape 1 pour nouvelle recharge, garder le message statut */
      setTimeout(function () {
        setRcStep(1);
        renderHistory();
        g.Router.render(true);
      }, 1800);
    };

    // Withdraw

    document.getElementById("wd-submit").onclick = async function () {
      var active = document.querySelector("#wd-providers .provider-pick.is-active");
      if (active) {
        var ix = Number(active.getAttribute("data-idx"));
        if (!isNaN(ix) && WITHDRAW_OPS[ix]) wdSelected = WITHDRAW_OPS[ix];
      }
      if (!wdSelected) {
        g.UI.toast("Choisissez d'abord MTN, Orange ou Wave", "error");
        return;
      }

      var amount = Number(document.getElementById("wd-amount").value);
      var available = Number(store().user.balance) || 0; /* revenus déjà inclus dans le solde après récolte */
      var minWd = (store().settings && store().settings.minWithdraw) || 2000;
      var maxWd = (store().settings && store().settings.maxWithdraw) || 500000;
      var wdPhoneEl = document.getElementById("wd-phone");
      var wdAmtEl = document.getElementById("wd-amount");
      var useSelf = !(document.getElementById("wd-dest-other") && document.getElementById("wd-dest-other").checked);
      var phone;
      var pe = null;
      if (useSelf) {
        phone = String((store().user && store().user.phone) || "").trim();
        if (!phone || phone.replace(/\D/g, "").length < 8) {
          pe = "phone_invalid";
          g.UI.toast("Numéro de compte introuvable. Choisissez un autre numéro.", "error");
          return;
        }
      } else {
        phone = (document.getElementById("wd-phone") && document.getElementById("wd-phone").value.trim()) || "";
        var dialW = wdDial();
        var localW = g.UI.formatLocalPhone ? g.UI.formatLocalPhone(phone, dialW) : phone.replace(/\D/g, "");
        phone = g.UI.fullPhone ? g.UI.fullPhone(localW, dialW) : phone;
        pe = String(localW || "").replace(/\D/g, "").length < 8 ? "phone_invalid" : null;
      }
      var amtRes = g.Validate.amount(amount, { min: minWd, max: maxWd, step: 500 });
      amount = amtRes.value;
      if (wdPhoneEl) g.Validate.setFieldError(wdPhoneEl, pe ? "Numéro invalide" : null);
      if (wdAmtEl) g.Validate.setFieldError(wdAmtEl, amtRes.ok ? null : amtRes.message);
      if (pe || !amtRes.ok) {
        g.UI.toast(amtRes.message || "Numéro et montant invalides", "error");
        return;
      }
      if (amount > available) {
        var inc = Number(store().user.income) || 0;
        var bal = Number(store().user.balance) || 0;
        g.UI.toast(
          "Solde insuffisant (" + g.UI.cfa(bal) + " disponible)",
          "error"
        );
        return;
      }
      if (!wdSelected) {
        g.UI.toast("Choisissez d'abord MTN, Orange ou Wave", "error");
        return;
      }
      var ok = await g.UI.confirmModal(
        "Confirmer le retrait",
        g.UI.cfa(amount) + " via " + wdSelected.name + "\n" +
          (useSelf ? "Vers mon numéro : " : "Vers un autre numéro : ") + phone,
        { okText: "Demander", danger: true }
      );
      if (!ok) return;
      var btn = document.getElementById("wd-submit");
      if (btn && btn.getAttribute("data-busy") === "1") return;
      if (btn) btn.setAttribute("data-busy", "1");
      g.UI.setBtnLoading(btn, true);
      var res = await g.API.requestWithdraw({
        amount: amount,
        method: "momo",
        mobileProvider: wdSelected.name,
        mobileNumber: phone,
        accountNumber: phone,
        clientAt: new Date().toISOString(),
      });
      g.UI.setBtnLoading(btn, false);
      if (btn) btn.removeAttribute("data-busy");
      if (!res.ok) {
        toastApiError((res && res.error) || "error", "Échec retrait");
        return;
      }
      g.UI.toast(g.I18n.t("withdrawSent") + " " + phone, "success");
      document.getElementById("wd-amount").value = "";
      wdPanel.classList.add("is-hidden");
      g.Router.render(true);
    };
  }




  function bindNotifications() {
    document.querySelectorAll("[data-notif-id]").forEach(function (btn) {
      btn.onclick = async function () {
        await g.API.markNotifRead(btn.getAttribute("data-notif-id"));
        g.Router.render(true);
      };
    });
    var all = document.getElementById("notif-read-all");
    if (all)
      all.onclick = async function () {
        await g.API.markNotifRead(null);
        g.UI.toast("Toutes lues", "success");
        g.Router.render(true);
      };
  }

  function bindProfile() {
    var form = document.getElementById("profile-form");
    if (!form) return;
    form.onsubmit = async function (e) {
      e.preventDefault();
      var errEl = document.getElementById("pf-error");
      errEl.classList.add("is-hidden");
      var name = document.getElementById("pf-name").value.trim();
      var phone = document.getElementById("pf-phone").value.trim();
      if (name.length < 2) {
        errEl.textContent = "Nom trop court (min. 2 caractères)";
        errEl.classList.remove("is-hidden");
        g.UI.toast("Nom invalide", "error");
        return;
      }
      var btn = document.getElementById("pf-btn");
      g.UI.setBtnLoading(btn, true);
      var res = await g.API.updateProfile({ name: name, phone: phone });
      g.UI.setBtnLoading(btn, false);
      if (!res.ok) {
        var msg = res.error === "phone" ? "Téléphone invalide" : "Échec enregistrement";
        errEl.textContent = msg;
        errEl.classList.remove("is-hidden");
        g.UI.toast(msg, "error");
        return;
      }
      g.UI.toast("Profil mis à jour", "success");
      g.Router.render(true);
    };
  }

  function maybeShowOnboard() {
    var st = g.Store.get();
    if (st.onboardDone) return;
    if (document.getElementById("onboard-overlay")) return;
    var path = (location.hash || "#/").replace(/^#/, "").split("?")[0] || "/";
    if (path === "/admin" || path.indexOf("/admin") === 0) return;
    var steps = [
      { title: "Bienvenue sur Intel NG", text: "Investissez dans des nœuds de calcul et suivez vos gains quotidiens." },
      { title: g.I18n.lang() === "en" ? "1. Top up via MoMo" : "1. Rechargez en MoMo", text: g.I18n.t("onboard1") },
      { title: "2. Achetez une machine", text: "Commencez par Activité (3 000 ou 8 000 FCFA), max 10 achats chacun." },
      { title: g.I18n.lang() === "en" ? "3. Collect your earnings" : "3. Récoltez vos gains", text: g.I18n.t("onboard3") },
    ];
    var step = 0;
    var ov = document.createElement("div");
    ov.id = "onboard-overlay";
    ov.className = "onboard-overlay";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-labelledby", "onboard-title");
    function paint() {
      var s = steps[step];
      ov.innerHTML =
        '<div class="onboard-card">' +
        '<p class="text-3xs text-muted">' +
        (step + 1) +
        " / " +
        steps.length +
        "</p>" +
        '<h2 id="onboard-title">' +
        s.title +
        "</h2>" +
        "<p>" +
        s.text +
        "</p>" +
        '<div class="flex gap-2 mt-4">' +
        '<button type="button" class="btn-outline flex-1" id="ob-skip">Passer</button>' +
        '<button type="button" class="btn-primary flex-1" id="ob-next">' +
        (step === steps.length - 1 ? "Commencer" : "Suivant") +
        "</button></div></div>";
      document.getElementById("ob-skip").onclick = finish;
      document.getElementById("ob-next").onclick = function () {
        if (step >= steps.length - 1) finish();
        else {
          step++;
          paint();
        }
      };
    }
    function finish() {
      g.API.completeOnboard();
      ov.remove();
    }
    document.body.appendChild(ov);
    paint();
  }

  function bindSupport() {
    var box = document.getElementById("my-tickets-list");
    if (box) {
      var list = (g.Store.get().supportTickets || []).slice().reverse();
      if (!list.length) {
        box.innerHTML = '<div class="empty-state"><strong>Aucun ticket</strong><p class="text-xs text-muted mt-1">' + g.I18n.t("supportEmpty") + '</p></div>';
      } else {
        box.innerHTML = list.map(function (t) {
          return '<div class="list-row" style="flex-direction:column;align-items:stretch;gap:0.25rem">' +
            '<div class="flex" style="justify-content:space-between"><p class="label">' + (t.subject || "Ticket") +
            '</p><span class="status-tag ' + (t.status || "") + '">' + (t.status || "") + '</span></div>' +
            '<p class="text-3xs text-muted">' + String(t.message || "").slice(0, 120) + '</p>' +
            (t.adminReply ? '<p class="text-xs text-teal">Réponse : ' + String(t.adminReply).replace(/</g, "") + '</p>' : '') +
            '</div>';
        }).join("");
      }
    }
    var form = document.getElementById("support-form");
    if (!form) return;
    form.onsubmit = async function (e) {
      e.preventDefault();
      var name = document.getElementById("s-name").value.trim();
      var email = document.getElementById("s-email").value.trim();
      var subject = document.getElementById("s-subject").value.trim();
      var message = document.getElementById("s-msg").value.trim();
      if (!name || !email || !subject || !message) {
        g.UI.toast("Remplissez tous les champs", "error");
        return;
      }
      var btn = document.getElementById("s-btn");
      g.UI.setBtnLoading(btn, true);
      var res = await g.API.submitSupport({ name: name, email: email, subject: subject, message: message });
      g.UI.setBtnLoading(btn, false);
      if (!res.ok) return g.UI.toast("Échec envoi", "error");
      g.UI.toast("Message envoyé — nous vous répondrons bientôt", "success");
      form.reset();
    };
  }

  function bindMyTeam() {
    try { localStorage.setItem("intelng_invite_seen", "1"); } catch (e) {}
    var invite = (g.Store.get().user && g.Store.get().user.invite) || "";
    var copy = document.getElementById("btn-copy-invite");
    /* copy full referral link when possible */
    if (copy)
      copy.onclick = async function () {
        try {
          await navigator.clipboard.writeText(invite);
          g.UI.toast("Code copié : " + invite, "success");
        } catch (e) {
          g.UI.toast("Code : " + invite, "info");
        }
      };
    var waBtn = document.getElementById("btn-wa-invite");
    if (waBtn)
      waBtn.onclick = function () {
        var inv = (g.Store.get().user && g.Store.get().user.invite) || "";
        var base = location.href.split("#")[0];
        var link = inv ? base + "#/register?ref=" + encodeURIComponent(inv) : base + "#/register";
        var text = "Rejoins Intel NG avec mon code " + inv + " : " + link;
        window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener");
      };
    var share = document.getElementById("btn-share-invite");
    if (share)
      share.onclick = async function () {
        var link =
          location.href.split("#")[0] + "#/register?ref=" + encodeURIComponent(invite);
        var text =
          "Rejoins " +
          (g.Store.get().settings.siteName || "Intel NG") +
          " avec mon code " +
          invite +
          " : " +
          link;
        if (navigator.share) {
          try {
            await navigator.share({ title: "Invitation", text: text, url: link });
            return;
          } catch (e) {}
        }
        try {
          var wa = "https://wa.me/?text=" + encodeURIComponent(text);
          window.open(wa, "_blank", "noopener");
          g.UI.toast("Ouverture WhatsApp…", "success");
        } catch (e2) {
          try {
            await navigator.clipboard.writeText(text);
            g.UI.toast("Lien d'invitation copié", "success");
          } catch (e) {
            g.UI.toast(text, "info");
          }
        }
      };
    var sim = document.getElementById("btn-sim-filleul");
    if (sim)
      sim.onclick = function () {
        var n = String(Math.floor(700000000 + Math.random() * 99999999));
        var masked = n.slice(0, 3) + "****" + n.slice(-4);
        g.Store.update(function (st) {
          st.user.referrals = st.user.referrals || [];
          st.user.referrals.unshift({
            id: g.Store.uid("ref"),
            phone: masked,
            joinedAt: new Date().toISOString(),
            status: "inscrit",
            invested: false,
            bonusPaid: 0,
          });
          st.user.team = st.user.referrals.length;
        });
        g.UI.toast("Filleul ajouté à l'équipe", "success");
        g.Router.render(true);
      };

    /* Préremplir code depuis #/register?ref= */
  }



  function setupOfflineBanner() {
    var bar = document.getElementById("offline-banner");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "offline-banner";
      bar.className = "offline-banner is-hidden";
      bar.setAttribute("role", "status");
      document.body.appendChild(bar);
    }
    function show(msg, kind) {
      bar.textContent = msg;
      bar.classList.remove("is-hidden", "is-warn", "is-ok");
      if (kind) bar.classList.add(kind);
    }
    function hide() {
      bar.classList.add("is-hidden");
    }
    function sync() {
      var off = typeof navigator !== "undefined" && navigator.onLine === false;
      if (off) {
        show("Hors ligne — vérifiez votre connexion Internet", "is-warn");
        try { g.UI.toast("Connexion perdue", "error"); } catch (e) {}
      } else {
        if (bar.classList.contains("is-warn") && !bar.classList.contains("is-hidden")) {
          show("Connexion rétablie", "is-ok");
          setTimeout(hide, 2500);
          try { g.UI.toast("De retour en ligne", "success"); } catch (e) {}
        } else {
          hide();
        }
      }
    }
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    g.Network = {
      show: show,
      hide: hide,
      isOnline: function () {
        try { return navigator.onLine !== false; } catch (e) { return true; }
      },
    };
    sync();
  }
  try { setupOfflineBanner(); } catch (e) {}

  g.Router = { render: render, getPath: getPath };

  window.addEventListener("hashchange", function () {
    render(true);
  });

  if (!location.hash) location.hash = "/";
  try {
    if (g.CDN && g.Store) {
      var cb = (g.Store.get().settings || {}).cdnBase || "";
      if (cb) {
        g.CDN.setCdnBase(cb);
        g.CDN.enableCdn(true);
      }
    }
  } catch (e) {}
  g.UI.applyTheme((g.Store.get().settings && g.Store.get().settings.theme) || "light");

  // Service worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(function () {});
  }

  /** Vide le cache SW (utile après mise à jour) */
  g.clearAppCache = function () {
    return new Promise(function (resolve) {
      if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
        resolve(false);
        return;
      }
      var ch = new MessageChannel();
      ch.port1.onmessage = function () { resolve(true); };
      navigator.serviceWorker.controller.postMessage({ type: "CLEAR_CACHE" }, [ch.port2]);
      setTimeout(function () { resolve(false); }, 2000);
    });
  };

  g.bind = bind;

  async function boot() {
    try {
      if (g.API && g.API.bootstrap) {
        var bootRes = await g.API.bootstrap();
        if (bootRes && !bootRes.ok && (String(bootRes.error || "").indexOf("network") === 0 || bootRes.error === "offline" || String(bootRes.error || "").indexOf("timeout") === 0)) {
          var base = (g.API && g.API.apiBaseDebug) ? g.API.apiBaseDebug() : "";
          console.warn("[Intel NG] API injoignable", base, bootRes.error);
          if (g.Network && g.Network.show) {
            g.Network.show("Serveur injoignable (" + base + ") — configurez l'URL API", "is-warn");
          }
          try { g.UI.toast("Impossible de joindre le serveur", "error"); } catch (e) {}
        }
      }
    } catch (e) {}
    try {
      if (g.API && g.API.getToken && g.API.getToken() && g.API.refreshMe) await g.API.refreshMe();
      if (g.API && g.API.getToken && g.API.getToken() && g.API.fetchNotifications) await g.API.fetchNotifications();
    } catch (e2) {}
    await render(true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      boot();
    });
  } else {
    boot();
  }
})(window);
