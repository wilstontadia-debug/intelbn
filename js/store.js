/**
 * Store + persistance localStorage + journal admin + RBAC
 */
(function (g) {
  "use strict";
  var KEY = "intelng_store_v2";
  var ADMIN_KEY = "intelng_admin_session";

  function defaults() {
    return {
      notice: "Règlement des gains chaque jour à 00:00 (heure de Douala). Dépôt min. 2 000 FCFA.",
      featured: [
        { name: "Intel Core Node A1", price: 12000, daily: 640, days: 40, image: "img/machines/thumbs/chip-i7.jpg" },
        { name: "Intel Core Node A2", price: 35000, daily: 1980, days: 45, image: "img/machines/thumbs/chip-intel-conn.jpg" },
        { name: "Intel Server Rack B1", price: 90000, daily: 5400, days: 50, image: "img/machines/thumbs/cpu5.jpg" },
      ],
      products: {
        Activité: [
          /* 3000 → 6000 en 21 j  |  8000 → 20000 en 14 j — max 10 achats chacun */
          { id: "c1", name: "Pack Bienvenue", price: 3000, daily: 286, days: 21, image: "img/machines/thumbs/cpu1.jpg", maxBuys: 10 },
          { id: "c2", name: "Boost Week-end", price: 8000, daily: 1429, days: 14, image: "img/machines/thumbs/cpu3.jpg", maxBuys: 10 },
        ],
        Basique: [
          { id: "s1", name: "Node Starter i3", price: 12000, daily: 640, days: 40, image: "img/machines/thumbs/chip-intel-conn.jpg" },
          { id: "b1", name: "Node A1", price: 12000, daily: 640, days: 40, image: "img/machines/thumbs/chip-i7.jpg" },
          { id: "b2", name: "Node A2", price: 35000, daily: 1980, days: 45, image: "img/machines/thumbs/chip-intel486.jpg" },
          { id: "b3", name: "Node A3", price: 60000, daily: 3600, days: 45, image: "img/machines/thumbs/chip-i486-wide.jpg" },
          { id: "ly1", name: "Loyalty Node", price: 25000, daily: 1410, days: 40, image: "img/machines/thumbs/chip-lga.jpg" },
        ],
        Avancé: [
          { id: "ai1", name: "Node AI Inference", price: 45000, daily: 2700, days: 45, image: "img/machines/thumbs/chip-ati.jpg" },
          { id: "a1", name: "Rack B1", price: 90000, daily: 5400, days: 50, image: "img/machines/thumbs/server-rack.jpg" },
          { id: "a2", name: "Rack B2", price: 150000, daily: 9750, days: 55, image: "img/machines/thumbs/chip-mb-blue.jpg" },
          { id: "a3", name: "Rack B3", price: 300000, daily: 21000, days: 60, image: "img/machines/thumbs/chip-heatsink.jpg" },
        ],
        Premium: [
          { id: "cl1", name: "Cluster Duo", price: 70000, daily: 4200, days: 45, image: "img/machines/thumbs/chip-pins.jpg" },
          { id: "lm1", name: "Node Limited Edition", price: 100000, daily: 6000, days: 50, image: "img/machines/thumbs/chip-dark.jpg" },
          { id: "ic1", name: "Intel Core Node A1", price: 12000, daily: 640, days: 40, image: "img/machines/thumbs/chip-i7.jpg" },
          { id: "ic2", name: "Intel Core Node A2", price: 35000, daily: 1980, days: 45, image: "img/machines/thumbs/chip-intel-conn.jpg" },
          { id: "ic3", name: "Intel Core Node A3", price: 60000, daily: 3600, days: 45, image: "img/machines/thumbs/chip-hynix.jpg" },
        ],
        Vendredi: [
          /* Spécial vendredi — images à ajouter plus tard */
          { id: "vf1", name: "Flash Vendredi 10k", price: 10000, daily: 10000, days: 3, image: "img/machines/thumbs/friday-10k.jpg" },
          { id: "vf2", name: "Flash Vendredi 100k", price: 100000, daily: 100000, days: 3, image: "img/machines/thumbs/friday-100k.jpg" },
          { id: "vf3", name: "Flash Vendredi 20k", price: 20000, daily: 20000, days: 3, image: "img/machines/thumbs/friday-20k.jpg" },
          { id: "vf4", name: "Flash Vendredi 30k", price: 30000, daily: 20000, days: 3, image: "img/machines/thumbs/friday-30k.jpg" },
          { id: "vf5", name: "Flash Vendredi 50k", price: 50000, daily: 50000, days: 3, image: "img/machines/thumbs/friday-50k.jpg" },
        ],
      },
      honorTop: [
        { name: "67****1245", amount: 2410000 },
        { name: "69****9032", amount: 1875500 },
        { name: "65****4471", amount: 1320000 },
      ],
      withdrawals: [
        { name: "69****1409", amount: 5000, when: "il y a 48 min" },
        { name: "69****9935", amount: 2000, when: "il y a 2 min" },
        { name: "69****4582", amount: 4500, when: "il y a 36 min" },
        { name: "68****9928", amount: 329000, when: "il y a 18 min" },
        { name: "67****3615", amount: 7500, when: "il y a 14 min" },
        { name: "70****2674", amount: 58000, when: "il y a 55 min" },
        { name: "70****5333", amount: 1500, when: "il y a 25 min" },
        { name: "69****5803", amount: 198000, when: "il y a 5 min" },
        { name: "67****4733", amount: 5500, when: "il y a 25 min" },
        { name: "66****8428", amount: 30000, when: "il y a 14 min" },
        { name: "66****2169", amount: 3500, when: "il y a 11 min" },
        { name: "06****7216", amount: 452000, when: "il y a 15 min" },
        { name: "70****1916", amount: 14000, when: "il y a 18 min" },
        { name: "69****4456", amount: 208000, when: "il y a 32 min" },
        { name: "75****8517", amount: 3000, when: "il y a 48 min" },
        { name: "07****9830", amount: 319000, when: "il y a 7 h" },
        { name: "70****4593", amount: 3000, when: "il y a 1 h" },
        { name: "69****3504", amount: 316000, when: "il y a 2 h" },
        { name: "75****7252", amount: 228000, when: "il y a 1 h" },
        { name: "69****9797", amount: 5000, when: "il y a 5 h" },
        { name: "75****3591", amount: 469000, when: "il y a 5 h" },
        { name: "07****3927", amount: 23000, when: "il y a 11 h" },
        { name: "07****4258", amount: 3000, when: "il y a 9 h" },
        { name: "07****1009", amount: 6000, when: "il y a 6 h" },
        { name: "66****4923", amount: 1500, when: "il y a 2 h" },
        { name: "06****2133", amount: 165000, when: "il y a 8 h" },
        { name: "07****3705", amount: 77000, when: "il y a 4 h" },
        { name: "07****4295", amount: 443000, when: "il y a 6 h" },
        { name: "06****9479", amount: 8000, when: "il y a 2 h" },
        { name: "70****1344", amount: 217000, when: "il y a 4 h" },
        { name: "67****2163", amount: 1500, when: "il y a 6 h" },
        { name: "69****9423", amount: 45000, when: "il y a 4 h" },
        { name: "07****3167", amount: 10000, when: "il y a 8 h" },
        { name: "75****4119", amount: 22000, when: "il y a 6 h" },
        { name: "75****7735", amount: 444000, when: "il y a 11 h" },
      ],
      /* Demandes en attente (style Energivest) */
      pendingDeposits: [],
      pendingWithdrawals: [],
      /* Moyens de paiement affichés à l'utilisateur */
      paymentMethods: {
        mobileMoney: {
          enabled: true,
          providers: [
            { name: "MTN MoMo", number: "683 592 035", accountName: "Emile Loic" },
            { name: "Orange Money", number: "690 000 002", accountName: "Intel NG SARL" },
            { name: "Wave", number: "670 000 003", accountName: "Intel NG SARL" },
          ],
          instructions: "1) Envoyez le montant exact au numéro affiché (Cameroun). 2) Conservez la capture. 3) Revenez dans l'app et envoyez la preuve. Validation admin sous 24 h en général.",
        },
      },
      user: {
        name: "Utilisateur invité",
        invite: "",
        balance: 0,
        income: 0,
        points: 0,
        team: 0,
        phone: "",
        country: "CM",
        dial: "+237",
        loggedIn: false,
        owned: [],
        lastClaimAt: null,
        referrals: [],
        referralEarnings: 0,
        referredBy: "",
      },
      users: [
        { id: "u1", phone: "67****1245", balance: 2410000, status: "actif", role: "user" },
        { id: "u2", phone: "69****9032", balance: 1875500, status: "actif", role: "user" },
        { id: "u3", phone: "65****4471", balance: 50000, status: "suspendu", role: "user" },
      ],
      stats: { purchases: 0, registrations: 0, logins: 0 },
      settings: {
        maintenance: false,
        minPassword: 6,
        siteName: "Intel NG",
        lang: "fr",
        theme: "light",
        referralBonusPercent: 25,
        minDeposit: 2000,
        maxDeposit: 500000,
        minWithdraw: 2000,
        maxWithdraw: 500000,
        /* Comptes admin : surcharge via window.__INTEL_NG_CONFIG__.adminBootstrap */
        adminAccounts: (function () {
          var cfg = (typeof window !== "undefined" && window.__INTEL_NG_CONFIG__) || {};
          if (cfg.adminBootstrap && cfg.adminBootstrap.length) return cfg.adminBootstrap.slice();
          return [{ email: "admin@localhost", password: "ChangeMe@2026", name: "Admin" }];
        })(),
        bannerUrl: "register-banner.jpg",
        bannerProduct: "img/banner-intel.jpg",
        bannerWallet: "img/banner-intel.jpg",
        teamMeeting: "img/team/team-meeting.jpg",
        teamOffice: "img/team/team-office.jpg",
      },
      activityLog: [],
      supportTickets: [],
      notifications: [
        { id: "n0", text: "Bienvenue sur Intel NG. Rechargez dès 2 000 FCFA.", read: false, at: new Date().toISOString() },
      ],
      onboardDone: false,
      loginAttempts: { count: 0, lockedUntil: 0 },
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      var d = JSON.parse(raw);
      var b = defaults();
      return Object.assign(b, d, {
        /* Garder le catalogue admin s'il existe, sinon défauts. Forcer Activité en 1er si présent. */
        products: (function () {
          var p = (d.products && typeof d.products === "object" && Object.keys(d.products).length)
            ? d.products
            : b.products;
          if (!p.Activité && b.products.Activité) {
            /* injecter machines Activité si absentes (mise à jour) */
            var ordered = { Activité: b.products.Activité };
            Object.keys(p).forEach(function (k) { ordered[k] = p[k]; });
            return ordered;
          }
          if (p.Activité && Object.keys(p)[0] !== "Activité") {
            var re = { Activité: p.Activité };
            Object.keys(p).forEach(function (k) { if (k !== "Activité") re[k] = p[k]; });
            return re;
          }
          return p;
        })(),
        featured: (d.featured && d.featured.length) ? d.featured : b.featured,
        user: Object.assign(b.user, d.user || {}),
        settings: (function () {
          var st = Object.assign({}, b.settings, d.settings || {});
          /* Règles plateforme imposées */
          st.referralBonusPercent = 25;
          st.minDeposit = 2000;
          st.maxDeposit = 500000;
          st.minWithdraw = 2000;
          st.maxWithdraw = 500000;
          if (st.theme !== "light" && st.theme !== "dark") st.theme = "light";
          st.bannerUrl = "register-banner.jpg";
          if (!st.adminAccounts || !st.adminAccounts.length) {
            var cfg2 = (typeof window !== "undefined" && window.__INTEL_NG_CONFIG__) || {};
            st.adminAccounts = (cfg2.adminBootstrap && cfg2.adminBootstrap.length)
              ? cfg2.adminBootstrap.slice()
              : [{ email: "admin@localhost", password: "ChangeMe@2026", name: "Admin" }];
          }
          st.bannerProduct = "img/banner-intel.jpg"; /* siège / marque Intel — pas de puces */
          st.bannerWallet = "img/banner-intel.jpg";
          return st;
        })(),
        stats: Object.assign(b.stats, d.stats || {}),
        paymentMethods: { mobileMoney: Object.assign((b.paymentMethods && b.paymentMethods.mobileMoney) || {}, (d && d.paymentMethods && d.paymentMethods.mobileMoney) || {}) },
        loginAttempts: Object.assign(b.loginAttempts, d.loginAttempts || {}),
      });
    } catch (e) {
      return defaults();
    }
  }

  var state = load();

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function log(action, detail) {
    state.activityLog.unshift({
      id: "log_" + Date.now(),
      at: new Date().toISOString(),
      action: action,
      detail: detail || "",
      by: (getAdminSession() && getAdminSession().role) || "system",
    });
    if (state.activityLog.length > 100) state.activityLog.length = 100;
    save();
  }

  function getAdminSession() {
    try {
      return JSON.parse(sessionStorage.getItem(ADMIN_KEY) || "null");
    } catch (e) {
      return null;
    }
  }

  function setAdminSession(sess) {
    if (sess) sessionStorage.setItem(ADMIN_KEY, JSON.stringify(sess));
    else sessionStorage.removeItem(ADMIN_KEY);
  }

  /** Rôles : super = tout ; editor = contenu/produits/honneur ; viewer = lecture */
  var ROLE_PERMS = {
    super: ["dash", "produits", "contenu", "honneur", "users", "systeme", "logs", "export", "depots", "retraits", "support", "admins", "paiements"],
    editor: ["dash", "produits", "contenu", "honneur", "logs", "depots", "retraits", "support"],
    viewer: ["dash", "logs"],
  };

  function can(perm) {
    var s = getAdminSession();
    if (!s) return false;
    var list = ROLE_PERMS[s.role] || [];
    return list.indexOf(perm) !== -1;
  }

  g.Store = {
    KEY: KEY,
    get: function () {
      return state;
    },
    reload: function () {
      state = load();
      return state;
    },
    update: function (fn) {
      fn(state);
      save();
    },
    reset: function () {
      state = defaults();
      save();
      log("reset", "Données réinitialisées");
    },
    log: log,
    getAdminSession: getAdminSession,
    setAdminSession: setAdminSession,
    can: can,
    ROLE_PERMS: ROLE_PERMS,
    defaults: defaults,
    save: save,
    uid: function (p) {
      return (p || "id") + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    },
  };
})(window);
