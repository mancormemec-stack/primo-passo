// Aspetto della demo: barra in basso e foglio a biglietto.
// Solo presentazione: osserva la pagina e aggiunge elementi di navigazione e uno stile al foglio.
// Non cambia dati, strumenti, agente ne' il codice di app.js. Si toglie cancellando il <script> in index.html.
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const ICONE = {
    pino: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10.5V19h11v-8.5"/></svg>',
    percorso: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="18" r="2.2"/><path d="M8.2 6H14a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h5.8"/></svg>',
    lingua: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18"/></svg>',
  };

  // ---------- Barra in basso: Pino, Percorso, Lingua ----------
  function etichette() {
    const nav = $("tabbar");
    if (!nav) return;
    const titoloPercorso = ($("steps") && $("steps").querySelector("h2") && $("steps").querySelector("h2").textContent.trim()) || "Percorso";
    const lingua = ($("lingua-nome") && $("lingua-nome").textContent.trim()) || "Lingua";
    const mappa = { pino: "Pino", percorso: titoloPercorso, lingua };
    nav.querySelectorAll("button").forEach((b) => {
      const t = mappa[b.dataset.voce];
      const span = b.querySelector("span");
      if (span && span.textContent !== t) span.textContent = t;
      b.setAttribute("aria-label", t);
    });
  }
  function barra() {
    const app = $("app");
    if (!app || app.hidden) return;
    if (!$("tabbar")) {
      const nav = document.createElement("nav");
      nav.id = "tabbar";
      nav.setAttribute("aria-label", "Primo Passo");
      const azioni = {
        pino: () => { if (app.scrollTo) app.scrollTo({ top: 0, behavior: "smooth" }); window.scrollTo({ top: 0, behavior: "smooth" }); },
        percorso: () => { const s = $("steps"); if (s) s.scrollIntoView({ behavior: "smooth", block: "start" }); },
        lingua: () => { const l = $("lingua"); if (l) l.click(); },
      };
      for (const voce of ["pino", "percorso", "lingua"]) {
        const b = document.createElement("button");
        b.type = "button"; b.dataset.voce = voce; b.className = "press";
        b.innerHTML = ICONE[voce] + "<span></span>";
        b.addEventListener("click", azioni[voce]);
        nav.appendChild(b);
      }
      app.appendChild(nav);
    }
    etichette();
  }

  // ---------- Foglio a biglietto (dentro l'iframe del foglio, stesso dominio) ----------
  const CSS_FOGLIO = `
@import url("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=Nunito+Sans:wght@400;600;700;800&display=swap");
html { background: #F3F1EC; }
body { position: relative; margin: 16px auto; max-width: 620px; padding: 22px 22px 26px; color: #202B30; background: #FFFDF8;
  border-radius: 20px; box-shadow: 0 1px 2px rgba(32,43,48,.06), 0 10px 28px rgba(32,43,48,.10);
  font: 15px/1.5 "Nunito Sans", system-ui, sans-serif; }
body::before { content: "PRIMO PASSO \\00B7\\00A0 FOGLIO"; display: block; margin-bottom: 8px; color: #B8450F; font: 800 12px "Bricolage Grotesque", sans-serif; letter-spacing: .14em; }
h1 { margin: 0 0 6px; font: 700 22px/1.2 "Bricolage Grotesque", "Nunito Sans", sans-serif; letter-spacing: -.01em; color: #173F46; }
h1 + p { margin: 0 0 4px; font-weight: 700; color: #5E6A6F; }
h2 { position: relative; margin: 20px 0 8px; padding-top: 14px; border-top: 2px dashed #E4DED3; color: #5E6A6F; font: 800 12px "Bricolage Grotesque", sans-serif; letter-spacing: .1em; text-transform: uppercase; }
h1 + p + h2::before, h1 + p + h2::after { content: ""; position: absolute; top: -11px; width: 20px; height: 20px; border-radius: 50%; background: #F3F1EC; }
h1 + p + h2::before { left: -33px; }
h1 + p + h2::after { right: -33px; }
ul { margin: 0; padding-left: 20px; }
li { margin: 5px 0; }
.nota { margin: 14px 0 0; padding: 10px 12px; border-radius: 12px; background: #FBF0DA; color: #8A5300; font-size: 13px; }
.tr { margin-top: 16px; padding: 12px 14px; border-radius: 12px; background: #E6EEEE; color: #173F46; }
@media print { html { background: #fff; } body { margin: 0; max-width: none; box-shadow: none; border-radius: 0; } h1 + p + h2::before, h1 + p + h2::after { display: none; } }
`;
  function foglio() {
    const frame = document.querySelector("#foglio iframe");
    if (!frame || frame.dataset.tema) return;
    frame.dataset.tema = "1";
    const inietta = () => {
      try {
        const d = frame.contentDocument;
        if (!d || !d.head || d.getElementById("tema-foglio")) return;
        const s = d.createElement("style");
        s.id = "tema-foglio";
        s.textContent = CSS_FOGLIO;
        d.head.appendChild(s);
      } catch (e) { /* se il foglio non si puo' stilare resta com'e' */ }
    };
    frame.addEventListener("load", inietta);
    inietta();
  }

  let attesa = 0;
  function aggiorna() { attesa = 0; try { barra(); foglio(); } catch (e) { /* mai bloccare l'app */ } }
  const osserva = new MutationObserver(() => { if (!attesa) attesa = requestAnimationFrame(aggiorna); });
  function parti() {
    aggiorna();
    osserva.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", parti); else parti();
})();
