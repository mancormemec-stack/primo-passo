// Aspetto della demo: barra in basso e foglio a biglietto.
// Solo presentazione: osserva la pagina e aggiunge elementi di navigazione e uno stile al foglio.
// Non cambia dati, strumenti, agente ne' il codice di app.js. Si toglie cancellando il <script> in index.html.
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // ---------- Muto del microfono ----------
  // Spegne le tracce audio del microfono (silenzio), cosi' se l'utente parla con qualcuno Pino non viene interrotto.
  const mic = { muto: false, tracce: new Set() };
  function applicaMuto() {
    mic.tracce.forEach((t) => { if (t.readyState === "ended") mic.tracce.delete(t); else if (t.enabled === mic.muto) t.enabled = !mic.muto; });
  }
  try {
    const md = navigator.mediaDevices;
    if (md && md.getUserMedia) {
      const orig = md.getUserMedia.bind(md);
      md.getUserMedia = async (c) => {
        const st = await orig(c);
        st.getAudioTracks().forEach((t) => { mic.tracce.add(t); if (mic.muto) t.enabled = false; });
        return st;
      };
    }
  } catch (e) { /* senza muto l'app funziona lo stesso */ }
  setInterval(() => { if (mic.muto) applicaMuto(); }, 400);
  const T_MUTO = {
    it: ["Muto", "Microfono spento: Pino non ti sente"], en: ["Mute", "Microphone off: Pino cannot hear you"],
    es: ["Silenciar", "Micr\u00F3fono apagado: Pino no te oye"], fr: ["Muet", "Micro coup\u00E9 : Pino ne t\u2019entend pas"],
    ro: ["F\u0103r\u0103 sunet", "Microfon oprit: Pino nu te aude"],
    ar: ["\u0643\u062A\u0645", "\u0627\u0644\u0645\u064A\u0643\u0631\u0648\u0641\u0648\u0646 \u0645\u0637\u0641\u0623: \u0644\u0627 \u064A\u0633\u0645\u0639\u0643 Pino"],
    uk: ["\u0411\u0435\u0437 \u0437\u0432\u0443\u043A\u0443", "\u041C\u0456\u043A\u0440\u043E\u0444\u043E\u043D \u0432\u0438\u043C\u043A\u043D\u0435\u043D\u043E: Pino \u0442\u0435\u0431\u0435 \u043D\u0435 \u0447\u0443\u0454"],
  };
  const langDoc = () => (document.documentElement.lang || "en").toLowerCase().split("-")[0];
  const testiMuto = () => T_MUTO[langDoc()] || T_MUTO.en;
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


  // ---------- Posizione all'apertura (solo con il consenso dell'utente) ----------
  const T_POS = {
    it: ["Posso usare la tua posizione?", "Cos\u00EC ti indico l\u2019ufficio pi\u00F9 vicino a te. Non la salvo: la uso solo per capire il tuo Municipio.", "S\u00EC, usa la posizione", "Non ora", "Municipio"],
    en: ["Can I use your location?", "So I can point you to the office nearest to you. I don\u2019t save it: I only use it to find your Municipio.", "Yes, use my location", "Not now", "Municipio"],
    es: ["\u00BFPuedo usar tu ubicaci\u00F3n?", "As\u00ED te indico la oficina m\u00E1s cercana. No la guardo: solo la uso para saber tu Municipio.", "S\u00ED, usar mi ubicaci\u00F3n", "Ahora no", "Municipio"],
    fr: ["Puis-je utiliser votre position ?", "Pour vous indiquer le bureau le plus proche. Je ne l\u2019enregistre pas : je l\u2019utilise seulement pour trouver votre Municipio.", "Oui, utiliser ma position", "Pas maintenant", "Municipio"],
    ro: ["Pot folosi loca\u021Bia ta?", "Ca s\u0103 \u021Bi arat biroul cel mai apropiat. Nu o salvez: o folosesc doar ca s\u0103 aflu Municipio-ul t\u0103u.", "Da, folose\u0219te loca\u021Bia", "Nu acum", "Municipio"],
    ar: ["\u0647\u0644 \u064A\u0645\u0643\u0646\u0646\u064A \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0645\u0648\u0642\u0639\u0643\u061F", "\u0644\u0623\u062F\u0644\u0651\u0643 \u0639\u0644\u0649 \u0623\u0642\u0631\u0628 \u0645\u0643\u062A\u0628. \u0644\u0627 \u0623\u062D\u0641\u0638\u0647: \u0623\u0633\u062A\u062E\u062F\u0645\u0647 \u0641\u0642\u0637 \u0644\u0645\u0639\u0631\u0641\u0629 \u0628\u0644\u062F\u064A\u062A\u0643.", "\u0646\u0639\u0645\u060C \u0627\u0633\u062A\u062E\u062F\u0645 \u0645\u0648\u0642\u0639\u064A", "\u0644\u064A\u0633 \u0627\u0644\u0622\u0646", "Municipio"],
    uk: ["\u041C\u043E\u0436\u0443 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u0430\u0442\u0438 \u0442\u0432\u043E\u0454 \u043C\u0456\u0441\u0446\u0435\u0437\u043D\u0430\u0445\u043E\u0434\u0436\u0435\u043D\u043D\u044F?", "\u0429\u043E\u0431 \u043F\u043E\u043A\u0430\u0437\u0430\u0442\u0438 \u043D\u0430\u0439\u0431\u043B\u0438\u0436\u0447\u0438\u0439 \u043E\u0444\u0456\u0441. \u042F \u043D\u0435 \u0437\u0431\u0435\u0440\u0456\u0433\u0430\u044E \u0457\u0457: \u043B\u0438\u0448\u0435 \u0432\u0438\u0437\u043D\u0430\u0447\u0430\u044E Municipio.", "\u0422\u0430\u043A, \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u0430\u0442\u0438", "\u041D\u0435 \u0437\u0430\u0440\u0430\u0437", "Municipio"],
  };
  const testiPos = () => T_POS[langDoc()] || T_POS.en;
  const MUNICIPI_OK = /^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV)$/;
  let posChiesta = false;
  function chipMunicipio(m) {
    let c = $("chip-municipio");
    if (!m) { if (c) c.remove(); return; }
    if (!c) {
      c = document.createElement("button");
      c.id = "chip-municipio"; c.type = "button"; c.className = "press";
      c.addEventListener("click", () => { globalThis.__ppMunicipio = undefined; chipMunicipio(null); });
      const head = $("app").querySelector(".barra");
      if (head) head.insertAdjacentElement("afterend", c);
    }
    c.textContent = "\u{1F4CD} " + testiPos()[4] + " " + m + " \u00D7";
    c.setAttribute("aria-label", testiPos()[4] + " " + m);
  }
  async function cercaPosizione() {
    try {
      const { locateInBrowser } = await import("./tools.js?v=9");
      const r = await locateInBrowser();
      if (r && r.stato === "ok" && r.municipio && MUNICIPI_OK.test(r.municipio)) {
        globalThis.__ppMunicipio = r.municipio;
        chipMunicipio(r.municipio);
      }
    } catch (e) { /* senza posizione Pino chiede il quartiere */ }
  }
  function chiediPosizione() {
    const app = $("app");
    if (posChiesta || !app || app.hidden || $("benvenuto")) return;
    posChiesta = true;
    const t = testiPos();
    const box = document.createElement("div");
    box.id = "posizione"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true");
    box.innerHTML = '<div class="scheda"><div class="icona">' + SVG('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.4"/>') +
      '</div><h2></h2><p></p><button type="button" class="cta press si"></button><button type="button" class="link press no"></button></div>';
    box.querySelector("h2").textContent = t[0];
    box.querySelector("p").textContent = t[1];
    box.querySelector(".si").textContent = t[2];
    box.querySelector(".no").textContent = t[3];
    box.querySelector(".si").addEventListener("click", () => { box.remove(); cercaPosizione(); });
    box.querySelector(".no").addEventListener("click", () => box.remove());
    app.appendChild(box);
    box.querySelector(".si").focus({ preventScroll: true });
  }

  // ---------- Barra in basso come nella demo: Pino, Percorso, Profilo ----------
  // Tre viste dello stesso schermo: si mostra una parte alla volta, nulla viene ricreato.
  const SVG = (d) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
  ICONE.documenti = SVG('<path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h4l2 2.5h6a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 17z"/>');
  ICONE.profilo = SVG('<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>');
  ICONE.tastiera = SVG('<rect x="2.5" y="5.5" width="19" height="13" rx="3"/><path d="M6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M7.5 14h9"/>');
  ICONE.mic = SVG('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>');
  ICONE.stop = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2.5"/></svg>';
  ICONE.micOff = SVG('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 11.4 4.3M18.5 11a6.4 6.4 0 0 1-.3 1.9M12 17.5V21M3 3l18 18"/>');
  const VOCI = ["pino", "percorso", "documenti", "profilo"];
  function testo(id, vuoto) { const e = $(id); return (e && e.textContent.trim()) || vuoto; }
  function etichette() {
    const nav = $("tabbar");
    if (!nav) return;
    const h2 = $("steps") && $("steps").querySelector("h2");
    const mappa = { pino: "Pino", percorso: (h2 && h2.textContent.trim()) || "Percorso", documenti: (globalThis.ppDocumenti && globalThis.ppDocumenti.etichetta()) || "Documenti", profilo: testo("lingua-nome", "Profilo") };
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
      '<button type="button" class="lato press" data-az="muto" aria-pressed="false">' + ICONE.micOff + '</button>';
    dock.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      const az = b.dataset.az;
      if (az === "scrivi") { const t = $("text"); if (t && !t.disabled) t.click(); app.dataset.chat = "aperta"; }
      if (az === "muto") {
        mic.muto = !mic.muto; applicaMuto();
        b.setAttribute("aria-pressed", mic.muto ? "true" : "false");
        b.classList.toggle("spento", mic.muto);
        $("app").classList.toggle("muto", mic.muto);
      }
      if (az === "mic") {
        const stop = $("stop"), voce = $("voice");
        if (stop && !stop.disabled && statoPino() !== "idle") stop.click(); else if (voce && !voce.disabled) voce.click();
      }
    });
    main.appendChild(dock);
    const nascosti = app.querySelector(".azioni");
    if (nascosti) { nascosti.setAttribute("aria-hidden", "true"); nascosti.querySelectorAll("button").forEach((b) => { b.tabIndex = -1; }); }
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
    const mu = document.querySelector('#dock [data-az="muto"]');
    if (mu) mu.setAttribute("aria-label", mic.muto ? testiMuto()[1] : testiMuto()[0]);
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

  // ---------- Dove andare: link alla mappa dell'ufficio (arriva da find_office) ----------
  const T_MAPPA = {
    it: ["Dove andare", "Apri nella mappa"], en: ["Where to go", "Open in maps"], es: ["D\u00F3nde ir", "Abrir en el mapa"],
    fr: ["O\u00F9 aller", "Ouvrir dans la carte"], ro: ["Unde s\u0103 mergi", "Deschide pe hart\u0103"],
    ar: ["\u0623\u064A\u0646 \u062A\u0630\u0647\u0628", "\u0627\u0641\u062A\u062D \u0641\u064A \u0627\u0644\u062E\u0631\u064A\u0637\u0629"],
    uk: ["\u041A\u0443\u0434\u0438 \u0439\u0442\u0438", "\u0412\u0456\u0434\u043A\u0440\u0438\u0442\u0438 \u043D\u0430 \u043C\u0430\u043F\u0456"],
  };
  let uffici = [];
  const testiMappa = () => T_MAPPA[(document.documentElement.lang || "en").toLowerCase().split("-")[0]] || T_MAPPA.en;
  function disegnaUfficio() {
    const app = $("app"), main = app && app.querySelector("main");
    if (!main || !uffici.length) return;
    let sec = $("ufficio");
    if (!sec) {
      sec = document.createElement("section");
      sec.id = "ufficio"; sec.className = "card";
      main.insertBefore(sec, $("steps") ? $("steps").nextSibling : null);
    }
    const [titolo, bottone] = testiMappa();
    const chiave = JSON.stringify(uffici) + titolo;
    if (sec.dataset.chiave === chiave) return;
    sec.dataset.chiave = chiave;
    sec.replaceChildren();
    const h = document.createElement("h2"); h.textContent = titolo; sec.appendChild(h);
    for (const u of uffici) {
      const a = document.createElement("a");
      a.className = "mappa press"; a.href = u.link; a.target = "_blank"; a.rel = "noopener noreferrer";
      a.innerHTML = SVG('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.4"/>') +
        '<span class="testo"><strong></strong><small></small></span>';
      a.querySelector("strong").textContent = u.nome;
      a.querySelector("small").textContent = bottone;
      sec.appendChild(a);
    }
    const nav = $("tabbar"), b = nav && nav.querySelector('[data-voce="percorso"]');
    if (b && app.dataset.vista !== "percorso") b.classList.add("novita");
  }
  globalThis.addEventListener("pp:ufficio", (e) => {
    const d = e.detail || {};
    uffici = (d.mappe || []).filter((m) => m && /^https:\/\/www\.google\.com\/maps\//.test(m.link));
    disegnaUfficio();
  });

  // ---------- Percorso vuoto: dice cosa fare e porta a Pino ----------
  function percorsoVuoto() {
    const st = $("steps");
    if (!st) return;
    if (st.querySelector("li")) return;
    if ($("vuoto-vai")) return;
    const voce = $("voice"), did = $("didascalia");
    const etichetta = (did && did.textContent.trim()) || (voce && (voce.getAttribute("aria-label") || "").trim()) || "Pino";
    const b = document.createElement("button");
    b.id = "vuoto-vai"; b.type = "button"; b.className = "cta press";
    b.innerHTML = ICONE.mic + "<span></span>";
    b.querySelector("span").textContent = etichetta;
    b.addEventListener("click", () => vista("pino"));
    st.appendChild(b);
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
    disegnaUfficio();
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
li.chk { list-style: none; margin: 8px 0; }
ul:has(li.chk) { padding-left: 0; }
li.chk label { display: flex; align-items: flex-start; gap: 12px; min-height: 44px; padding: 8px 10px; border-radius: 14px; background: #fff; border: 1px solid #ECE8E1; cursor: pointer; }
li.chk input { flex: none; width: 24px; height: 24px; margin: 1px 0 0; accent-color: #F06424; }
li.chk input:checked + span { color: #5E6A6F; }
li.inf { list-style: none; margin: 8px 0; padding: 8px 10px; border-radius: 14px; background: #E6EEEE; color: #173F46; }
ul:has(li.inf) { padding-left: 0; }
#avanza { margin: 12px 20px 4px; }
#avanza .barra { height: 8px; border-radius: 99px; background: #ECE8E1; overflow: hidden; }
#avanza .barra i { display: block; height: 100%; width: 0; background: #368568; transition: width .25s; }
#avanza small { display: block; margin-top: 4px; color: #5E6A6F; font-weight: 800; font-size: 13px; }
#operatore { margin: 14px 20px 0; padding: 12px 14px; border: 1.5px dashed #173F46; border-radius: 14px; background: #fff; }
#operatore small { display: block; margin-bottom: 4px; color: #B8450F; font: 800 11px "Bricolage Grotesque", sans-serif; letter-spacing: .1em; text-transform: uppercase; }
#operatore p { margin: 0; font-size: 17px; font-weight: 700; color: #173F46; }
body { padding-bottom: 86px; }
#azioni { position: fixed; left: 0; right: 0; bottom: 0; display: flex; gap: 10px; padding: 10px 16px calc(10px + env(safe-area-inset-bottom)); background: rgba(255,253,248,.96); border-top: 1px solid #ECE8E1; }
#azioni button, #azioni a { flex: 1; min-height: 48px; display: grid; place-items: center; border: 0; border-radius: 999px; font: 800 16px "Nunito Sans", sans-serif; text-decoration: none; }
#azioni .primo { background: #F06424; color: #fff; }
#azioni .secondo { background: #E6EEEE; color: #173F46; }
@media print { #azioni, #avanza { display: none; } li.chk label { border: 0; padding: 0; } }
@media print { html { background: #fff; } body { margin: 0; max-width: none; box-shadow: none; border-radius: 0; } }
`;

  // ---------- Foglio da telefono: spunte da toccare, avanzamento, condividi, mappa ----------
  const T_FOGLIO = {
    it: ["Condividi", "Mappa", "Da dire all\u2019operatore", "Buongiorno, ho bisogno di questo servizio: ", ". Ho con me i documenti elencati.", "pronti"],
    en: ["Share", "Map", "To say to the officer", "Buongiorno, ho bisogno di questo servizio: ", ". Ho con me i documenti elencati.", "ready"],
    es: ["Compartir", "Mapa", "Para decir al funcionario", "Buongiorno, ho bisogno di questo servizio: ", ". Ho con me i documenti elencati.", "listos"],
    fr: ["Partager", "Carte", "\u00C0 dire \u00E0 l\u2019agent", "Buongiorno, ho bisogno di questo servizio: ", ". Ho con me i documenti elencati.", "pr\u00EAts"],
    ro: ["Partajeaz\u0103", "Hart\u0103", "De spus func\u021Bionarului", "Buongiorno, ho bisogno di questo servizio: ", ". Ho con me i documenti elencati.", "gata"],
    ar: ["\u0645\u0634\u0627\u0631\u0643\u0629", "\u062E\u0631\u064A\u0637\u0629", "\u0644\u062A\u0642\u0648\u0644\u0647 \u0644\u0644\u0645\u0648\u0638\u0641", "Buongiorno, ho bisogno di questo servizio: ", ". Ho con me i documenti elencati.", "\u062C\u0627\u0647\u0632"],
    uk: ["\u041F\u043E\u0434\u0456\u043B\u0438\u0442\u0438\u0441\u044F", "\u041C\u0430\u043F\u0430", "\u0429\u043E \u0441\u043A\u0430\u0437\u0430\u0442\u0438 \u043F\u0440\u0430\u0446\u0456\u0432\u043D\u0438\u043A\u0443", "Buongiorno, ho bisogno di questo servizio: ", ". Ho con me i documenti elencati.", "\u0433\u043E\u0442\u043E\u0432\u043E"],
  };
  function potenzia(d) {
    if (d.getElementById("azioni")) return;
    const T = T_FOGLIO[langDoc()] || T_FOGLIO.en;
    const titolo = (d.querySelector("h1") || {}).textContent || "Primo Passo";
    // Spunte vere al posto dei simboli
    let tot = 0;
    d.querySelectorAll("li").forEach((li) => {
      const m = /^([\u2611\u2610])\s*/.exec(li.textContent);
      if (m) {
        const testo = li.textContent.replace(/^[\u2611\u2610]\s*/, "");
        li.textContent = "";
        li.className = "chk";
        const lab = d.createElement("label"), inp = d.createElement("input"), sp = d.createElement("span");
        inp.type = "checkbox"; inp.checked = m[1] === "\u2611";
        sp.textContent = testo;
        lab.appendChild(inp); lab.appendChild(sp); li.appendChild(lab);
        tot++;
      } else if (/^\u2139/.test(li.textContent)) {
        li.textContent = li.textContent.replace(/^\u2139\s*/, "");
        li.className = "inf";
      }
    });
    // Avanzamento (si aggiorna quando si tocca una spunta)
    const av = d.createElement("div");
    av.id = "avanza";
    av.innerHTML = '<div class="barra"><i></i></div><small></small>';
    const ban = d.getElementById("banner");
    if (ban) ban.insertAdjacentElement("afterend", av);
    const agg = () => {
      const n = d.querySelectorAll("li.chk input:checked").length;
      av.querySelector("i").style.width = (tot ? Math.round((n / tot) * 100) : 0) + "%";
      av.querySelector("small").textContent = n + "/" + tot + " " + T[5];
    };
    d.addEventListener("change", agg);
    agg();
    // Frase da mostrare all'operatore (italiano), costruita solo dal titolo del percorso
    const op = d.createElement("div");
    op.id = "operatore";
    op.innerHTML = "<small></small><p></p>";
    op.querySelector("small").textContent = T[2];
    op.querySelector("p").textContent = "\u00AB" + T[3] + titolo + T[4] + "\u00BB";
    av.insertAdjacentElement("afterend", op);
    // Barra azioni fissa in basso
    const bar = d.createElement("div");
    bar.id = "azioni";
    const sh = d.createElement("button");
    sh.type = "button"; sh.className = "primo"; sh.textContent = T[0];
    sh.addEventListener("click", async () => {
      const righe = [titolo, ""];
      d.querySelectorAll("li.chk").forEach((li) => righe.push((li.querySelector("input").checked ? "\u2611 " : "\u2610 ") + li.textContent));
      const testo = righe.join("\n");
      try {
        if (navigator.share) await navigator.share({ title: titolo, text: testo });
        else if (navigator.clipboard) await navigator.clipboard.writeText(testo);
      } catch (e) { /* annullato dall'utente */ }
    });
    bar.appendChild(sh);
    if (uffici.length) {
      const a = d.createElement("a");
      a.className = "secondo"; a.href = uffici[0].link; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = "\u{1F4CD} " + T[1];
      bar.appendChild(a);
    }
    d.body.appendChild(bar);
  }
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
        potenzia(d);
      } catch (e) { /* se il foglio non si puo' stilare resta com'e' */ }
    };
    frame.addEventListener("load", inietta);
    inietta();
  }

  let attesa = 0;
  function aggiorna() { attesa = 0; try { statusbar(); onboarding(); welcomeTesti(); barra(); chiediPosizione(); percorsoVuoto(); contatori(); foglio(); } catch (e) { /* mai bloccare l'app */ } }
  const osserva = new MutationObserver(() => { if (!attesa) attesa = requestAnimationFrame(aggiorna); });
  function parti() {
    aggiorna();
    osserva.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "data-stato", "disabled"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", parti); else parti();
})();

