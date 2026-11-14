// Scheda "Mappa": Pino guida l'utente ai Municipi e a tutto quello che serve, su una mappa vera di Roma (OpenStreetMap).
// - Confini dei 15 Municipi: web/data/roma-municipi.json (OpenStreetMap, ODbL, semplificati; vedi scripts/mappa-dati.mjs).
// - Luoghi: web/data/luoghi.json, SOLO con indirizzi già presenti in uffici.json (fonti ufficiali).
// - Telefoni, PEC, ASL e testi ufficiali: web/data/uffici.json, mostrati come sono (in italiano).
// La posizione dell'utente (se la consente) resta sul dispositivo: il Municipio si ricava qui, con i confini, senza inviarla.
// Si toglie cancellando il <script> e il <link> in index.html.
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const V = "11";
  const CHIAVE = "primoPasso.municipio";

  // ---------- Testi (le altre lingue ricadono sull'inglese) ----------
  const CHIAVI = ["tab", "titolo", "guida0", "guida1", "posizione", "posNota", "posNegata", "posFuori", "dMun", "dAna", "dAsl", "dQue", "dAiu",
    "municipio", "scegli", "anaTit", "paginaUff", "telefono", "pec", "aslTit", "aslNota", "paginaAsl", "queTit", "queNota", "aiuTit", "aiuNota",
    "mostra", "arrivare", "chiama", "credito", "dati", "caricamento", "errore", "sedeEsempio", "seiQui", "srMappa", "tessere", "nessunMun", "dettagli"];
  const RIGHE = {
    it: ["Mappa", "Dove andare", "Dove devi andare? Scegli il tuo Municipio e ti dico cosa ti serve e dove.", "Sei nel Municipio {m}: per la residenza vai all'Anagrafe del Municipio, per il medico alla {asl}.", "Usa la mia posizione", "La posizione resta sul tuo telefono: serve solo a trovare il Municipio e non viene inviata a nessuno.", "Non riesco a leggere la posizione. Scegli il Municipio dalla mappa o dall'elenco.", "Sembri fuori da Roma Capitale: scegli il Municipio a mano.", "Il mio Municipio", "Anagrafe", "ASL", "Questura", "Aiuto gratuito",
      "Municipio {m}", "Scegli il tuo Municipio", "Anagrafe del Municipio {m}", "Pagina ufficiale degli uffici", "Telefono", "Scrivi alla PEC", "{asl}: sportello del medico", "È la ASL che copre il tuo Municipio. Allo sportello scegli il medico di famiglia.", "Elenco ufficiale degli sportelli", "Questura: Ufficio Immigrazione", "Ci vai con la convocazione, dopo aver spedito il kit dall'ufficio postale.", "Aiuto gratuito", "Se hai dubbi o la tua situazione è particolare, questi servizi possono aiutarti.",
      "Mostra sulla mappa", "Come arrivare", "Chiama", "Mappa © OpenStreetMap", "Dati controllati in automatico sulle fonti ufficiali il {date}, non ancora da una persona.", "Carico la mappa…", "Non riesco a caricare la mappa (serve la connessione). Le schede qui sotto funzionano lo stesso.", "Sede indicata come esempio", "Sei qui", "Mappa di Roma con i 15 Municipi", "Le tessere della mappa vengono caricate da OpenStreetMap.", "Tocca un Municipio sulla mappa o scegli dall'elenco.", "Dettagli ufficiali"],
    en: ["Map", "Where to go", "Where do you need to go? Pick your Municipio and I'll tell you what you need and where.", "You are in Municipio {m}: for residence go to the Municipio's Anagrafe, for a doctor go to {asl}.", "Use my location", "Your location stays on your phone: it is only used to find your Municipio and is not sent to anyone.", "I can't read your location. Pick your Municipio on the map or from the list.", "You seem to be outside Rome: pick your Municipio by hand.", "My Municipio", "Anagrafe", "ASL", "Questura", "Free help",
      "Municipio {m}", "Pick your Municipio", "Anagrafe of Municipio {m}", "Official page of the offices", "Phone", "Write to the PEC", "{asl}: doctor's desk", "This is the health authority that covers your Municipio. At the desk you choose your family doctor.", "Official list of desks", "Questura: Immigration Office", "You go there with your summons, after sending the kit from the post office.", "Free help", "If you have doubts or your situation is special, these services can help.",
      "Show on the map", "Directions", "Call", "Map © OpenStreetMap", "Data checked automatically against official sources on {date}, not yet by a person.", "Loading the map…", "I can't load the map (you need a connection). The cards below still work.", "Office given as an example", "You are here", "Map of Rome with its 15 Municipi", "Map tiles are loaded from OpenStreetMap.", "Tap a Municipio on the map or pick from the list.", "Official details"],
    es: ["Mapa", "Adónde ir", "¿Adónde tienes que ir? Elige tu Municipio y te digo qué necesitas y dónde.", "Estás en el Municipio {m}: para la residencia ve a la Anagrafe del Municipio, para el médico a la {asl}.", "Usar mi ubicación", "Tu ubicación se queda en tu teléfono: solo sirve para encontrar el Municipio y no se envía a nadie.", "No puedo leer tu ubicación. Elige el Municipio en el mapa o en la lista.", "Pareces estar fuera de Roma: elige el Municipio a mano.", "Mi Municipio", "Anagrafe", "ASL", "Questura", "Ayuda gratuita",
      "Municipio {m}", "Elige tu Municipio", "Anagrafe del Municipio {m}", "Página oficial de las oficinas", "Teléfono", "Escribe al PEC", "{asl}: ventanilla del médico", "Es la ASL que cubre tu Municipio. En la ventanilla eliges al médico de cabecera.", "Lista oficial de ventanillas", "Questura: Oficina de Inmigración", "Vas con la citación, después de enviar el kit desde correos.", "Ayuda gratuita", "Si tienes dudas o tu situación es especial, estos servicios pueden ayudarte.",
      "Mostrar en el mapa", "Cómo llegar", "Llamar", "Mapa © OpenStreetMap", "Datos comprobados automáticamente con fuentes oficiales el {date}, aún no por una persona.", "Cargando el mapa…", "No puedo cargar el mapa (hace falta conexión). Las fichas de abajo funcionan igualmente.", "Sede indicada como ejemplo", "Estás aquí", "Mapa de Roma con sus 15 Municipios", "Las teselas del mapa se cargan desde OpenStreetMap.", "Toca un Municipio en el mapa o elige de la lista.", "Detalles oficiales"],
    fr: ["Carte", "Où aller", "Où devez-vous aller ? Choisissez votre Municipio et je vous dis ce qu'il vous faut et où.", "Vous êtes dans le Municipio {m} : pour la résidence, allez à l'Anagrafe du Municipio, pour le médecin à la {asl}.", "Utiliser ma position", "Votre position reste sur votre téléphone : elle sert seulement à trouver le Municipio et n'est envoyée à personne.", "Je ne peux pas lire votre position. Choisissez le Municipio sur la carte ou dans la liste.", "Vous semblez être hors de Rome : choisissez le Municipio à la main.", "Mon Municipio", "Anagrafe", "ASL", "Questura", "Aide gratuite",
      "Municipio {m}", "Choisissez votre Municipio", "Anagrafe du Municipio {m}", "Page officielle des bureaux", "Téléphone", "Écrire à la PEC", "{asl} : guichet du médecin", "C'est l'ASL qui couvre votre Municipio. Au guichet, vous choisissez votre médecin traitant.", "Liste officielle des guichets", "Questura : Bureau de l'immigration", "Vous y allez avec la convocation, après avoir envoyé le kit depuis la poste.", "Aide gratuite", "Si vous avez des doutes ou une situation particulière, ces services peuvent vous aider.",
      "Voir sur la carte", "Itinéraire", "Appeler", "Carte © OpenStreetMap", "Données vérifiées automatiquement sur les sources officielles le {date}, pas encore par une personne.", "Chargement de la carte…", "Je ne peux pas charger la carte (connexion nécessaire). Les fiches ci-dessous fonctionnent quand même.", "Bureau indiqué à titre d'exemple", "Vous êtes ici", "Carte de Rome avec ses 15 Municipi", "Les tuiles de la carte sont chargées depuis OpenStreetMap.", "Touchez un Municipio sur la carte ou choisissez dans la liste.", "Détails officiels"],
    ro: ["Hartă", "Unde să mergi", "Unde trebuie să mergi? Alege Municipio-ul tău și îți spun ce-ți trebuie și unde.", "Ești în Municipio {m}: pentru rezidență mergi la Anagrafe din Municipio, pentru medic la {asl}.", "Folosește locația mea", "Locația rămâne pe telefonul tău: servește doar la găsirea Municipio-ului și nu e trimisă nimănui.", "Nu pot citi locația. Alege Municipio-ul pe hartă sau din listă.", "Pari să fii în afara Romei: alege Municipio-ul manual.", "Municipio-ul meu", "Anagrafe", "ASL", "Questura", "Ajutor gratuit",
      "Municipio {m}", "Alege Municipio-ul tău", "Anagrafe din Municipio {m}", "Pagina oficială a birourilor", "Telefon", "Scrie la PEC", "{asl}: ghișeul medicului", "Este ASL-ul care acoperă Municipio-ul tău. La ghișeu alegi medicul de familie.", "Lista oficială a ghișeelor", "Questura: Biroul de imigrări", "Mergi cu convocarea, după ce ai trimis kitul de la poștă.", "Ajutor gratuit", "Dacă ai nelămuriri sau situația ta e specială, aceste servicii te pot ajuta.",
      "Arată pe hartă", "Cum ajungi", "Sună", "Hartă © OpenStreetMap", "Date verificate automat pe surse oficiale la {date}, încă nu de o persoană.", "Se încarcă harta…", "Nu pot încărca harta (e nevoie de conexiune). Fișele de mai jos funcționează oricum.", "Sediu indicat ca exemplu", "Ești aici", "Harta Romei cu cele 15 Municipi", "Plăcile hărții sunt încărcate de la OpenStreetMap.", "Atinge un Municipio pe hartă sau alege din listă.", "Detalii oficiale"],
    ar: ["الخريطة", "إلى أين تذهب", "إلى أين تريد الذهاب؟ اختر بلديتك (Municipio) وسأخبرك بما تحتاجه وأين.", "أنت في Municipio {m}: للإقامة اذهب إلى Anagrafe البلدية، وللطبيب إلى {asl}.", "استخدم موقعي", "يبقى موقعك على هاتفك: يُستخدم فقط لإيجاد البلدية ولا يُرسل إلى أحد.", "لا أستطيع قراءة موقعك. اختر البلدية من الخريطة أو من القائمة.", "يبدو أنك خارج روما: اختر البلدية يدويًا.", "بلديتي", "Anagrafe", "ASL", "Questura", "مساعدة مجانية",
      "Municipio {m}", "اختر بلديتك", "Anagrafe في Municipio {m}", "الصفحة الرسمية للمكاتب", "الهاتف", "اكتب إلى PEC", "{asl}: شباك الطبيب", "هذه هي ASL التي تغطي بلديتك. عند الشباك تختار طبيب الأسرة.", "القائمة الرسمية للشبابيك", "Questura: مكتب الهجرة", "تذهب إليها بالاستدعاء، بعد إرسال الحزمة من مكتب البريد.", "مساعدة مجانية", "إذا كانت لديك أسئلة أو وضعك خاص، يمكن لهذه الخدمات مساعدتك.",
      "اعرض على الخريطة", "كيفية الوصول", "اتصل", "الخريطة © OpenStreetMap", "بيانات تم التحقق منها تلقائيًا من المصادر الرسمية في {date}، ولم يراجعها شخص بعد.", "جارٍ تحميل الخريطة…", "لا أستطيع تحميل الخريطة (يلزم اتصال). البطاقات أدناه تعمل مع ذلك.", "مقر مذكور كمثال", "أنت هنا", "خريطة روما مع بلدياتها الخمس عشرة", "تُحمَّل بلاطات الخريطة من OpenStreetMap.", "المس بلدية على الخريطة أو اختر من القائمة.", "تفاصيل رسمية"],
    uk: ["Мапа", "Куди йти", "Куди тобі потрібно? Обери свій Municipio, і я скажу, що тобі потрібно і де.", "Ти в Municipio {m}: для реєстрації місця проживання йди до Anagrafe муніципіо, до лікаря — до {asl}.", "Використати моє місцезнаходження", "Місцезнаходження лишається на твоєму телефоні: воно потрібне лише, щоб знайти Municipio, і нікому не надсилається.", "Не можу прочитати місцезнаходження. Обери Municipio на мапі або зі списку.", "Схоже, ти поза Римом: обери Municipio вручну.", "Мій Municipio", "Anagrafe", "ASL", "Questura", "Безкоштовна допомога",
      "Municipio {m}", "Обери свій Municipio", "Anagrafe Municipio {m}", "Офіційна сторінка офісів", "Телефон", "Написати на PEC", "{asl}: віконце лікаря", "Це ASL, що обслуговує твій Municipio. У віконці обираєш сімейного лікаря.", "Офіційний список віконець", "Questura: Імміграційний офіс", "Йдеш туди з повісткою, після того як надіслав набір з пошти.", "Безкоштовна допомога", "Якщо маєш сумніви або ситуація особлива, ці служби можуть допомогти.",
      "Показати на мапі", "Як дістатися", "Зателефонувати", "Мапа © OpenStreetMap", "Дані автоматично перевірені за офіційними джерелами {date}, ще не людиною.", "Завантажую мапу…", "Не можу завантажити мапу (потрібне з'єднання). Картки нижче працюють і так.", "Офіс указано як приклад", "Ти тут", "Мапа Рима з 15 Municipi", "Плитки мапи завантажуються з OpenStreetMap.", "Торкнись Municipio на мапі або обери зі списку.", "Офіційні деталі"],
  };
  const TESTI = Object.fromEntries(Object.entries(RIGHE).map(([l, r]) => [l, Object.fromEntries(CHIAVI.map((k, i) => [k, r[i]]))]));
  const lingua = () => (document.documentElement.lang || "en").toLowerCase().split("-")[0];
  const t = (k, p = {}) => {
    const s = (TESTI[lingua()] || TESTI.en)[k] ?? TESTI.en[k] ?? k;
    return s.replace(/\{(\w+)\}/g, (_, n) => (p[n] ?? ""));
  };

  // ---------- Dati e costanti ----------
  const ASL_COLORE = { "ASL Roma 1": "#F06424", "ASL Roma 2": "#2E8B6A", "ASL Roma 3": "#3C78A8" };
  const ASL_PAGINA = {
    "ASL Roma 1": "https://www.aslroma1.it/sportelli-di-medicina-generale",
    "ASL Roma 2": "https://www.aslroma2.it/index.php?id=322&option=com_content&view=article",
    "ASL Roma 3": "https://www.aslroma3.it/servizi-dalla-a-alla-z/i/iscrizione-servizio-sanitario-scelta-medico-o-pediatra/",
  };
  const ANAGRAFE_PAGINA = (id) => "https://www.comune.roma.it/web/it/rubrica-uffici.page?cpz=anagrafe_stato_civile_elet&mun=municipio_" + id.toLowerCase();
  const ORD = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];
  const ROMA = [41.9028, 12.4964];
  const dati = { geo: null, luoghi: [], uffici: null };
  const st = { sel: null, filtro: "mun", mappa: null, L: null, poligoni: {}, marker: {}, utente: null, caricata: false, nota: "" };
  try { const s = localStorage.getItem(CHIAVE); if (s && ORD.includes(s)) st.sel = s; } catch { /* senza memoria si sceglie ogni volta */ }

  const SVG = (d) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
  const ICONE = {
    mappa: SVG('<path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>'),
    mun: SVG('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.4"/>'),
    ana: SVG('<path d="M4 10 12 5l8 5"/><path d="M6 10v8M10 10v8M14 10v8M18 10v8M4 19h16"/>'),
    asl: SVG('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>'),
    que: SVG('<path d="M12 3 5 6v6c0 4.2 2.8 7.4 7 9 4.2-1.6 7-4.8 7-9V6z"/><path d="m9 12 2 2 4-4"/>'),
    aiu: SVG('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
    gps: SVG('<circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>'),
    vai: SVG('<path d="m9 6 6 6-6 6"/>'),
    tel: SVG('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
    mail: SVG('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 8 8 5 8-5"/>'),
    ext: SVG('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
    rotta: SVG('<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6"/>'),
  };
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
  const aslDi = (id) => (dati.uffici && dati.uffici.municipi[id] && dati.uffici.municipi[id].asl) || "";
  const telDi = (s) => { const m = /(?:tel\.?|telefono)\s*([\d][\d ]{4,})/i.exec(s || ""); return m ? m[1].replace(/\s+/g, "") : ""; };
  const dataIt = (iso) => { const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(iso || ""); return m ? `${m[3]}/${m[2]}/${m[1]}` : ""; };
  const dirLink = (l) => `https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lon}`;
  const luogo = (id) => dati.luoghi.find((l) => l.id === id);
  const dentro = (pt, anello) => { // ray casting, punti [lat, lon]
    let d = false;
    for (let i = 0, j = anello.length - 1; i < anello.length; j = i++) {
      const [yi, xi] = anello[i], [yj, xj] = anello[j];
      if (yi > pt[0] !== yj > pt[0] && pt[1] < ((xj - xi) * (pt[0] - yi)) / (yj - yi) + xi) d = !d;
    }
    return d;
  };
  const municipioDi = (lat, lon) => { const m = dati.geo.municipi.find((x) => x.anelli.some((a) => dentro([lat, lon], a))); return m ? m.id : null; };

  // ---------- Scheletro (si costruisce una volta: la mappa non va distrutta) ----------
  function prepara() {
    const app = $("app"), main = app && app.querySelector("main");
    if (!main || $("mappa")) return;
    const sec = h("section", { id: "mappa", "aria-label": "Mappa" },
      h("div", { id: "mp-guida" }), h("div", { id: "mp-barra", role: "group" }),
      h("div", { id: "mp-box" }, h("div", { id: "mp-mappa", role: "region" }), h("p", { id: "mp-stato", role: "status" })),
      h("div", { id: "mp-municipi", role: "group" }), h("div", { id: "mp-scheda" }), h("p", { id: "mp-pie" }));
    main.appendChild(sec);
    disegna();
    Promise.all([
      fetch(`data/roma-municipi.json?v=${V}`).then((r) => r.json()),
      fetch(`data/luoghi.json?v=${V}`).then((r) => r.json()),
      fetch(`data/uffici.json?v=${V}`).then((r) => r.json()),
    ]).then(([g, l, u]) => { dati.geo = g; dati.luoghi = l.luoghi; dati.uffici = u; disegna(); if (vistaAttiva()) avviaMappa(); })
      .catch(() => { st.nota = "errore"; disegna(); });
  }
  const vistaAttiva = () => { const a = $("app"); return a && a.dataset.vista === "mappa"; };

  // ---------- Parti che cambiano con lingua, Municipio e destinazione ----------
  function disegna() {
    if (!$("mappa")) return;
    guida(); barra(); municipi(); scheda(); pie();
    const box = $("mp-mappa");
    box.setAttribute("aria-label", t("srMappa"));
    const stato = $("mp-stato");
    stato.textContent = !st.caricata ? (st.nota === "errore" ? t("errore") : t("caricamento")) : "";
    stato.hidden = st.caricata;
  }

  function guida() {
    const el = $("mp-guida");
    const pino = $("pino") && $("pino").querySelector("svg") ? $("pino").querySelector("svg").cloneNode(true) : null;
    if (pino) { pino.removeAttribute("id"); pino.setAttribute("data-stato", "idle"); pino.setAttribute("aria-hidden", "true"); pino.classList.add("mp-pino"); }
    const asl = st.sel ? aslDi(st.sel) : "";
    const testo = st.sel ? t("guida1", { m: st.sel, asl }) : t("guida0");
    el.replaceChildren(h("div", { class: "mp-guida" }, pino, h("div", {},
      h("h2", {}, t("titolo")),
      h("p", { class: "mp-bolla", lang: lingua(), "aria-live": "polite" }, testo),
      h("button", { type: "button", class: "mp-gps press", onclick: usaPosizione }, h("span", { html: ICONE.gps }), t("posizione")),
      st.nota && st.nota !== "errore" ? h("p", { class: "mp-nota", role: "status" }, t(st.nota)) : h("p", { class: "mp-nota" }, t("posNota")))));
  }

  const VOCI = [["mun", "dMun", "mun"], ["ana", "dAna", "ana"], ["asl", "dAsl", "asl"], ["que", "dQue", "que"], ["aiu", "dAiu", "aiu"]];
  function barra() {
    $("mp-barra").replaceChildren(...VOCI.map(([id, k, ic]) => h("button", { type: "button", class: "mp-dest press", "aria-pressed": String(st.filtro === id),
      onclick: () => { st.filtro = id; disegna(); focus(); } }, h("span", { html: ICONE[ic] }), t(k))));
  }

  function municipi() {
    $("mp-municipi").replaceChildren(h("p", { class: "mp-etichetta", id: "mp-et" }, t("scegli")),
      h("div", { class: "mp-chips", role: "radiogroup", "aria-labelledby": "mp-et" }, ORD.map((id) => h("button", { type: "button", role: "radio", class: "mp-chip press",
        "aria-checked": String(st.sel === id), "aria-label": t("municipio", { m: id }), onclick: () => seleziona(id, true) }, id))));
  }

  const riga = (icona, testo, href, extra) => h(href ? "a" : "div", Object.assign({ class: "mp-riga press" }, href ? { href, target: href.startsWith("tel:") || href.startsWith("mailto:") ? null : "_blank", rel: "noopener noreferrer" } : {}),
    h("span", { class: "mp-ic", html: icona }), h("span", { class: "mp-t" }, testo, extra ? h("small", {}, extra) : null), href ? h("span", { class: "mp-vai", html: href.startsWith("tel:") || href.startsWith("mailto:") ? ICONE.vai : ICONE.ext }) : null);
  const dettagli = (...p) => h("details", { class: "mp-det" }, h("summary", {}, t("dettagli")), h("div", { lang: "it" }, p.filter(Boolean).map((x) => h("p", {}, x))));

  function scheda() {
    const el = $("mp-scheda");
    const u = dati.uffici;
    if (!u) { el.replaceChildren(); return; }
    const id = st.sel;
    const blocchi = [];
    if (st.filtro === "mun" || (!id && (st.filtro === "ana" || st.filtro === "asl"))) {
      if (!id) blocchi.push(h("p", { class: "mp-vuoto" }, t("nessunMun")));
      else {
        const m = u.municipi[id];
        blocchi.push(h("h3", {}, t("municipio", { m: id })), riga(ICONE.ana, t("anaTit", { m: id }), ANAGRAFE_PAGINA(id), t("paginaUff")),
          riga(ICONE.asl, aslDi(id), ASL_PAGINA[m.asl], t("paginaAsl")),
          m.telefono ? riga(ICONE.tel, t("telefono") + " " + m.telefono, "tel:" + m.telefono) : null,
          m.pec ? riga(ICONE.mail, t("pec"), "mailto:" + m.pec, m.pec) : null);
      }
    } else if (st.filtro === "ana") {
      const m = u.municipi[id];
      blocchi.push(h("h3", {}, t("anaTit", { m: id })), riga(ICONE.ana, t("paginaUff"), ANAGRAFE_PAGINA(id)),
        m.telefono ? riga(ICONE.tel, t("telefono") + " " + m.telefono, "tel:" + m.telefono) : null, m.pec ? riga(ICONE.mail, t("pec"), "mailto:" + m.pec, m.pec) : null,
        luogo("anagrafe-viii") ? h("button", { type: "button", class: "mp-riga press", onclick: () => mostraLuogo("anagrafe-viii") }, h("span", { class: "mp-ic", html: ICONE.mun }), h("span", { class: "mp-t" }, t("sedeEsempio") + ": " + luogo("anagrafe-viii").indirizzo, h("small", {}, t("mostra")))) : null,
        dettagli(u.uffici.anagrafe_municipio.come));
    } else if (st.filtro === "asl") {
      const m = u.municipi[id];
      blocchi.push(h("h3", {}, t("aslTit", { asl: m.asl })), h("p", { class: "mp-sotto" }, t("aslNota")), riga(ICONE.asl, t("paginaAsl"), ASL_PAGINA[m.asl]), dettagli(u.uffici.asl.come));
    } else if (st.filtro === "que") {
      const q = u.uffici.questura, l = luogo("questura"), tel = telDi(q.dove);
      blocchi.push(h("h3", {}, t("queTit")), h("p", { class: "mp-sotto" }, t("queNota")),
        l ? h("button", { type: "button", class: "mp-riga press", onclick: () => mostraLuogo("questura") }, h("span", { class: "mp-ic", html: ICONE.mun }), h("span", { class: "mp-t" }, l.indirizzo, h("small", {}, t("mostra")))) : null,
        l ? riga(ICONE.rotta, t("arrivare"), dirLink(l)) : null, tel ? riga(ICONE.tel, t("chiama") + " " + tel, "tel:" + tel) : null, dettagli(q.dove, q.come));
    } else if (st.filtro === "aiu") {
      blocchi.push(h("h3", {}, t("aiuTit")), h("p", { class: "mp-sotto" }, t("aiuNota")));
      for (const a of u.aiuto_gratuito) {
        const l = ["acli", "santegidio", "astalli"].map(luogo).find((x) => x && a.nome.toLowerCase().includes(x.id === "acli" ? "acli" : x.id === "santegidio" ? "egidio" : "astalli"));
        const tel = /060606/.test(a.nome) ? "060606" : telDi(a.contatto);
        blocchi.push(h("div", { class: "mp-aiuto" }, h("strong", { lang: "it" }, a.nome), h("span", { lang: "it", class: "mp-per" }, a.per),
          h("div", { class: "mp-azioni" }, l ? h("button", { type: "button", class: "mp-az press", onclick: () => mostraLuogo(l.id) }, h("span", { html: ICONE.mun }), t("mostra")) : null,
            l ? h("a", { class: "mp-az press", href: dirLink(l), target: "_blank", rel: "noopener noreferrer" }, h("span", { html: ICONE.rotta }), t("arrivare")) : null,
            tel ? h("a", { class: "mp-az press", href: "tel:" + tel }, h("span", { html: ICONE.tel }), t("chiama") + " " + tel) : null), dettagli(a.contatto)));
      }
    }
    el.replaceChildren(h("div", { class: "mp-card" }, blocchi));
  }

  function pie() {
    const u = dati.uffici;
    const q = u && u.uffici && u.uffici.questura;
    const d = q ? dataIt(q.verificato_il) : "";
    $("mp-pie").textContent = (q && q.controllo === "automatico" && d ? t("dati", { date: d }) + " " : "") + t("credito") + " · " + t("tessere");
  }

  // ---------- Mappa vera (Leaflet, caricata solo quando serve) ----------
  function carica(src, tipo) {
    return new Promise((ok, no) => {
      const e = tipo === "css" ? h("link", { rel: "stylesheet", href: src }) : h("script", { src });
      e.onload = () => ok(); e.onerror = () => no(new Error(src));
      document.head.appendChild(e);
    });
  }
  async function avviaMappa() {
    if (st.mappa || !dati.geo || !vistaAttiva() || st.caricamento) return;
    st.caricamento = true;
    try {
      if (!window.L) { await carica(`vendor/leaflet/leaflet.css?v=${V}`, "css"); await carica(`vendor/leaflet/leaflet.js?v=${V}`, "js"); }
      const L = (st.L = window.L);
      const m = (st.mappa = L.map($("mp-mappa"), { center: ROMA, zoom: 11, minZoom: 9, maxZoom: 18, zoomControl: true, attributionControl: true, worldCopyJump: false, scrollWheelZoom: false, dragging: !L.Browser.mobile, tap: false }));
      m.on("focus", () => m.scrollWheelZoom.enable());
      m.on("blur", () => m.scrollWheelZoom.disable());
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(m);
      for (const mu of dati.geo.municipi) {
        const colore = ASL_COLORE[aslDi(mu.id)] || "#173F46";
        const p = L.polygon(mu.anelli, { color: colore, weight: 2, fillColor: colore, fillOpacity: 0.14, className: "mp-poligono" }).addTo(m);
        p.on("click", () => seleziona(mu.id, false));
        p.bindTooltip("", { sticky: true, direction: "top", className: "mp-tip" });
        p.on("tooltipopen", () => p.setTooltipContent(t("municipio", { m: mu.id }) + " · " + aslDi(mu.id)));
        st.poligoni[mu.id] = p;
        L.marker(mu.centro, { interactive: false, keyboard: false, icon: L.divIcon({ className: "mp-num", html: "<span>" + mu.id + "</span>", iconSize: [34, 20] }) }).addTo(m);
      }
      for (const l of dati.luoghi) {
        const mk = L.marker([l.lat, l.lon], { title: l.nome, riseOnHover: true, icon: L.divIcon({ className: "mp-pin " + l.tipo, html: ICONE[l.tipo === "questura" ? "que" : l.tipo === "aiuto" ? "aiu" : "ana"], iconSize: [34, 34], iconAnchor: [17, 34], popupAnchor: [0, -30] }) }).addTo(m);
        mk.bindPopup(() => popup(l));
        st.marker[l.id] = mk;
      }
      st.caricata = true;
      stili(); disegna();
      setTimeout(() => { m.invalidateSize(); focus(); }, 60);
    } catch (e) {
      st.caricamento = false; st.nota = "errore"; disegna();
    }
  }
  function popup(l) {
    return h("div", { class: "mp-pop" }, h("strong", { lang: "it" }, l.nome), h("span", { lang: "it" }, l.indirizzo),
      h("a", { href: dirLink(l), target: "_blank", rel: "noopener noreferrer" }, t("arrivare")));
  }
  function stili() {
    if (!st.caricata) return;
    for (const [id, p] of Object.entries(st.poligoni)) {
      const sel = id === st.sel;
      p.setStyle({ weight: sel ? 4 : 2, fillOpacity: sel ? 0.42 : 0.14 });
      if (sel) p.bringToFront();
    }
  }
  function focus() {
    if (!st.caricata) return;
    const L = st.L, m = st.mappa;
    const aiuto = ["acli", "santegidio", "astalli"].map((i) => st.marker[i]).filter(Boolean);
    if (st.filtro === "que" && st.marker.questura) { m.setView(st.marker.questura.getLatLng(), 14); st.marker.questura.openPopup(); }
    else if (st.filtro === "aiu" && aiuto.length) m.fitBounds(L.featureGroup(aiuto).getBounds().pad(0.4), { maxZoom: 14 });
    else if (st.sel && st.poligoni[st.sel]) m.fitBounds(st.poligoni[st.sel].getBounds().pad(0.15));
    else m.setView(ROMA, 11);
  }
  function mostraLuogo(id) {
    if (!st.caricata) return;
    const mk = st.marker[id];
    if (mk) { st.mappa.setView(mk.getLatLng(), 15); mk.openPopup(); $("mp-box").scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  }
  function seleziona(id, daElenco) {
    st.sel = id; st.nota = "";
    try { localStorage.setItem(CHIAVE, id); } catch { /* pazienza */ }
    globalThis.dispatchEvent(new CustomEvent("pp:municipio", { detail: { municipio: id } }));
    stili(); disegna();
    if (st.caricata && st.poligoni[id]) st.mappa.fitBounds(st.poligoni[id].getBounds().pad(0.15));
    if (daElenco) $("mp-box").scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  // ---------- Posizione: resta sul dispositivo ----------
  function usaPosizione() {
    if (!navigator.geolocation || !dati.geo) { st.nota = "posNegata"; disegna(); return; }
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude: la, longitude: lo } = pos.coords;
      const id = municipioDi(la, lo);
      if (st.caricata) {
        if (st.utente) st.utente.remove();
        st.utente = st.L.circleMarker([la, lo], { radius: 8, color: "#fff", weight: 3, fillColor: "#1E6FD9", fillOpacity: 1 }).addTo(st.mappa).bindTooltip(t("seiQui"));
      }
      if (id) seleziona(id, false); else { st.nota = "posFuori"; disegna(); }
    }, () => { st.nota = "posNegata"; disegna(); }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 });
  }

  // Etichetta della scheda per la barra in basso (la legge tema-demo.js)
  globalThis.ppMappa = { etichetta: () => t("tab") };
  new MutationObserver(() => disegna()).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  let ultima = null;
  setInterval(() => {
    prepara();
    const a = $("app"), v = a && a.dataset.vista;
    if (v !== ultima) {
      ultima = v;
      if (v === "mappa") { if (st.mappa) setTimeout(() => { st.mappa.invalidateSize(); focus(); }, 80); else avviaMappa(); }
    }
  }, 300);
  document.addEventListener("DOMContentLoaded", prepara);
  prepara();
})();
