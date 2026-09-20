/**
 * Validation unifiée
 */
(function (g) {
  "use strict";

  function phone(value) {
    if (!value || !String(value).trim()) return "phone_required";
    if (String(value).replace(/\D/g, "").length < 7) return "phone_invalid";
    return null;
  }

  function password(value, min) {
    min = min || 6;
    if (!value) return "password_required";
    if (value.length < min) return "password_short";
    return null;
  }

  function required(value, key) {
    if (value === undefined || value === null || String(value).trim() === "") return key || "required";
    return null;
  }

  function numberMin(value, min, key) {
    var n = Number(value);
    if (isNaN(n) || n < min) return key || "number_invalid";
    return null;
  }

    /**
   * Validation montant FCFA
   * @returns {string|null} code erreur ou null si OK
   */
  function amountMin(value, min) {
    return amount(value, { min: min }).code;
  }

  /**
   * @param {*} value
   * @param {{min?:number,max?:number,step?:number}} opts
   * @returns {{ok:boolean,code:string|null,message:string|null,value:number}}
   */
  function amount(value, opts) {
    opts = opts || {};
    var min = opts.min != null ? Number(opts.min) : 0;
    var max = opts.max != null ? Number(opts.max) : 500000;
    var step = opts.step != null ? Number(opts.step) : 0;
    var raw = value;
    if (typeof raw === "string") raw = raw.replace(/\s/g, "").replace(/,/g, "");
    if (raw === "" || raw == null) {
      return { ok: false, code: "amount_required", message: "Montant requis.", value: 0 };
    }
    var n = Number(raw);
    if (!isFinite(n) || isNaN(n)) {
      return { ok: false, code: "number_invalid", message: "Montant invalide (chiffres uniquement).", value: 0 };
    }
    if (n <= 0) {
      return { ok: false, code: "amount_required", message: "Le montant doit être supérieur à 0.", value: n };
    }
    if (n !== Math.floor(n)) {
      return { ok: false, code: "amount_integer", message: "Le montant doit être un nombre entier (FCFA).", value: n };
    }
    if (n < min) {
      return {
        ok: false,
        code: "amount_min",
        message: "Minimum " + min.toLocaleString("fr-FR") + " FCFA.",
        value: n,
      };
    }
    if (n > max) {
      return {
        ok: false,
        code: "amount_max",
        message: "Maximum " + max.toLocaleString("fr-FR") + " FCFA.",
        value: n,
      };
    }
    if (step > 0 && n % step !== 0) {
      return {
        ok: false,
        code: "amount_step",
        message: "Le montant doit être un multiple de " + step.toLocaleString("fr-FR") + " FCFA.",
        value: n,
      };
    }
    return { ok: true, code: null, message: null, value: n };
  }

  /** Bind live validation on an amount input */
  function bindAmountInput(inputOrId, getOpts) {
    var el = typeof inputOrId === "string" ? document.getElementById(inputOrId) : inputOrId;
    if (!el) return;
    function run() {
      var opts = typeof getOpts === "function" ? getOpts() : getOpts || {};
      var res = amount(el.value, opts);
      setFieldError(el, res.ok ? null : res.message);
      return res;
    }
    el.addEventListener("input", run);
    el.addEventListener("blur", run);
    return run;
  }

  function email(value) {
    if (!value || !String(value).trim()) return "email_required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())) return "email_invalid";
    return null;
  }

  var MESSAGES = {
    fr: {
      phone_required: "Veuillez entrer votre numéro de téléphone.",
      phone_invalid: "Veuillez entrer un numéro de téléphone valide.",
      password_required: "Mot de passe requis.",
      password_short: "Mot de passe trop court.",
      password_mismatch: "Les mots de passe ne correspondent pas.",
      code_required: "Code d'invitation requis.",
      required: "Champ requis.",
      number_invalid: "Valeur numérique invalide.",
      amount_required: "Montant requis.",
      amount_min: "Montant inférieur au minimum autorisé.",
      amount_max: "Montant supérieur au maximum autorisé.",
      amount_integer: "Le montant doit être un nombre entier (FCFA).",
      amount_step: "Montant non multiple de l'incrément autorisé.",
      email_required: "E-mail requis.",
      email_invalid: "E-mail invalide.",
      name_required: "Nom requis.",
      locked: "Trop de tentatives. Réessayez plus tard.",
      maintenance: "Service indisponible (maintenance).",
    },
    en: {
      phone_required: "Please enter your phone number.",
      phone_invalid: "Please enter a valid phone number.",
      password_required: "Password required.",
      password_short: "Password too short.",
      password_mismatch: "Passwords do not match.",
      code_required: "Invitation code required.",
      required: "Required field.",
      number_invalid: "Invalid number.",
      locked: "Too many attempts. Try again later.",
      maintenance: "Service unavailable (maintenance).",
    },
  };

  function msg(code) {
    var lang = (g.I18n && g.I18n.lang()) || "fr";
    var pack = MESSAGES[lang] || MESSAGES.fr;
    if (code === "password_short") {
      var min = (g.Store.get().settings.minPassword) || 6;
      return (lang === "en" ? "Password must be at least " : "Mot de passe trop court (min. ") + min + (lang === "en" ? " characters." : ").");
    }
    return pack[code] || code;
  }

  function showFormError(elOrId, message) {
    var el = typeof elOrId === "string" ? document.getElementById(elOrId) : elOrId;
    if (el) {
      el.textContent = message || "";
      el.classList.toggle("is-hidden", !message);
      el.setAttribute("role", "alert");
    }
    if (message && g.UI && g.UI.toast) g.UI.toast(message, "error");
  }

  /** Marque un champ invalide (bordure rouge + message) */
  function setFieldError(inputOrId, message) {
    var el = typeof inputOrId === "string" ? document.getElementById(inputOrId) : inputOrId;
    if (!el) return;
    el.classList.toggle("is-invalid", !!message);
    el.setAttribute("aria-invalid", message ? "true" : "false");
    var box = el.closest(".field-box") || el.parentElement;
    if (box) box.classList.toggle("is-invalid", !!message);
    var id = el.id ? el.id + "-err" : null;
    var msgEl = id ? document.getElementById(id) : null;
    if (!msgEl && box) {
      msgEl = box.parentElement && box.parentElement.querySelector(".field-error");
    }
    if (msgEl) {
      msgEl.textContent = message || "";
      msgEl.classList.toggle("is-hidden", !message);
    }
  }

  function clearFormErrors(root) {
    var scope = root || document;
    scope.querySelectorAll(".is-invalid").forEach(function (el) {
      el.classList.remove("is-invalid");
      el.removeAttribute("aria-invalid");
    });
    scope.querySelectorAll(".field-error").forEach(function (el) {
      el.textContent = "";
      el.classList.add("is-hidden");
    });
  }

  g.Validate = {
    setFieldError: setFieldError,
    clearFormErrors: clearFormErrors,
    phone: phone,
    password: password,
    required: required,
    numberMin: numberMin,
    amountMin: amountMin,
    amount: amount,
    bindAmountInput: bindAmountInput,
    email: email,
    msg: msg,
    match: function (a, b) {
      return a === b ? null : "password_mismatch";
    },
    showFormError: showFormError,
  };
})(window);
