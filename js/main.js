/* ============================================================
   POLARIS CONCIERGE — main.js
   Hier anpassen:
   1. WHATSAPP        = deine WhatsApp Nummer (ohne +, ohne Leerzeichen)
   2. PHONE           = deine Telefonnummer
   3. CONVERSION_ID   = Google Ads Conversion ID (optional)
   4. CONVERSION_LABEL= Google Ads Conversion Label (optional)
   ============================================================ */

const WHATSAPP        = "4915214869594";
const PHONE           = "+49 1521 4869594";
const EMAIL           = "info@polaris-concierge.de";
const CONVERSION_ID   = "";
const CONVERSION_LABEL= "";

const WA_TEXT = encodeURIComponent("Hallo Polaris Concierge, ich interessiere mich für einen Privatjet Charter.");
const WA_URL  = "https://wa.me/" + WHATSAPP + "?text=" + WA_TEXT;
const MAIL_URL= "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Anfrage Privatjet Charter");

/* ── Links setzen ── */
document.querySelectorAll("[data-wa]").forEach(el => {
  el.href = WA_URL;
  el.target = "_blank";
  el.rel = "noopener";
  el.addEventListener("click", fireConversion);
});
document.querySelectorAll("[data-mail]").forEach(el => {
  el.href = MAIL_URL;
  el.addEventListener("click", fireConversion);
});
document.querySelectorAll("[data-phone]").forEach(el => {
  el.href = "tel:" + PHONE.replace(/\s/g,"");
  el.addEventListener("click", fireConversion);
});

const phoneDisp = document.getElementById("phoneDisp");
if (phoneDisp) phoneDisp.textContent = PHONE;

function fireConversion() {
  if (typeof gtag === "function" && CONVERSION_ID && CONVERSION_LABEL) {
    gtag("event","conversion",{"send_to": CONVERSION_ID+"/"+CONVERSION_LABEL});
  }
  document.getElementById("mobileBar")?.classList.add("hidden");
}

/* ── Header Scroll ── */
const hdr = document.getElementById("hdr");
window.addEventListener("scroll", () => {
  hdr.classList.toggle("scrolled", window.scrollY > 40);
}, {passive:true});
hdr.classList.toggle("scrolled", window.scrollY > 40);

/* ── Reveal Animation ── */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }});
}, {threshold: 0.12, rootMargin: "0px 0px -8% 0px"});
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

/* ── Jahr im Footer ── */
document.getElementById("yr").textContent = new Date().getFullYear();


/* ── Flight Timeline Scroll Animation ── */
function initFlight() {
  const section  = document.querySelector(".process");
  const jetEl    = document.querySelector(".jet-icon");
  const trackEl  = document.querySelector(".flight-track");
  const fillEl   = document.querySelector(".track-fill");
  const dots     = document.querySelectorAll(".track-dot");
  const steps    = document.querySelectorAll(".fstep");

  if (!section || !jetEl || !trackEl || !steps.length) return;

  const JET_H = jetEl.offsetHeight || 84;

  /* Marker-Positionen berechnen:
     Jeder Marker sitzt vertikal auf der Mitte der entsprechenden Kachel,
     relativ zum Anfang des Track-Elements. */
  function getMarkerY(stepIndex) {
    const tRect  = trackEl.getBoundingClientRect();
    const sRect  = steps[stepIndex].getBoundingClientRect();
    const midAbs = sRect.top + sRect.height / 2;
    return midAbs - tRect.top;   /* relativ zum Track */
  }

  /* Dots auf die richtige Y-Position setzen */
  function placeDots() {
    dots.forEach((dot, i) => {
      if (steps[i]) {
        dot.style.top = (getMarkerY(i) - 6) + "px";   /* -6 = halbe Dot-Höhe */
      }
    });
  }

  /* Haupt-Update-Funktion, wird bei jedem Scroll aufgerufen */
  function update() {
    const secRect = section.getBoundingClientRect();
    const vh      = window.innerHeight;
    const tH      = trackEl.offsetHeight;

    /* Progress 0→1:
       0 = Oberkante der Sektion ist 60% des Viewports von oben entfernt
       1 = Unterkante der Sektion scrollt auf 40% viewport */
    const progress = Math.max(0, Math.min(1,
      (vh * 0.6 - secRect.top) / (secRect.height + vh * 0.2)
    ));

    /* Jet-Position im Track */
    const pad  = 8;
    const maxY = tH - JET_H - pad;
    const jetY = pad + progress * maxY;

    jetEl.style.top = jetY + "px";

    /* Leuchtlinie wächst mit */
    if (fillEl) fillEl.style.height = Math.max(0, jetY + JET_H * 0.5) + "px";

    /* Dots und Kacheln aktivieren */
    const jetCenter = jetY + JET_H / 2;

    steps.forEach((step, i) => {
      const mY      = getMarkerY(i);
      const dist    = Math.abs(jetCenter - mY);
      const isOn    = jetCenter >= mY - 30;
      const nearness= Math.max(0, 1 - dist / 80);

      /* Dot */
      if (dots[i]) dots[i].classList.toggle("active", dist < 55);

      /* Kachel */
      step.classList.toggle("active", isOn);

      if (isOn) {
        /* Sanftes Aufleuchten wenn Jet direkt daneben ist */
        step.style.borderColor  = `rgba(240,237,230,${0.1 + nearness * 0.18})`;
        step.style.boxShadow    = `inset 0 0 80px rgba(240,237,230,${nearness * 0.04}), 0 8px 40px rgba(0,0,0,0.35)`;
      } else {
        step.style.borderColor  = "";
        step.style.boxShadow    = "";
      }
    });
  }

  /* RAF-Wrapper für flüssiges Scrolling */
  let raf = false;
  window.addEventListener("scroll", () => {
    if (!raf) { requestAnimationFrame(() => { update(); raf = false; }); raf = true; }
  }, {passive: true});

  window.addEventListener("resize", () => {
    placeDots();
    update();
  });

  /* Initial */
  placeDots();
  update();
}

/* Nach vollständigem Laden starten, damit alle Layouts feststehen */
window.addEventListener("load", () => {
  setTimeout(initFlight, 150);
});
