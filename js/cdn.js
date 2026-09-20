/**
 * CDN + WebP automatique + version de cache
 *
 * Production :
 *   g.CDN.setCdnBase("https://cdn.example.com/intel-ng");
 * Cache CDN recommandé (voir public/_headers ou docs) :
 *   Cache-Control: public, max-age=31536000, immutable  pour /img/*
 */
(function (g) {
  "use strict";

  var CONFIG = {
    CDN_BASE: "",
    USE_CDN: true,
    ASSET_VERSION: "37",
    /** Preferer WebP si le navigateur le supporte */
    AUTO_WEBP: true,
  };

  var supportsWebp = null;

  function checkWebp() {
    if (supportsWebp !== null) return supportsWebp;
    try {
      var c = document.createElement("canvas");
      supportsWebp = c.toDataURL("image/webp").indexOf("data:image/webp") === 0;
    } catch (e) {
      supportsWebp = false;
    }
    return supportsWebp;
  }

  function assetUrl(path) {
    if (!path) return path;
    var p = String(path).trim();
    if (/^(data:|https?:|blob:)/i.test(p)) return p;
    p = p.replace(/^\.\//, "").replace(/^\//, "");
    var base = CONFIG.USE_CDN && CONFIG.CDN_BASE ? CONFIG.CDN_BASE.replace(/\/$/, "") : "";
    var url = base ? base + "/" + p : p;
    /* chemins relatifs stables depuis la racine du site */
    if (!base && url.indexOf("data:") !== 0 && url.charAt(0) !== "/" && url.indexOf("http") !== 0) {
      /* garder relatif simple — OK si index à la racine */
    }
    if (CONFIG.ASSET_VERSION && url.indexOf("data:") !== 0) {
      url += (url.indexOf("?") >= 0 ? "&" : "?") + "v=" + CONFIG.ASSET_VERSION;
    }
    return url;
  }

  /** Même chemin en .webp (si jpg/png) */
  function webpUrl(path) {
    if (!path || /^(data:|blob:)/i.test(path)) return null;
    var clean = String(path).split("?")[0];
    if (!/\.(jpe?g|png)$/i.test(clean)) return null;
    return assetUrl(clean.replace(/\.(jpe?g|png)$/i, ".webp"));
  }

  function setCdnBase(url) {
    CONFIG.CDN_BASE = String(url || "").replace(/\/$/, "");
  }

  function enableCdn(on) {
    CONFIG.USE_CDN = !!on;
  }

  g.CDN = {
    config: CONFIG,
    assetUrl: assetUrl,
    webpUrl: webpUrl,
    supportsWebp: checkWebp,
    setCdnBase: setCdnBase,
    enableCdn: enableCdn,
  };
})(window);
