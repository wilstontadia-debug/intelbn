/**
 * Pages publiques
 */
(function (g) {
  "use strict";

  function t(k) {
    return g.I18n.t(k);
  }
  function icon(n, c) {
    return g.UI.icon(n, c);
  }
  function cfa(n) {
    return g.UI.cfa(n);
  }
  function store() {
    return g.Store.get();
  }

  var NAV = [
    { name: "home", key: "home", path: "/" },
    { name: "product", key: "products", path: "/product" },
    { name: "honor", key: "honor", path: "/honor" },
    { name: "wallet", key: "wallet", path: "/wallet" },
    { name: "user", key: "my", path: "/my" },
  ];

  function bottomNav(active) {
    var parts = ['<nav class="bottom-nav" role="navigation">'];
    var i, item;
    for (i = 0; i < NAV.length; i++) {
      item = NAV[i];
      parts.push(
        '<a href="#' +
          item.path +
          '" class="nav-item' +
          (active === item.path ? " is-active" : "") +
          '" data-link' +
          (active === item.path ? ' aria-current="page"' : "") +
          ">" +
          icon(item.name, "icon") +
          "<span>" +
          t(item.key) +
          (item.path === "/my" && ((store().user && store().user.referrals) || []).length
            ? ' <span class="nav-dot" title="Équipe"></span>'
            : "") +
          "</span></a>"
      );
    }
    return parts.join("") + "</nav>";
  }

  function shell(opts) {
    var hc = opts.gradient ? "header header-gradient" : "header header-plain";
    var back = opts.back
      ? '<a href="#/" class="header-back" data-link aria-label="Retour">' + icon("chevron-left", "icon") + "</a>"
      : "";
    var maint =
      store().settings.maintenance && opts.active !== "/admin"
        ? '<div class="notice" style="margin:0.5rem 1rem 0"><p><strong>Maintenance</strong> — certaines opérations sont temporairement indisponibles.</p></div>'
        : "";
    return (
      '<div class="shell"><header class="' +
      hc +
      '">' +
      back +
      '<span class="header-title">' +
      opts.title +
      "</span></header>" +
      maint +
      opts.content +
      (opts.noNav ? "" : bottomNav(opts.active)) +
      "</div>"
    );
  }


  function pageMaintenance() {
    return (
      '<main class="main main-center" style="min-height:70vh;display:flex;align-items:center;justify-content:center">' +
      '<div class="card card-pad-lg" style="max-width:22rem;text-align:center">' +
      '<div class="spinner spinner-sm mb-5" style="margin:0 auto" aria-hidden="true"></div>' +
      '<h1 class="text-lg font-semibold mb-2">Maintenance en cours</h1>' +
      '<p class="text-sm text-muted mb-5">Intel NG est momentanément indisponible pour maintenance. Merci de réessayer dans quelques minutes.</p>' +
      '<p class="text-3xs text-muted mb-5">Les soldes et machines restent en sécurité sur le serveur.</p>' +
      '<button type="button" class="btn-primary" id="btn-maint-retry">Réessayer</button>' +
      '<p class="text-3xs text-muted mt-4"><a href="#/admin" class="text-cyan" data-link>Accès administrateur</a></p>' +
      "</div></main>"
    );
  }

  function pageError(opts) {
    opts = opts || {};
    var title = opts.title || t("errorTitle");
    var msg = opts.message || t("errorMsg");
    return (
      '<main class="main main-center" style="min-height:70vh;display:flex;align-items:center;justify-content:center">' +
      '<div class="card card-pad-lg" style="max-width:22rem;text-align:center">' +
      '<p class="text-lg font-semibold mb-2">' + title + "</p>" +
      '<p class="text-sm text-muted mb-5">' + msg + "</p>" +
      '<button type="button" class="btn-primary" onclick="location.reload()">Recharger</button> ' +
      '<a href="#/" class="btn-xs mt-3" data-link style="display:inline-block;margin-top:0.75rem">Accueil</a>' +
      '<p class="text-3xs text-muted mt-4"><a href="#/support" class="text-cyan" data-link>Support</a></p>' +
      "</div></main>"
    );
  }

  function pageHome() {
    var s = store();
    var featured = s.featured || [];
    var notifHtml = '';
    var notes = (s.notifications || []).filter(function (n) { return !n.read; }).slice(0, 2);
    if (notes.length) {
      notifHtml = '<div class="notice" id="home-notif">' + icon('bell', 'icon icon-sm') + '<div>' +
        notes.map(function (n) { return '<p>' + n.text + '</p>'; }).join('') + '</div></div>';
    }
    var balHtml = '';
    if (s.user && s.user.loggedIn) {
      balHtml = '<div class="card card-pad" style="margin-bottom:0.75rem"><p class="label">Solde disponible</p>' +
        '<p class="value text-teal" style="font-size:1.35rem">' + cfa(s.user.balance) + '</p>' +
        '<div class="flex gap-2 mt-2">' +
        '<a href="#/wallet" class="btn-primary flex-1" data-link style="text-align:center">Recharger</a>' +
        '<a href="#/product" class="btn-outline flex-1" data-link style="text-align:center">Investir</a></div></div>';
    }
    var parts = [
      '<main class="main">' + notifHtml + balHtml + '<div class="card"><div class="banner">' +
      g.UI.mediaHtml((s.settings && s.settings.bannerUrl) || "register-banner.jpg", { eager: true, className: "media-wrap is-loading", alt: "Bannière" }) +
      '<div class="banner-overlay-title"><h2>' +
      s.settings.siteName +
      '</h2><p>Rechargez · Investissez · Récoltez chaque jour</p></div>',
      '</div><div class="card-pad"><h1 class="text-sm font-semibold" style="font-size:1.125rem">',
      t("welcome") + " " + s.settings.siteName,
      '</h1><p class="mt-1 text-xs text-muted">',
      t("welcomeSub"),
      '</p><div class="mt-4 flex gap-2">',
      '<a href="#/register" class="btn-primary flex-1" data-link>' + t("register") + "</a>",
      '<a href="#/login" class="btn-outline flex-1" data-link>' + t("login") + "</a>",
      '</div></div></div><div class="notice">',
      icon("bell", "icon icon-sm"),
      "<p>" + (s.notice || "") + "</p></div>",
      '<div class="quick-grid">',
    ];
    var quick = [
      { icon: "product", key: "products", path: "/product" },
      { icon: "honor", key: "honor", path: "/honor" },
      { icon: "wallet", key: "wallet", path: "/wallet" },
      { icon: "user", key: "my", path: "/my" },
    ];
    var i, q, p;
    for (i = 0; i < quick.length; i++) {
      q = quick[i];
      parts.push(
        '<a href="#' + q.path + '" class="quick-item" data-link>' + icon(q.icon, "icon") + "<span>" + t(q.key) + "</span></a>"
      );
    }
    try {
      if (!(localStorage.getItem("intelng_invite_seen")) && (s.user && s.user.loggedIn)) {
        parts.push('<div class="notice"><p>Partagez votre code <strong>' + (s.user.invite || "") + '</strong> pour gagner 25 % sur les machines de vos filleuls. <a href="#/my" data-link class="text-cyan">Voir mon équipe</a></p></div>');
      }
    } catch (e) {}
    parts.push('</div><h2 class="section-label">' + t("featured") + '</h2><div class="space-y">');
    if (!featured.length) {
      parts.push('<div class="empty-state card card-pad"><strong>' + t("emptyFeatured") + '</strong><p class="text-xs text-muted mt-1">Revenez bientôt ou ouvrez le catalogue.</p><a href="#/product" class="btn-outline mt-3" data-link style="display:inline-block">Catalogue</a></div>');
    } else {
      for (i = 0; i < featured.length; i++) {
        p = featured[i];
        parts.push(
          '<div class="card product-card">' +
            g.UI.mediaHtml(p.image || "img/machines/cpu1.jpg", { className: "product-media media-wrap is-loading" }) +
            '<div class="card-pad"><p class="text-sm font-semibold">' +
            p.name +
            '</p><p class="mt-1 text-xs text-muted">' +
            t("daily") +
            " " +
            cfa(p.daily) +
            " · " +
            p.days +
            " " +
            t("days") +
            '</p><p class="text-sm font-semibold text-teal mt-1">' +
            cfa(p.price) +
            '</p><a href="#/product" class="btn-outline full mt-2" data-link style="text-align:center;display:block">Voir</a></div></div>'
        );
      }
    }
    /* Recommandé selon solde */
    var bal = Number((s.user && s.user.balance) || 0);
    var allP = [];
    Object.keys(s.products || {}).forEach(function (k) {
      (s.products[k] || []).forEach(function (x) { allP.push(x); });
    });
    var rec = allP
      .filter(function (x) { return Number(x.price) > 0 && Number(x.price) <= Math.max(bal, 8000); })
      .sort(function (a, b) { return Number(a.price) - Number(b.price); })
      .slice(0, 3);
    if (!rec.length) {
      rec = ((s.products && s.products.Activité) || []).slice(0, 2);
    }
    if (rec.length) {
      parts.push('<h2 class="section-label">RECOMMANDÉ POUR VOUS</h2><div class="space-y">');
      rec.forEach(function (rp) {
        parts.push(
          '<div class="card product-card"><div class="card-pad">' +
          '<p class="text-sm font-semibold">' + rp.name + '</p>' +
          '<p class="text-xs text-muted mt-1">' + cfa(rp.price) + ' · ' + cfa(rp.daily) + '/j</p>' +
          '<a href="#/product" class="btn-primary full mt-2" data-link style="text-align:center;display:block">Choisir</a></div></div>'
        );
      });
      parts.push('</div>');
    }
    parts.push("</div></main>");
    return shell({ title: t("home"), gradient: true, content: parts.join(""), active: "/" });
  }


  function pageForgot() {
    return shell({
      title: "MOT DE PASSE",
      back: true,
      active: "/login",
      content:
        '<main class="main-auth"><div class="card card-pad-lg">' +
        '<h1 class="text-sm font-semibold">' + t("forgotTitle") + '</h1>' +
        '<p class="mt-1 mb-5 text-xs text-muted">' + t("forgotHint") + '</p>' +
        '<div class="form-stack" id="forgot-step1">' +
        '<div><label class="field-label" for="fphone">Téléphone du compte</label>' +
        '<div class="field-box"><input id="fphone" inputmode="tel" placeholder="6XX XX XX XX" /></div></div>' +
        '<button type="button" class="btn-primary full" id="forgot-send">' + t("forgotSend") + '</button></div>' +
        '<div class="form-stack is-hidden" id="forgot-step2">' +
        '<div><label class="field-label" for="fcode">Code reçu</label>' +
        '<div class="field-box"><input id="fcode" inputmode="numeric" placeholder="6 chiffres" /></div></div>' +
        '<div><label class="field-label" for="fpass">Nouveau mot de passe</label>' +
        '<div class="field-box"><input id="fpass" type="password" autocomplete="new-password" /></div></div>' +
        '<div><label class="field-label" for="fpass2">Confirmer</label>' +
        '<div class="field-box"><input id="fpass2" type="password" autocomplete="new-password" /></div></div>' +
        '<button type="button" class="btn-primary full" id="forgot-reset">' + t("forgotSave") + '</button></div>' +
        '<p class="text-center text-xs text-muted mt-4"><a href="#/login" class="text-cyan" data-link>' + t("backLogin") + '</a></p>' +
        "</div></main>",
    });
  }

  function pageLogin() {
    return shell({
      title: t("login").toUpperCase(),
      back: true,
      active: "/login",
      content:
        '<div class="banner banner-tall"><img src="register-banner.jpg" alt="" width="640" height="320" decoding="async" sizes="480px" /><div class="banner-fade"></div></div>' +
        '<main class="main-auth"><div class="card card-pad-lg">' +
        '<h1 class="text-sm font-semibold">' +
        t("login") +
        '</h1><p class="mt-1 mb-5 text-xs text-muted">Zone XAF</p>' +
        '<form id="login-form" class="form-stack" novalidate>' +
        '<div><label class="field-label" for="login-country">Pays</label><div class="field-box">' +
        '<select id="login-country" style="width:100%;border:none;background:transparent;color:inherit;font:inherit">' +
        '<option value="+237" selected>Cameroun (+237)</option>' +
        '<option value="+236">Centrafrique (+236)</option>' +
        '<option value="+235">Tchad (+235)</option>' +
        '<option value="+242">Congo (+242)</option>' +
        '<option value="+240">Guinée équatoriale (+240)</option>' +
        '<option value="+241">Gabon (+241)</option>' +
        "</select></div></div>" +
        '<div><label class="field-label" for="lphone">Téléphone</label><div class="field-box"><div class="field-prefix">' +
        icon("phone", "icon icon-sm") +
        '<span id="login-prefix">+237</span></div><input id="lphone" inputmode="tel" placeholder="6XX XX XX XX" autocomplete="tel" /></div></div>' +
        '<div><label class="field-label" for="lpassword">Password</label><div class="field-box">' +
        icon("lock", "icon icon-sm text-cyan") +
        '<input id="lpassword" type="password" autocomplete="current-password" />' +
        '<button type="button" class="field-toggle" id="l-toggle">' +
        icon("eye", "icon icon-sm") +
        "</button></div></div>" +
        '<p class="error-msg is-hidden" id="login-error" role="alert"></p>' +
        '<label class="text-xs text-muted" style="display:flex;align-items:center;gap:0.4rem;margin:0.35rem 0"><input type="checkbox" id="remember-login" /> Se souvenir de moi (cet appareil)</label>' +
        '<button type="submit" id="login-btn" class="btn-primary full"><span class="btn-label">' +
        t("login") +
        '</span><span class="btn-spinner"><span class="spinner-btn"></span></span></button>' +
        '<p class="text-center text-xs mt-3"><a href="#/forgot" class="text-cyan" data-link>' + t("forgotLink") + '</a></p>' +
        '<p class="text-center text-xs text-muted"><a href="#/register" class="text-cyan" data-link>' +
        t("register") +
        "</a></p></form>" +
        '<div id="login-success" class="success-panel is-hidden"><div class="success-icon">' +
        icon("check", "icon icon-xl") +
        '</div><p class="text-sm text-muted" id="login-phone-display"></p>' +
        '<a href="#/" class="btn-primary mt-2" data-link>OK</a></div></div></main>',
    });
  }

  function pageRegister() {
    return shell({
      title: t("register").toUpperCase(),
      back: true,
      active: "/register",
      content:
        '<div class="banner banner-tall"><img src="register-banner.jpg" alt="" width="640" height="320" decoding="async" /><div class="banner-fade"></div></div>' +
        '<main class="main-auth"><div class="card card-pad-lg">' +
        '<form id="register-form" class="form-stack" novalidate>' +
        '<div><label class="field-label" for="country">Pays (XAF)</label><div class="field-box">' +
        '<select id="country" style="width:100%;border:none;background:transparent;color:inherit;font:inherit;padding:0.25rem 0">' +
        '<option value="CM" data-dial="+237" selected>Cameroun (+237)</option>' +
        '<option value="CF" data-dial="+236">Centrafrique (+236)</option>' +
        '<option value="TD" data-dial="+235">Tchad (+235)</option>' +
        '<option value="CG" data-dial="+242">Congo (+242)</option>' +
        '<option value="GQ" data-dial="+240">Guinée équatoriale (+240)</option>' +
        '<option value="GA" data-dial="+241">Gabon (+241)</option>' +
        "</select></div></div>" +
        '<div><label class="field-label" for="phone">Téléphone</label><div class="field-box"><div class="field-prefix">' +
        icon("phone", "icon icon-sm") +
        '<span id="phone-prefix">+237</span></div>' +
        '<input id="phone" inputmode="tel" placeholder="6XX XX XX XX" autocomplete="tel-national" /></div>' +
        '<p class="text-3xs text-muted mt-1">Le numéro commence par l’indicatif du pays choisi</p></div>' +
        '<div><label class="field-label" for="code">Code</label><div class="field-box">' +
        icon("ticket", "icon icon-sm text-cyan") +
        '<input id="code" value="' +
        (store().user.invite || (store().user.loggedIn ? "—" : "")) +
        '" /></div></div>' +
        '<div><label class="field-label" for="password">Password</label><div class="field-box">' +
        icon("lock", "icon icon-sm text-cyan") +
        '<input id="password" type="password" /><button type="button" class="field-toggle" data-toggle="password">' +
        icon("eye", "icon icon-sm") +
        "</button></div></div>" +
        '<div><label class="field-label" for="confirm">Confirm</label><div class="field-box">' +
        icon("lock", "icon icon-sm text-cyan") +
        '<input id="confirm" type="password" /><button type="button" class="field-toggle" data-toggle="confirm">' +
        icon("eye", "icon icon-sm") +
        "</button></div></div>" +
        '<p class="error-msg is-hidden" id="register-error" role="alert"></p>' +
        '<button type="submit" id="register-btn" class="btn-primary full"><span class="btn-label">' +
        t("register") +
        '</span><span class="btn-spinner"><span class="spinner-btn"></span></span></button></form>' +
        '<div id="register-success" class="success-panel is-hidden"><div class="success-icon">' +
        icon("check", "icon icon-xl") +
        '</div><p id="reg-phone-display" class="text-sm text-muted"></p>' +
        '<a href="#/" class="btn-primary mt-2" data-link>OK</a></div></div></main>',
    });
  }

  function renderProductCards(list) {
    if (!list || !list.length) {
      return '<div class="empty-state"><strong>Aucun produit</strong><p class="text-xs text-muted mt-1">Changez de catégorie ou revenez plus tard.</p><a href="#/" class="btn-outline mt-3" data-link style="display:inline-block">Accueil</a></div>';
    }
    var cfa = g.UI.cfa;
    var owned = (store().user && store().user.owned) || [];
    var bal = Number(store().user && store().user.balance) || 0;
    return list
      .map(function (p) {
        var img = p.image || "";
        var price = Number(p.price) || 0;
        var daily = Number(p.daily) || 0;
        var days = Number(p.days) || 0;
        var total = daily * days;
        var roi = price > 0 ? Math.round(((total - price) / price) * 100) : 0;
        var maxBuys = p.maxBuys != null ? Number(p.maxBuys) : (price === 3000 || price === 8000 ? 10 : null);
        var bought = owned.filter(function (o) {
          return o.name === p.name || Number(o.price) === price;
        }).length;
        var left = maxBuys != null ? Math.max(0, maxBuys - bought) : null;
        var limitNote = maxBuys
          ? '<p class="text-3xs mt-1" style="color:#f59e0b">Limite : ' + bought + '/' + maxBuys + ' achats' +
            (left === 0 ? ' — maximum atteint' : ' (reste ' + left + ')') + '</p>'
          : "";
        var canAfford = bal >= price;
        var disabled = left === 0;
        var btnLabel = disabled ? t("limitReached") : (t("buy") + " · " + cfa(price));
        return (
          '<article class="card product-card" data-price="' + price + '" data-daily="' + daily + '" data-days="' + days + '">' +
          (img
            ? g.UI.mediaHtml(img, { alt: p.name, className: "product-media media-wrap is-loading" })
            : '<div class="product-media media-wrap" style="min-height:7rem;display:flex;align-items:center;justify-content:center;background:rgba(30,78,90,0.15);border-radius:0.5rem"><span class="text-3xs text-muted">Image bientôt</span></div>') +
          '<div class="card-pad">' +
          '<div class="flex gap-2 flex-wrap" style="align-items:center;margin-bottom:0.25rem">' +
          (price === 3000 || price === 8000 ? '<span class="badge badge-popular">Populaire</span>' : '') +
          (String(p.id || "").indexOf("vf") === 0 ? '<span class="badge" style="background:#f59e0b;color:#111">Vendredi</span>' : '') +
          (p.badge === 'new' || (p.id && String(p.id).indexOf('c') === 0) ? '<span class="badge badge-new">Nouveau</span>' : '') +
          (p.priceHistory && p.priceHistory.length ? '<span class="badge">Prix MAJ</span>' : '') +
          '</div>' +
          '<p class="text-sm font-semibold">' + p.name + '</p>' +
          '<p class="text-xs text-muted mt-1">' + cfa(price) + " · " + cfa(daily) + "/j · " + (days || "—") + " j</p>" +
          '<p class="product-final mt-2">Total à la fin : <strong>' + cfa(total) + '</strong>' +
          (roi > 0 ? ' <span class="text-3xs text-teal">(+'+roi+'%)</span>' : '') + '</p>' +
          '<p class="text-3xs text-muted">Investissement ' + cfa(price) + ' → gains cumulés ' + cfa(total) + '</p>' +
          '<p class="text-3xs text-muted">Frais de plateforme : <strong>0 FCFA</strong></p>' +
          limitNote +
          (!canAfford && !disabled ? '<p class="text-3xs text-muted mt-1">Solde insuffisant — <a href="#/wallet" data-link class="text-cyan">Recharger</a></p>' : '') +
          '<button type="button" class="btn-primary full mt-3 purchase-btn"' + (disabled ? ' disabled style="opacity:0.55"' : '') +
          ' data-id="' + String(p.id || "").replace(/"/g, "&quot;") +
          '" data-name="' + String(p.name).replace(/"/g, "&quot;") +
          '" data-price="' + price +
          '" data-daily="' + daily +
          '" data-days="' + days +
          '" data-image="' + String(img).replace(/"/g, "&quot;") +
          '" data-max-buys="' + (maxBuys != null ? maxBuys : "") +
          '"><span class="btn-label">' + btnLabel +
          '</span><span class="btn-spinner"><span class="spinner-btn"></span></span></button></div></article>'
        );
      })
      .join("");
  }

  function businessTz() {
    var cfg = (typeof window !== "undefined" && window.__INTEL_NG_CONFIG__) || {};
    return cfg.timezone || cfg.tz || "Africa/Douala";
  }
  function fridayCountdownHtml() {
    try {
      var tz = businessTz();
      var now = new Date();
      var fmt = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false });
      var parts = fmt.formatToParts(now);
      var get = function (t) { for (var i = 0; i < parts.length; i++) if (parts[i].type === t) return parts[i].value; return ""; };
      var wd = (get("weekday") || "").toLowerCase();
      var isFri = wd.indexOf("fri") === 0 || wd.indexOf("ven") === 0;
      var isThu = wd.indexOf("thu") === 0 || wd.indexOf("jeu") === 0;
      if (isFri) {
        return '<div class="notice" style="border-left:3px solid #f59e0b"><p class="text-sm font-semibold">⚡ Flash Vendredi en cours</p><p class="text-xs text-muted">Offres spéciales disponibles aujourd\'hui (fuseau ' + tz + ').</p></div>';
      }
      // next Friday rough
      var daysMap = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, dim: 0, lun: 1, mar: 2, mer: 3, jeu: 4, ven: 5, sam: 6 };
      var cur = 0;
      for (var k in daysMap) { if (wd.indexOf(k) === 0) { cur = daysMap[k]; break; } }
      var delta = (5 - cur + 7) % 7;
      if (delta === 0) delta = 7;
      var msg = isThu ? "Demain : Flash Vendredi (machines spéciales)." : ("Prochain Flash Vendredi dans " + delta + " j.");
      return '<div class="notice"><p class="text-xs"><strong>Flash Vendredi</strong> — ' + msg + ' Fuseau : ' + tz + '.</p></div>';
    } catch (e) { return ""; }
  }

  function isFridayDouala() {
    try {
      var fmt = new Intl.DateTimeFormat("en-US", { timeZone: businessTz(), weekday: "short" });
      var w = fmt.format(new Date()).toLowerCase();
      return w.indexOf("fri") === 0 || w.indexOf("ven") === 0;
    } catch (e) {
      return new Date().getDay() === 5;
    }
  }

  function pageProduct() {
    var s = store();
    var tabs = Object.keys(s.products).filter(function (k) {
      if (k === "Vendredi" && !isFridayDouala()) return false;
      return true;
    });
    var ban = (s.settings && s.settings.bannerProduct) || "img/banner-product.jpg";
    var owned = (s.user && s.user.owned) || [];
    var left3000 = Math.max(0, 10 - owned.filter(function (o) { return Number(o.price) === 3000; }).length);
    var left8000 = Math.max(0, 10 - owned.filter(function (o) { return Number(o.price) === 8000; }).length);
    var parts = [
      '<main class="main">' + fridayCountdownHtml() +
      '<div class="card" style="margin-bottom:0.75rem"><div class="banner">' +
        g.UI.mediaHtml(ban, { className: "media-wrap is-loading", alt: "Catalogue" }) +
        '<div class="banner-overlay-title"><h2>Catalogue machines</h2><p>' + t("catalogSub") + '</p></div></div></div>' +
        '<div class="tabs" id="product-tabs" role="tablist">',
    ];
    var i;
    for (i = 0; i < tabs.length; i++) {
      parts.push(
        '<button type="button" class="tab' +
          (i === 0 ? " is-active" : "") +
          '" data-tab="' +
          tabs[i] +
          '">' +
          tabs[i] +
          "</button>"
      );
    }
    parts.push(
      '</div>' +
      '<div class="card card-pad" style="margin-bottom:0.75rem">' +
      '<div class="flex gap-2 flex-wrap" style="align-items:center">' +
      '<label class="text-3xs text-muted">Trier</label>' +
      '<select id="product-sort" class="field-box" style="flex:1;min-width:8rem;padding:0.4rem 0.5rem">' +
      '<option value="default">Par défaut</option>' +
      '<option value="price-asc">Prix ↑</option>' +
      '<option value="price-desc">Prix ↓</option>' +
      '<option value="daily-desc">Gain/j ↓</option>' +
      '<option value="roi-desc">Rendement % ↓</option>' +
      '</select>' +
      '<label class="text-3xs text-muted">Max prix</label>' +
      '<select id="product-maxprice" class="field-box" style="flex:1;min-width:7rem;padding:0.4rem 0.5rem">' +
      '<option value="0">Tous</option>' +
      '<option value="10000">≤ 10 000</option>' +
      '<option value="50000">≤ 50 000</option>' +
      '<option value="100000">≤ 100 000</option>' +
      '</select></div>' +
      '<p class="text-3xs text-muted mt-2">Astuce : commencez par <strong>Activité</strong>. Restants : <strong>3 000 FCFA × ' + left3000 + '</strong> · <strong>8 000 FCFA × ' + left8000 + '</strong></p></div>' +
      '<div class="space-y" id="product-list">' +
        renderProductCards(store().products[tabs[0]]) +
        "</div></main>"
    );
    return shell({ title: t("products"), gradient: true, content: parts.join(""), active: "/product" });
  }


  function investmentHelpers(owned) {
    var dayMs = 24 * 60 * 60 * 1000;
    var now = Date.now();
    return (owned || []).map(function (o) {
      var days = Number(o.days) || 0;
      var daily = Number(o.daily) || 0;
      var start = o.startedAt ? new Date(o.startedAt).getTime() : o.at || now;
      var end = days > 0 ? start + days * dayMs : start;
      var elapsed = Math.max(0, now - start);
      var progress = days > 0 ? Math.min(100, Math.round((elapsed / (days * dayMs)) * 100)) : 0;
      var maxEarn = daily * days;
      var earned = Number(o.earned) || 0;
      if (earned >= maxEarn && maxEarn > 0) progress = 100;
      var status = o.status || "active";
      if (progress >= 100 || (maxEarn > 0 && earned >= maxEarn)) status = "completed";
      var daysLeft = days > 0 ? Math.max(0, Math.ceil((end - now) / dayMs)) : 0;
      return {
        raw: o,
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
      };
    });
  }

  function pageInvestments() {
    var u = store().user;
    var list = investmentHelpers(u.owned || []);
    var capital = list.reduce(function (s, x) { return s + (Number(x.price) || 0); }, 0);
    var profit = list.reduce(function (s, x) { return s + (Number(x.earned) || 0); }, 0);
    var active = list.filter(function (x) { return x.status === "active"; }).length;
    var current = capital + profit;
    var t = g.I18n.t;
    var cfa = g.UI.cfa;

    return shell({
      title: t("investments"),
      gradient: true,
      active: "/wallet",
      content:
        '<main class="main">' +
        '<div class="card" style="margin-bottom:0.75rem"><div class="banner banner-sm">' +
        g.UI.mediaHtml("img/banner-product.jpg", { className: "media-wrap is-loading", alt: "Investissements" }) +
        '<div class="banner-overlay-title"><h2>Mes investissements</h2><p>Performance de vos machines</p></div></div></div>' +
        '<p class="text-xs text-muted mb-5">Suivez vos machines, gains journaliers et fin de contrat.</p>' +
        '<div class="admin-grid" style="margin-bottom:0.75rem">' +
        '<div class="kpi"><p class="k">Capital investi</p><p class="v" style="font-size:0.95rem">' + cfa(capital) + '</p></div>' +
        '<div class="kpi"><p class="k">Profit total</p><p class="v" style="font-size:0.95rem">' + cfa(profit) + '</p></div>' +
        '<div class="kpi"><p class="k">Actifs</p><p class="v">' + active + '</p></div>' +
        '<div class="kpi"><p class="k">Valeur actuelle</p><p class="v" style="font-size:0.95rem">' + cfa(current) + '</p></div>' +
        '</div>' +
        '<div class="flex gap-2 flex-wrap mb-5" id="inv-filters">' +
        '<button type="button" class="tab is-active" data-inv-filter="all">Tous</button>' +
        '<button type="button" class="tab" data-inv-filter="active">Actifs</button>' +
        '<button type="button" class="tab" data-inv-filter="completed">Terminés</button>' +
        '</div>' +
        '<div class="flex gap-2 mb-5">' +
        '<button type="button" class="btn-primary flex-1" id="btn-claim-daily-inv">Récolter les gains du jour</button>' +
        '<a href="#/product" class="btn-outline flex-1" data-link style="text-align:center">Catalogue</a></div>' +
        '<div id="inv-list"></div>' +
        '<p class="text-center text-3xs text-muted mt-4"><a href="#/wallet" class="text-cyan" data-link>Portefeuille</a></p>' +
        "</main>",
    });
  }

  function pageWallet() {
    var stAll = store();
    var u = stAll.user;
    var pendingDeps = (stAll.pendingDeposits || []).filter(function (d) { return d.status === "pending"; });
    var pendingWds = (stAll.pendingWithdrawals || []).filter(function (d) { return d.status === "pending"; });
    var t = g.I18n.t;
    var icon = g.UI.icon;
    var cfa = g.UI.cfa;
    return shell({
      title: t("wallet"),
      gradient: true,
      active: "/wallet",
      content:
        '<main class="main">' +
        '<div class="card" style="margin-bottom:0.75rem"><div class="banner banner-sm">' +
        g.UI.mediaHtml((store().settings && store().settings.bannerWallet) || "img/banner-wallet.jpg", { className: "media-wrap is-loading", alt: "Portefeuille" }) +
        '<div class="banner-overlay-title"><h2>Portefeuille</h2><p>Recharge · retrait · solde</p></div></div></div>' +
        '<div class="card card-pad">' +
        '<p class="label">Solde disponible</p>' +
        '<p class="value" style="font-size:1.5rem" id="wallet-balance">' + cfa(u.balance) + '</p>' +
        '<p class="text-xs text-muted mt-1">Solde mis à jour dès validation de votre dépôt</p>' +
        '<div class="flex gap-2 mt-4">' +
        '<button type="button" class="btn-primary flex-1" id="btn-recharge">' + t("recharge") + '</button>' +
        '<button type="button" class="btn-outline flex-1" id="btn-withdraw">' + t("withdraw") + '</button></div>' +
        '<a href="#/investments" class="btn-outline full mt-2" data-link style="text-align:center;display:block">Mes investissements</a>' +
        (pendingDeps.length
          ? '<div class="card card-pad mt-4" style="border-color:var(--gold,#F2A93B)">' +
            '<p class="text-sm font-semibold">' + t("depositPendingTitle") + '</p>' +
            pendingDeps.map(function (d) {
              return '<p class="text-xs text-muted mt-2">#' + String(d.id).slice(0, 12) + ' · ' + g.UI.cfa(d.amount) +
                (d.provider ? ' · ' + d.provider : '') +
                ' · <span class="badge">En cours</span></p>';
            }).join('') +
            '<p class="text-3xs text-muted mt-2">' + t("depositHelp") + '</p></div>'
          : '') +
        (function () {
          var rejected = (stAll.pendingDeposits || []).filter(function (d) { return d.status === "rejected"; }).slice(0, 5);
          if (!rejected.length) return '';
          return '<div class="card card-pad mt-4" style="border-color:#ef4444">' +
            '<p class="text-sm font-semibold">Recharges refusées</p>' +
            rejected.map(function (d) {
              return '<div class="mt-3" style="border-top:1px solid var(--border,rgba(0,0,0,.08));padding-top:0.5rem">' +
                '<p class="text-xs">#' + String(d.id).slice(0, 12) + ' · <strong>' + g.UI.cfa(d.amount) + '</strong>' +
                (d.provider ? ' · ' + d.provider : '') + '</p>' +
                '<p class="text-3xs text-muted mt-1">Motif : ' + String(d.rejectReason || "Non précisé").replace(/</g, "") + '</p>' +
                '<button type="button" class="btn-xs primary mt-2" data-resubmit-dep="' + d.id + '">Renvoyer une preuve</button>' +
                '<input type="file" accept="image/*" class="is-hidden" id="resubmit-file-' + d.id + '" data-resubmit-file="' + d.id + '" />' +
                '</div>';
            }).join('') +
            '</div>';
        })() +
        (pendingWds.length
          ? '<div class="card card-pad mt-4">' +
            '<p class="text-sm font-semibold">Retraits en cours de traitement</p>' +
            pendingWds.map(function (d) {
              return '<p class="text-xs text-muted mt-2">' + g.UI.cfa(d.amount) + ' · en cours de traitement</p>';
            }).join('') + '</div>'
          : '') +
        '</div>' +
        /* Panel recharge wizard (hidden until open) */
        '<div class="card card-pad mt-4 is-hidden" id="recharge-panel">' +
        '<p class="text-sm font-semibold" style="font-size:1.15rem">Recharger mon wallet</p>' +
        '<p class="text-xs text-muted mt-1 mb-3">' + t("depositIntro") + '</p>' +
        '<div class="hint-box mb-5" style="background:var(--surface-elevated);border-radius:12px;padding:12px;font-size:0.8rem;line-height:1.45">' +
        '<p class="text-xs font-semibold mb-2">' + t("depositHowTitle") + '</p>' +
        '<ol class="text-xs text-muted" style="margin:0;padding-left:1.1rem">' +
        '<li style="margin-bottom:0.35rem">' + t("depositHow1") + '</li>' +
        '<li style="margin-bottom:0.35rem">' + t("depositHow2") + '</li>' +
        '<li style="margin-bottom:0.35rem">' + t("depositHow3") + '</li>' +
        '<li>' + t("depositHow4") + '</li>' +
        '</ol></div>' +
        '<p class="text-xs mb-5" style="color:var(--teal-dark);font-weight:600">' + t("depositExactAmount") + '</p>' +
        '<div id="rc-status-box" class="status-box is-hidden" role="status"></div>' +
        '<ol class="wizard-steps" id="rc-steps" aria-label="Étapes de recharge">' +
        '<li class="on" data-rc-step="1"><span class="n">1</span> Paiement</li>' +
        '<li data-rc-step="2"><span class="n">2</span> ' + t("proofStep") + '</li>' +
        '<li data-rc-step="3"><span class="n">3</span> Envoi</li></ol>' +
        '<div id="rc-step1">' +
        '<p class="text-xs text-muted mb-5">' + t("depositMinInfo") + '</p>' +
        '<p class="text-sm font-semibold mb-5">Choisir un compte de dépôt</p>' +
        '<div id="rc-providers" class="space-y"></div>' +
        '<div class="card card-pad mt-4 is-hidden" id="rc-deposit-box" style="background:var(--surface-elevated)">' +
        '<p class="text-3xs text-muted" style="letter-spacing:.06em;text-transform:uppercase">Coordonnées officielles</p>' +
        '<p class="text-sm font-semibold mt-1" id="rc-dep-provider">—</p>' +
        '<p class="text-xs text-muted mt-1">Numéro</p>' +
        '<div class="flex items-center gap-2 mt-1">' +
        '<span class="text-sm font-semibold text-teal" id="rc-dep-number">—</span>' +
        '<button type="button" class="btn-xs primary" id="rc-copy">Copier</button></div>' +
        '<p class="text-xs text-muted mt-2">Titulaire</p>' +
        '<p class="text-sm" id="rc-dep-holder">—</p></div>' +
        '<div class="form-stack mt-4">' +
        '<div class="hint-box mb-5" style="background:var(--surface-elevated);border-radius:12px;padding:12px;font-size:0.82rem;color:var(--muted)">' +
        '<p class="text-xs" style="color:var(--foreground)">' + t("depositLimits") + '</p></div>' +
        '<div><label class="field-label" for="rc-country">Pays (zone XAF)</label>' +
        '<div class="field-box"><select id="rc-country" style="width:100%;border:none;background:transparent;color:inherit;font:inherit">' +
        g.UI.xafCountryOptions(u.dial || u.country || "+237") +
        '</select></div></div>' +
        '<div><label class="field-label" for="rc-phone">Votre n° (expéditeur)</label>' +
        '<div class="field-box phone-row" style="display:flex;align-items:center;gap:0.5rem">' +
        '<span class="dial-prefix" id="rc-dial-prefix" style="font-weight:600;font-size:0.9rem;white-space:nowrap;color:var(--accent-cyan)">' +
        (u.dial || "+237") +
        '</span>' +
        '<input id="rc-phone" inputmode="tel" placeholder="6XX XX XX XX" style="flex:1;border:none;background:transparent;color:inherit;font:inherit" value="' +
        String(u.phone || "").replace(/^\+\d{3}/, "").replace(/^\+/, "") +
        '" /></div>' +
        '<p class="text-3xs text-muted mt-1">Le numéro doit correspondre à celui qui envoie le Mobile Money.</p>' +
        '<p class="field-error is-hidden" id="rc-phone-err"></p></div>' +
        '<div><label class="field-label" for="rc-amount">Montant déposé (FCFA)</label>' +
        '<div class="field-box"><input id="rc-amount" type="number" min="2000" max="500000" step="500" placeholder="Ex. 5000" /></div><p class="text-3xs text-muted mt-1">Min. 2 000 · max. 500 000 · multiple de 500 FCFA</p><p class="field-error is-hidden" id="rc-amount-err"></p></div>' +
        '<div class="flex gap-2 flex-wrap" id="rc-chips">' +
        (function () {
          var bal = Number(u.balance) || 0;
          var base = [2000, 5000, 10000, 25000, 50000, 100000];
          if (bal >= 4000) base.push(Math.floor(bal / 2 / 500) * 500);
          if (bal >= 2000) base.push(Math.min(500000, Math.floor(bal / 500) * 500));
          var seen = {};
          return base.filter(function (a) {
            if (a < 2000 || a > 500000 || seen[a]) return false;
            seen[a] = true;
            return true;
          }).sort(function (a, b) { return a - b; }).map(function (a) {
            return '<button type="button" class="btn-xs" data-chip="' + a + '">' + a.toLocaleString("fr-FR") + "</button>";
          }).join("");
        })() +
        "</div>" +
        '<button type="button" class="btn-primary full mt-3" id="rc-paid">J\'ai effectué le paiement →</button>' +
        '<button type="button" class="btn-outline full mt-2" id="rc-cancel">Fermer</button>' +
        "</div></div>" +
        '<div id="rc-step2" class="is-hidden">' +
        '<button type="button" class="text-xs text-cyan mb-5" id="rc-back">← Retour</button>' +
        '<p class="text-sm font-semibold">' + t("proofTitle") + '</p>' +
        '<p class="text-xs text-muted mt-1 mb-2">Résumé : <span id="rc-summary"></span></p>' +
        '<p class="text-xs mb-3" style="color:var(--teal-dark)">Vérifiez que la capture montre le <strong>montant exact</strong>, le <strong>numéro</strong> et le <strong>statut réussi</strong>.</p>' +
        '<div class="hint-box mb-5" style="background:var(--surface-elevated);border-radius:12px;padding:12px;font-size:0.8rem">' +
        '<p class="text-xs font-semibold mb-2">Checklist</p>' +
        '<label class="text-xs text-muted" style="display:block;margin:0.25rem 0"><input type="checkbox" id="rc-chk-sent" /> J\'ai envoyé le Mobile Money</label>' +
        '<label class="text-xs text-muted" style="display:block;margin:0.25rem 0"><input type="checkbox" id="rc-chk-shot" /> Je dispose de la capture d\'écran</label>' +
        '<label class="text-xs text-muted" style="display:block;margin:0.25rem 0"><input type="checkbox" id="rc-chk-name" /> Le nom du titulaire est exact</label></div>' +
        '<div class="form-stack">' +
        '<div><label class="field-label" for="rc-accname">Nom du titulaire utilisé pour le dépôt</label>' +
        '<div class="field-box"><input id="rc-accname" placeholder="Nom exact du compte MoMo" /></div></div>' +
        '<div><label class="field-label">Capture d\'écran du paiement</label>' +
        '<div class="file-drop" id="rc-file-drop" style="border:1.5px dashed var(--field-border);border-radius:10px;padding:1rem;text-align:center;cursor:pointer">' +
        '<p class="text-xs text-muted">Appuyez pour sélectionner une image</p>' +
        '<input type="file" id="rc-screenshot" accept="image/*" class="is-hidden" /></div>' +
        '<div id="rc-preview" class="is-hidden mt-2"><img id="rc-preview-img" alt="" style="max-width:100%;border-radius:8px;max-height:160px" />' +
        '<p class="text-3xs text-muted mt-1" id="rc-preview-name"></p></div></div>' +
        '<button type="button" class="btn-primary full" id="rc-submit">' + t("proofSend") + '</button>' +
        "</div></div></div>" +
        /* Withdraw panel */
        '<div class="card card-pad mt-4 is-hidden" id="withdraw-panel">' +
        '<p class="text-sm font-semibold">' + t("withdrawTitle") + '</p>' +
        '<p class="text-xs text-muted mt-1 mb-3">' + t("withdrawLimits") + '</p>' +
        '<p class="text-xs font-semibold mb-2">' + t("chooseOperator") + '</p>' +
        '<div id="wd-providers" class="space-y mb-4"></div>' +
        '<p class="text-xs font-semibold mb-2">' + t("destNumber") + '</p>' +
        '<div class="hint-box mb-3" style="background:var(--surface-elevated);border-radius:12px;padding:10px">' +
        '<label class="text-xs" style="display:flex;align-items:flex-start;gap:0.5rem;margin-bottom:0.5rem;cursor:pointer">' +
        '<input type="radio" name="wd-dest" id="wd-dest-self" value="self" checked style="margin-top:2px" />' +
        '<span><strong>' + t("useMyPhone") + '</strong><br/><span class="text-muted">' +
        (u.phone || "—") +
        '</span></span></label>' +
        '<label class="text-xs" style="display:flex;align-items:flex-start;gap:0.5rem;cursor:pointer">' +
        '<input type="radio" name="wd-dest" id="wd-dest-other" value="other" style="margin-top:2px" />' +
        '<span><strong>' + t("useOtherPhone") + '</strong><br/><span class="text-muted">' + t("otherPhoneHint") + '</span></span></label>' +
        '</div>' +
        '<div class="form-stack">' +
        '<div id="wd-other-fields" class="is-hidden">' +
        '<div><label class="field-label" for="wd-country">Pays (zone XAF)</label>' +
        '<div class="field-box"><select id="wd-country" style="width:100%;border:none;background:transparent;color:inherit;font:inherit">' +
        g.UI.xafCountryOptions(u.dial || u.country || "+237") +
        '</select></div></div>' +
        '<div><label class="field-label" for="wd-phone">N° du destinataire</label>' +
        '<div class="field-box phone-row" style="display:flex;align-items:center;gap:0.5rem">' +
        '<span class="dial-prefix" id="wd-dial-prefix" style="font-weight:600;white-space:nowrap;color:var(--accent-cyan)">' +
        (u.dial || "+237") +
        '</span>' +
        '<input id="wd-phone" inputmode="tel" placeholder="6XX XX XX XX" style="flex:1;border:none;background:transparent;color:inherit;font:inherit" value="" /></div>' +
        '<p class="field-error is-hidden" id="wd-phone-err"></p></div></div>' +
        '<div><label class="field-label" for="wd-amount">Montant à retirer (FCFA)</label>' +
        '<div class="field-box"><input id="wd-amount" type="number" min="2000" max="500000" step="500" placeholder="Ex. 5000" /></div><p class="text-3xs text-muted mt-1">Min. 2 000 · max. 500 000 · multiple de 500 FCFA</p><p class="field-error is-hidden" id="wd-amount-err"></p></div>' +
        '<button type="button" class="btn-primary full" id="wd-submit">' + t("askWithdraw") + '</button>' +
        '<button type="button" class="btn-outline full mt-2" id="wd-cancel">Fermer</button>' +
        "</div></div>" +
        /* History */
        '<h2 class="section-label">' + t("historyTitle") + '</h2>' +
        '<div class="flex gap-2 flex-wrap mb-2" id="tx-filters" style="padding:0 0.25rem">' +
        '<button type="button" class="btn-xs primary" data-tx-filter="all">Tous</button>' +
        '<button type="button" class="btn-xs" data-tx-filter="recharge">Recharges</button>' +
        '<button type="button" class="btn-xs" data-tx-filter="withdrawal">Retraits</button>' +
        '<button type="button" class="btn-xs" data-tx-filter="rejected">Refusés</button>' +
        '<button type="button" class="btn-xs" data-tx-filter="pending">En cours</button>' +
        '</div>' +
        '<div class="flex gap-2 flex-wrap mb-2" style="padding:0 0.25rem">' +
        '<div class="field-box flex-1"><input id="tx-search" type="search" placeholder="Montant, date, opérateur…" style="width:100%;border:none;background:transparent;color:inherit" /></div>' +
        '<select id="tx-provider" style="max-width:8rem;border-radius:8px;border:1px solid var(--field-border);background:var(--field);color:inherit;font-size:0.75rem;padding:0.35rem">' +
        '<option value="">Tous opérateurs</option><option value="MTN">MTN</option><option value="Orange">Orange</option><option value="Wave">Wave</option></select>' +
        '</div>' +
        '<div class="card" style="padding:0.5rem 0" id="tx-history"></div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin:1rem 0 0.5rem">' +
        '<h2 class="section-label" style="margin:0">' + t("myProducts") + '</h2>' +
        '<div class="flex gap-2">' +
        '<button type="button" class="btn-xs" id="btn-export-gains">Export CSV</button>' +
        '<button type="button" class="btn-xs primary" id="btn-claim-daily">' + t("claimGains") + '</button></div></div>' +
        '<div class="card" style="padding:0.5rem 0" id="owned-list"></div>' +
        "</main>",
    });
  }

  function pageHonor() {
    var top = store().honorTop || [];
    var rec = store().withdrawals || [];
    var parts = [
      '<main class="main"><div class="card card-pad"><div class="flex items-center gap-2">' +
        icon("honor", "icon text-teal") +
        '<h1 class="text-sm font-semibold">Top</h1></div>',
    ];
    var i;
    if (!top.length) parts.push('<div class="empty-state">—</div>');
    else {
      parts.push('<ul class="honor-list">');
      for (i = 0; i < top.length; i++) {
        parts.push(
          '<li><span class="rank ' +
            (i < 3 ? "top" : "other") +
            '">' +
            (i + 1) +
            '</span><span class="flex-1 text-sm">' +
            top[i].name +
            '</span><span class="text-sm font-semibold text-teal">' +
            cfa(top[i].amount) +
            "</span></li>"
        );
      }
      parts.push("</ul>");
    }
    parts.push('</div><h2 class="section-label">RETRAITS RÉCENTS</h2><p class="text-3xs text-muted" style="margin:0.25rem 0 0.5rem">Retraits validés sur la plateforme (zone XAF)</p><div class="card"><ul class="record-list">');
    for (i = 0; i < rec.length; i++) {
      parts.push(
        "<li>" +
          icon("upload", "icon icon-sm text-cyan") +
          '<div class="flex-1"><p class="text-sm">' +
          rec[i].name +
          '</p><p class="text-3xs text-muted">' +
          rec[i].when +
          '</p></div><span class="text-sm font-semibold text-teal">' +
          cfa(rec[i].amount) +
          "</span></li>"
      );
    }
    parts.push("</ul></div></main>");
    return shell({ title: t("honor"), gradient: true, content: parts.join(""), active: "/honor" });
  }

  function pageMy() {
    var u = store().user;
    var s = store().settings;
    var refs = u.referrals || [];
    var t = g.I18n.t;
    var icon = g.UI.icon;
    var cfa = g.UI.cfa;
    var invite = u.invite || "";
    var base = "";
    if (typeof location !== "undefined") {
      base = location.origin + location.pathname.replace(/index\.html$/i, "");
      if (base.slice(-1) !== "/") base = location.href.split("#")[0];
      else base = base + (base.indexOf("index") >= 0 ? "" : "");
      base = location.href.split("#")[0];
    }
    var link = invite ? base + "#/register?ref=" + encodeURIComponent(invite) : base + "#/register";
    var teamN = refs.length || Number(u.team) || 0;
    var teamLevel = teamN >= 20 ? "Or" : teamN >= 5 ? "Argent" : teamN >= 1 ? "Bronze" : "Débutant";
    var initials = (u.name || "U").trim().split(/\s+/).map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase() || "U";
    var activeRefs = refs.filter(function (r) { return r.invested; }).length;
    var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=" + encodeURIComponent(link);

    var refsHtml = "";
    if (!refs.length) {
      refsHtml =
        '<div class="empty-state"><strong>Aucun filleul</strong>Partagez votre code pour constituer votre équipe.</div>';
    } else {
      refsHtml = refs
        .map(function (r) {
          return (
            '<div class="list-row"><div class="flex-1"><p class="label">' +
            r.phone +
            '</p><p class="text-3xs text-muted">' +
            (r.status || "inscrit") +
            " · " +
            String(r.joinedAt || "").slice(0, 10) +
            (r.bonusPaid ? " · bonus " + cfa(r.bonusPaid) : "") +
            '</p></div><span class="badge">' +
            (r.invested ? "Actif" : "Inscrit") +
            "</span></div>"
          );
        })
        .join("");
    }

    return shell({
      title: t("my"),
      gradient: true,
      active: "/my",
      content:
        '<main class="main">' +
        '<div class="card card-pad">' +
        '<div class="flex items-center gap-3">' +
        '<div class="avatar-initials" aria-hidden="true">' + initials + '</div>' +
        '<div class="flex-1"><p class="text-sm font-semibold">' +
        (u.name || 'Utilisateur') +
        '</p><p class="text-xs text-muted">' +
        (u.loggedIn && u.phone ? String(u.phone) : 'Non connecté') +
        ' · Niveau équipe : <strong class="text-teal">' + teamLevel + '</strong></p>' +
        '<p class="text-xs text-muted">Code : <strong class="text-teal">' + invite + '</strong></p></div></div>' +

        '<div class="mini-grid mt-4">' +
        '<div><p class="label">' +
        t("balance") +
        '</p><p class="value">' +
        cfa(u.balance) +
        '</p></div><div><p class="label">' +
        t("income") +
        '</p><p class="value">' +
        cfa(u.income) +
        '</p></div><div><p class="label">' +
        t("team") +
        '</p><p class="value">' +
        String(refs.length || u.team || 0) +
        "</p></div></div></div>" +
        /* Parrainage / Mon équipe */
        '<h2 class="section-label">MON ÉQUIPE · PARRAINAGE</h2>' +
        '<div class="card card-pad">' +
        '<p class="text-xs text-muted mb-5">Invitez vos proches. Ils rejoignent votre équipe avec votre code. Bonus de <strong>' +
        (s.referralBonusPercent || 25) +
        "%</strong> sur <strong>chaque machine</strong> qu'ils achètent.</p>" +
        '<div class="admin-grid" style="margin-bottom:0.75rem">' +
        '<div class="kpi"><p class="k">Filleuls</p><p class="v">' + String(teamN) + '</p></div>' +
        '<div class="kpi"><p class="k">Actifs</p><p class="v">' + String(activeRefs) + '</p></div>' +
        '<div class="kpi"><p class="k">Gains parrainage</p><p class="v" style="font-size:0.95rem">' +
        cfa(u.referralEarnings || 0) + "</p></div>" +
        '<div class="kpi"><p class="k">Niveau</p><p class="v" style="font-size:0.95rem">' + teamLevel + '</p></div></div>' +
        '<p class="text-3xs text-muted mb-2">Progression : Débutant (0) → Bronze (1+) → Argent (5 actifs) → Or (20 actifs). Actifs = filleuls ayant investi.</p>' +
        '<div style="height:6px;background:rgba(0,0,0,.08);border-radius:99px;overflow:hidden;margin-bottom:0.75rem"><div style="height:100%;width:' +
        Math.min(100, teamN >= 20 ? 100 : teamN >= 5 ? 40 + (teamN / 20) * 60 : teamN >= 1 ? 15 + teamN * 5 : 5) +
        '%;background:var(--accent-cyan,#2dd4bf)"></div></div>' +
        '<p class="text-xs text-muted mb-5">Votre code</p>' +
        '<div class="flex items-center gap-2 mb-5">' +
        '<div class="field-box flex-1" style="justify-content:center"><span class="text-sm font-semibold" id="my-invite-code">' +
        invite +
        "</span></div>" +
        '<button type="button" class="btn-xs primary" id="btn-copy-invite">Copier le lien</button>' +
        '<button type="button" class="btn-xs" id="btn-share-invite">Partager</button>' +
        '<button type="button" class="btn-xs" id="btn-wa-invite" style="background:#25D366;color:#fff;border:none">WhatsApp</button></div>' +
        '<p class="text-3xs text-muted mb-5" id="my-invite-link" style="word-break:break-all">' +
        link +
        "</p>" +
        '<div class="card card-pad mb-5" style="background:var(--field);border:1px solid var(--field-border)">' +
        '<p class="text-xs font-semibold mb-2">QR code d\'invitation</p>' +
        '<div class="flex gap-3" style="align-items:center">' +
        '<img src="' + qrUrl + '" width="140" height="140" alt="QR invitation" style="border-radius:8px;background:#fff" loading="lazy" />' +
        '<p class="text-3xs text-muted">Scannez pour ouvrir le lien d\'inscription avec votre code.</p></div></div>' +
        '<div class="card card-pad mb-5">' +
        '<p class="text-xs font-semibold mb-2">Comment parrainer</p>' +
        '<ol class="text-xs text-muted" style="padding-left:1.1rem;line-height:1.65;margin:0">' +
        '<li>Copiez votre code ou partagez le lien / QR.</li>' +
        '<li>Votre filleul s\'inscrit avec ce code.</li>' +
        '<li>Quand il achète une machine, vous recevez <strong>' +
        String(s.referralBonusPercent || 25) +
        '%</strong> du prix.</li>' +
        '<li>Suivez votre équipe et vos bonus ici.</li>' +
        '</ol></div>' +
        '<p class="text-xs font-semibold mb-5">Vos filleuls</p>' +
        '<div id="team-list">' +
        refsHtml +
        "</div>" +
        '<button type="button" class="btn-outline full mt-4" id="btn-sim-filleul">Simuler un filleul (démo)</button>' +
        "</div>" +
        '<div class="card mt-4" style="padding:0.25rem 0">' +
        '<a href="#/investments" class="list-row" data-link>' +
        icon("chart", "icon icon-md text-teal") +
        '<span class="label">Mes investissements</span>' +
        icon("chevron-right", "icon icon-sm text-muted") +
        "</a>" +
        '<a href="#/profile" class="list-row" data-link>' +
        icon("user", "icon icon-md text-teal") +
        '<span class="label">Mon profil</span>' +
        icon("chevron-right", "icon icon-sm text-muted") +
        "</a>" +
        '<a href="#/notifications" class="list-row" data-link>' +
        icon("bell", "icon icon-md text-teal") +
        '<span class="label">Notifications</span>' +
        icon("chevron-right", "icon icon-sm text-muted") +
        "</a>" +
        '<button type="button" class="list-row" data-action="theme">' +
        icon("shield", "icon icon-md text-teal") +
        '<span class="label">' +
        t("theme") +
        " (" +
        ((s.theme || "dark") === "light" ? t("light") : t("dark")) +
        ")</span>" +
        icon("chevron-right", "icon icon-sm text-muted") +
        "</button>" +
        '<button type="button" class="list-row" data-action="lang">' +
        icon("globe", "icon icon-md text-teal") +
        '<span class="label">' +
        t("lang") +
        " (" +
        s.lang +
        ")</span>" +
        icon("chevron-right", "icon icon-sm text-muted") +
        "</button>" +
        '<button type="button" class="list-row" data-action="logout">' +
        icon("logout", "icon icon-md text-teal") +
        '<span class="label">' +
        t("logout") +
        "</span>" +
        icon("chevron-right", "icon icon-sm text-muted") +
        "</button></div>" +
        '<p class="text-center text-3xs text-muted mt-4"><a href="#/notifications" class="text-cyan" data-link>Notifs</a> · <a href="#/profile" class="text-cyan" data-link>Profil</a> · <a href="#/support" class="text-cyan" data-link>Support</a> · <a href="#/cgu" class="text-cyan" data-link>CGU</a> · <a href="#/privacy" class="text-cyan" data-link>Confidentialité</a><br/><a href="#/design" class="text-cyan" data-link>Design system</a></p></main>',
    });
  }



  function pageNotifications() {
    var list = store().notifications || [];
    var html;
    if (!list.length) {
      html = '<div class="empty-state"><strong>Aucune notification</strong>Les alertes apparaîtront ici.</div>';
    } else {
      html = list
        .map(function (n) {
          return (
            '<button type="button" class="list-row" data-notif-id="' +
            n.id +
            '" style="width:100%;text-align:left">' +
            '<div class="flex-1"><p class="label">' +
            n.text +
            '</p><p class="text-3xs text-muted">' +
            String(n.at || "").slice(0, 16).replace("T", " ") +
            (n.read ? "" : " · non lue") +
            "</p></div>" +
            (n.read ? "" : '<span class="badge">Nouveau</span>') +
            "</button>"
          );
        })
        .join("");
    }
    return shell({
      title: t("notifications"),
      back: true,
      active: "/my",
      content:
        '<main class="main"><div class="flex gap-2 mb-5">' +
        '<button type="button" class="btn-xs primary" id="notif-read-all">Tout marquer lu</button></div>' +
        '<div class="card" style="padding:0.25rem 0" id="notif-list">' +
        html +
        "</div></main>",
    });
  }

  function pageProfile() {
    var u = store().user;
    return shell({
      title: "PROFIL",
      back: true,
      active: "/my",
      content:
        '<main class="main"><div class="card card-pad">' +
        '<h1 class="text-sm font-semibold" style="font-size:1.1rem">Modifier mon profil</h1>' +
        '<form id="profile-form" class="form-stack mt-4" novalidate>' +
        '<div><label class="field-label" for="pf-name">Nom affiché</label>' +
        '<div class="field-box"><input id="pf-name" required minlength="2" value="' +
        String(u.name || "").replace(/"/g, "&quot;") +
        '" autocomplete="name" /></div></div>' +
        '<div><label class="field-label" for="pf-phone">Téléphone</label>' +
        '<div class="field-box"><input id="pf-phone" inputmode="tel" value="' +
        String(u.phone || "").replace(/"/g, "&quot;") +
        '" autocomplete="tel" /></div></div>' +
        '<p id="pf-error" class="form-error is-hidden" role="alert"></p>' +
        '<button type="submit" class="btn-primary full" id="pf-btn"><span class="btn-label">Enregistrer</span><span class="btn-spinner"><span class="spinner-btn"></span></span></button>' +
        "</form></div></main>",
    });
  }

  function pageLegal(kind) {
    var titles = { cgu: "Conditions d'utilisation", privacy: "Confidentialité" };
    var title = titles[kind] || "Mentions légales";
    var body =
      kind === "privacy"
        ? "<p><strong>Responsable</strong> — Intel NG traite les données nécessaires au service (téléphone, historique d'opérations, preuves de paiement).</p>" +
          "<p><strong>Finalités</strong> — gestion du compte, validation des dépôts/retraits, support, prévention de la fraude.</p>" +
          "<p><strong>Durée</strong> — conservation pendant la durée d'utilisation du compte puis archivage limité aux obligations légales.</p>" +
          "<p><strong>Partage</strong> — pas de vente de données à des tiers. Accès limité aux administrateurs habilités.</p>" +
          "<p><strong>Vos droits</strong> — accès, rectification, suppression : contactez le support depuis l'application.</p>" +
          "<p class=\"text-xs text-muted mt-2\">Document applicable zone XAF (Cameroun et pays associés). Mise à jour : 2026.</p>"
        : "<p><strong>1. Objet</strong> — Intel NG propose des produits d'investissement liés à des nœuds de calcul. Les rendements affichés sont contractuels selon le produit souscrit.</p>" +
          "<p><strong>2. Compte</strong> — L'inscription nécessite un numéro valide zone XAF. Vous êtes responsable de la confidentialité de votre mot de passe.</p>" +
          "<p><strong>3. Dépôts &amp; retraits</strong> — Minimum 2 000 FCFA, maximum 500 000 FCFA par opération. Toute opération peut être validée ou refusée par l'administration (preuve illisible, fraude, incohérence).</p>" +
          "<p><strong>4. Produits</strong> — Certains packs (ex. 3 000 / 8 000 FCFA) sont limités à 10 achats par utilisateur. Les gains se récoltent selon les règles du produit (cycle 24 h).</p>" +
          "<p><strong>5. Parrainage</strong> — Bonus indiqué dans l'application (25 % sur machines des filleuls), sous réserve de conformité.</p>" +
          "<p><strong>6. Abus</strong> — Intel NG peut suspendre un compte en cas de manœuvre frauduleuse.</p>" +
          "<p class=\"text-xs text-muted mt-2\">En continuant, vous acceptez ces conditions. Mise à jour : 2026.</p>";
    return shell({
      title: title.toUpperCase(),
      back: true,
      active: "/my",
      content: '<main class="main"><div class="card card-pad text-sm" style="line-height:1.55">' + body + "</div></main>",
    });
  }

  function pageSupport() {
    var team1 = (store().settings && store().settings.teamMeeting) || "img/team/team-meeting.jpg";
    var team2 = (store().settings && store().settings.teamOffice) || "img/team/team-office.jpg";

    return shell({
      title: "SUPPORT",
      back: true,
      active: "/my",
      content:
        '<main class="main"><div class="card card-pad">' +
        '<h1 class="text-sm font-semibold" style="font-size:1.1rem">Centre d\'aide</h1>' +
        '<p class="text-xs text-muted mt-1 mb-5">Décrivez votre problème. Un administrateur traitera votre demande.</p>' +
        '<form id="support-form" class="form-stack" novalidate>' +
        '<div><label class="field-label" for="s-name">Nom</label><div class="field-box"><input id="s-name" required placeholder="Votre nom" /></div></div>' +
        '<div><label class="field-label" for="s-email">Email ou téléphone</label><div class="field-box"><input id="s-email" required placeholder="contact@email.com" /></div></div>' +
        '<div><label class="field-label" for="s-subject">Sujet</label><div class="field-box"><input id="s-subject" required placeholder="Ex. Dépôt non crédité" /></div></div>' +
        '<div><label class="field-label" for="s-msg">Message</label><div class="field-box"><textarea id="s-msg" required rows="4" placeholder="Expliquez en détail…" style="width:100%;min-height:6rem;border:none;background:transparent;color:inherit;font:inherit;resize:vertical"></textarea></div></div>' +
        '<button type="submit" class="btn-primary full" id="s-btn"><span class="btn-label">Envoyer</span><span class="btn-spinner"><span class="spinner-btn"></span></span></button>' +
        '</form></div>' +
        '<h2 class="section-label">MES TICKETS</h2>' +
        '<div class="card" style="padding:0.5rem 0" id="my-tickets-list"></div>' +
        '<p class="text-center text-3xs text-muted mt-4"><a href="#/my" class="text-cyan" data-link>Retour au compte</a></p></main>',
    });
  }

  function pageDesign() {
    return (
      '<div class="shell" style="max-width:480px;margin:0 auto;padding:1rem">' +
      '<header class="header header-plain"><a href="#/" class="header-back" data-link>' +
      icon("chevron-left", "icon") +
      '</a><span class="header-title">DESIGN SYSTEM</span></header>' +
      '<main class="main" style="padding-top:1rem">' +
      '<div class="admin-card"><h3>Boutons</h3><div class="admin-actions-inline">' +
      '<button class="btn-primary">Primary</button><button class="btn-outline">Outline</button><button class="btn-danger">Danger</button>' +
      '<button class="btn-xs primary">xs primary</button></div></div>' +
      '<div class="admin-card"><h3>Card</h3><div class="card card-pad">Contenu card</div></div>' +
      '<div class="admin-card"><h3>Field</h3><div class="field-box"><input placeholder="Input" style="width:100%" /></div></div>' +
      '<div class="admin-card"><h3>Toast</h3><button class="btn-xs" id="ds-toast">Tester toast</button></div>' +
      '<div class="admin-card"><h3>Skeleton</h3>' +
      g.UI.skeleton("cards") +
      "</div></main></div>"
    );
  }

  g.Pages = {
    shell: shell,
    home: pageHome,
    login: pageLogin,
    forgot: pageForgot,
    register: pageRegister,
    product: pageProduct,
    wallet: pageWallet,
    investments: pageInvestments,
    honor: pageHonor,
    my: pageMy,
    support: pageSupport,
    notifications: pageNotifications,
    maintenance: pageMaintenance,
    error: pageError,
    profile: pageProfile,
    cgu: function () { return pageLegal("cgu"); },
    privacy: function () { return pageLegal("privacy"); },
    design: pageDesign,
    renderProductCards: renderProductCards,
    investmentHelpers: investmentHelpers,
  };
})(window);
