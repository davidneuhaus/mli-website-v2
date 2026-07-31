/**
 * MLI Cookie Consent — local CMP (no Usercentrics).
 * Categories: essential (always), functional, marketing (LinkedIn Insight).
 */
(function () {
  "use strict";

  var STORAGE_KEY = "mli-consent-v1";
  var MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
  var LINKEDIN_PID = "7055746";
  var loaded = { marketing: false, functional: false };

  var I18N = {
    de: {
      brand: "MLI Leadership Institut",
      bannerTitle: "Ihre Privatsphäre",
      bannerText:
        "Wir verwenden essenzielle Cookies und – nur mit Ihrer Einwilligung – optionale Technologien für Funktionen und Marketing. Details in unserer ",
      privacy: "Datenschutzerklärung",
      privacyHref: "/datenschutzerklaerung/",
      acceptAll: "Alles akzeptieren",
      reject: "Ablehnen",
      settings: "Einstellungen",
      settingsTitle: "Cookie-Einstellungen",
      settingsText:
        "Wählen Sie, welche Kategorien Sie zulassen. Essenzielle Technologien sind für den Betrieb der Website erforderlich.",
      save: "Einstellungen speichern",
      essential: "Essenziell",
      essentialDesc:
        "Erforderlich für grundlegende Funktionen der Website (z. B. Sicherheit, Einwilligungsspeicher).",
      functional: "Funktionell",
      functionalDesc:
        "Hilft uns, die Nutzung zu verstehen und die Website zu verbessern. Derzeit keine zusätzlichen Dienste aktiv.",
      marketing: "Marketing",
      marketingDesc:
        "Ermöglicht messbare Reichweite und relevante Kommunikation (z. B. LinkedIn Insight Tag).",
      reopen: "Cookie-Einstellungen öffnen",
    },
    en: {
      brand: "MLI Leadership Institute",
      bannerTitle: "Your privacy",
      bannerText:
        "We use essential cookies and — only with your consent — optional technologies for functionality and marketing. See our ",
      privacy: "Privacy Policy",
      privacyHref: "/datenschutzerklaerung/",
      acceptAll: "Accept all",
      reject: "Reject",
      settings: "Settings",
      settingsTitle: "Cookie settings",
      settingsText:
        "Choose which categories you allow. Essential technologies are required for the website to work.",
      save: "Save settings",
      essential: "Essential",
      essentialDesc:
        "Required for basic website functions (e.g. security, storing your consent).",
      functional: "Functional",
      functionalDesc:
        "Helps us understand usage and improve the site. No additional services active at the moment.",
      marketing: "Marketing",
      marketingDesc:
        "Enables measurable reach and relevant communication (e.g. LinkedIn Insight Tag).",
      reopen: "Open cookie settings",
    },
  };

  function lang() {
    var l = (document.documentElement.getAttribute("lang") || "de").toLowerCase();
    return l.indexOf("en") === 0 ? "en" : "de";
  }

  function t() {
    return I18N[lang()];
  }

  function defaultConsent(partial) {
    return {
      essential: true,
      functional: !!(partial && partial.functional),
      marketing: !!(partial && partial.marketing),
      ts: Date.now(),
      v: 1,
    };
  }

  function readConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || typeof data !== "object") return null;
      if (!data.ts || Date.now() - data.ts > MAX_AGE_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return defaultConsent(data);
    } catch (e) {
      return null;
    }
  }

  function writeConsent(consent) {
    var next = defaultConsent(consent);
    next.ts = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    try {
      document.cookie =
        "mli_consent=" +
        encodeURIComponent(next.marketing ? "m1" : "m0") +
        (next.functional ? "f1" : "f0") +
        "; path=/; max-age=" +
        Math.floor(MAX_AGE_MS / 1000) +
        "; SameSite=Lax";
    } catch (e) {
      /* ignore */
    }
    return next;
  }

  function loadLinkedIn() {
    if (loaded.marketing) return;
    loaded.marketing = true;
    window._linkedin_partner_id = LINKEDIN_PID;
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
    if (window._linkedin_data_partner_ids.indexOf(LINKEDIN_PID) === -1) {
      window._linkedin_data_partner_ids.push(LINKEDIN_PID);
    }
    if (!window.lintrk) {
      window.lintrk = function () {
        window.lintrk.q.push(arguments);
      };
      window.lintrk.q = [];
    }
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
    document.head.appendChild(s);
  }

  function applyConsent(consent) {
    window.mliConsent = {
      essential: true,
      functional: !!consent.functional,
      marketing: !!consent.marketing,
    };
    document.documentElement.dataset.mliConsentMarketing = consent.marketing
      ? "1"
      : "0";
    document.documentElement.dataset.mliConsentFunctional = consent.functional
      ? "1"
      : "0";

    if (consent.marketing) loadLinkedIn();

    // Activate any deferred scripts marked with data-mli-consent
    var nodes = document.querySelectorAll(
      'script[type="text/plain"][data-mli-consent]'
    );
    nodes.forEach(function (node) {
      var cat = node.getAttribute("data-mli-consent");
      if (cat === "marketing" && !consent.marketing) return;
      if (cat === "functional" && !consent.functional) return;
      if (cat === "essential" || !cat) {
        /* always */
      } else if (cat !== "marketing" && cat !== "functional") {
        return;
      }
      var s = document.createElement("script");
      Array.prototype.forEach.call(node.attributes, function (attr) {
        if (attr.name === "type" || attr.name === "data-mli-consent") return;
        s.setAttribute(attr.name, attr.value);
      });
      if (node.src) s.src = node.src;
      else s.textContent = node.textContent;
      node.parentNode.insertBefore(s, node);
      node.parentNode.removeChild(node);
    });

    try {
      window.dispatchEvent(
        new CustomEvent("mli:consent", { detail: window.mliConsent })
      );
    } catch (e) {
      /* ignore */
    }
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function buildUI() {
    if (document.getElementById("mli-consent-root")) return;
    var copy = t();

    var fab = el("button", "mli-consent-fab");
    fab.type = "button";
    fab.id = "mli-consent-fab";
    fab.setAttribute("aria-label", copy.reopen);
    fab.title = copy.reopen;
    fab.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a3 3 0 0 1 3 3v1.07A7.002 7.002 0 0 1 19 13a7 7 0 1 1-10.07-6.23V5a3 3 0 0 1 3-3zm-1 8.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm4.5 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM10 15.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>';
    document.body.appendChild(fab);

    var root = el("div", "mli-consent-root");
    root.id = "mli-consent-root";
    root.setAttribute("hidden", "");
    root.innerHTML =
      '<div class="mli-consent-backdrop" data-mli-consent-close></div>' +
      '<div class="mli-consent-banner" role="dialog" aria-modal="false" aria-labelledby="mli-consent-banner-title">' +
      '<p class="mli-consent-brand"></p>' +
      '<h2 id="mli-consent-banner-title"></h2>' +
      "<p></p>" +
      '<div class="mli-consent-actions">' +
      '<button type="button" class="mli-consent-btn mli-consent-btn--ghost" data-mli-consent-reject></button>' +
      '<button type="button" class="mli-consent-btn mli-consent-btn--secondary" data-mli-consent-settings></button>' +
      '<button type="button" class="mli-consent-btn mli-consent-btn--primary" data-mli-consent-accept></button>' +
      "</div></div>" +
      '<div class="mli-consent-panel" role="dialog" aria-modal="true" aria-labelledby="mli-consent-panel-title">' +
      '<div class="mli-consent-panel-head">' +
      "<div><p class=\"mli-consent-brand\"></p><h2 id=\"mli-consent-panel-title\"></h2></div>" +
      '<button type="button" class="mli-consent-close" data-mli-consent-close aria-label="Close">×</button>' +
      "</div>" +
      "<p class=\"mli-consent-panel-intro\"></p>" +
      '<div class="mli-consent-cats">' +
      catHtml("essential", true) +
      catHtml("functional", false) +
      catHtml("marketing", false) +
      "</div>" +
      '<div class="mli-consent-actions">' +
      '<button type="button" class="mli-consent-btn mli-consent-btn--ghost" data-mli-consent-reject></button>' +
      '<button type="button" class="mli-consent-btn mli-consent-btn--secondary" data-mli-consent-save></button>' +
      '<button type="button" class="mli-consent-btn mli-consent-btn--primary" data-mli-consent-accept></button>' +
      "</div></div>";

    document.body.appendChild(root);
    localize();
    bind(root, fab);
  }

  function catHtml(id, locked) {
    return (
      '<div class="mli-consent-cat" data-cat="' +
      id +
      '">' +
      '<div class="mli-consent-cat-row">' +
      "<div><h3></h3></div>" +
      '<label class="mli-consent-switch">' +
      '<input type="checkbox" data-mli-cat="' +
      id +
      '"' +
      (locked ? " checked disabled" : "") +
      " />" +
      "<span></span></label></div><p></p></div>"
    );
  }

  function localize() {
    var copy = t();
    var root = document.getElementById("mli-consent-root");
    if (!root) return;
    root.querySelectorAll(".mli-consent-brand").forEach(function (n) {
      n.textContent = copy.brand;
    });
    var banner = root.querySelector(".mli-consent-banner");
    banner.querySelector("h2").textContent = copy.bannerTitle;
    var bp = banner.querySelector("p:not(.mli-consent-brand)");
    bp.innerHTML = "";
    bp.appendChild(document.createTextNode(copy.bannerText));
    var a = document.createElement("a");
    a.href = copy.privacyHref;
    a.textContent = copy.privacy;
    bp.appendChild(a);
    bp.appendChild(document.createTextNode("."));

    root.querySelectorAll("[data-mli-consent-accept]").forEach(function (b) {
      b.textContent = copy.acceptAll;
    });
    root.querySelectorAll("[data-mli-consent-reject]").forEach(function (b) {
      b.textContent = copy.reject;
    });
    root.querySelector("[data-mli-consent-settings]").textContent = copy.settings;
    root.querySelector("[data-mli-consent-save]").textContent = copy.save;
    root.querySelector("#mli-consent-panel-title").textContent = copy.settingsTitle;
    root.querySelector(".mli-consent-panel-intro").textContent = copy.settingsText;

    setCatCopy("essential", copy.essential, copy.essentialDesc);
    setCatCopy("functional", copy.functional, copy.functionalDesc);
    setCatCopy("marketing", copy.marketing, copy.marketingDesc);

    var fab = document.getElementById("mli-consent-fab");
    if (fab) {
      fab.setAttribute("aria-label", copy.reopen);
      fab.title = copy.reopen;
    }
  }

  function setCatCopy(id, title, desc) {
    var cat = document.querySelector('.mli-consent-cat[data-cat="' + id + '"]');
    if (!cat) return;
    cat.querySelector("h3").textContent = title;
    cat.querySelector("p").textContent = desc;
  }

  function showBanner() {
    var root = document.getElementById("mli-consent-root");
    root.removeAttribute("hidden");
    root.classList.add("is-banner");
    root.classList.remove("is-panel", "is-open");
  }

  function showPanel() {
    var root = document.getElementById("mli-consent-root");
    var c = readConsent() || defaultConsent();
    var f = root.querySelector('[data-mli-cat="functional"]');
    var m = root.querySelector('[data-mli-cat="marketing"]');
    if (f) f.checked = !!c.functional;
    if (m) m.checked = !!c.marketing;
    root.removeAttribute("hidden");
    root.classList.add("is-panel", "is-open");
    root.classList.remove("is-banner");
  }

  function hideUI() {
    var root = document.getElementById("mli-consent-root");
    if (!root) return;
    root.classList.remove("is-banner", "is-panel", "is-open");
    root.setAttribute("hidden", "");
  }

  function commit(partial) {
    var consent = writeConsent(partial);
    applyConsent(consent);
    hideUI();
  }

  function bind(root, fab) {
    root.addEventListener("click", function (ev) {
      var target = ev.target;
      if (!target || !target.closest) return;
      if (target.closest("[data-mli-consent-accept]")) {
        commit({ functional: true, marketing: true });
        return;
      }
      if (target.closest("[data-mli-consent-reject]")) {
        commit({ functional: false, marketing: false });
        return;
      }
      if (target.closest("[data-mli-consent-settings]")) {
        showPanel();
        return;
      }
      if (target.closest("[data-mli-consent-save]")) {
        commit({
          functional: !!root.querySelector('[data-mli-cat="functional"]').checked,
          marketing: !!root.querySelector('[data-mli-cat="marketing"]').checked,
        });
        return;
      }
      if (target.closest("[data-mli-consent-close]")) {
        if (readConsent()) hideUI();
        else showBanner();
      }
    });

    fab.addEventListener("click", function () {
      showPanel();
    });

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && root.classList.contains("is-panel")) {
        if (readConsent()) hideUI();
        else showBanner();
      }
    });
  }

  function openSettings() {
    buildUI();
    localize();
    showPanel();
    return Promise.resolve();
  }

  function stripLegacyLinkedIn() {
    // Neutralize any leftover LinkedIn blocks that still execute on parse —
    // migration script should remove them; this is a safety net for noscript pixels.
    document
      .querySelectorAll('img[src*="ads.linkedin.com"], img[src*="licdn.com"]')
      .forEach(function (img) {
        img.remove();
      });
  }

  function init() {
    stripLegacyLinkedIn();
    buildUI();
    window.mliOpenPrivacySettings = openSettings;
    window.mliGetConsent = readConsent;

    var existing = readConsent();
    if (existing) {
      applyConsent(existing);
      hideUI();
    } else {
      showBanner();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
