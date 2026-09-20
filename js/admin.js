/**
 * Admin panel — RBAC, recherche, pagination, logs
 */
(function (g) {
  "use strict";
  function t(k) { return (g.I18n && g.I18n.t) ? g.I18n.t(k) : k; }


  var PAGE_SIZE = 5;
  var adminState = { tab: "dash", search: "", page: 0 };

  function cfa(n) {
    return g.UI.cfa(n);
  }
  /** Date/heure Afrique/Douala pour comparer aux captures MoMo */
  function fmtAdminTime(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("fr-FR", {
        timeZone: "Africa/Douala",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch (e) {
      return String(iso).slice(0, 19).replace("T", " ");
    }
  }
  function can(p) {
    return g.Store.can(p);
  }
  function store() {
    return g.Store.get();
  }

  /** Charge dépôts / retraits / users / tickets depuis l'API backend */
  function syncAdminData() {
    if (!g.API) return Promise.resolve();
    var tasks = [];
    if (g.API.adminListDeposits) {
      tasks.push(
        g.API.adminListDeposits().then(function (res) {
          if (res && res.ok && res.data) {
            g.Store.update(function (st) {
              st.pendingDeposits = res.data.deposits || [];
            });
          }
        })
      );
    }
    if (g.API.adminListWithdrawals) {
      tasks.push(
        g.API.adminListWithdrawals().then(function (res) {
          if (res && res.ok && res.data) {
            g.Store.update(function (st) {
              st.pendingWithdrawals = res.data.withdrawals || [];
            });
          }
        })
      );
    }
    if (g.API.adminListUsers) {
      tasks.push(
        g.API.adminListUsers().then(function (res) {
          if (res && res.ok && res.data) {
            g.Store.update(function (st) {
              st.users = res.data.users || [];
            });
          }
        })
      );
    }
    if (g.API.adminListTickets) {
      tasks.push(
        g.API.adminListTickets().then(function (res) {
          if (res && res.ok && res.data) {
            g.Store.update(function (st) {
              st.supportTickets = res.data.tickets || [];
            });
          }
        })
      );
    }
    if (g.API.adminListProducts) {
      tasks.push(
        g.API.adminListProducts().then(function (res) {
          if (res && res.ok && res.data && res.data.products) {
            g.Store.update(function (st) {
              st.products = res.data.products;
            });
          }
        })
      );
    }
    return Promise.all(tasks);
  }

  function pageAdmin() {
    var sess = g.Store.getAdminSession();
    var token = g.API && g.API.getAdminToken ? g.API.getAdminToken() : "";
    /* Accès admin strict : session + JWT admin (pas le token user) */
    if (!sess || !token) {
      if (sess && !token && g.Store.setAdminSession) g.Store.setAdminSession(null);
      return adminLogin();
    }

    var tabs = [
      /* Aligné sur EnergiInvest */
      { id: "dash", label: "Tableau de bord", perm: "dash" },
      { id: "produits", label: "Machines", perm: "produits" },
      { id: "depots", label: "Recharges", perm: "users" },
      { id: "retraits", label: "Retraits", perm: "users" },
      { id: "paiements", label: "Moyens de paiement", perm: "systeme" },
      { id: "users", label: "Utilisateurs", perm: "users" },
      { id: "logs", label: "Journal d'audit", perm: "logs" },
      { id: "contenu", label: "Articles", perm: "contenu" },
      { id: "images", label: "Images du site", perm: "contenu" },
      { id: "honneur", label: "Classements", perm: "honneur" },
      { id: "support", label: "Support", perm: "users" },
      { id: "admins", label: "Admins", perm: "systeme" },
      { id: "account", label: "Mon compte", perm: "dash" },
      { id: "systeme", label: "Système", perm: "systeme" },
    ].filter(function (t) {
      return can(t.perm);
    });

    var tabOk = false;
    for (var ti = 0; ti < tabs.length; ti++) {
      if (tabs[ti].id === adminState.tab) { tabOk = true; break; }
    }
    if (!tabOk) {
      adminState.tab = tabs[0] ? tabs[0].id : "dash";
    }

    var parts = [
      '<div class="admin-shell"><div class="admin-top"><div><span class="admin-brand">ADMIN · ' +
        store().settings.siteName +
        '</span> <span class="admin-badge">' +
        sess.role +
        '</span></div><div class="admin-actions-inline">' +
        '<input id="admin-global-search" type="search" placeholder="Recherche globale…" style="max-width:11rem;padding:0.35rem 0.5rem;border-radius:8px;border:1px solid var(--field-border);background:var(--field);color:inherit;font-size:0.75rem" />' +
        '<button type="button" class="btn-xs" id="admin-logout">Déconnexion</button>' +
        '<a href="#/" class="btn-xs primary" data-link>Site</a></div></div><div class="admin-tabs">',
    ];
    var i;
    var pendingD = (store().pendingDeposits || []).filter(function (d) { return d.status === "pending"; }).length;
    var pendingW = (store().pendingWithdrawals || []).filter(function (d) { return d.status === "pending"; }).length;
    var openT = (store().supportTickets || []).filter(function (x) { return x.status === "open"; }).length;
    for (i = 0; i < tabs.length; i++) {
      var lab = tabs[i].label;
      if (tabs[i].id === "depots" && pendingD) lab += " (" + pendingD + ")";
      if (tabs[i].id === "retraits" && pendingW) lab += " (" + pendingW + ")";
      if (tabs[i].id === "support" && openT) lab += " (" + openT + ")";
      parts.push(
        '<button type="button" class="admin-tab' +
          (adminState.tab === tabs[i].id ? " is-active" : "") +
          ( (tabs[i].id === "depots" && pendingD) || (tabs[i].id === "retraits" && pendingW) || (tabs[i].id === "support" && openT) ? " has-badge" : "") +
          '" data-admin-tab="' +
          tabs[i].id +
          '">' +
          lab +
          "</button>"
      );
    }
    parts.push('</div><div class="admin-body">' + renderPanel(adminState.tab) + "</div></div>");
    return parts.join("");
  }

  function adminLogin() {
    return (
      '<div class="admin-shell"><div class="admin-top"><span class="admin-brand">ADMIN INTEL NG</span>' +
      '<a href="#/" class="btn-xs" data-link>Retour site</a></div>' +
      '<div class="admin-login"><div class="card card-pad-lg">' +
      '<span class="admin-badge">Réservé administrateurs</span>' +
      '<h1 class="text-sm font-semibold mt-2" style="font-size:1.1rem">Connexion admin</h1>' +
      '<p class="text-xs text-muted mt-1 mb-5">Accès par e-mail autorisé uniquement. Les utilisateurs du site n’ont pas accès à cet espace.</p>' +
      '<form id="admin-login-form" class="form-stack">' +
      '<div><label class="field-label">E-mail admin</label><div class="field-box">' +
      g.UI.icon("user", "icon icon-sm text-cyan") +
      '<input id="admin-email" type="email" autocomplete="username" placeholder="admin@example.com" required /></div></div>' +
      '<div><label class="field-label">Mot de passe</label><div class="field-box">' +
      g.UI.icon("lock", "icon icon-sm text-cyan") +
      '<input id="admin-pass" type="password" autocomplete="current-password" required /></div></div>' +
      '<p class="error-msg is-hidden" id="admin-login-error" role="alert"></p>' +
      '<button type="submit" class="btn-primary full">Ouvrir l’espace admin</button></form></div></div></div>'
    );
  }

  function countProducts() {
    var n = 0, k;
    for (k in store().products) n += store().products[k].length;
    return n;
  }

  function renderPanel(tab) {
    if (tab === "produits") return panelProduits();
    if (tab === "contenu") return panelContenu();
    if (tab === "honneur") return panelHonneur();
    if (tab === "users") return panelUsers();
    if (tab === "logs") return panelLogs();
    if (tab === "support") return panelSupport();
    if (tab === "systeme") return panelSysteme();
    if (tab === "depots") return panelDepots();
    if (tab === "retraits") return panelRetraits();
    if (tab === "paiements") return panelPaiements();
    if (tab === "images") return panelImages();
    if (tab === "admins") return panelAdmins();
    if (tab === "account") return panelAccount();
    return panelDash();
  }

  function panelDash() {
    var pendingD = (store().pendingDeposits || []).filter(function (d) { return d.status === "pending"; }).length;
    var pendingW = (store().pendingWithdrawals || []).filter(function (d) { return d.status === "pending"; }).length;
    var tickets = (store().supportTickets || []).filter(function (t) { return t.status === "open"; }).length;
    return (
      '<div class="admin-card"><h3>Vue d\'ensemble</h3>' +
      '<p class="text-xs text-muted mb-5">Contrôle total — comme EnergiInvest, en mode offline.</p></div>' +
      '<div class="admin-grid">' +
      kpi("Machines", countProducts()) +
      kpi("Utilisateurs", store().users.length) +
      kpi("Recharges en attente", pendingD) +
      kpi("Retraits en attente", pendingW) +
      kpi("Tickets ouverts", tickets) +
      kpi("Achats", store().stats.purchases) +
      kpi("Inscriptions", store().stats.registrations) +
      kpi("Connexions", store().stats.logins) +
      kpi("Solde démo", cfa(store().user.balance)) +
      kpi("Gains parrainage", cfa(store().user.referralEarnings || 0)) +
      "</div>" +
      '<div class="admin-card mt-4"><h3>Actions rapides</h3><div class="admin-actions-inline">' +
      '<button type="button" class="btn-xs primary" data-admin-tab="depots">Voir recharges (' + pendingD + ')</button> ' +
      '<button type="button" class="btn-xs primary" data-admin-tab="retraits">Voir retraits (' + pendingW + ')</button> ' +
      '<button type="button" class="btn-xs" data-admin-tab="support">Support (' + tickets + ')</button> ' +
      '<button type="button" class="btn-xs" data-admin-tab="produits">Machines</button>' +
      "</div></div>"
    );
  }

  function panelAdmins() {
    var list = (store().settings && store().settings.adminAccounts) || [];
    var parts = [
      '<div class="admin-card"><h3>Comptes administrateurs</h3>',
      '<p class="text-xs text-muted mb-5">Seuls ces e-mails peuvent ouvrir l’espace admin. Le compte principal est protégé.</p>',
      '<table class="admin-table"><thead><tr><th>E-mail</th><th>Nom</th><th></th></tr></thead><tbody>',
    ];
    list.forEach(function (acc) {
      var em = acc.email || "";
      var isPrimary = i === 0;
      parts.push(
        "<tr><td>" + em + "</td><td>" + (acc.name || "—") + "</td><td>" +
          (isPrimary
            ? '<span class="badge">Principal</span>'
            : '<button type="button" class="btn-xs danger" data-del-admin="' + em.replace(/"/g, "") + '">Retirer</button>') +
          "</td></tr>"
      );
    });
    parts.push(
      '</tbody></table></div><div class="admin-card"><h3>Ajouter un admin</h3>' +
        '<div class="admin-field"><label>E-mail</label><input id="adm-new-email" type="email" placeholder="collegue@email.com" /></div>' +
        '<div class="admin-field"><label>Nom</label><input id="adm-new-name" placeholder="Nom" /></div>' +
        '<div class="admin-field"><label>Mot de passe</label><input id="adm-new-pass" type="password" placeholder="min. 6 caractères" /></div>' +
        '<button type="button" class="btn-xs primary" id="adm-add-btn">Ajouter</button></div>'
    );
    return parts.join("");
  }

  function panelAccount() {
    var sess = g.Store.getAdminSession() || {};
    return (
      '<div class="admin-card"><h3>Mon compte admin</h3>' +
      '<p class="text-sm">Rôle : <strong>' +
      (sess.role || "—") +
      '</strong></p>' +
      '<p class="text-xs text-muted mt-2">Session locale (pas de serveur). Déconnectez-vous pour changer de rôle.</p>' +
      '<ul class="text-xs text-muted mt-4" style="padding-left:1.1rem;line-height:1.7">' +
      "<li><strong>super</strong> — tous les droits</li>" +
      "<li><strong>editor</strong> — contenu, machines, honneur</li>" +
      "<li><strong>viewer</strong> — lecture seule</li>" +
      '</ul>' +
      '<button type="button" class="btn-xs danger mt-4" id="admin-logout-2">Se déconnecter</button></div>'
    );
  }

  function panelImages() {
    var s = store().settings || {};
    function row(label, key, val, fileId, saveId) {
      return (
        '<div class="admin-card"><h3>' + label + '</h3>' +
        '<img src="' + String(val || "").replace(/"/g, "") + '" alt="" style="max-width:100%;max-height:140px;border-radius:12px;object-fit:cover;margin:0.5rem 0;border:1px solid var(--field-border)" />' +
        '<div class="admin-field"><label>URL</label><input id="' + key + '" value="' + String(val || "").replace(/"/g, "&quot;") + '" /></div>' +
        '<div class="admin-field"><label>Importer</label><input type="file" id="' + fileId + '" accept="image/*,video/mp4,video/webm" /></div>' +
        '<button type="button" class="btn-xs primary" id="' + saveId + '">Enregistrer</button></div>'
      );
    }
    return (
      row("Bannière accueil", "img-banner-url", s.bannerUrl || "register-banner.jpg", "img-banner-file", "img-save-banner") +
      row("Bannière produits", "img-banner-product", s.bannerProduct || "img/banner-intel.jpg", "img-file-product", "img-save-product") +
      row("Bannière portefeuille", "img-banner-wallet", s.bannerWallet || "img/banner-intel.jpg", "img-file-wallet", "img-save-wallet")
    );
  }



  function panelSupport() {
    var list = store().supportTickets || [];
    var parts = ['<div class="admin-card"><h3>Tickets support</h3>'];
    if (!list.length) {
      parts.push('<div class="empty-state">Aucun ticket</div>');
    } else {
      parts.push('<table class="admin-table"><thead><tr><th>Date</th><th>Contact</th><th>Sujet</th><th>Statut</th><th></th></tr></thead><tbody>');
      list.forEach(function (t) {
        parts.push(
          "<tr><td>" +
            String(t.createdAt || "").slice(0, 16).replace("T", " ") +
            "</td><td>" +
            (t.name || "") +
            '<br/><span class="text-3xs text-muted">' +
            (t.email || "") +
            "</span></td><td>" +
            (t.subject || "") +
            '<br/><span class="text-3xs text-muted">' +
            String(t.message || "").slice(0, 80) +
            "</span></td><td>" +
            t.status +
            "</td><td>" +
            (t.status === "open"
              ? '<button type="button" class="btn-xs" data-reply-ticket="' + t.id + '">Répondre</button> ' +
                '<button type="button" class="btn-xs primary" data-close-ticket="' + t.id + '">Clôturer</button>'
              : (t.adminReply
                  ? '<span class="text-3xs text-muted">Réponse: ' + String(t.adminReply).slice(0, 40).replace(/</g, "") + "</span>"
                  : "—")) +
            "</td></tr>"
        );
      });
      parts.push("</tbody></table>");
    }
    parts.push("</div>");
    return parts.join("");
  }

  function panelDepots() {
    var list = (store().pendingDeposits || []).slice();
    /* File d'attente : plus ancien en premier */
    list.sort(function (a, b) {
      return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
    });
    var f = adminState.depFilter || "pending";
    var minAmt = Number(adminState.depMinAmt) || 0;
    if (f === "pending") list = list.filter(function (d) { return d.status === "pending"; });
    if (f === "today") {
      var day = new Date().toISOString().slice(0, 10);
      list = list.filter(function (d) { return String(d.createdAt || "").slice(0, 10) === day; });
    }
    if (minAmt > 0) list = list.filter(function (d) { return Number(d.amount) >= minAmt; });
    var parts = [
      '<div class="admin-card"><h3>Demandes de dépôt / recharge</h3><p class="text-xs text-muted mb-5">Comparez <strong>l’heure de la requête</strong> (Douala) avec la date/heure sur la capture MoMo. Un écart important peut indiquer une preuve réutilisée.</p>',
      '<div class="flex gap-2 flex-wrap mb-5">',
      '<button type="button" class="btn-xs' + (f === "pending" ? " primary" : "") + '" data-dep-filter="pending">En attente</button>',
      '<button type="button" class="btn-xs' + (f === "all" ? " primary" : "") + '" data-dep-filter="all">Tous</button>',
      '<button type="button" class="btn-xs' + (f === "today" ? " primary" : "") + '" data-dep-filter="today">Aujourd\'hui</button>',
      '<button type="button" class="btn-xs" data-dep-min="50000">≥ 50 000</button>',
      '<button type="button" class="btn-xs" id="adm-export-dep-csv">Export CSV</button>',
      '<button type="button" class="btn-xs primary" id="adm-focus-dep">Mode focus</button>',
      '</div>',
    ];
    if (!list.length) parts.push('<div class="empty-state">Aucune demande</div>');
    else {
      parts.push('<table class="admin-table"><thead><tr><th>Date &amp; heure requête</th><th>Pays</th><th>Tél</th><th>Titulaire</th><th>Montant</th><th>Opérateur</th><th>Preuve</th><th>Statut</th><th></th></tr></thead><tbody>');
      list.forEach(function (d) {
        var when =
          '<div class="text-xs"><strong>' +
          fmtAdminTime(d.createdAt) +
          '</strong><br/><span class="text-3xs text-muted">Heure requête (serveur · Douala)</span>' +
          (d.clientAt && d.clientAt !== d.createdAt
            ? '<br/><span class="text-3xs text-muted">Appareil: ' + fmtAdminTime(d.clientAt) + "</span>"
            : "") +
          "</div>";
        parts.push(
          "<tr><td>" +
            when +
            "</td><td>" +
            (d.country || d.dial || "—") +
            "</td><td>" +
            (d.phone || "—") +
            "</td><td>" +
            (d.accountName || "—") +
            "</td><td>" +
            cfa(d.amount) +
            "</td><td>" +
            (d.provider || d.method) +
            "</td><td>" +
            (d.screenshot
              ? '<button type="button" class="btn-xs" data-lightbox="' + String(d.screenshot).replace(/"/g, "&quot;") + '">Voir</button>'
              : "—") +
            "</td><td>" +
            d.status +
            "</td><td>"
        );
        if (d.status === "pending") {
          parts.push(
            '<button class="btn-xs primary" data-approve-dep="' +
              d.id +
              '">' + t("adminApprove") + '</button> ' +
              '<button class="btn-xs danger" data-reject-dep="' +
              d.id +
              '">' + t("adminReject") + '</button>'
          );
        }
        parts.push("</td></tr>");
      });
      parts.push("</tbody></table>");
    }
    parts.push("</div>");
    return parts.join("");
  }

  function panelRetraits() {
    var list = (store().pendingWithdrawals || []).slice();
    list.sort(function (a, b) {
      return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
    });
    var parts = [
      '<div class="admin-card"><h3>Demandes de retrait</h3>',
      '<p class="text-xs text-muted mb-5">Utilisateur, heure exacte de la demande, destination Mobile Money.</p>',
    ];
    if (!list.length) parts.push('<div class="empty-state">Aucune demande</div>');
    else {
      parts.push(
        '<table class="admin-table"><thead><tr><th>Date &amp; heure</th><th>Utilisateur</th><th>Montant</th><th>Destination</th><th>Statut</th><th></th></tr></thead><tbody>'
      );
      list.forEach(function (d) {
        var when = d.createdAt
          ? new Date(d.createdAt).toLocaleString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          : "—";
        var dest =
          (d.mobileProvider ? d.mobileProvider + " · " : "") +
          (d.mobileNumber || d.accountNumber || "—");
        var user = d.phone || d.accountName || "—";
        var stCls = d.status === "pending" ? "pending" : d.status === "approved" ? "approved" : "rejected";
        parts.push(
          "<tr><td>" +
            when +
            "</td><td>" +
            user +
            "</td><td>" +
            cfa(d.amount) +
            "</td><td>" +
            dest +
            '</td><td><span class="status-tag ' +
            stCls +
            '">' +
            (d.status === "pending" ? "En attente" : d.status === "approved" ? "Payé" : "Refusé") +
            "</span></td><td>"
        );
        if (d.status === "pending") {
          parts.push(
            '<button class="btn-xs primary" data-approve-wd="' +
              d.id +
              '">Payer</button> ' +
              '<button class="btn-xs danger" data-reject-wd="' +
              d.id +
              '">' + t("adminReject") + '</button>'
          );
        }
        parts.push("</td></tr>");
      });
      parts.push("</tbody></table>");
    }
    parts.push("</div>");
    return parts.join("");
  }

  function panelPaiements() {
    var momo = (store().paymentMethods || {}).mobileMoney || {};
    var prov = momo.providers || [];
    var parts = [
      '<div class="admin-card"><h3>Moyens de paiement Mobile Money</h3>',
      '<p class="text-xs text-muted mb-5">Ajoutez ou retirez des opérateurs (MTN, Orange, Wave, Moov…).</p>',
    ];
    if (!prov.length) {
      parts.push('<div class="empty-state">Aucun opérateur configuré.</div>');
    } else {
      parts.push(
        '<table class="admin-table"><thead><tr><th>Opérateur</th><th>Numéro</th><th>Nom compte</th><th></th></tr></thead><tbody>'
      );
      prov.forEach(function (pr, i) {
        parts.push(
          "<tr><td>" +
            (pr.name || "") +
            "</td><td>" +
            (pr.number || "") +
            "</td><td>" +
            (pr.accountName || "") +
            '</td><td class="admin-actions-inline">' +
            '<button type="button" class="btn-xs" data-edit-momo="' +
            i +
            '">Édit</button> ' +
            '<button type="button" class="btn-xs danger" data-del-momo="' +
            i +
            '">Retirer</button></td></tr>'
        );
      });
      parts.push("</tbody></table>");
    }
    parts.push(
      '</div><div class="admin-card"><h3>Ajouter un opérateur</h3>' +
        '<div class="admin-row">' +
        '<div class="admin-field"><label>Opérateur</label><input id="momo-new-name" placeholder="Ex. MTN MoMo, Orange Money" /></div>' +
        '<div class="admin-field"><label>Numéro</label><input id="momo-new-number" placeholder="07 XX XX XX XX" /></div>' +
        '<div class="admin-field"><label>Nom du compte</label><input id="momo-new-acc" placeholder="Intel NG" /></div>' +
        '</div><button type="button" class="btn-primary" id="momo-add">Ajouter</button></div>' +
        '<div class="admin-card"><h3>Instructions affichées aux utilisateurs</h3>' +
        '<div class="admin-field"><textarea id="pay-momo-ins">' +
        (momo.instructions || "").replace(/</g, "&lt;") +
        '</textarea></div>' +
        '<button type="button" class="btn-xs primary mt-2" id="pay-save-momo-ins">Enregistrer les instructions</button></div>'
    );
    return parts.join("");
  }


  function kpi(label, value) {
    return '<div class="kpi"><p class="k">' + label + '</p><p class="v">' + value + '</p></div>';
  }

  function panelProduits() {
    var cats = Object.keys(store().products || {});
    var parts = [
      '<div class="admin-card"><h3>Catalogue machines</h3>',
      '<p class="text-xs text-muted mb-5">Ajoutez une machine avec photo (optionnel).</p>',
      '<div class="admin-row">',
      '<div class="admin-field"><label>Catégorie</label><select id="ap-cat">' +
        (cats.length
          ? cats.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join("")
          : '<option value="Machines">Machines</option>') +
        '</select></div>' +
        '<div class="admin-field"><label>Ou nouvelle catégorie</label><input id="ap-cat-new" placeholder="Ex. Packs" /></div>',
      '<div class="admin-field"><label>Nom</label><input id="ap-name" placeholder="Nom machine" /></div>',
      '<div class="admin-field"><label>Prix</label><input id="ap-price" type="number" value="10000" /></div>',
      '<div class="admin-field"><label>Gain / jour</label><input id="ap-daily" type="number" value="500" /></div>',
      '<div class="admin-field"><label>Durée (j)</label><input id="ap-days" type="number" value="30" /></div>',
      '</div>',
      '<div class="admin-field"><label>Photo / vidéo machine</label><input type="file" id="ap-photo" accept="image/*,video/mp4,video/webm,video/*" />',
      '<input type="hidden" id="ap-photo-data" value="" />',
      '<img id="ap-photo-preview" alt="" style="display:none;max-width:100%;max-height:120px;margin-top:8px;border-radius:10px;object-fit:cover" /></div>',
      '<button type="button" class="btn-xs primary" id="ap-add">Ajouter la machine</button></div>',
    ];
    cats.forEach(function (cat) {
      parts.push('<div class="admin-card"><h3>' + cat + '</h3>');
      var list = store().products[cat] || [];
      if (!list.length) parts.push('<div class="empty-state">Vide</div>');
      else {
        parts.push('<table class="admin-table"><thead><tr><th></th><th>Nom</th><th>Prix</th><th>Journalier</th><th>Jours</th><th></th></tr></thead><tbody>');
        list.forEach(function (pr) {
          var img = pr.image || "img/machines/cpu1.jpg";
          parts.push(
            "<tr><td><img src=\"" + img + "\" alt=\"\" style=\"width:48px;height:48px;object-fit:cover;border-radius:8px\" /></td><td>" +
              pr.name +
              "</td><td>" + cfa(pr.price) + "</td><td>" + cfa(pr.daily) + "</td><td>" + (pr.days || "—") +
              '</td><td class="admin-actions-inline">' +
              '<button type="button" class="btn-xs" data-edit-prod="' + cat + ":" + pr.id + '">Édit</button> ' +
              '<button type="button" class="btn-xs" data-photo-prod="' + cat + ":" + pr.id + '">Photo</button> ' +
              '<button type="button" class="btn-xs danger" data-del-prod="' + cat + ":" + pr.id + '">Suppr</button></td></tr>'
          );
        });
        parts.push("</tbody></table>");
      }
      parts.push("</div>");
    });
    return parts.join("");
  }

  function panelContenu() {
    var s = store();
    var feat = s.featured || [];
    var parts = ['<div class="admin-card"><h3>Articles / textes</h3>',
      '<div class="admin-field"><label>Nom du site</label><input id="ct-site" value="' + String(s.settings.siteName || "").replace(/"/g, "&quot;") + '" /></div>',
      '<button type="button" class="btn-xs primary" data-save-site>Enregistrer</button></div>',
      '<div class="admin-card"><h3>Produits mis en avant</h3>'];
    feat.forEach(function (f, i) {
      parts.push(
        '<div class="admin-row" data-feat-idx="' + i + '">' +
          '<div class="admin-field"><label>Nom</label><input data-f="name" value="' + String(f.name || "").replace(/"/g, "&quot;") + '" /></div>' +
          '<div class="admin-field"><label>Prix</label><input data-f="price" type="number" value="' + (f.price || 0) + '" /></div>' +
          '<div class="admin-field"><label>Daily</label><input data-f="daily" type="number" value="' + (f.daily || 0) + '" /></div>' +
          '<div class="admin-field"><label>Jours</label><input data-f="days" type="number" value="' + (f.days || 0) + '" /></div>' +
          '<div class="admin-field"><label>Image URL</label><input data-f="image" value="' + String(f.image || "").replace(/"/g, "&quot;") + '" /></div></div>'
      );
    });
    parts.push('<button type="button" class="btn-xs primary" data-save-feat>Enregistrer featured</button></div>');
    return parts.join("");
  }

  function panelHonneur() {
    var ht = store().honorTop || [];
    var wd = store().withdrawals || [];
    var parts = ['<div class="admin-card"><h3>Classement</h3><button type="button" class="btn-xs primary" id="ht-add">+ Entrée</button><table class="admin-table"><thead><tr><th>Nom</th><th>Montant</th><th></th></tr></thead><tbody>'];
    ht.forEach(function (h, i) {
      parts.push("<tr><td>" + h.name + "</td><td>" + cfa(h.amount) + '</td><td><button class="btn-xs danger" data-del-ht="' + i + '">×</button></td></tr>');
    });
    parts.push('</tbody></table></div><div class="admin-card"><h3>Retraits affichés</h3><button type="button" class="btn-xs primary" id="wd-add">+ Entrée</button><table class="admin-table"><thead><tr><th>Nom</th><th>Montant</th><th>Quand</th><th></th></tr></thead><tbody>');
    wd.forEach(function (w, i) {
      parts.push("<tr><td>" + w.name + "</td><td>" + cfa(w.amount) + "</td><td>" + (w.when || "") + '</td><td><button class="btn-xs danger" data-del-wd="' + i + '">×</button></td></tr>');
    });
    parts.push("</tbody></table></div>");
    return parts.join("");
  }

  function panelUsers() {
    var q = (adminState.search || "").toLowerCase();
    var list = (store().users || []).filter(function (u) {
      return !q || String(u.phone || "").toLowerCase().indexOf(q) !== -1 || String(u.name || "").toLowerCase().indexOf(q) !== -1;
    });
    var wds = store().pendingWithdrawals || [];
    var page = adminState.page || 0;
    var slice = list.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
    var parts = [
      '<div class="admin-card"><h3>Tous les utilisateurs</h3>',
      '<p class="text-xs text-muted mb-5">' + list.length + " compte(s) · recherche par téléphone ou nom</p>",
      '<input id="adm-search" placeholder="Recherche téléphone / nom…" value="' + String(adminState.search || "").replace(/"/g, "&quot;") + '" style="width:100%;margin-bottom:0.75rem;padding:0.5rem;border-radius:8px;border:1px solid var(--field-border);background:var(--field);color:inherit" />',
      '<table class="admin-table"><thead><tr><th>Tél</th><th>Nom</th><th>Solde</th><th>Inscription</th><th>Dernier retrait demandé</th><th>Statut</th><th></th></tr></thead><tbody>',
    ];
    if (!slice.length) parts.push('<tr><td colspan="7">Aucun</td></tr>');
    slice.forEach(function (u) {
      var userWds = wds.filter(function (w) {
        return String(w.phone || "") === String(u.phone || "");
      }).sort(function (a, b) {
        return String(b.createdAt).localeCompare(String(a.createdAt));
      });
      var lastWd = userWds[0] || null;
      var wdTxt = lastWd
        ? new Date(lastWd.createdAt).toLocaleString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }) +
          " · " +
          cfa(lastWd.amount) +
          (userWds.length > 1 ? " (" + userWds.length + " demandes)" : "")
        : "—";
      var reg = u.createdAt
        ? new Date(u.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
        : "—";
      parts.push(
        "<tr><td>" +
          (u.phone || "—") +
          "</td><td>" +
          (u.name || "—") +
          "</td><td>" +
          cfa(u.balance) +
          "</td><td>" +
          reg +
          "</td><td>" +
          wdTxt +
          "</td><td>" +
          (u.status || "actif") +
          '</td><td><button class="btn-xs" data-toggle-user="' +
          u.id +
          '">Statut</button> ' +
          '<button class="btn-xs" data-user-note="' +
          String(u.phone || u.id).replace(/"/g, "") +
          '">Note</button> ' +
          '<button class="btn-xs danger" data-del-user="' +
          u.id +
          '">×</button></td></tr>'
      );
    });
    parts.push(
      '</tbody></table></div>' +
      '<div class="admin-card"><h3>Toutes les demandes de retrait (heure exacte)</h3>'
    );
    if (!wds.length) {
      parts.push('<div class="empty-state">Aucune demande de retrait</div>');
    } else {
      parts.push('<table class="admin-table"><thead><tr><th>Date &amp; heure</th><th>Utilisateur</th><th>Montant</th><th>Destination</th><th>Statut</th></tr></thead><tbody>');
      wds.slice().sort(function (a, b) {
        return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
      }).forEach(function (d) {
        var when = d.createdAt
          ? new Date(d.createdAt).toLocaleString("fr-FR", {
              day: "2-digit", month: "2-digit", year: "numeric",
              hour: "2-digit", minute: "2-digit", second: "2-digit",
            })
          : "—";
        parts.push(
          "<tr><td>" + when + "</td><td>" + (d.phone || "—") + "</td><td>" + cfa(d.amount) +
          "</td><td>" + (d.mobileProvider || "") + " " + (d.mobileNumber || d.accountNumber || "") +
          "</td><td><span class=\"status-tag " + (d.status || "") + "\">" + (d.status || "") + "</span></td></tr>"
        );
      });
      parts.push("</tbody></table>");
    }
    parts.push(
      '</div><div class="admin-card"><div class="admin-actions-inline mt-2">' +
        '<button class="btn-xs" id="page-prev">Préc.</button> ' +
        '<span class="text-xs text-muted">p. ' +
        (page + 1) +
        "</span> " +
        '<button class="btn-xs" id="page-next">Suiv.</button></div></div>'
    );
    return parts.join("");
  }

  function panelLogs() {
    var typeF = adminState.logType || "all";
    var logs = (store().activityLog || []).filter(function (l) {
      if (typeF === "all") return true;
      return String(l.action || "").indexOf(typeF) >= 0;
    }).slice(0, 50);
    var parts = [
      '<div class="admin-card"><h3>Journal d\'audit</h3>',
      '<div class="flex gap-2 flex-wrap mb-5">',
      '<button type="button" class="btn-xs' + (typeF === "all" ? " primary" : "") + '" data-log-type="all">Tous</button>',
      '<button type="button" class="btn-xs' + (typeF === "deposit" ? " primary" : "") + '" data-log-type="deposit">' + t("adminDeposits") + '</button>',
      '<button type="button" class="btn-xs' + (typeF === "withdraw" ? " primary" : "") + '" data-log-type="withdraw">' + t("adminWithdrawals") + '</button>',
      '<button type="button" class="btn-xs' + (typeF === "admin" ? " primary" : "") + '" data-log-type="admin">Admin</button>',
      '</div>',
      '<table class="admin-table"><thead><tr><th>Date</th><th>Action</th><th>Détail</th></tr></thead><tbody>',
    ];
    if (!logs.length) parts.push('<tr><td colspan="3">Vide</td></tr>');
    logs.forEach(function (l) {
      parts.push("<tr><td>" + String(l.at || "").slice(0, 19).replace("T", " ") + "</td><td>" + (l.action || "") + "</td><td>" + (l.detail || "") + "</td></tr>");
    });
    parts.push("</tbody></table></div>");
    return parts.join("");
  }

  function panelSysteme() {
    var s = store().settings || {};
    return (
      '<div class="admin-card"><h3>Maintenance</h3>' +
      '<button type="button" class="btn-xs' + (s.maintenance ? " danger" : " primary") + '" id="sys-maint">' +
      (s.maintenance ? "Désactiver maintenance" : "Activer maintenance") +
      "</button></div>" +
      '<div class="admin-card"><h3>Bonus parrainage (%)</h3><input id="sys-ref-bonus" type="number" min="0" max="50" value="' +
      (s.referralBonusPercent || 25) +
      '" style="width:100%;padding:0.5rem;border-radius:0.5rem;border:1px solid var(--field-border);background:var(--field);color:inherit" />' +
      '<button class="btn-xs primary mt-2" id="sys-save-ref">Enregistrer bonus</button></div>' +
      '<div class="admin-card"><h3>Min password</h3><input id="sys-minpw" type="number" value="' +
      (s.minPassword || 6) +
      '" style="width:100%;padding:0.5rem;border-radius:0.5rem;border:1px solid var(--field-border);background:var(--field);color:inherit" />' +
      '<button class="btn-xs primary mt-2" id="sys-save-pw">Enregistrer</button></div>' +
      '<div class="admin-card"><h3>CDN images</h3>' +
      '<p class="text-xs text-muted mb-2">Laisser vide = images locales. Ex: https://cdn.example.com/intel-ng</p>' +
      '<input id="sys-cdn" placeholder="https://cdn…" value="' +
      String((g.CDN && g.CDN.config.CDN_BASE) || '').replace(/"/g, '&quot;') +
      '" style="width:100%;padding:0.5rem;border-radius:0.5rem;border:1px solid var(--field-border);background:var(--field);color:inherit" />' +
      '<button class="btn-xs primary mt-2" id="sys-save-cdn">Enregistrer CDN</button></div>' +
      '<div class="admin-card"><h3>Données</h3>' +
      '<button class="btn-xs" id="sys-export">Export JSON</button> ' +
      '<label class="btn-xs" style="display:inline-block;cursor:pointer">Import<input type="file" id="sys-import" accept="application/json" class="is-hidden" /></label> ' +
      '<button class="btn-xs danger" id="sys-reset">Reset data</button></div>'
    );
  }

  function bind() {
    /* Sync API une seule fois par session admin — jamais en boucle, jamais sans session */
    var sess = g.Store.getAdminSession();
    var hasToken = g.API && g.API.getAdminToken && g.API.getAdminToken();
    if (sess && hasToken && !window._adminDataLoaded) {
      window._adminDataLoaded = true;
      syncAdminData()
        .then(function () {
          if ((location.hash || "").indexOf("/admin") >= 0) g.Router.render(true);
        })
        .catch(function () {
          window._adminDataLoaded = false;
        });
    }
    var form = document.getElementById("admin-login-form");
    if (form) {
      form.onsubmit = async function (e) {
        e.preventDefault();
        var email = document.getElementById("admin-email").value;
        var pass = document.getElementById("admin-pass").value;
        var res = await g.API.adminLogin(email, pass);
        if (!res.ok) {
          document.getElementById("admin-login-error").textContent = "Mot de passe incorrect";
          document.getElementById("admin-login-error").classList.remove("is-hidden");
          g.UI.toast("Accès refusé", "error");
          return;
        }
        var role = (res.data && res.data.admin && res.data.admin.role) || (res.data && res.data.role) || "admin";
        g.UI.toast("Admin (" + role + ")", "success");
        window._adminDataLoaded = false;
        adminState.tab = "dash";
        g.Router.render(true);
      };
      return;
    }

    function doAdminLogout() {
      window._adminDataLoaded = false;
      if (g.API && g.API.adminLogout) g.API.adminLogout();
      else g.Store.setAdminSession(null);
      g.UI.toast("Déconnexion admin", "info");
      g.Router.render(true);
    }
    var lo = document.getElementById("admin-logout");
    if (lo) lo.onclick = doAdminLogout;
    var lo2 = document.getElementById("admin-logout-2");
    if (lo2) lo2.onclick = doAdminLogout;

    var saveBan = document.getElementById("img-save-banner");
    if (saveBan)
      saveBan.onclick = function () {
        var url = (document.getElementById("img-banner-url").value || "").trim() || "register-banner.jpg";
        g.Store.update(function (s) {
          s.settings.bannerUrl = url;
        });
        g.Store.log("banner", String(url).slice(0, 48));
        g.UI.toast("Bannière enregistrée", "success");
        adminState.tab = "images";
        g.Router.render(true);
      };
    var resetBan = document.getElementById("img-reset-banner");
    if (resetBan)
      resetBan.onclick = function () {
        g.Store.update(function (s) {
          s.settings.bannerUrl = "register-banner.jpg";
        });
        g.UI.toast("Bannière réinitialisée", "info");
        adminState.tab = "images";
        g.Router.render(true);
      };
    var fileBan = document.getElementById("img-banner-file");
    if (fileBan)
      fileBan.onchange = function () {
        var f = fileBan.files && fileBan.files[0];
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function () {
          document.getElementById("img-banner-url").value = reader.result;
          g.UI.toast("Image chargée — cliquez Enregistrer", "info");
        };
        reader.readAsDataURL(f);
      };

    document.querySelectorAll("[data-admin-tab]").forEach(function (b) {
      b.onclick = function () {
        adminState.tab = b.getAttribute("data-admin-tab");
        adminState.page = 0;
        g.Router.render(true);
      };
    });

    /* Recherche globale admin */
    var gs = document.getElementById("admin-global-search");
    if (gs && !gs._bound) {
      gs._bound = true;
      gs.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        var q = String(gs.value || "").trim().toLowerCase();
        if (!q) return;
        var st = store();
        var hits = [];
        (st.pendingDeposits || []).forEach(function (d) {
          if (String(d.phone || "").toLowerCase().indexOf(q) >= 0 || String(d.amount).indexOf(q) >= 0)
            hits.push("Dépôt " + d.id + " · " + d.amount);
        });
        (st.pendingWithdrawals || []).forEach(function (d) {
          if (String(d.phone || "").toLowerCase().indexOf(q) >= 0 || String(d.amount).indexOf(q) >= 0)
            hits.push("Retrait " + d.id + " · " + d.amount);
        });
        (st.supportTickets || []).forEach(function (x) {
          if (String(x.subject || "").toLowerCase().indexOf(q) >= 0 || String(x.email || "").toLowerCase().indexOf(q) >= 0)
            hits.push("Ticket " + (x.subject || x.id));
        });
        g.UI.toast(hits.length ? hits.slice(0, 3).join(" | ") : "Aucun résultat", hits.length ? "success" : "info");
      });
    }

    /* Filtres dépôts */
    document.querySelectorAll("[data-dep-filter]").forEach(function (b) {
      b.onclick = function () {
        adminState.depFilter = b.getAttribute("data-dep-filter");
        adminState.depMinAmt = 0;
        g.Router.render(true);
      };
    });
    document.querySelectorAll("[data-dep-min]").forEach(function (b) {
      b.onclick = function () {
        adminState.depMinAmt = Number(b.getAttribute("data-dep-min")) || 0;
        g.Router.render(true);
      };
    });
    document.querySelectorAll("[data-log-type]").forEach(function (b) {
      b.onclick = function () {
        adminState.logType = b.getAttribute("data-log-type");
        adminState.tab = "logs";
        g.Router.render(true);
      };
    });

    /* Lightbox preuve */
    document.querySelectorAll("[data-lightbox]").forEach(function (b) {
      b.onclick = function () {
        var src = b.getAttribute("data-lightbox");
        if (!src) return;
        var ov = document.createElement("div");
        ov.className = "lightbox-overlay";
        ov.innerHTML = '<div class="lightbox-inner"><img src="' + src.replace(/"/g, "&quot;") + '" alt="Preuve" /><button type="button" class="btn-xs" id="lb-close">Fermer</button></div>';
        ov.onclick = function (e) { if (e.target === ov || (e.target && e.target.id === "lb-close")) ov.remove(); };
        document.body.appendChild(ov);
      };
    });

    /* Export CSV dépôts */
    var expDep = document.getElementById("adm-export-dep-csv");
    if (expDep) {
      expDep.onclick = function () {
        var rows = [["id", "date", "phone", "amount", "status", "provider"]];
        (store().pendingDeposits || []).forEach(function (d) {
          rows.push([d.id, d.createdAt, d.phone, d.amount, d.status, d.provider || ""]);
        });
        var csv = rows.map(function (r) { return r.join(","); }).join("\n");
        var a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        a.download = "depots-intel-ng.csv";
        a.click();
        g.UI.toast("CSV exporté", "success");
      };
    }

    /* Mode focus : première demande pending */
    var focusDep = document.getElementById("adm-focus-dep");
    if (focusDep) {
      focusDep.onclick = function () {
        var d = (store().pendingDeposits || []).find(function (x) { return x.status === "pending"; });
        if (!d) return g.UI.toast("Aucune demande en attente", "info");
        var html = "<p><b>" + g.UI.cfa(d.amount) + "</b> · " + (d.phone || "") + "</p>" +
          "<p class=\"text-xs\">" + (d.accountName || "") + " · " + (d.provider || "") + "</p>" +
          (d.screenshot ? "<p><img src=\"" + d.screenshot.replace(/"/g, "&quot;") + "\" style=\"max-width:100%;max-height:200px;border-radius:8px\"/></p>" : "");
        g.UI.confirmModal("Focus validation", html, { okText: "Valider" }).then(function (ok) {
          if (!ok) return;
          g.API.approveDeposit(d.id).then(async function () {
            if (typeof syncAdminData === "function") await syncAdminData();
            g.UI.toast("Validé", "success");
            g.Router.render(true);
          });
        });
      };
    }

    /* Raccourcis clavier admin */
    if (!window._adminKeysBound) {
      window._adminKeysBound = true;
      document.addEventListener("keydown", function (e) {
        if (!(location.hash || "").replace(/^#/, "").startsWith("/admin")) return;
        if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
        var k = (e.key || "").toLowerCase();
        if (k === "g") { adminState.tab = "dash"; g.Router.render(true); }
        if (k === "r") { adminState.tab = "retraits"; g.Router.render(true); }
        if (k === "d") { adminState.tab = "depots"; g.Router.render(true); }
        if (k === "u") { adminState.tab = "users"; g.Router.render(true); }
      });
    }

    /* Ajouter / retirer des administrateurs (email + mot de passe) */
    var addAdm = document.getElementById("adm-add-btn");
    if (addAdm) {
      addAdm.onclick = async function () {
        var email = (document.getElementById("adm-new-email") || {}).value || "";
        var name = (document.getElementById("adm-new-name") || {}).value || "";
        var pass = (document.getElementById("adm-new-pass") || {}).value || "";
        var res = await g.API.adminAddAccount({ email: email, name: name, password: pass });
        if (!res.ok) {
          var msg = "Impossible d\'ajouter";
          if (res.error === "email") msg = "E-mail invalide";
          else if (res.error === "password") msg = "Mot de passe trop court (min. 6)";
          else if (res.error === "exists") msg = "Cet e-mail est déjà admin";
          else if (res.error === "unauthorized") msg = "Session admin requise";
          g.UI.toast(msg, "error");
          return;
        }
        g.UI.toast("Admin ajouté : " + email.trim().toLowerCase(), "success");
        adminState.tab = "admins";
        g.Router.render(true);
      };
    }
    document.querySelectorAll("[data-del-admin]").forEach(function (b) {
      b.onclick = async function () {
        var em = b.getAttribute("data-del-admin");
        if (!(await g.UI.confirmModal("Retirer admin", "Retirer " + em + " ?", { danger: true, okText: "Retirer" }))) return;
        var res = await g.API.adminRemoveAccount(em);
        if (!res.ok) {
          g.UI.toast(res.error === "protected" ? "Compte principal protégé" : "Échec", "error");
          return;
        }
        g.UI.toast("Admin retiré", "success");
        adminState.tab = "admins";
        g.Router.render(true);
      };
    });

    var search = document.getElementById("adm-search");
    if (search) {
      var tmr;
      search.oninput = function () {
        clearTimeout(tmr);
        tmr = setTimeout(function () {
          adminState.search = search.value;
          adminState.page = 0;
          g.Router.render(true);
        }, 200);
      };
    }

    var prev = document.getElementById("page-prev");
    var next = document.getElementById("page-next");
    if (prev)
      prev.onclick = function () {
        adminState.page = Math.max(0, adminState.page - 1);
        g.Router.render(true);
      };
    if (next)
      next.onclick = function () {
        adminState.page++;
        g.Router.render(true);
      };

    document.querySelectorAll("[data-reply-ticket]").forEach(function (b) {
      b.onclick = async function () {
        var id = b.getAttribute("data-reply-ticket");
        var reply = window.prompt("Réponse visible par l'utilisateur :", "Nous avons bien reçu votre demande.");
        if (reply === null) return;
        if (g.API.replySupportTicket) {
          await g.API.replySupportTicket(id, reply);
        } else {
          g.Store.update(function (st) {
            (st.supportTickets || []).forEach(function (t) {
              if (t.id === id) {
                t.adminReply = String(reply).slice(0, 500);
                t.status = "answered";
              }
            });
            st.notifications = st.notifications || [];
            st.notifications.unshift({
              id: g.Store.uid("n"),
              text: "Réponse support : " + String(reply).slice(0, 80),
              read: false,
              at: new Date().toISOString(),
            });
          });
        }
        g.UI.toast("Réponse enregistrée", "success");
        g.Router.render(true);
      };
    });
    document.querySelectorAll("[data-close-ticket]").forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute("data-close-ticket");
        g.Store.update(function (s) {
          (s.supportTickets || []).forEach(function (t) {
            if (t.id === id) t.status = "closed";
          });
        });
        g.Store.log("support_close", id);
        g.UI.toast("Ticket clôturé", "success");
        adminState.tab = "support";
        g.Router.render(true);
      };
    });

    // dépôts / retraits
    document.querySelectorAll("[data-approve-dep]").forEach(function (b) {
      b.onclick = async function () {
        var id = b.getAttribute("data-approve-dep");
        await g.API.approveDeposit(id);
        if (typeof syncAdminData === "function") await syncAdminData();
        g.UI.toast("Dépôt validé — solde crédité", "success");
        g.Router.render(true);
      };
    });
    document.querySelectorAll("[data-reject-dep]").forEach(function (b) {
      b.onclick = async function () {
        var reason = window.prompt("Motif du refus (visible par l'utilisateur) :", "Preuve illisible ou montant incorrect");
        if (reason === null) return;
        await g.API.rejectDeposit(b.getAttribute("data-reject-dep"), reason);
        if (typeof syncAdminData === "function") await syncAdminData();
        g.UI.toast("Dépôt refusé", "info");
        g.Router.render(true);
      };
    });
    document.querySelectorAll("[data-approve-wd]").forEach(function (b) {
      b.onclick = async function () {
        await g.API.approveWithdraw(b.getAttribute("data-approve-wd"));
        if (typeof syncAdminData === "function") await syncAdminData();
        g.UI.toast("Retrait marqué payé", "success");
        g.Router.render(true);
      };
    });
    document.querySelectorAll("[data-reject-wd]").forEach(function (b) {
      b.onclick = async function () {
        var reason = window.prompt("Motif du refus (visible par l'utilisateur) :", "Coordonnées incorrectes");
        if (reason === null) return;
        await g.API.rejectWithdraw(b.getAttribute("data-reject-wd"), reason);
        if (typeof syncAdminData === "function") await syncAdminData();
        g.UI.toast("Retrait refusé — fonds restitués", "info");
        g.Router.render(true);
      };
    });
    function saveProviders(providers, instructions) {
      g.Store.update(function (s) {
        var prev = (s.paymentMethods && s.paymentMethods.mobileMoney) || {};
        s.paymentMethods = {
          mobileMoney: {
            enabled: true,
            providers: providers,
            instructions:
              instructions != null ? instructions : prev.instructions || "",
          },
        };
      });
    }

    var addMomo = document.getElementById("momo-add");
    if (addMomo)
      addMomo.onclick = function () {
        var name = (document.getElementById("momo-new-name").value || "").trim();
        var number = (document.getElementById("momo-new-number").value || "").trim();
        var accountName = (document.getElementById("momo-new-acc").value || "").trim();
        if (!name || name.length < 2) {
          g.UI.toast("Nom de l'opérateur requis", "error");
          return;
        }
        if (!number || String(number).replace(/\D/g, "").length < 8) {
          g.UI.toast("Numéro de dépôt invalide", "error");
          return;
        }
        var providers = (((store().paymentMethods || {}).mobileMoney || {}).providers || []).slice();
        providers.push({ name: name, number: number, accountName: accountName || name });
        saveProviders(providers);
        g.Store.log("momo_add", name);
        g.UI.toast(name + " ajouté", "success");
        adminState.tab = "paiements";
        g.Router.render(true);
      };

    document.querySelectorAll("[data-del-momo]").forEach(function (btn) {
      btn.onclick = async function () {
        var i = Number(btn.getAttribute("data-del-momo"));
        var prov = (((store().paymentMethods || {}).mobileMoney || {}).providers || [])[i];
        var label = prov ? prov.name : "cet opérateur";
        if (
          !(await g.UI.confirmModal("Retirer", "Retirer « " + label + " » des moyens de paiement ?", {
            danger: true,
            okText: "Retirer",
          }))
        )
          return;
        var providers = (((store().paymentMethods || {}).mobileMoney || {}).providers || []).slice();
        providers.splice(i, 1);
        saveProviders(providers);
        g.Store.log("momo_del", label);
        g.UI.toast(label + " retiré", "info");
        adminState.tab = "paiements";
        g.Router.render(true);
      };
    });

    document.querySelectorAll("[data-edit-momo]").forEach(function (btn) {
      btn.onclick = async function () {
        var i = Number(btn.getAttribute("data-edit-momo"));
        var prov = (((store().paymentMethods || {}).mobileMoney || {}).providers || [])[i];
        if (!prov) return;
        var data = await g.UI.formModal("Modifier l'opérateur", [
          { name: "name", label: "Opérateur", value: prov.name },
          { name: "number", label: "Numéro", value: prov.number },
          { name: "accountName", label: "Nom du compte", value: prov.accountName || "" },
        ]);
        if (!data) return;
        if (!String(data.name || "").trim() || !String(data.number || "").trim()) {
          g.UI.toast("Opérateur et numéro requis", "error");
          return;
        }
        var providers = (((store().paymentMethods || {}).mobileMoney || {}).providers || []).slice();
        providers[i] = {
          name: String(data.name).trim(),
          number: String(data.number).trim(),
          accountName: String(data.accountName || "").trim(),
        };
        saveProviders(providers);
        g.Store.log("momo_edit", providers[i].name);
        g.UI.toast("Opérateur mis à jour", "success");
        adminState.tab = "paiements";
        g.Router.render(true);
      };
    });

    var saveIns = document.getElementById("pay-save-momo-ins");
    if (saveIns)
      saveIns.onclick = function () {
        var providers = (((store().paymentMethods || {}).mobileMoney || {}).providers || []).slice();
        saveProviders(providers, document.getElementById("pay-momo-ins").value);
        g.Store.log("momo_instructions", "update");
        g.UI.toast("Instructions enregistrées", "success");
      };

    // produits
    var apPhoto = document.getElementById("ap-photo");
    if (apPhoto)
      apPhoto.onchange = function () {
        var f = apPhoto.files && apPhoto.files[0];
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function () {
          var prev = document.getElementById("ap-photo-preview");
          var hid = document.getElementById("ap-photo-data");
          if (hid) hid.value = reader.result;
          if (prev) {
            if (String(reader.result).indexOf("data:video") === 0) {
              prev.style.display = "none";
              g.UI.toast("Vidéo prête — Ajouter la machine", "info");
            } else {
              prev.src = reader.result;
              prev.style.display = "block";
            }
          }
        };
        reader.readAsDataURL(f);
      };

    var add = document.getElementById("ap-add");
    if (add) {
      add.onclick = async function () {
        var catNew = (document.getElementById("ap-cat-new") && document.getElementById("ap-cat-new").value || "").trim();
        var cat = catNew || ((document.getElementById("ap-cat") || {}).value) || "Machines";
        var name = ((document.getElementById("ap-name") || {}).value || "").trim();
        var price = Number((document.getElementById("ap-price") || {}).value) || 0;
        var daily = Number((document.getElementById("ap-daily") || {}).value) || 0;
        var days = Number((document.getElementById("ap-days") || {}).value) || 0;
        if (!name || price <= 0) {
          g.UI.toast("Nom et prix requis", "error");
          return;
        }
        var photo = (document.getElementById("ap-photo-data") && document.getElementById("ap-photo-data").value) || "img/machines/thumbs/cpu1.jpg";
        var res = await g.API.adminAddProduct({ category: cat, name: name, price: price, daily: daily, days: days, image: photo });
        if (!res.ok) {
          g.UI.toast("Échec ajout machine (serveur)", "error");
          return;
        }
        if (res.data && res.data.products) {
          g.Store.update(function (s) { s.products = res.data.products; });
        }
        g.UI.toast("Machine enregistrée sur le serveur", "success");
        g.Router.render(true);
      };
    }

    document.querySelectorAll("[data-photo-prod]").forEach(function (btn) {
      btn.onclick = function () {
        var key = btn.getAttribute("data-photo-prod");
        var parts = key.split(":");
        var id = parts[1];
        var input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*,video/mp4,video/webm";
        input.onchange = function () {
          var f = input.files && input.files[0];
          if (!f) return;
          var reader = new FileReader();
          reader.onload = async function () {
            var res = await g.API.adminUpdateProduct(id, { image: reader.result });
            if (!res.ok) {
              g.UI.toast("Échec photo serveur", "error");
              return;
            }
            if (res.data && res.data.products) {
              g.Store.update(function (s) { s.products = res.data.products; });
            }
            g.UI.toast("Photo machine mise à jour", "success");
            adminState.tab = "produits";
            g.Router.render(true);
          };
          reader.readAsDataURL(f);
        };
        input.click();
      };
    });

    document.querySelectorAll("[data-del-prod]").forEach(function (btn) {
      btn.onclick = async function () {
        var key = btn.getAttribute("data-del-prod") || "";
        var parts = key.split(":");
        if (parts.length < 2) return;
        if (!(await g.UI.confirmModal("Supprimer", "Supprimer cette machine ?", { danger: true, okText: "Suppr." })))
          return;
        var res = await g.API.adminDeleteProduct(parts[1]);
        if (!res.ok) {
          g.UI.toast("Échec suppression", "error");
          return;
        }
        if (res.data && res.data.products) {
          g.Store.update(function (s) { s.products = res.data.products; });
        }
        g.UI.toast("Machine supprimée (serveur)", "info");
        g.Router.render(true);
      };
    });

    document.querySelectorAll("[data-edit-prod]").forEach(function (btn) {
      btn.onclick = async function () {
        var key = btn.getAttribute("data-edit-prod") || "";
        var parts = key.split(":");
        var cat = parts[0],
          id = parts[1];
        var prod = (store().products[cat] || []).find(function (p) {
          return p.id === id;
        });
        if (!prod) return;
        var data = await g.UI.formModal("Éditer produit", [
          { name: "name", label: "Nom", value: prod.name },
          { name: "price", label: "Prix", type: "number", value: prod.price },
          { name: "daily", label: "Quotidien", type: "number", value: prod.daily },
          { name: "days", label: "Jours", type: "number", value: prod.days },
        ]);
        if (!data) return;
        var res = await g.API.adminUpdateProduct(id, {
          name: data.name,
          price: Number(data.price),
          daily: Number(data.daily),
          days: Number(data.days),
        });
        if (!res.ok) {
          g.UI.toast("Échec édition serveur", "error");
          return;
        }
        if (res.data && res.data.products) {
          g.Store.update(function (s) { s.products = res.data.products; });
        }
        g.UI.toast("Machine mise à jour (serveur)", "success");
        g.Router.render(true);
      };
    });

    // contenu
    bindContenu();
    bindHonneur();
    bindUsers();
    bindSysteme();
  }

  function bindContenu() {
    var el;
    el = document.getElementById("ac-save-site");
    if (el)
      el.onclick = function () {
        g.Store.update(function (s) {
          s.settings.siteName = document.getElementById("ac-sitename").value.trim() || s.settings.siteName;
        });
        g.Store.log("settings", "siteName");
        g.UI.toast("OK", "success");
      };
    el = document.getElementById("ac-save-notice");
    if (el)
      el.onclick = function () {
        g.Store.update(function (s) {
          s.notice = document.getElementById("ac-notice").value;
        });
        g.Store.log("settings", "notice");
        g.UI.toast("Notice OK", "success");
      };
    el = document.getElementById("ac-save-feat");
    if (el)
      el.onclick = function () {
        var next = [];
        document.querySelectorAll("[data-feat-idx]").forEach(function (row) {
          next.push({
            name: row.querySelector('[data-f="name"]').value,
            price: Number(row.querySelector('[data-f="price"]').value) || 0,
            daily: Number(row.querySelector('[data-f="daily"]').value) || 0,
            days: Number(row.querySelector('[data-f="days"]').value) || 1,
          });
        });
        g.Store.update(function (s) {
          s.featured = next;
        });
        g.Store.log("featured", "update");
        g.UI.toast("Vedettes OK", "success");
      };
    el = document.getElementById("ac-save-wallet");
    if (el)
      el.onclick = function () {
        g.Store.update(function (s) {
          s.user.balance = Number(document.getElementById("ac-bal").value) || 0;
          s.user.income = Number(document.getElementById("ac-inc").value) || 0;
          s.user.points = Number(document.getElementById("ac-pts").value) || 0;
        });
        g.Store.log("wallet", "user update");
        g.UI.toast("Wallet OK", "success");
      };
  }

  function bindHonneur() {
    var list = document.getElementById("ht-list");
    if (list) {
      list.innerHTML = (store().honorTop || [])
        .map(function (t, i) {
          return (
            '<div class="admin-row"><span class="text-xs">' +
            t.name +
            " — " +
            cfa(t.amount) +
            '</span><button class="btn-xs danger" data-del-ht="' +
            i +
            '">×</button></div>'
          );
        })
        .join("");
    }
    var wd = document.getElementById("wd-list");
    if (wd) {
      wd.innerHTML = (store().withdrawals || [])
        .map(function (r, i) {
          return (
            '<div class="admin-row"><span class="text-xs">' +
            r.name +
            " " +
            cfa(r.amount) +
            '</span><button class="btn-xs danger" data-del-wd="' +
            i +
            '">×</button></div>'
          );
        })
        .join("");
    }
    var htAdd = document.getElementById("ht-add");
    if (htAdd) {
      htAdd.onclick = async function () {
        var data = await g.UI.formModal("Nouveau top", [
          { name: "name", label: "Téléphone", value: "080****0000" },
          { name: "amount", label: "Montant", type: "number", value: 100000 },
        ]);
        if (!data) return;
        g.Store.update(function (s) {
          s.honorTop.push({ name: data.name, amount: data.amount });
          s.honorTop.sort(function (a, b) {
            return b.amount - a.amount;
          });
        });
        g.Store.log("honor_add", data.name);
        g.Router.render(true);
      };
    }
    var wdAdd = document.getElementById("wd-add");
    if (wdAdd) {
      wdAdd.onclick = async function () {
        var data = await g.UI.formModal("Nouveau retrait", [
          { name: "name", label: "Téléphone", value: "080****0000" },
          { name: "amount", label: "Montant", type: "number", value: 25000 },
          { name: "when", label: "Quand", value: "à l'instant" },
        ]);
        if (!data) return;
        g.Store.update(function (s) {
          s.withdrawals.unshift(data);
        });
        g.Store.log("withdraw_add", data.name);
        g.Router.render(true);
      };
    }
    document.querySelectorAll("[data-del-ht]").forEach(function (b) {
      b.onclick = function () {
        var i = Number(b.getAttribute("data-del-ht"));
        g.Store.update(function (s) {
          s.honorTop.splice(i, 1);
        });
        g.Router.render(true);
      };
    });
    document.querySelectorAll("[data-del-wd]").forEach(function (b) {
      b.onclick = function () {
        var i = Number(b.getAttribute("data-del-wd"));
        g.Store.update(function (s) {
          s.withdrawals.splice(i, 1);
        });
        g.Router.render(true);
      };
    });
  }

  function bindUsers() {
    document.querySelectorAll("[data-user-note]").forEach(function (b) {
      b.onclick = function () {
        var phone = b.getAttribute("data-user-note");
        var notes = (store().settings && store().settings.userNotes) || {};
        var cur = notes[phone] || "";
        var n = window.prompt("Note interne pour " + phone, cur);
        if (n === null) return;
        g.Store.update(function (s) {
          s.settings.userNotes = s.settings.userNotes || {};
          s.settings.userNotes[phone] = String(n).slice(0, 300);
        });
        g.UI.toast("Note enregistrée", "success");
      };
    });
    document.querySelectorAll("[data-toggle-user]").forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute("data-toggle-user");
        g.Store.update(function (s) {
          s.users.forEach(function (u) {
            if (u.id === id) u.status = u.status === "actif" ? "suspendu" : "actif";
          });
        });
        g.Store.log("user_toggle", id);
        g.Router.render(true);
      };
    });
    document.querySelectorAll("[data-del-user]").forEach(function (b) {
      b.onclick = async function () {
        if (!(await g.UI.confirmModal("Suppr.", "Supprimer user ?", { danger: true }))) return;
        var id = b.getAttribute("data-del-user");
        g.Store.update(function (s) {
          s.users = s.users.filter(function (u) {
            return u.id !== id;
          });
        });
        g.Store.log("user_del", id);
        g.Router.render(true);
      };
    });
  }

  function bindSysteme() {
    var m = document.getElementById("sys-maint");
    if (m)
      m.onclick = function () {
        g.Store.update(function (s) {
          s.settings.maintenance = !s.settings.maintenance;
        });
        g.Store.log("maintenance", String(store().settings.maintenance));
        g.Router.render(true);
      };
    var sr = document.getElementById("sys-save-ref");
    if (sr)
      sr.onclick = function () {
        var v = Number(document.getElementById("sys-ref-bonus").value);
        if (isNaN(v) || v < 0) return g.UI.toast("Valeur invalide", "error");
        g.Store.update(function (s) {
          s.settings.referralBonusPercent = v;
        });
        g.Store.log("referral_bonus", String(v));
        g.UI.toast("Bonus parrainage : " + v + "%", "success");
      };
    var sp = document.getElementById("sys-save-pw");
    if (sp)
      sp.onclick = function () {
        g.Store.update(function (s) {
          s.settings.minPassword = Number(document.getElementById("sys-minpw").value) || 6;
        });
        g.UI.toast("OK", "success");
      };
    var exp = document.getElementById("sys-export");
    if (exp)
      exp.onclick = function () {
        var blob = new Blob([JSON.stringify(store(), null, 2)], { type: "application/json" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "intelng-export.json";
        a.click();
        g.Store.log("export", "json");
      };
    var imp = document.getElementById("sys-import");
    if (imp)
      imp.onchange = function (e) {
        var f = e.target.files[0];
        if (!f) return;
        var r = new FileReader();
        r.onload = function () {
          try {
            var data = JSON.parse(r.result);
            g.Store.update(function (s) {
              Object.keys(data).forEach(function (k) {
                s[k] = data[k];
              });
            });
            g.Store.log("import", "json");
            g.UI.toast("Import OK", "success");
            g.Router.render(true);
          } catch (err) {
            g.UI.toast("JSON invalide", "error");
          }
        };
        r.readAsText(f);
      };
    var rs = document.getElementById("sys-reset");
    if (rs)
      rs.onclick = async function () {
        if (!(await g.UI.confirmModal("Reset", "Effacer toutes les données ?", { danger: true, okText: "Continuer" })))
          return;
        if (!(await g.UI.confirmModal("Confirmation finale", "Cette action est irréversible. Confirmer le reset ?", { danger: true, okText: "Reset définitif" })))
          return;
        g.Store.reset();
        g.UI.toast("Reset OK", "success");
        g.Router.render(true);
      };
  }

  g.Admin = {
    page: pageAdmin,
    bind: bind,
    state: adminState,
  };
})(window);
