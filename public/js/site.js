/**
 * MLI static site enhancements: contact form, load-more, countdown helpers.
 */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  /* ---- Contact form (JSON or classic POST to /api/contact.php) ---- */
  function initContactForm() {
    const form = document.getElementById("mli-contact-form");
    if (!form) return;
    const flash = document.getElementById("mli-contact-flash");

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (flash) {
        flash.classList.add("d-none");
        flash.classList.remove("alert-success", "alert-danger");
      }

      const fd = new FormData(form);
      if (fd.get("website")) {
        // honeypot filled — pretend success
        showFlash(flash, "Vielen Dank! Ihre Nachricht wurde gesendet.", true);
        form.reset();
        return;
      }

      const payload = {
        name: String(fd.get("name") || ""),
        email: String(fd.get("email") || ""),
        phone: String(fd.get("phone") || ""),
        subject: String(fd.get("subject") || ""),
        comments: String(fd.get("comments") || ""),
        privacy: fd.get("privacy") ? true : false,
        lang: String(fd.get("lang") || "de"),
      };

      try {
        const res = await fetch(form.action || "/api/contact.php", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(function () {
          return {};
        });
        if (!res.ok || data.ok === false) {
          throw new Error(data.error || "Send failed");
        }
        showFlash(
          flash,
          payload.lang === "en"
            ? "Thank you! Your message has been sent."
            : "Vielen Dank! Ihre Nachricht wurde gesendet.",
          true
        );
        form.reset();
      } catch (err) {
        showFlash(
          flash,
          payload.lang === "en"
            ? "Sorry, something went wrong. Please email info@leadership-munich.org."
            : "Entschuldigung, etwas ist schiefgelaufen. Bitte schreiben Sie an info@leadership-munich.org.",
          false
        );
      }
    });
  }

  function showFlash(el, msg, ok) {
    if (!el) {
      alert(msg);
      return;
    }
    el.textContent = msg;
    el.classList.remove("d-none");
    el.classList.add(ok ? "alert-success" : "alert-danger");
  }

  /* ---- Load more: reveal hidden cards in .mli-load-more-root ---- */
  function initLoadMore() {
    document.querySelectorAll(".mli-load-more-root").forEach(function (root) {
      const candidates = root.querySelectorAll(".row > [class*='col-']");
      if (!candidates.length) return;

      const pageSize = 6;
      // Hide anything beyond first page (and respect pre-hidden extras)
      candidates.forEach(function (el, i) {
        if (i >= pageSize || el.getAttribute("data-mli-extra") === "1") {
          el.classList.add("mli-load-more-hidden");
          el.style.display = "none";
        }
      });

      let shown = Math.min(pageSize, candidates.length);
      // count currently visible
      shown = 0;
      candidates.forEach(function (el) {
        if (el.style.display !== "none") shown += 1;
      });
      // ensure at least first page visible
      if (shown === 0) {
        candidates.forEach(function (el, i) {
          if (i < pageSize) {
            el.style.display = "";
            el.classList.remove("mli-load-more-hidden");
            shown += 1;
          }
        });
      }

      const btn = root.querySelector(".mli-load-more");
      if (!btn) return;
      if (shown >= candidates.length) {
        btn.style.display = "none";
        return;
      }
      if (btn.dataset.bound) return;
      btn.dataset.bound = "1";

      btn.addEventListener("click", function () {
        let revealed = 0;
        for (let i = 0; i < candidates.length && revealed < pageSize; i++) {
          const el = candidates[i];
          if (el.style.display === "none") {
            el.style.display = "";
            el.classList.remove("mli-load-more-hidden");
            revealed += 1;
            shown += 1;
          }
        }
        if (shown >= candidates.length) btn.style.display = "none";
      });
    });
  }

  /* ---- Simple countdown for [data-countdown-to="ISO date"] ---- */
  function initCountdowns() {
    document.querySelectorAll("[data-countdown-to]").forEach(function (el) {
      const target = new Date(el.getAttribute("data-countdown-to")).getTime();
      if (Number.isNaN(target)) return;

      function tick() {
        const diff = target - Date.now();
        if (diff <= 0) {
          el.textContent = "0";
          return;
        }
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        el.textContent = d + "d " + h + "h " + m + "m " + s + "s";
      }
      tick();
      setInterval(tick, 1000);
    });
  }

  /* ---- HubSpot forms: create from .hs-form-frame data attributes ---- */
  function initHubspotForms() {
    const frames = document.querySelectorAll(".hs-form-frame[data-form-id]");
    if (!frames.length) return;

    function create() {
      if (!window.hbspt || !window.hbspt.forms) return false;
      frames.forEach(function (frame) {
        const formId = frame.getAttribute("data-form-id");
        const portalId = frame.getAttribute("data-portal-id");
        const region = frame.getAttribute("data-region") || "eu1";
        if (!formId || formId.indexOf("REPLACE_") === 0) return;
        if (!portalId || portalId.indexOf("REPLACE_") === 0) return;
        if (frame.dataset.hsReady) return;
        frame.dataset.hsReady = "1";
        window.hbspt.forms.create({
          region: region,
          portalId: portalId,
          formId: formId,
          target: frame,
        });
      });
      return true;
    }

    if (!create()) {
      let n = 0;
      const t = setInterval(function () {
        n += 1;
        if (create() || n > 40) clearInterval(t);
      }, 250);
    }
  }

  /* ---- October CMS used $(document).trigger('render'); emulate it ---- */
  function triggerLegacyRender() {
    if (window.jQuery) {
      try {
        window.jQuery(document).trigger("render");
      } catch (e) {
        /* ignore */
      }
    }
  }

  /* ---- Hide broken video sources (also 404 on live CMS) ---- */
  function initBrokenMediaFallback() {
    document.querySelectorAll("video").forEach(function (video) {
      const sources = video.querySelectorAll("source");
      let pending = sources.length;
      if (!pending && video.currentSrc) return;

      function fail() {
        video.style.display = "none";
        const parent = video.parentElement;
        if (parent && !parent.querySelector("img.mli-video-fallback")) {
          const poster = video.getAttribute("poster");
          if (poster) {
            const img = document.createElement("img");
            img.src = poster;
            img.alt = "";
            img.className = "mli-video-fallback w-100";
            parent.insertBefore(img, video);
          }
        }
      }

      if (!sources.length) {
        video.addEventListener("error", fail);
        return;
      }

      sources.forEach(function (source) {
        const test = new Image();
        // for non-image sources use fetch HEAD
        fetch(source.src, { method: "HEAD" })
          .then(function (r) {
            if (!r.ok) source.remove();
          })
          .catch(function () {
            source.remove();
          })
          .finally(function () {
            pending -= 1;
            if (pending <= 0) {
              if (!video.querySelector("source")) fail();
              else {
                try {
                  video.load();
                } catch (e) {
                  /* ignore */
                }
              }
            }
          });
      });
    });
  }

  ready(function () {
    initContactForm();
    initLoadMore();
    initCountdowns();
    initHubspotForms();
    triggerLegacyRender();
    initBrokenMediaFallback();
  });
})();
