// Profilo arricchito: Municipio, avanzamento del percorso, aiuto gratuito, dati e privacy, informazioni, cancellazione.
// Non salva nulla di nuovo sui server: lingua e Municipio restano solo in questo browser (localStorage) e si cancellano da qui.
// Aggiunge blocchi dentro #profilo (creato da tema-demo.js). Si toglie cancellando il <script> e il <link> in index.html.
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const V = "12";
  const CHIAVI = ["titolo", "sotto", "municipio", "nonScelto", "percorso", "nessunPercorso", "passi", "aiuto", "chiama", "dati", "d1", "d2", "d3", "d4", "d5", "d6",
    "info", "sito", "codice", "licenza", "prototipo", "versione", "cancella", "conferma"];
  const RIGHE = {
    it: ["Il tuo profilo", "Tutto resta su questo dispositivo.", "Il tuo Municipio", "Non scelto: tocca per sceglierlo sulla mappa", "Il tuo percorso", "Nessun percorso avviato", "{done} passi fatti su {total}", "Aiuto gratuito", "Chiama", "Come usiamo i tuoi dati",
      "Nessun account: non ti chiediamo nome né documenti.", "Il tuo percorso resta in questa pagina e sparisce quando la chiudi.", "La lingua e il Municipio che scegli restano solo su questo dispositivo.", "Voce e testo passano dai servizi che fanno funzionare Pino (ElevenLabs e il modello linguistico).", "La posizione, se la consenti, serve solo a trovare il Municipio.", "La mappa carica le tessere da OpenStreetMap.",
      "Informazioni", "Sito del progetto", "Codice sorgente", "Licenza MIT", "Primo Passo è un prototipo: non sostituisce gli uffici e non è consulenza legale.", "Versione {v}", "Cancella i dati di questo dispositivo", "Tocca di nuovo per cancellare lingua e Municipio e ricominciare"],
    en: ["Your profile", "Everything stays on this device.", "Your Municipio", "Not chosen: tap to pick it on the map", "Your path", "No path started", "{done} steps done out of {total}", "Free help", "Call", "How we use your data",
      "No account: we don't ask for your name or documents.", "Your path stays on this page and disappears when you close it.", "The language and Municipio you choose stay only on this device.", "Voice and text go through the services that make Pino work (ElevenLabs and the language model).", "Your location, if you allow it, is only used to find your Municipio.", "The map loads its tiles from OpenStreetMap.",
      "About", "Project website", "Source code", "MIT license", "Primo Passo is a prototype: it does not replace the offices and is not legal advice.", "Version {v}", "Delete this device's data", "Tap again to delete your language and Municipio and start over"],
    es: ["Tu perfil", "Todo se queda en este dispositivo.", "Tu Municipio", "Sin elegir: toca para elegirlo en el mapa", "Tu camino", "Ningún camino iniciado", "{done} pasos hechos de {total}", "Ayuda gratuita", "Llamar", "Cómo usamos tus datos",
      "Sin cuenta: no te pedimos nombre ni documentos.", "Tu camino se queda en esta página y desaparece al cerrarla.", "El idioma y el Municipio que eliges se quedan solo en este dispositivo.", "La voz y el texto pasan por los servicios que hacen funcionar a Pino (ElevenLabs y el modelo de lenguaje).", "Tu ubicación, si la permites, solo sirve para encontrar el Municipio.", "El mapa carga sus teselas desde OpenStreetMap.",
      "Información", "Sitio del proyecto", "Código fuente", "Licencia MIT", "Primo Passo es un prototipo: no sustituye a las oficinas ni es asesoría legal.", "Versión {v}", "Borrar los datos de este dispositivo", "Toca de nuevo para borrar el idioma y el Municipio y empezar de nuevo"],
    fr: ["Votre profil", "Tout reste sur cet appareil.", "Votre Municipio", "Non choisi : touchez pour le choisir sur la carte", "Votre parcours", "Aucun parcours commencé", "{done} étapes faites sur {total}", "Aide gratuite", "Appeler", "Comment nous utilisons vos données",
      "Pas de compte : nous ne demandons ni nom ni documents.", "Votre parcours reste sur cette page et disparaît quand vous la fermez.", "La langue et le Municipio que vous choisissez restent uniquement sur cet appareil.", "La voix et le texte passent par les services qui font fonctionner Pino (ElevenLabs et le modèle de langage).", "Votre position, si vous l'autorisez, sert seulement à trouver le Municipio.", "La carte charge ses tuiles depuis OpenStreetMap.",
      "À propos", "Site du projet", "Code source", "Licence MIT", "Primo Passo est un prototype : il ne remplace pas les bureaux et ne constitue pas un conseil juridique.", "Version {v}", "Effacer les données de cet appareil", "Touchez encore pour effacer la langue et le Municipio et recommencer"],
    ro: ["Profilul tău", "Totul rămâne pe acest dispozitiv.", "Municipio-ul tău", "Nealeș: atinge pentru a-l alege pe hartă", "Traseul tău", "Niciun traseu început", "{done} pași făcuți din {total}", "Ajutor gratuit", "Sună", "Cum folosim datele tale",
      "Fără cont: nu cerem nici nume, nici documente.", "Traseul tău rămâne pe această pagină și dispare când o închizi.", "Limba și Municipio-ul alese rămân doar pe acest dispozitiv.", "Vocea și textul trec prin serviciile care fac să funcționeze Pino (ElevenLabs și modelul de limbaj).", "Locația, dacă o permiți, servește doar la găsirea Municipio-ului.", "Harta încarcă plăcile de la OpenStreetMap.",
      "Despre", "Site-ul proiectului", "Cod sursă", "Licență MIT", "Primo Passo este un prototip: nu înlocuiește birourile și nu e consultanță juridică.", "Versiunea {v}", "Șterge datele de pe acest dispozitiv", "Atinge din nou pentru a șterge limba și Municipio-ul și a o lua de la capăt"],
    ar: ["ملفك", "كل شيء يبقى على هذا الجهاز.", "بلديتك (Municipio)", "غير محددة: المس لاختيارها على الخريطة", "مسارك", "لم يبدأ أي مسار", "{done} خطوات منجزة من {total}", "مساعدة مجانية", "اتصل", "كيف نستخدم بياناتك",
      "بلا حساب: لا نطلب اسمك ولا وثائقك.", "يبقى مسارك في هذه الصفحة ويختفي عند إغلاقها.", "اللغة والبلدية اللتان تختارهما تبقيان على هذا الجهاز فقط.", "الصوت والنص يمرّان عبر الخدمات التي تجعل Pino يعمل (ElevenLabs ونموذج اللغة).", "موقعك، إن سمحت به، يُستخدم فقط لإيجاد البلدية.", "تحمّل الخريطة بلاطاتها من OpenStreetMap.",
      "معلومات", "موقع المشروع", "الشيفرة المصدرية", "رخصة MIT", "Primo Passo نموذج أولي: لا يحل محل المكاتب وليس استشارة قانونية.", "الإصدار {v}", "امسح بيانات هذا الجهاز", "المس مرة أخرى لمسح اللغة والبلدية والبدء من جديد"],
    uk: ["Твій профіль", "Усе лишається на цьому пристрої.", "Твій Municipio", "Не обрано: торкнись, щоб обрати на мапі", "Твій маршрут", "Жодного маршруту не розпочато", "{done} кроків виконано з {total}", "Безкоштовна допомога", "Зателефонувати", "Як ми використовуємо твої дані",
      "Без облікового запису: ми не просимо ні імені, ні документів.", "Твій маршрут лишається на цій сторінці й зникає, коли ти її закриваєш.", "Мова та Municipio, які ти обираєш, лишаються лише на цьому пристрої.", "Голос і текст проходять через сервіси, що забезпечують роботу Pino (ElevenLabs і мовна модель).", "Місцезнаходження, якщо ти дозволиш, потрібне лише для пошуку Municipio.", "Мапа завантажує плитки з OpenStreetMap.",
      "Про проєкт", "Сайт проєкту", "Вихідний код", "Ліцензія MIT", "Primo Passo — прототип: він не замінює офіси й не є юридичною консультацією.", "Версія {v}", "Видалити дані на цьому пристрої", "Торкнись ще раз, щоб видалити мову та Municipio і почати спочатку"],
  };
  const TESTI = Object.fromEntries(Object.entries(RIGHE).map(([l, r]) => [l, Object.fromEntries(CHIAVI.map((k, i) => [k, r[i]]))]));
  const lingua = () => (document.documentElement.lang || "en").toLowerCase().split("-")[0];
  const t = (k, p = {}) => ((TESTI[lingua()] || TESTI.en)[k] ?? TESTI.en[k] ?? k).replace(/\{(\w+)\}/g, (_, n) => (p[n] ?? ""));

  const SVG = (d) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
  const IC = {
    mun: SVG('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.4"/>'),
    per: SVG('<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6"/>'),
    tel: SVG('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
    ext: SVG('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
    vai: SVG('<path d="m9 6 6 6-6 6"/>'),
    cestino: SVG('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
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
  const vai = (voce) => { const b = document.querySelector(`#tabbar [data-voce="${voce}"]`); if (b) b.click(); };
  let uffici = null;
  fetch(`data/uffici.json?v=${V}`).then((r) => r.json()).then((u) => { uffici = u; disegna(); }).catch(() => { /* senza dati restano gli altri blocchi */ });

  const municipioSalvato = () => { try { const s = localStorage.getItem("primoPasso.municipio"); return s && /^[IVX]{1,5}$/.test(s) ? s : ""; } catch { return ""; } };
  const telDi = (s) => { const m = /(?:tel\.?|telefono)\s*([\d][\d ]{4,})/i.exec(s || ""); return m ? m[1].replace(/\s+/g, "") : ""; };
  function passi() {
    const li = [...document.querySelectorAll("#steps li")].filter((x) => !x.classList.contains("info"));
    return { done: li.filter((x) => x.classList.contains("done")).length, total: li.length };
  }

  function riga(icona, testo, sotto, azione, href) {
    const tag = href ? "a" : "button";
    const e = h(tag, Object.assign({ class: "pf-riga press" }, href ? { href, target: href.startsWith("tel:") ? null : "_blank", rel: "noopener noreferrer" } : { type: "button", onclick: azione }),
      h("span", { class: "pf-ic", html: icona }), h("span", { class: "pf-t" }, testo, sotto ? h("small", {}, sotto) : null), h("span", { class: "pf-vai", html: href && !href.startsWith("tel:") ? IC.ext : IC.vai }));
    return e;
  }

  let conferma = false;
  function disegna() {
    const sec = $("profilo");
    if (!sec) return;
    // Due contenitori: in alto Pino, Municipio e percorso; in basso aiuto, dati, informazioni (le righe lingua e "aggiungi alla home" stanno in mezzo)
    let box = $("pf-extra"), box2 = $("pf-extra2");
    if (!box) { box = h("div", { id: "pf-extra", class: "pf-col" }); sec.prepend(box); }
    if (!box2) { box2 = h("div", { id: "pf-extra2", class: "pf-col" }); sec.appendChild(box2); }
    const m = municipioSalvato();
    const asl = m && uffici && uffici.municipi[m] ? uffici.municipi[m].asl : "";
    const p = passi();
    const aiuti = uffici ? uffici.aiuto_gratuito : [];
    const pino = $("pino") && $("pino").querySelector("svg") ? $("pino").querySelector("svg").cloneNode(true) : null;
    if (pino) { pino.removeAttribute("id"); pino.setAttribute("data-stato", "idle"); pino.setAttribute("aria-hidden", "true"); pino.classList.add("pf-pino"); }
    box.replaceChildren(
      h("div", { class: "pf-testa" }, pino, h("div", {}, h("h2", {}, t("titolo")), h("p", {}, t("sotto")))),
      h("div", { class: "pf-gruppo" },
        riga(IC.mun, t("municipio"), m ? `Municipio ${m}${asl ? " · " + asl : ""}` : t("nonScelto"), () => vai("mappa")),
        riga(IC.per, t("percorso"), p.total ? t("passi", p) : t("nessunPercorso"), () => vai("percorso"))));
    box2.replaceChildren(
      aiuti.length ? h("section", { class: "pf-card" }, h("h3", {}, t("aiuto")),
        h("div", { class: "pf-lista" }, aiuti.map((a) => {
          const tel = /060606/.test(a.nome) ? "060606" : telDi(a.contatto);
          return h("div", { class: "pf-aiuto" }, h("div", {}, h("strong", { lang: "it" }, a.nome), h("span", { lang: "it" }, a.per)),
            tel ? h("a", { class: "pf-chiama press", href: "tel:" + tel, "aria-label": t("chiama") + " " + tel }, h("span", { html: IC.tel }), tel) : null);
        }))) : null,
      h("details", { class: "pf-card pf-det" }, h("summary", {}, t("dati")), h("ul", {}, ["d1", "d2", "d3", "d4", "d5", "d6"].map((k) => h("li", {}, t(k))))),
      h("section", { class: "pf-card" }, h("h3", {}, t("info")),
        h("div", { class: "pf-lista" },
          riga(IC.ext, t("sito"), "", null, "https://mancormemec-stack.github.io/stock/"),
          riga(IC.ext, t("codice"), "github.com/mancormemec-stack/primo-passo", null, "https://github.com/mancormemec-stack/primo-passo"),
          riga(IC.ext, t("licenza"), "", null, "https://github.com/mancormemec-stack/primo-passo/blob/main/LICENSE")),
        h("p", { class: "pf-nota" }, t("prototipo")), h("p", { class: "pf-nota" }, t("versione", { v: V }))),
      h("button", { type: "button", class: "pf-cancella press" + (conferma ? " conferma" : ""), onclick: cancella }, h("span", { html: IC.cestino }), conferma ? t("conferma") : t("cancella")));
  }
  function cancella() {
    if (!conferma) { conferma = true; disegna(); setTimeout(() => { conferma = false; disegna(); }, 6000); return; }
    try { Object.keys(localStorage).filter((k) => k.startsWith("primoPasso.")).forEach((k) => localStorage.removeItem(k)); } catch { /* nulla da cancellare */ }
    location.reload();
  }

  new MutationObserver(() => disegna()).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  globalThis.addEventListener("pp:municipio", disegna);
  // Aggiorna i dati del percorso quando si apre il profilo
  let ultima = null;
  setInterval(() => {
    if (!$("pf-extra") && $("profilo")) disegna();
    const a = $("app"), v = a && a.dataset.vista;
    if (v !== ultima) { ultima = v; if (v === "profilo") { conferma = false; disegna(); } }
  }, 400);
  document.addEventListener("DOMContentLoaded", disegna);
})();
