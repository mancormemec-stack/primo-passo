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


  // ---------- Barra di stato decorativa (solo dentro il telefono su schermi larghi) ----------
  function statusbar() {
    for (const id of ["app", "onboarding"]) {
      const c = $(id);
      if (!c || c.querySelector(":scope > #statusbar-" + id)) continue;
      const d = document.createElement("div");
      d.id = "statusbar-" + id; d.className = "statusbar"; d.setAttribute("aria-hidden", "true");
      d.innerHTML = '<span>9:41</span><span class="isola"></span><span class="icone"><svg viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2.5" width="3" height="9.5" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg viewBox="0 0 27 12"><rect x=".5" y=".5" width="22" height="11" rx="3" fill="none" stroke="currentColor" opacity=".5"/><rect x="2" y="2" width="17" height="8" rx="1.8" fill="currentColor"/><rect x="24" y="4" width="2" height="4" rx="1" fill="currentColor" opacity=".5"/></svg></span>';
      c.insertBefore(d, c.firstChild);
    }
  }


  // ---------- Prima schermata come nella demo: benvenuto, poi scelta della lingua ----------
  let benvenutoFatto = false;
  function onboarding() {
    const o = $("onboarding");
    if (!o) return;
    // Riga "Pino + fumetto con la domanda" sopra la ricerca
    if (!$("onb-riga") && $("onb-pino") && o.querySelector(".onb-domanda") && $("cerca")) {
      const riga = document.createElement("div");
      riga.id = "onb-riga";
      riga.appendChild($("onb-pino"));
      riga.appendChild(o.querySelector(".onb-domanda"));
      o.insertBefore(riga, $("cerca").previousElementSibling || $("cerca"));
    }
    if (benvenutoFatto || o.hidden) return;
    benvenutoFatto = true;
    const b = document.createElement("div");
    b.id = "benvenuto";
    b.innerHTML = '<span class="logo">Primo Passo<svg viewBox="0 0 120 10" aria-hidden="true"><path d="M2 6c30-6 70-6 116-1" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></span>' +
      '<div class="scena"><div class="pino-grande"></div></div>' +
      '<h2 class="saluto"></h2><p class="sub"></p>' +
      '<div class="punti" aria-hidden="true"><span class="on"></span><span></span><span></span></div>' +
      '<button type="button" class="cta press"><span class="et"></span><span class="freccia" aria-hidden="true">\u2192</span></button>';
    const pg = b.querySelector(".pino-grande");
    if ($("onb-pino")) pg.innerHTML = $("onb-pino").innerHTML;
    b.querySelector("button").addEventListener("click", () => { b.remove(); const c = $("cerca"); if (c) c.focus({ preventScroll: true }); });
    o.insertBefore(b, o.firstChild);
    welcomeTesti();
  }
  function welcomeTesti() {
    const b = $("benvenuto");
    if (!b) return;
    const sal = $("saluto") ? $("saluto").textContent.replace(/\s+/g, " ").trim() : "";
    const half = sal.slice(0, Math.ceil(sal.length / 2));
    const saluto = (sal.length > 1 && sal === half + half) ? half : sal;
    const sub = document.querySelector("#onboarding .onb-sub");
    const av = $("avanti") && $("avanti").querySelector("span");
    const set = (sel, t) => { const e = b.querySelector(sel); if (e && e.textContent !== t) e.textContent = t; };
    set(".saluto", saluto); set(".sub", sub ? sub.textContent.trim() : ""); set(".et", av ? av.textContent.trim() : "");
  }


  // ---------- Percorso: contatore "fatti/totale" accanto a ogni procedura ----------
  function contatori() {
    const st = $("steps");
    if (!st) return;
    st.querySelectorAll("h3").forEach((h) => {
      const ul = h.nextElementSibling;
      if (!ul || ul.tagName !== "UL") return;
      const voci = [...ul.querySelectorAll("li:not(.info)")];
      const t = voci.filter((l) => l.classList.contains("done")).length + "/" + voci.length;
      let c = h.querySelector(".conta");
      if (!c) { c = document.createElement("span"); c.className = "conta"; c.setAttribute("aria-hidden", "true"); h.appendChild(c); }
      if (c.textContent !== t) c.textContent = t;
    });
  }

  // ---------- Barra in basso come nella demo: Pino, Percorso, Profilo ----------
  // Tre viste dello stesso schermo: si mostra una parte alla volta, nulla viene ricreato.
  const SVG = (d) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
  ICONE.profilo = SVG('<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>');
  ICONE.tastiera = SVG('<rect x="2.5" y="5.5" width="19" height="13" rx="3"/><path d="M6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M7.5 14h9"/>');
  ICONE.mic = SVG('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>');
  ICONE.stop = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2.5"/></svg>';
  const VOCI = ["pino", "percorso", "profilo"];
  function testo(id, vuoto) { const e = $(id); return (e && e.textContent.trim()) || vuoto; }
  function etichette() {
    const nav = $("tabbar");
    if (!nav) return;
    const h2 = $("steps") && $("steps").querySelector("h2");
    const mappa = { pino: "Pino", percorso: (h2 && h2.textContent.trim()) || "Percorso", profilo: testo("lingua-nome", "Profilo") };
    nav.querySelectorAll("button").forEach((b) => {
      const t = mappa[b.dataset.voce];
      const span = b.querySelector("span");
      if (span && span.textContent !== t) span.textContent = t;
      b.setAttribute("aria-label", t);
    });
    const riga = $("profilo-lingua");
    if (riga) { const n = riga.querySelector(".nome"); if (n && n.textContent !== mappa.profilo) n.textContent = mappa.profilo; }
  }
  function vista(v) {
    const app = $("app");
    if (!app) return;
    app.dataset.vista = v;
    const nav = $("tabbar");
    if (nav) nav.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", b.dataset.voce === v ? "true" : "false"));
    if (v === "percorso") { const b = nav && nav.querySelector('[data-voce="percorso"]'); if (b) b.classList.remove("novita"); }
    if (app.scrollTo) app.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }
  function profilo() {
    if ($("profilo")) return;
    const main = $("app").querySelector("main");
    if (!main) return;
    const sec = document.createElement("section");
    sec.id = "profilo"; sec.className = "card";
    sec.innerHTML = '<button id="profilo-lingua" type="button" class="riga press">' + ICONE.lingua + '<span class="nome"></span><span class="freccia" aria-hidden="true">›</span></button>';
    sec.querySelector("button").addEventListener("click", () => { const l = $("lingua"); if (l) l.click(); });
    main.appendChild(sec);
  }

  // ---------- Home come nella demo: fumetto, Pino nella scena, barra del microfono ----------
  const BARRE = [.35, .55, .8, .6, 1, .7, .9, .5, .75, .45, .3];
  function statoPino() { const p = document.querySelector("#app .palco"); return (p && p.dataset.stato) || "idle"; }
  function testoFumetto() {
    const st = statoPino();
    const didas = testo("didascalia", "");
    if (st === "listening") return didas;
    const ai = document.querySelectorAll("#log .msg.ai");
    const ultimo = ai.length ? ai[ai.length - 1].textContent.trim() : "";
    return ultimo || didas;
  }
  function casa() {
    const app = $("app"), main = app.querySelector("main");
    if (!main || $("fumetto")) return;
    const fu = document.createElement("button");
    fu.id = "fumetto"; fu.type = "button"; fu.className = "press";
    fu.setAttribute("aria-live", "polite");
    fu.addEventListener("click", () => { if (app.dataset.chat) delete app.dataset.chat; else app.dataset.chat = "aperta"; });
    main.insertBefore(fu, main.firstChild);
    const onde = document.createElement("div");
    onde.id = "onde"; onde.setAttribute("aria-hidden", "true");
    BARRE.forEach((h) => { const i = document.createElement("span"); i.style.setProperty("--h", h); onde.appendChild(i); });
    main.appendChild(onde);
    const dock = document.createElement("div");
    dock.id = "dock";
    dock.innerHTML = '<button type="button" class="lato press" data-az="scrivi">' + ICONE.tastiera + '</button>' +
      '<button type="button" class="mic press" data-az="mic">' + ICONE.mic + '</button>' +
      '<button type="button" class="lato press" data-az="lingua">' + ICONE.lingua + '</button>';
    dock.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      const az = b.dataset.az;
      if (az === "scrivi") { const t = $("text"); if (t && !t.disabled) t.click(); app.dataset.chat = "aperta"; }
      if (az === "lingua") { const l = $("lingua"); if (l) l.click(); }
      if (az === "mic") {
        const stop = $("stop"), voce = $("voice");
        if (stop && !stop.disabled && statoPino() !== "idle") stop.click(); else if (voce && !voce.disabled) voce.click();
      }
    });
    main.appendChild(dock);
  }
  function casaAggiorna() {
    const app = $("app");
    const fu = $("fumetto"); if (!fu) return;
    const t = testoFumetto();
    if (fu.textContent !== t) fu.textContent = t;
    fu.hidden = !t;
    const top = (fu.hidden ? 60 : fu.offsetTop + fu.offsetHeight + 12) + "px";
    if (app.style.getPropertyValue("--chat-top") !== top) app.style.setProperty("--chat-top", top);
    const dk = $("dock");
    if (dk && dk.offsetHeight) {
      const fondo = Math.max(120, app.scrollHeight - dk.offsetTop + 30) + "px";
      if (app.style.getPropertyValue("--chat-fondo") !== fondo) app.style.setProperty("--chat-fondo", fondo);
    }
    const st = statoPino();
    if (app.dataset.pino !== st) app.dataset.pino = st;
    const mic = document.querySelector('#dock .mic');
    if (mic) {
      const attivo = st !== "idle" && st !== "success";
      const nuovo = attivo ? ICONE.stop : ICONE.mic;
      if (mic.dataset.icona !== (attivo ? "stop" : "mic")) { mic.innerHTML = nuovo; mic.dataset.icona = attivo ? "stop" : "mic"; }
      mic.setAttribute("aria-label", attivo ? ($("stop") ? $("stop").textContent.trim() : "") : ($("voice") ? ($("voice").getAttribute("aria-label") || "") : ""));
    }
    const sc = document.querySelector('#dock [data-az="scrivi"]'), tx = $("text");
    if (sc && tx) sc.setAttribute("aria-label", tx.textContent.replace(/\s+/g, " ").trim());
    const li = document.querySelector('#dock [data-az="lingua"]'), ln = $("lingua-nome");
    if (li && ln) li.setAttribute("aria-label", ln.textContent.trim());
  }

  // ---------- Aggiungi alla home (installazione come app) ----------
  const T_INST = {
    it: ["Aggiungi alla home", "Tocca Condividi, poi «Aggiungi alla schermata Home».", "Dal menu del browser scegli «Installa app» o «Aggiungi alla schermata Home»."],
    en: ["Add to home screen", "Tap Share, then “Add to Home Screen”.", "In the browser menu choose “Install app” or “Add to Home screen”."],
    es: ["Añadir a la pantalla de inicio", "Toca Compartir y luego « Añadir a pantalla de inicio».", "En el menú del navegador elige «Instalar app» o «Añadir a pantalla de inicio»."],
    fr: ["Ajouter à l’écran d’accueil", "Touchez Partager, puis « Sur l’écran d’accueil ».", "Dans le menu du navigateur, choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil »."],
    ro: ["Adaugă pe ecranul principal", "Atinge Partajare, apoi „Adaugă pe ecranul principal”.", "Din meniul browserului alege „Instalează aplicația” sau „Adaugă pe ecranul principal”."],
    ar: ["أضف إلى الشاشة الرئيسية", "اضغط مشاركة ثم «إضافة إلى الشاشة الرئيسية».", "من قائمة المتصفح اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»."],
    uk: ["Додати на головний екран", "Натисни «Поділитися», потім «На початковий екран».", "У меню браузера обери «Встановити застосунок» або «Додати на головний екран»."],
  };
  let promptInstall = null;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); promptInstall = e; });
  window.addEventListener("appinstalled", () => { promptInstall = null; const r = $("profilo-installa"); if (r) r.hidden = true; });
  const giaInstallata = () => (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  const eIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  function testiInstalla() {
    const lang = ((document.documentElement.lang || "en").toLowerCase().split("-")[0]);
    return T_INST[lang] || T_INST.en;
  }
  function installa() {
    const sec = $("profilo");
    if (!sec || $("profilo-installa") || giaInstallata()) return;
    const riga = document.createElement("button");
    riga.id = "profilo-installa"; riga.type = "button"; riga.className = "riga press";
    riga.innerHTML = SVG('<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/>') + '<span class="nome"></span>';
    const nota = document.createElement("p");
    nota.id = "installa-nota"; nota.className = "muted"; nota.hidden = true;
    riga.addEventListener("click", async () => {
      if (promptInstall) { promptInstall.prompt(); try { await promptInstall.userChoice; } catch (e) { /* nulla */ } promptInstall = null; return; }
      const t = testiInstalla();
      nota.textContent = eIOS() ? t[1] : t[2];
      nota.hidden = !nota.hidden;
    });
    sec.appendChild(riga); sec.appendChild(nota);
  }
  function installaTesti() {
    const r = $("profilo-installa");
    if (!r) return;
    const n = r.querySelector(".nome"), t = testiInstalla()[0];
    if (n && n.textContent !== t) n.textContent = t;
    const nota = $("installa-nota");
    if (nota && !nota.hidden) nota.textContent = eIOS() ? testiInstalla()[1] : testiInstalla()[2];
  }
  function barra() {
    const app = $("app");
    if (!app || app.hidden) return;
    if (!$("tabbar")) {
      const nav = document.createElement("nav");
      nav.id = "tabbar";
      nav.setAttribute("aria-label", "Primo Passo");
      for (const voce of VOCI) {
        const b = document.createElement("button");
        b.type = "button"; b.dataset.voce = voce; b.className = "press";
        b.innerHTML = ICONE[voce] + "<span></span>";
        b.addEventListener("click", () => vista(voce));
        nav.appendChild(b);
      }
      app.appendChild(nav);
      profilo();
      installa();
      casa();
      vista(app.dataset.vista || "pino");
      const steps = $("steps");
      if (steps) new MutationObserver(() => {
        if (app.dataset.vista === "percorso") return;
        const b = nav.querySelector('[data-voce="percorso"]');
        if (b && steps.querySelector("li")) b.classList.add("novita");
      }).observe(steps, { childList: true, subtree: true });
    }
    etichette();
    installaTesti();
    if ($("fumetto")) casaAggiorna();
  }

  // ---------- Foglio a biglietto (dentro l'iframe del foglio, stesso dominio) ----------
  const CSS_FOGLIO = `
@import url("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=Nunito+Sans:wght@400;600;700;800&display=swap");
html { background: #F3F1EC; }
body { position: relative; margin: 16px auto; max-width: 620px; padding: 0 0 22px; color: #202B30; background: #FFFDF8;
  border-radius: 20px; overflow: hidden; box-shadow: 0 1px 2px rgba(32,43,48,.06), 0 10px 28px rgba(32,43,48,.10);
  font: 15px/1.5 "Nunito Sans", system-ui, sans-serif; }
body > *:not(#banner) { margin-left: 20px; margin-right: 20px; }
#banner { display: flex; align-items: center; gap: 12px; margin: 0 0 14px; padding: 16px 20px; background: #173F46; color: #fff; }
#banner .ico { flex: none; width: 36px; height: 36px; border-radius: 50%; background: #F06424; box-shadow: inset 0 0 0 9px #F06424, inset 0 0 0 11px rgba(255,255,255,.9); }
#banner small { display: block; margin-bottom: 2px; color: #FFD2B8; font: 800 11px "Bricolage Grotesque", sans-serif; letter-spacing: .12em; }
#banner h1 { margin: 0; color: #fff; font: 700 20px/1.2 "Bricolage Grotesque", "Nunito Sans", sans-serif; letter-spacing: -.01em; }
h1 { margin: 0 0 6px; font: 700 22px/1.2 "Bricolage Grotesque", "Nunito Sans", sans-serif; color: #173F46; }
#banner + p { margin-top: 0; margin-bottom: 4px; font-weight: 700; color: #5E6A6F; }
h2 { position: relative; margin-top: 20px; margin-bottom: 8px; padding-top: 14px; border-top: 3px dotted #D9D4CB; color: #5E6A6F; font: 800 12px "Bricolage Grotesque", sans-serif; letter-spacing: .1em; text-transform: uppercase; }
ul { padding-left: 20px; }
li { margin: 5px 0; }
.nota { margin-top: 14px; padding: 10px 12px; border-radius: 12px; background: #FBF0DA; color: #8A5300; font-size: 13px; }
.tr { margin-top: 16px; padding: 12px 14px; border: 1.5px dashed #173F46; border-radius: 14px; background: #fff; color: #173F46; }
@media print { html { background: #fff; } body { margin: 0; max-width: none; box-shadow: none; border-radius: 0; } }
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
        const h1 = d.querySelector("h1");
        if (h1 && !d.getElementById("banner")) {
          const ban = d.createElement("div");
          ban.id = "banner";
          const ico = d.createElement("span"); ico.className = "ico";
          const col = d.createElement("div");
          const small = d.createElement("small"); small.textContent = "PRIMO PASSO · FOGLIO";
          h1.parentNode.insertBefore(ban, h1);
          col.appendChild(small); col.appendChild(h1);
          ban.appendChild(ico); ban.appendChild(col);
        }
      } catch (e) { /* se il foglio non si puo' stilare resta com'e' */ }
    };
    frame.addEventListener("load", inietta);
    inietta();
  }

  let attesa = 0;
  function aggiorna() { attesa = 0; try { statusbar(); onboarding(); welcomeTesti(); barra(); contatori(); foglio(); } catch (e) { /* mai bloccare l'app */ } }
  const osserva = new MutationObserver(() => { if (!attesa) attesa = requestAnimationFrame(aggiorna); });
  function parti() {
    aggiorna();
    osserva.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "data-stato", "disabled"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", parti); else parti();
})();

