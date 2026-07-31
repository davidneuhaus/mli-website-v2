/**
 * MLI v2 presentation layer — menu UX, motion, interactive polish.
 * Runs only when body has .mli-v2 (injected by build-v2).
 */
(function () {
  "use strict";

  var MQ = "(max-width: 1199.98px)";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  function isMobileNav() {
    return window.matchMedia(MQ).matches;
  }

  function init() {
    var body = document.body;
    if (!body || !body.classList.contains("mli-v2")) return;

    initNav();
    initHeaderScroll();
    if (!reduceMotion) initScrollReveal();
    initContactLoading();
  }

  /* ---------- Mobile drawer + a11y ---------- */
  function initNav() {
    var toggler = document.querySelector(".navbar-toggler");
    var collapse = document.getElementById("navbarNavDropdown");
    if (!toggler || !collapse) return;

    var backdrop = document.createElement("div");
    backdrop.className = "mli-v2-nav-backdrop";
    backdrop.setAttribute("aria-hidden", "true");
    document.body.appendChild(backdrop);

    var lastFocus = null;

    function drawerOpen() {
      return (
        collapse.classList.contains("show") ||
        collapse.classList.contains("mli-v2-drawer-open") ||
        toggler.getAttribute("aria-expanded") === "true"
      );
    }

    function openDrawer() {
      lastFocus = document.activeElement;
      collapse.classList.add("mli-v2-drawer-open", "show");
      toggler.setAttribute("aria-expanded", "true");
      document.body.classList.add("mli-v2-nav-open");
      backdrop.classList.add("is-visible");
      backdrop.setAttribute("aria-hidden", "false");
      trapFocus(true);
    }

    function closeDrawer() {
      collapse.classList.remove("mli-v2-drawer-open", "show");
      toggler.setAttribute("aria-expanded", "false");
      document.body.classList.remove("mli-v2-nav-open");
      backdrop.classList.remove("is-visible");
      backdrop.setAttribute("aria-hidden", "true");
      trapFocus(false);
      if (lastFocus && typeof lastFocus.focus === "function") {
        lastFocus.focus();
      } else {
        toggler.focus();
      }
    }

    function syncFromBootstrap() {
      if (!isMobileNav()) {
        document.body.classList.remove("mli-v2-nav-open");
        backdrop.classList.remove("is-visible");
        collapse.classList.remove("mli-v2-drawer-open");
        return;
      }
      if (collapse.classList.contains("show")) openDrawer();
      else if (document.body.classList.contains("mli-v2-nav-open")) closeDrawer();
    }

    /* Intercept toggler: Bootstrap still toggles classes; we sync visual drawer */
    toggler.addEventListener("click", function () {
      if (!isMobileNav()) return;
      /* Bootstrap flips state after click — sync next frame */
      requestAnimationFrame(function () {
        if (collapse.classList.contains("show")) {
          openDrawer();
        } else {
          closeDrawer();
        }
      });
    });

    collapse.addEventListener("shown.bs.collapse", function () {
      if (isMobileNav()) openDrawer();
    });
    collapse.addEventListener("hidden.bs.collapse", function () {
      if (isMobileNav()) closeDrawer();
    });

    backdrop.addEventListener("click", function () {
      if (!drawerOpen()) return;
      /* Prefer Bootstrap hide if available */
      if (window.bootstrap && window.bootstrap.Collapse) {
        var inst = window.bootstrap.Collapse.getInstance(collapse);
        if (inst) {
          inst.hide();
          return;
        }
      }
      closeDrawer();
      toggler.setAttribute("aria-expanded", "false");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isMobileNav() && drawerOpen()) {
        e.preventDefault();
        backdrop.click();
      }
    });

    /* Mobile accordion submenus — don't rely on Bootstrap Dropdown hover/popper */
    collapse.addEventListener(
      "click",
      function (e) {
        if (!isMobileNav()) return;
        var toggle = e.target.closest(".dropdown-toggle");
        if (!toggle || !collapse.contains(toggle)) return;
        var parent = toggle.closest(".nav-item.dropdown, .dropdown");
        if (!parent) return;
        var menu = parent.querySelector(":scope > .dropdown-menu");
        if (!menu) return;
        e.preventDefault();
        e.stopPropagation();
        var open = parent.classList.contains("show");
        collapse.querySelectorAll(".nav-item.dropdown.show, .dropdown.show").forEach(function (el) {
          if (el === parent || parent.contains(el)) return;
          el.classList.remove("show");
          var t = el.querySelector(":scope > .dropdown-toggle");
          var m = el.querySelector(":scope > .dropdown-menu");
          if (t) t.setAttribute("aria-expanded", "false");
          if (m) m.classList.remove("show");
        });
        parent.classList.toggle("show", !open);
        menu.classList.toggle("show", !open);
        toggle.setAttribute("aria-expanded", open ? "false" : "true");
      },
      true
    );

    window.addEventListener(
      "resize",
      function () {
        if (!isMobileNav()) {
          document.body.classList.remove("mli-v2-nav-open");
          backdrop.classList.remove("is-visible");
          collapse.classList.remove("mli-v2-drawer-open");
        }
      },
      { passive: true }
    );

    var focusHandler = null;
    function trapFocus(enable) {
      if (focusHandler) {
        document.removeEventListener("keydown", focusHandler, true);
        focusHandler = null;
      }
      if (!enable) return;
      focusHandler = function (e) {
        if (e.key !== "Tab" || !isMobileNav() || !drawerOpen()) return;
        /* Include toggler as first escape hatch */
        var items = [toggler].concat(
          Array.prototype.slice.call(
            collapse.querySelectorAll(
              'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          )
        );
        items = items.filter(function (el, i, arr) {
          return arr.indexOf(el) === i && !el.hasAttribute("disabled");
        });
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      };
      document.addEventListener("keydown", focusHandler, true);
    }

    syncFromBootstrap();
  }

  /* ---------- Header scroll polish ---------- */
  function initHeaderScroll() {
    var nav = document.querySelector(".navbar");
    if (!nav) return;
    var ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        if (window.scrollY > 12) nav.classList.add("is-scrolled");
        else nav.classList.remove("is-scrolled");
        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Scroll reveal ---------- */
  function initScrollReveal() {
    var candidates = document.querySelectorAll(
      [
        "#layout-content > section",
        "#layout-content > .container",
        "#layout-content > .container-fluid",
        ".page-content > section",
        ".teaser",
        ".element-teaser",
        ".accordion",
        ".card",
        ".slick-team",
        ".keynote-card",
        ".story-card",
        "[class*='teaser-']",
      ].join(",")
    );

    var seen = new Set();
    var targets = [];

    candidates.forEach(function (el) {
      if (seen.has(el)) return;
      if (el.closest(".navbar") || el.closest("#layout-header")) return;
      /* Skip logo / partner strips — avoid busy motion on those bands */
      if (
        el.classList.contains("kundenstimmen") ||
        el.closest(".kundenstimmen") ||
        /kunden/i.test(el.className || "")
      )
        return;
      /* Skip tiny utility nodes */
      if (el.children.length === 0 && (el.textContent || "").trim().length < 40)
        return;
      seen.add(el);
      el.classList.add("mli-v2-reveal");
      targets.push(el);
    });

    if (!targets.length || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) {
        el.classList.add("is-inview");
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-inview");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    targets.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---------- Contact form loading state (visual) ---------- */
  function initContactLoading() {
    var form = document.getElementById("mli-contact-form");
    if (!form) return;
    var btn = form.querySelector('[type="submit"], button[type="submit"], .btn');
    if (!btn) return;

    form.addEventListener(
      "submit",
      function () {
        btn.classList.add("is-loading");
        btn.setAttribute("aria-busy", "true");
        setTimeout(function () {
          btn.classList.remove("is-loading");
          btn.removeAttribute("aria-busy");
        }, 4000);
      },
      true
    );
  }

  ready(init);
})();
