// Scheda "Documenti": MOCKUP CONCETTUALE con stati di esempio (come nella demo Lovable).
// Non carica file, non salva nulla, non riconosce documenti e non tocca strumenti, agente o dati.
// Una cosa è vera: i collegamenti tra documenti e percorsi vengono dai prerequisiti reali di data/percorsi.json
// (quali documenti servono a quale percorso, e se sono obbligatori o facoltativi). Lo STATO (caricato / da aggiungere)
// è inventato, e la pagina lo dice. Si toglie cancellando il <script> e il <link> in index.html.
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // ---------- Testi (le altre lingue ricadono sull'inglese) ----------
  const CHIAVI = ["tab", "titolo", "sotto", "concetto", "esempio", "riepilogo", "pronti", "mancanti", "caricato", "aggiungi", "aggiungiNota",
    "pino", "pinoMsg", "elenco", "perPercorso", "dettaglio", "servePer", "stato", "scadenza", "scadenzaNo", "facsimile", "vediPercorso",
    "contaPercorso", "obbligatorio", "facoltativo", "indietro", "apri",
    "d.permesso", "d.passaporto", "d.cf", "d.residenza", "d.alloggio", "d.lavoro", "d.bollo", "d.foto", "d.bollettini"];
  const RIGHE = {
    it: ["Documenti", "I tuoi documenti", "Tutto quello che ti serve, in un unico posto", "Mockup concettuale", "Dati di esempio", "{done} di {total} pronti", "Pronti", "Da aggiungere", "Caricato · Esempio", "Aggiungi documento", "Nella demo non si caricano file.",
      "Pino ti avvisa", "Ti manca «{doc}» per il prossimo passaggio del tuo percorso.", "Elenco", "Per percorso", "Dettaglio documento", "Serve per questi percorsi", "Stato", "Scadenza", "Non indicata (dato di esempio)", "Facsimile", "Vedi nel percorso",
      "{done} di {total} documenti pronti", "obbligatorio", "facoltativo", "Indietro", "Apri {name}",
      "Permesso di soggiorno (o ricevuta)", "Passaporto valido", "Codice fiscale", "Residenza o dichiarazione di dimora", "Titolo dell'alloggio (affitto o proprietà)", "Documenti di lavoro", "Marca da bollo", "Fototessera", "Bollettini postali"],
    en: ["Documents", "Your documents", "Everything you need, in one place", "Conceptual mockup", "Sample data", "{done} of {total} ready", "Ready", "To add", "Uploaded · Example", "Add document", "Files are not uploaded in the demo.",
      "Pino lets you know", "You are missing “{doc}” for the next step of your path.", "List", "By path", "Document details", "Needed for these paths", "Status", "Expiry", "Not shown (sample data)", "Specimen", "See in the path",
      "{done} of {total} documents ready", "required", "optional", "Back", "Open {name}",
      "Residence permit (or receipt)", "Valid passport", "Tax code (codice fiscale)", "Residence or declaration of address", "Housing title (rental contract or ownership)", "Work documents", "Revenue stamp (marca da bollo)", "Passport photo", "Postal payment slips"],
    es: ["Documentos", "Tus documentos", "Todo lo que necesitas, en un solo lugar", "Maqueta conceptual", "Datos de ejemplo", "{done} de {total} listos", "Listos", "Por añadir", "Subido · Ejemplo", "Añadir documento", "En la demo no se suben archivos.",
      "Pino te avisa", "Te falta «{doc}» para el siguiente paso de tu camino.", "Lista", "Por camino", "Detalle del documento", "Necesario para estos caminos", "Estado", "Caducidad", "No indicada (dato de ejemplo)", "Espécimen", "Ver en el camino",
      "{done} de {total} documentos listos", "obligatorio", "opcional", "Atrás", "Abrir {name}",
      "Permiso de residencia (o recibo)", "Pasaporte válido", "Código fiscal (codice fiscale)", "Residencia o declaración de domicilio", "Título de la vivienda (alquiler o propiedad)", "Documentos de trabajo", "Timbre fiscal (marca da bollo)", "Foto de carné", "Recibos de pago postales"],
    fr: ["Documents", "Vos documents", "Tout ce qu'il vous faut, au même endroit", "Maquette conceptuelle", "Données d'exemple", "{done} sur {total} prêts", "Prêts", "À ajouter", "Téléversé · Exemple", "Ajouter un document", "Dans la démo, aucun fichier n'est envoyé.",
      "Pino vous prévient", "Il vous manque « {doc} » pour la prochaine étape de votre parcours.", "Liste", "Par parcours", "Détail du document", "Nécessaire pour ces parcours", "Statut", "Expiration", "Non indiquée (donnée d'exemple)", "Spécimen", "Voir dans le parcours",
      "{done} sur {total} documents prêts", "obligatoire", "facultatif", "Retour", "Ouvrir {name}",
      "Permis de séjour (ou récépissé)", "Passeport valide", "Code fiscal (codice fiscale)", "Résidence ou déclaration de domicile", "Titre d'occupation (bail ou propriété)", "Documents de travail", "Timbre fiscal (marca da bollo)", "Photo d'identité", "Bulletins de paiement postaux"],
    ro: ["Documente", "Documentele tale", "Tot ce ai nevoie, într-un singur loc", "Machetă conceptuală", "Date de exemplu", "{done} din {total} gata", "Gata", "De adăugat", "Încărcat · Exemplu", "Adaugă document", "În demo nu se încarcă fișiere.",
      "Pino te anunță", "Îți lipsește „{doc}” pentru următorul pas din traseul tău.", "Listă", "Pe traseu", "Detalii document", "Necesar pentru aceste trasee", "Stare", "Expirare", "Nu este indicată (date de exemplu)", "Specimen", "Vezi în traseu",
      "{done} din {total} documente gata", "obligatoriu", "facultativ", "Înapoi", "Deschide {name}",
      "Permis de ședere (sau chitanța)", "Pașaport valabil", "Cod fiscal (codice fiscale)", "Rezidență sau declarație de domiciliu", "Act de locuință (chirie sau proprietate)", "Documente de muncă", "Timbru fiscal (marca da bollo)", "Fotografie tip pașaport", "Chitanțe poștale de plată"],
    ar: ["الوثائق", "وثائقك", "كل ما تحتاجه في مكان واحد", "نموذج مفاهيمي", "بيانات تجريبية", "{done} من {total} جاهزة", "جاهزة", "للإضافة", "مرفوعة · مثال", "أضف وثيقة", "لا يتم رفع ملفات في العرض التجريبي.",
      "Pino ينبّهك", "تنقصك «{doc}» للخطوة التالية في مسارك.", "قائمة", "حسب المسار", "تفاصيل الوثيقة", "مطلوبة لهذه المسارات", "الحالة", "تاريخ الانتهاء", "غير مذكور (بيانات تجريبية)", "نموذج توضيحي", "اعرض في المسار",
      "{done} من {total} وثائق جاهزة", "إلزامي", "اختياري", "رجوع", "افتح {name}",
      "تصريح الإقامة (أو الإيصال)", "جواز سفر ساري", "الرقم الضريبي (codice fiscale)", "الإقامة أو إقرار السكن", "سند السكن (عقد إيجار أو ملكية)", "وثائق العمل", "الطابع المالي (marca da bollo)", "صورة شخصية", "إيصالات الدفع البريدية"],
    uk: ["Документи", "Твої документи", "Усе потрібне — в одному місці", "Концептуальний макет", "Приклад даних", "{done} з {total} готові", "Готові", "Треба додати", "Завантажено · Приклад", "Додати документ", "У демо файли не завантажуються.",
      "Pino попереджає", "Тобі бракує «{doc}» для наступного кроку твого маршруту.", "Список", "За маршрутом", "Деталі документа", "Потрібен для цих маршрутів", "Стан", "Термін дії", "Не вказано (приклад даних)", "Зразок", "Дивись у маршруті",
      "{done} з {total} документів готові", "обов'язково", "за бажанням", "Назад", "Відкрити {name}",
      "Дозвіл на проживання (або квитанція)", "Дійсний паспорт", "Податковий код (codice fiscale)", "Реєстрація або декларація про місце проживання", "Документ на житло (оренда або власність)", "Документи про роботу", "Гербова марка (marca da bollo)", "Фото на документи", "Поштові квитанції про оплату"],
  };
  const TESTI = Object.fromEntries(Object.entries(RIGHE).map(([l, r]) => [l, Object.fromEntries(CHIAVI.map((k, i) => [k, r[i]]))]));
  const lingua = () => (document.documentElement.lang || "en").toLowerCase().split("-")[0];
  const t = (k, p = {}) => {
    const s = (TESTI[lingua()] || TESTI.en)[k] ?? TESTI.en[k] ?? k;
    return s.replace(/\{(\w+)\}/g, (_, n) => (p[n] ?? ""));
  };

  // ---------- Dati: documenti (stato di ESEMPIO) e collegamenti ai percorsi (REALI, da percorsi.json) ----------
  const DOCS = [
    { id: "permesso", icona: "id", stato: "caricato" },
    { id: "passaporto", icona: "id", stato: "caricato" },
    { id: "cf", icona: "check", stato: "caricato" },
    { id: "residenza", icona: "casa", stato: "mancante" },
    { id: "alloggio", icona: "file", stato: "mancante" },
    { id: "lavoro", icona: "file", stato: "mancante" },
    { id: "bollo", icona: "bollo", stato: "mancante" },
    { id: "foto", icona: "foto", stato: "mancante" },
    { id: "bollettini", icona: "file", stato: "mancante" },
  ];
  // id dei prerequisiti in percorsi.json -> documento della scheda
  const DI = {
    permesso_o_ricevuta: "permesso", permesso_attuale: "permesso", passaporto: "passaporto", documento_riconoscimento: "passaporto",
    codice_fiscale: "cf", residenza_o_domicilio: "residenza", alloggio_o_residenza: "residenza", residenza_roma: "residenza",
    titolo_alloggio: "alloggio", dati_occupazione: "alloggio", documenti_lavoro: "lavoro", prova_motivo: "lavoro",
    marca_bollo: "bollo", bollettini: "bollettini", foto: "foto",
  };
  let percorsi = []; // [{id, titolo, docs: Map(docId -> obbligatorio)}]
  const docDi = (id) => DOCS.find((d) => d.id === id);
  const pronto = (d) => d.stato === "caricato";
  const nome = (d) => t("d." + d.id);
  function usoDi(docId) { return percorsi.filter((p) => p.docs.has(docId)).map((p) => ({ p, obbl: p.docs.get(docId) })); }

  // ---------- Icone ----------
  const SVG = (d) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
  const ICONE = {
    id: SVG('<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="11" r="2"/><path d="M14 10h4M14 14h4M6.5 16c.6-1.2 1.5-1.8 2.5-1.8s1.9.6 2.5 1.8"/>'),
    check: SVG('<circle cx="12" cy="12" r="9"/><path d="m8.5 12.3 2.4 2.4 4.6-5"/>'),
    casa: SVG('<path d="M4 11.5 12 5l8 6.5"/><path d="M6 10.5V19h12v-8.5"/><path d="M10 19v-5h4v5"/>'),
    file: SVG('<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>'),
    bollo: SVG('<rect x="5" y="5" width="14" height="14" rx="1"/><path d="M8 9h8M8 12h8M8 15h4"/>'),
    foto: SVG('<rect x="3" y="6" width="18" height="14" rx="3"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l1.5-2h5L16 6"/>'),
    vai: SVG('<path d="m9 6 6 6-6 6"/>'),
    ok: SVG('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
    vuoto: SVG('<circle cx="12" cy="12" r="8" stroke-dasharray="3 3"/>'),
    piu: SVG('<path d="M12 5v14M5 12h14"/>'),
    indietro: SVG('<path d="m15 6-6 6 6 6"/>'),
    prova: SVG('<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.5 15h9"/>'),
    percorso: SVG('<circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="18" r="2.2"/><path d="M8.2 6H15a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h6.8"/>'),
  };

  // ---------- Piccolo costruttore DOM ----------
  function h(tag, props, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (k === "class") e.className = v;
      else if (k === "html") e.innerHTML = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, "");
      else if (v !== false && v != null) e.setAttribute(k, v);
    }
    for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
    return e;
  }
  const chip = (d) => pronto(d)
    ? h("span", { class: "dc-chip ok", html: ICONE.ok + "<span></span>" })
    : h("span", { class: "dc-chip warn", html: ICONE.vuoto + "<span></span>" });
  function chipDoc(d) { const c = chip(d); c.querySelector("span").textContent = pronto(d) ? t("caricato") : t("mancanti"); return c; }
  const barra = (n, tot) => h("span", { class: "dc-barra", "aria-hidden": "true" }, h("span", { style: "transform:scaleX(" + (tot ? n / tot : 0) + ")" }));

  // ---------- Viste ----------
  const st = { vista: "elenco", doc: null, nota: false };
  const sec = () => $("documenti");

  function vaiAlPercorso() { const b = document.querySelector('#tabbar [data-voce="percorso"]'); if (b) b.click(); }

  function riga(d) {
    const b = h("button", { type: "button", class: "dc-riga press", "aria-label": t("apri", { name: nome(d) }),
      onclick: () => { st.doc = d.id; st.vista = "dettaglio"; render(); } },
      h("span", { class: "dc-icona " + (pronto(d) ? "ok" : ""), html: ICONE[d.icona] }),
      h("span", { class: "dc-testo" }, h("strong", { lang: lingua() }, nome(d)), chipDoc(d)),
      h("span", { class: "dc-vai", html: ICONE.vai }));
    return b;
  }

  function intestazione() {
    const pronti = DOCS.filter(pronto).length;
    return h("header", { class: "dc-testa" },
      h("span", { class: "dc-pill", html: ICONE.prova + "<span></span>" }),
      h("h2", {}, t("titolo")),
      h("p", { class: "dc-sotto" }, t("sotto")),
      h("p", { class: "dc-riepilogo" }, t("riepilogo", { done: pronti, total: DOCS.length })),
      barra(pronti, DOCS.length));
  }

  function elenco() {
    const mancante = docDi("residenza") && !pronto(docDi("residenza")) ? docDi("residenza") : DOCS.find((d) => !pronto(d));
    const pino = $("pino") && $("pino").querySelector("svg") ? $("pino").querySelector("svg").cloneNode(true) : null;
    if (pino) { pino.removeAttribute("id"); pino.setAttribute("data-stato", "idle"); pino.setAttribute("aria-hidden", "true"); pino.classList.add("dc-pino"); }
    const pronti = DOCS.filter(pronto), mancanti = DOCS.filter((d) => !pronto(d));
    const nota = h("p", { class: "dc-nota", role: "status", hidden: !st.nota }, t("aggiungiNota"));
    return h("div", { class: "dc-vista" },
      intestazione(),
      segmenti(),
      st.vista === "elenco" ? h("div", { class: "dc-corpo" },
        h("section", { class: "dc-avviso", "aria-labelledby": "dc-pino-t" }, pino,
          h("div", {}, h("h3", { id: "dc-pino-t" }, t("pino")), h("p", { lang: lingua() }, mancante ? t("pinoMsg", { doc: nome(mancante) }) : ""),
            h("button", { type: "button", class: "dc-btn press", onclick: vaiAlPercorso }, t("vediPercorso")))),
        h("section", {}, h("h3", { class: "dc-gruppo" }, t("pronti") + " · " + pronti.length), h("div", { class: "dc-lista" }, pronti.map(riga))),
        h("section", {}, h("h3", { class: "dc-gruppo" }, t("mancanti") + " · " + mancanti.length), h("div", { class: "dc-lista" }, mancanti.map(riga))),
        h("button", { type: "button", class: "dc-aggiungi press", "aria-expanded": String(st.nota), onclick: () => { st.nota = !st.nota; render(); } }, h("span", { html: ICONE.piu }), t("aggiungi")),
        nota) : perPercorso(),
      h("p", { class: "dc-pie" }, t("concetto") + " · " + t("esempio")));
  }

  function segmenti() {
    const voce = (v, k) => h("button", { type: "button", role: "radio", "aria-checked": String(st.vista === v), class: "press",
      onclick: () => { st.vista = v; render(); } }, t(k));
    return h("div", { class: "dc-segmenti", role: "radiogroup", "aria-label": t("titolo") }, voce("elenco", "elenco"), voce("percorso", "perPercorso"));
  }

  function perPercorso() {
    return h("div", { class: "dc-corpo" }, percorsi.map((p) => {
      const ds = [...p.docs.keys()].map(docDi).filter(Boolean);
      const pronti = ds.filter(pronto).length;
      return h("article", { class: "dc-percorso" },
        h("header", {}, h("span", { class: "dc-icona", html: ICONE.percorso }),
          h("div", {}, h("h3", { lang: "it" }, p.titolo), h("p", {}, t("contaPercorso", { done: pronti, total: ds.length })))),
        barra(pronti, ds.length),
        h("div", { class: "dc-chips" }, ds.map((d) => h("button", { type: "button", class: "dc-doc " + (pronto(d) ? "ok" : "warn") + " press", "aria-label": t("apri", { name: nome(d) }),
          onclick: () => { st.doc = d.id; st.vista = "dettaglio"; render(); },
          html: (pronto(d) ? ICONE.ok : ICONE.vuoto) }, h("span", { lang: lingua() }, nome(d)), p.docs.get(d.id) ? "" : h("em", {}, " · " + t("facoltativo"))))));
    }));
  }

  function facsimile(d) {
    if (!pronto(d)) {
      return h("div", { class: "dc-spec vuoto" }, h("div", { html: ICONE[d.icona] }), chipDoc(d));
    }
    return h("div", { class: "dc-spec" },
      h("div", { class: "dc-spec-int", "aria-hidden": "true" }, h("span", { class: "foto" }), h("span", { class: "righe" }, h("i"), h("i"), h("i"), h("i"))),
      h("span", { class: "dc-bollo", "aria-hidden": "true" }, t("facsimile")),
      h("span", { class: "sr" }, t("facsimile")));
  }

  function dettaglio() {
    const d = docDi(st.doc);
    if (!d) { st.vista = "elenco"; return elenco(); }
    const nota = h("p", { class: "dc-nota", role: "status", hidden: !st.nota }, t("aggiungiNota"));
    return h("div", { class: "dc-vista" },
      h("header", { class: "dc-barra-top" },
        h("button", { type: "button", class: "dc-indietro press", "aria-label": t("indietro"), html: ICONE.indietro, onclick: () => { st.vista = "elenco"; st.doc = null; render(); } }),
        h("h2", {}, t("dettaglio"))),
      h("div", { class: "dc-corpo" },
        h("div", { class: "dc-titolo-doc" }, h("span", { class: "dc-icona " + (pronto(d) ? "ok" : ""), html: ICONE[d.icona] }), h("h3", { lang: lingua() }, nome(d))),
        facsimile(d),
        h("dl", { class: "dc-schede" },
          h("div", {}, h("dt", {}, t("stato")), h("dd", {}, chipDoc(d))),
          h("div", {}, h("dt", {}, t("scadenza")), h("dd", { class: "muted" }, t("scadenzaNo")))),
        h("section", {}, h("h3", { class: "dc-gruppo" }, t("servePer")),
          h("ul", { class: "dc-usi" }, usoDi(d.id).map(({ p, obbl }) => h("li", {}, h("button", { type: "button", class: "dc-riga press", onclick: vaiAlPercorso },
            h("span", { class: "dc-icona", html: ICONE.percorso }), h("span", { class: "dc-testo" }, h("strong", { lang: "it" }, p.titolo), h("small", {}, obbl ? t("obbligatorio") : t("facoltativo"))),
            h("span", { class: "dc-vai", html: ICONE.vai })))))),
        h("button", { type: "button", class: "dc-btn grande press", onclick: vaiAlPercorso }, t("vediPercorso")),
        !pronto(d) ? h("button", { type: "button", class: "dc-aggiungi press", "aria-expanded": String(st.nota), onclick: () => { st.nota = !st.nota; render(); } }, h("span", { html: ICONE.piu }), t("aggiungi")) : null,
        nota),
      h("p", { class: "dc-pie" }, t("concetto") + " · " + t("esempio")));
  }

  function render() {
    const s = sec();
    if (!s) return;
    const mostra = st.vista === "dettaglio" ? dettaglio() : elenco();
    s.replaceChildren(mostra);
    const pill = s.querySelector(".dc-pill span");
    if (pill) pill.textContent = t("concetto");
    s.dataset.vista = st.vista;
  }

  function prepara() {
    const app = $("app"), main = app && app.querySelector("main");
    if (!main || sec()) return;
    main.appendChild(h("section", { id: "documenti", "aria-label": "Documenti" }));
    render();
  }

  fetch("data/percorsi.json?v=13").then((r) => r.json()).then((j) => {
    percorsi = j.percorsi.map((p) => {
      const docs = new Map();
      for (const q of p.prerequisiti) {
        const id = DI[q.id];
        if (!id) continue;
        const obbl = q.obbligatorio !== false;
        docs.set(id, (docs.get(id) || false) || obbl);
      }
      return { id: p.id, titolo: p.titolo, docs };
    });
    render();
  }).catch(() => { /* senza dati la scheda mostra solo l'elenco di esempio */ });

  // Etichetta della scheda per la barra in basso (la legge tema-demo.js)
  globalThis.ppDocumenti = { etichetta: () => t("tab") };

  // Cambio lingua o di vista: si ridisegna; quando si apre la scheda si parte dall'elenco
  new MutationObserver(() => render()).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  let ultimaVista = null;
  setInterval(() => {
    prepara();
    const app = $("app");
    const v = app && app.dataset.vista;
    if (v !== ultimaVista) {
      ultimaVista = v;
      if (v === "documenti") { st.vista = "elenco"; st.doc = null; st.nota = false; render(); }
    }
  }, 300);
  document.addEventListener("DOMContentLoaded", prepara);
  prepara();
})();
