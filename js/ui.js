/**
 * UI : toasts (file), modales, skeletons, theme, icônes, format
 */
(function (g) {
  /** Pays zone XAF (FCFA) — préfixes téléphoniques */
  var XAF_COUNTRIES = [
    { code: "CM", dial: "+237", name: "Cameroun" },
    { code: "CF", dial: "+236", name: "Centrafrique" },
    { code: "TD", dial: "+235", name: "Tchad" },
    { code: "CG", dial: "+242", name: "Congo" },
    { code: "GQ", dial: "+240", name: "Guinée équatoriale" },
    { code: "GA", dial: "+241", name: "Gabon" },
  ];

  function xafCountryOptions(selectedDial) {
    return XAF_COUNTRIES.map(function (c) {
      var sel = selectedDial && (selectedDial === c.dial || selectedDial === c.code) ? " selected" : "";
      return (
        '<option value="' +
        c.code +
        '" data-dial="' +
        c.dial +
        '"' +
        sel +
        ">" +
        c.name +
        " (" +
        c.dial +
        ")</option>"
      );
    }).join("");
  }

  function formatLocalPhone(raw, dial) {
    var d = String(raw || "").replace(/\D/g, "");
    var dialDigits = String(dial || "").replace(/\D/g, "");
    if (dialDigits && d.indexOf(dialDigits) === 0) d = d.slice(dialDigits.length);
    if (d.charAt(0) === "0") d = d.slice(1);
    return d;
  }

  function fullPhone(local, dial) {
    var loc = formatLocalPhone(local, dial);
    return (dial || "") + loc;
  }

  "use strict";

  var ICONS = {
    "chevron-left": "M15 18l-6-6 6-6",
    "chevron-right": "M9 6l6 6-6 6",
    phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
    ticket: "M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z",
    lock: "M7 11V8a5 5 0 0 1 10 0v3M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z",
    eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z",
    "eye-off": "M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A9.5 9.5 0 0 1 12 5c6.5 0 10 7 10 7a13 13 0 0 1-3.2 3.8M6.6 6.6A13 13 0 0 0 2 12s3.5 7 10 7a9.4 9.4 0 0 0 4.4-1.1",
    check: "M5 13l4 4L19 7",
    home: "M3 11l9-7 9 7M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10",
    product: "M3 7l9-4 9 4-9 4-9-4zm0 5l9 4 9-4M3 17l9 4 9-4",
    honor: "M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4zM5 5H4a1 1 0 0 0-1 1v1a3 3 0 0 0 3 3M19 5h1a1 1 0 0 1 1 1v1a3 3 0 0 1-3 3",
    wallet: "M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1H5a2 2 0 0 1 0-4M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3M17 13h4v3a1 1 0 0 1-1 1h-3a2 2 0 0 1 0-4z",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20a8 8 0 0 1 16 0",
    chart: "M12 3a9 9 0 1 0 9 9h-9V3z",
    list: "M4 5h16v14H4zM8 9h8M8 13h8M8 17h5",
    box: "M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8",
    upload: "M12 17V5M7 10l5-5 5 5M4 19h16",
    download: "M12 5v12M7 12l5 5 5-5M4 21h16",
    card: "M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7zM2 10h20",
    gift: "M20 12v9H4v-9M2 8h20v4H2zM12 21V8M12 8a4 4 0 1 1 4-4 4 4 0 0 1-4 4 4 4 0 1 1-4-4 4 4 0 0 1 4 4z",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 21a2 2 0 0 1-3.4 0",
    shield: "M12 3l8 3v6c0 5-3.5 8.4-8 9-4.5-.6-8-4-8-9V6l8-3z",
    headset: "M4 14v-2a8 8 0 0 1 16 0v2M4 14a2 2 0 0 0 2 2h1v-4H6a2 2 0 0 0-2 2zm16 0a2 2 0 0 0-2-2h-1v4h1a2 2 0 0 0 2-2zm-2 3v1a3 3 0 0 1-3 3h-2",
    globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z",
    logout: "M15 17l5-5-5-5M20 12H9M12 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
    users: "M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
    share: "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 3.9M15.4 6.6L8.6 10.5",
  };

  var iconCache = Object.create(null);
  function icon(name, cls) {
    cls = cls || "icon";
    var k = name + "|" + cls;
    if (iconCache[k]) return iconCache[k];
    iconCache[k] =
      '<svg class="' + cls + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (ICONS[name] || "") + '"/></svg>';
    return iconCache[k];
  }

  function isVideoUrl(src) {
    if (!src) return false;
    if (String(src).indexOf("data:video") === 0) return true;
    return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(String(src));
  }

  /** HTML media optimisé 3G — lazy, WebP optionnel, placeholder */
  function mediaHtml(src, opts) {
    opts = opts || {};
    var alt = opts.alt || "";
    var cls = opts.className || "media-wrap is-loading";
    var rawSrc = src || "img/machines/thumbs/cpu1.jpg";
    /* Normalise chemins machines vers thumbs si possible */
    if (/^img\/machines\/[^/]+\.(jpe?g|png|webp)$/i.test(rawSrc) && rawSrc.indexOf("/thumbs/") < 0) {
      var thumbTry = rawSrc.replace("img/machines/", "img/machines/thumbs/");
      rawSrc = thumbTry;
    }
    var resolved = g.CDN && g.CDN.assetUrl ? g.CDN.assetUrl(rawSrc) : rawSrc;
    var srcSafe = String(resolved).replace(/"/g, "&quot;");
    if (isVideoUrl(rawSrc)) {
      return (
        '<div class="' + cls + '" data-media="video">' +
        '<video src="' + srcSafe + '" muted playsinline loop preload="metadata" ' +
        (opts.autoplay !== false ? "autoplay " : "") +
        '></video></div>'
      );
    }
    var isBanner = cls.indexOf("product-media") < 0 && (opts.eager || cls.indexOf("banner") >= 0);
    var w = opts.width || (isBanner ? 800 : 200);
    var h = opts.height || (isBanner ? 320 : 140);
    var load = opts.eager ? "eager" : "lazy";
    var prio = opts.eager ? "high" : "low";
    var altSafe = String(alt).replace(/"/g, "");
    var sizes = opts.sizes || (isBanner ? "(max-width: 480px) 100vw, 800px" : "(max-width: 480px) 45vw, 200px");
    var webp = null;
    if (g.CDN && g.CDN.config && g.CDN.config.AUTO_WEBP && g.CDN.webpUrl && g.CDN.supportsWebp && g.CDN.supportsWebp()) {
      webp = g.CDN.webpUrl(rawSrc);
    }
    var imgTag =
      '<img src="' + srcSafe + '" alt="' + altSafe +
      '" width="' + w + '" height="' + h +
      '" sizes="' + sizes +
      '" loading="' + load + '" decoding="async" fetchpriority="' + prio +
      '" data-fallback="img/machines/thumbs/cpu1.jpg" />';
    var inner = webp
      ? '<picture><source srcset="' + String(webp).replace(/"/g, "&quot;") +
        '" type="image/webp" />' + imgTag + "</picture>"
      : imgTag;
    return '<div class="' + cls + '" data-media="img">' + inner + "</div>";
  }

  function bindMediaLoading(root) {
    root = root || document;
    var wraps = root.querySelectorAll(".media-wrap.is-loading");
    wraps.forEach(function (wrap) {
      var el = wrap.querySelector("img, video");
      if (!el) {
        wrap.classList.remove("is-loading");
        wrap.classList.add("is-ready");
        return;
      }
      var retries = 0;
      function done() {
        wrap.classList.remove("is-loading", "is-error");
        wrap.classList.add("is-ready");
      }
      function fail() {
        if (el.tagName === "IMG" && retries < 1) {
          retries++;
          var fb = el.getAttribute("data-fallback") || "img/machines/thumbs/cpu1.jpg";
          var resolved = g.CDN && g.CDN.assetUrl ? g.CDN.assetUrl(fb) : fb;
          /* retire le source webp pour forcer jpg */
          var pic = wrap.querySelector("picture");
          if (pic) {
            var sources = pic.querySelectorAll("source");
            sources.forEach(function (s) { s.remove(); });
          }
          el.src = resolved;
          return;
        }
        wrap.classList.remove("is-loading");
        wrap.classList.add("is-ready", "is-error");
        if (el.tagName === "IMG") {
          el.alt = el.alt || "Image indisponible";
          el.style.opacity = "0.35";
        }
      }
      if (el.tagName === "VIDEO") {
        el.addEventListener("loadeddata", done, { once: true });
        el.addEventListener("error", fail, { once: true });
        if (el.readyState >= 2) done();
      } else {
        if (el.complete && el.naturalWidth) done();
        else {
          el.addEventListener("load", done, { once: true });
          el.addEventListener("error", fail);
        }
      }
    });
  }


  function cfa(n) {
    return Number(n).toLocaleString("fr-FR") + " FCFA";
  }

  function delay(ms) {
    return new Promise(function (r) {
      setTimeout(r, ms);
    });
  }

  function nextFrame() {
    return new Promise(function (r) {
      requestAnimationFrame(r);
    });
  }

  function announce(msg) {
    var el = document.getElementById("aria-live");
    if (el) el.textContent = msg;
  }

  /* --- Toast queue (max 3) --- */
  var toastQueue = [];
  var toastActive = 0;
  var MAX_TOASTS = 3;

  function toast(message, type) {
    toastQueue.push({ message: message, type: type || "info" });
    drainToasts();
  }

  function drainToasts() {
    var root = document.getElementById("toast-root");
    if (!root) return;
    while (toastActive < MAX_TOASTS && toastQueue.length) {
      (function (item) {
        toastActive++;
        var el = document.createElement("div");
        el.className = "toast toast-" + item.type;
        el.setAttribute("role", "status");
        el.innerHTML =
          '<span class="toast-msg"></span><button type="button" class="toast-close" aria-label="Fermer">×</button>';
        el.querySelector(".toast-msg").textContent = item.message;
        root.appendChild(el);
        announce(item.message);
        var closed = false;
        var timer = setTimeout(close, 3500);
        function close() {
          if (closed) return;
          closed = true;
          clearTimeout(timer);
          el.classList.add("is-out");
          setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
            toastActive--;
            drainToasts();
          }, 200);
        }
        el.querySelector(".toast-close").onclick = close;
        el.onmouseenter = function () {
          clearTimeout(timer);
        };
        el.onmouseleave = function () {
          timer = setTimeout(close, 1500);
        };
      })(toastQueue.shift());
    }
  }

  /* --- Modal confirm + form --- */
  function confirmModal(title, body, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var root = document.getElementById("modal-root");
      if (!root) {
        resolve(window.confirm(title));
        return;
      }
      root.classList.remove("is-hidden");
      root.innerHTML =
        '<div class="modal-box" role="document">' +
        '<h2 class="modal-title" id="modal-title"></h2>' +
        '<p class="modal-body"></p>' +
        '<div class="modal-actions">' +
        '<button type="button" class="btn-outline" data-act="cancel"></button>' +
        '<button type="button" class="' +
        (opts.danger ? "btn-danger" : "btn-primary") +
        '" data-act="ok"></button></div></div>';
      root.querySelector(".modal-title").textContent = title;
      root.querySelector(".modal-body").textContent = body;
      root.querySelector('[data-act="cancel"]').textContent = opts.cancelText || "Annuler";
      root.querySelector('[data-act="ok"]').textContent = opts.okText || "Confirmer";
      var prev = document.activeElement;
      root.querySelector('[data-act="ok"]').focus();
      function done(v) {
        root.classList.add("is-hidden");
        root.innerHTML = "";
        if (prev && prev.focus) prev.focus();
        resolve(v);
      }
      root.onclick = function (e) {
        if (e.target === root) done(false);
      };
      root.querySelector('[data-act="cancel"]').onclick = function () {
        done(false);
      };
      root.querySelector('[data-act="ok"]').onclick = function () {
        done(true);
      };
    });
  }

  /**
   * Modal formulaire
   * fields: [{ name, label, type, value }]
   * @returns {Promise<object|null>}
   */
  function formModal(title, fields, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var root = document.getElementById("modal-root");
      root.classList.remove("is-hidden");
      var html =
        '<div class="modal-box"><h2 class="modal-title" id="modal-title"></h2><form id="modal-form" class="form-stack">';
      var i, f;
      for (i = 0; i < fields.length; i++) {
        f = fields[i];
        html +=
          '<div><label class="field-label" for="mf-' +
          f.name +
          '">' +
          f.label +
          "</label>" +
          '<div class="field-box"><input id="mf-' +
          f.name +
          '" name="' +
          f.name +
          '" type="' +
          (f.type || "text") +
          '" value="' +
          String(f.value != null ? f.value : "").replace(/"/g, "&quot;") +
          '" style="width:100%" /></div></div>';
      }
      html +=
        '<div class="modal-actions" style="margin-top:1rem">' +
        '<button type="button" class="btn-outline" data-act="cancel">Annuler</button>' +
        '<button type="submit" class="btn-primary">' +
        (opts.okText || "Enregistrer") +
        "</button></div></form></div>";
      root.innerHTML = html;
      root.querySelector(".modal-title").textContent = title;
      var prev = document.activeElement;
      function done(v) {
        root.classList.add("is-hidden");
        root.innerHTML = "";
        if (prev && prev.focus) prev.focus();
        resolve(v);
      }
      root.onclick = function (e) {
        if (e.target === root) done(null);
      };
      root.querySelector('[data-act="cancel"]').onclick = function () {
        done(null);
      };
      root.querySelector("#modal-form").onsubmit = function (e) {
        e.preventDefault();
        var data = {};
        for (i = 0; i < fields.length; i++) {
          f = fields[i];
          var el = document.getElementById("mf-" + f.name);
          data[f.name] = f.type === "number" ? Number(el.value) : el.value;
        }
        done(data);
      };
    });
  }

  function skeleton(type) {
    if (type === "cards") {
      return (
        '<div class="space-y">' +
        [1, 2, 3]
          .map(function () {
            return '<div class="card card-pad"><div class="skeleton" style="height:14px;width:60%;margin-bottom:8px"></div><div class="skeleton" style="height:12px;width:40%"></div></div>';
          })
          .join("") +
        "</div>"
      );
    }
    if (type === "wallet") {
      return '<div class="card card-pad"><div class="skeleton" style="height:18px;width:40%;margin-bottom:12px"></div><div class="skeleton" style="height:28px;width:55%"></div></div>';
    }
    return '<div class="skeleton" style="height:120px;width:100%;border-radius:1rem"></div>';
  }

  function applyTheme(theme) {
    theme = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#1E4E5A" : "#0a1520");
  }

  function setBtnLoading(btn, on) {
    if (!btn) return;
    btn.classList.toggle("btn-loading", !!on);
    btn.disabled = !!on;
  }

  g.UI = {
    XAF_COUNTRIES: XAF_COUNTRIES,
    xafCountryOptions: xafCountryOptions,
    formatLocalPhone: formatLocalPhone,
    fullPhone: fullPhone,
    icon: icon,
    mediaHtml: mediaHtml,
    bindMediaLoading: bindMediaLoading,
    isVideoUrl: isVideoUrl,
    cfa: cfa,
    delay: delay,
    nextFrame: nextFrame,
    toast: toast,
    confirmModal: confirmModal,
    formModal: formModal,
    skeleton: skeleton,
    applyTheme: applyTheme,
    setBtnLoading: setBtnLoading,
    announce: announce,
  };
})(window);
