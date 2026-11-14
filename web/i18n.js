// Testi dell'interfaccia e direzione della scrittura.
// Tutte le 89 lingue hanno l'interfaccia tradotta, ma SOLO italiano e inglese sono scritti da noi:
// le altre sono traduzioni automatiche non riviste da madrelingua (lo dichiara la pagina).
// Pino PARLA la lingua scelta con l'agente; le lingue provate a voce restano poche.
import { AUTO } from "./i18n-auto.js?v=14";

// Lingue principali: provate a voce (tranne il bengali, ancora da provare).
export const PRINCIPALI = [
  { code: "it", nome: "Italiano" },
  { code: "en", nome: "English" },
  { code: "ro", nome: "Română" },
  { code: "ar", nome: "العربية" },
  { code: "uk", nome: "Українська" },
  { code: "fil", nome: "Filipino" },
];

// Le altre lingue che l'agente accetta: [codice, nome inglese, nome nella lingua].
const ALTRE_RIGHE = [
  ["bn", "Bengali", "বাংলা"], ["af", "Afrikaans", "Afrikaans"], ["am", "Amharic", "አማርኛ"], ["hy", "Armenian", "Հայերեն"],
  ["as", "Assamese", "অসমীয়া"], ["ast", "Asturian", "Asturianu"], ["az", "Azerbaijani", "Azərbaycanca"], ["be", "Belarusian", "Беларуская"],
  ["bs", "Bosnian", "Bosanski"], ["bg", "Bulgarian", "Български"], ["my", "Burmese", "မြန်မာ"], ["yue", "Cantonese", "粵語"],
  ["ca", "Catalan", "Català"], ["zh", "Chinese (Mandarin)", "中文"], ["hr", "Croatian", "Hrvatski"], ["cs", "Czech", "Čeština"],
  ["da", "Danish", "Dansk"], ["nl", "Dutch", "Nederlands"], ["et", "Estonian", "Eesti"], ["fi", "Finnish", "Suomi"],
  ["fr", "French", "Français"], ["gl", "Galician", "Galego"], ["ka", "Georgian", "ქართული"], ["de", "German", "Deutsch"],
  ["el", "Greek", "Ελληνικά"], ["gu", "Gujarati", "ગુજરાતી"], ["ha", "Hausa", "Hausa"], ["he", "Hebrew", "עברית"],
  ["hi", "Hindi", "हिन्दी"], ["hu", "Hungarian", "Magyar"], ["is", "Icelandic", "Íslenska"], ["id", "Indonesian", "Bahasa Indonesia"],
  ["ga", "Irish", "Gaeilge"], ["ja", "Japanese", "日本語"], ["jv", "Javanese", "Basa Jawa"], ["kn", "Kannada", "ಕನ್ನಡ"],
  ["kk", "Kazakh", "Қазақша"], ["ko", "Korean", "한국어"], ["ckb", "Kurdish (Sorani)", "کوردیی ناوەندی"], ["ky", "Kyrgyz", "Кыргызча"],
  ["lo", "Lao", "ລາວ"], ["lv", "Latvian", "Latviešu"], ["lt", "Lithuanian", "Lietuvių"], ["lg", "Luganda", "Luganda"],
  ["lb", "Luxembourgish", "Lëtzebuergesch"], ["mk", "Macedonian", "Македонски"], ["ms", "Malay", "Bahasa Melayu"], ["ml", "Malayalam", "മലയാളം"],
  ["mt", "Maltese", "Malti"], ["mi", "Maori", "Te Reo Māori"], ["mr", "Marathi", "मराठी"], ["mn", "Mongolian", "Монгол"],
  ["ne", "Nepali", "नेपाली"], ["no", "Norwegian", "Norsk"], ["oc", "Occitan", "Occitan"], ["or", "Odia", "ଓଡ଼ିଆ"],
  ["ps", "Pashto", "پښتو"], ["fa", "Persian", "فارسی"], ["pl", "Polish", "Polski"], ["pt", "Portuguese", "Português"],
  ["pa", "Punjabi", "ਪੰਜਾਬੀ"], ["ru", "Russian", "Русский"], ["sr", "Serbian", "Српски"], ["sn", "Shona", "ChiShona"],
  ["sd", "Sindhi", "سنڌي"], ["sk", "Slovak", "Slovenčina"], ["sl", "Slovenian", "Slovenščina"], ["so", "Somali", "Soomaali"],
  ["es", "Spanish", "Español"], ["sw", "Swahili", "Kiswahili"], ["sv", "Swedish", "Svenska"], ["tg", "Tajik", "Тоҷикӣ"],
  ["ta", "Tamil", "தமிழ்"], ["te", "Telugu", "తెలుగు"], ["th", "Thai", "ไทย"], ["tr", "Turkish", "Türkçe"],
  ["ur", "Urdu", "اردو"], ["uz", "Uzbek", "Oʻzbekcha"], ["vi", "Vietnamese", "Tiếng Việt"], ["cy", "Welsh", "Cymraeg"],
  ["wo", "Wolof", "Wolof"], ["yo", "Yoruba", "Yorùbá"], ["zu", "Zulu", "isiZulu"],
];
export const ALTRE = ALTRE_RIGHE.map(([code, inglese, nativo]) => ({ code, inglese, nativo }));
export const TUTTE = [...PRINCIPALI.map((l) => l.code), ...ALTRE.map((l) => l.code)];

// Lingue che si scrivono da destra a sinistra.
export const RTL = new Set(["ar", "he", "fa", "ur", "ps", "sd", "ckb"]);
export const direzione = (code) => (RTL.has(code) ? "rtl" : "ltr");

// Nome della lingua da dare all'agente nel messaggio di avvio (come faceva il menu di prima).
export function nomePerAgente(code) {
  const p = PRINCIPALI.find((l) => l.code === code);
  if (p) return p.nome;
  return ALTRE.find((l) => l.code === code)?.inglese.replace(/\s*\(.*\)/, "") || "Italiano";
}
// Nome da mostrare: nella lingua stessa.
export function nomeNativo(code) {
  return PRINCIPALI.find((l) => l.code === code)?.nome || ALTRE.find((l) => l.code === code)?.nativo || code;
}
export const provataAVoce = (code) => PRINCIPALI.some((l) => l.code === code);

const it = {
  "onb.title": "In che lingua vuoi parlare?",
  "onb.sub": "Sono Pino. Ti aiuto a capire in che ordine fare le pratiche a Roma.",
  "onb.altre": "Altre lingue",
  "onb.cerca": "Cerca una lingua",
  "onb.nessuna": "Nessuna lingua trovata",
  "onb.avanti": "Avanti",
  "onb.nonProvata": "Pino parla questa lingua, ma a voce non l'abbiamo ancora provata.",
  privacy: "Assistente automatico (IA): non sostituisce gli uffici. Nessun dato viene salvato.",
  "lingua.cambia": "Cambia lingua",
  "stato.idle": "Tocca Pino per parlare",
  "stato.idleTesto": "Scrivi la tua domanda",
  "stato.listening": "Ti ascolto",
  "stato.thinking": "Ci penso…",
  "stato.speaking": "Ti rispondo",
  "stato.success": "Fatto!",
  "parla.aria": "Parla con Pino a voce",
  scrivi: "Scrivi",
  fine: "Fine",
  placeholder: "Scrivi qui la tua domanda…",
  invia: "Invia",
  percorso: "Il tuo percorso",
  "percorso.vuoto": "I passi compariranno qui.",
  "err.mic": "Non riesco a usare il microfono. Puoi scrivere a Pino.",
  "err.rete": "La connessione si è interrotta. Tocca Pino per riprovare.",
  "err.avvio": "Pino non riesce a partire. Controlla la connessione e riprova.",
  "err.sessione": "Qualcosa non ha funzionato. Se Pino non risponde, tocca Fine e riprova.",
  "passo.dichiarato": "Dichiarato dall'utente",
  "passo.info": "Informazione",
  "sys.promemoria": "Promemoria scaricato: {nome}",
  "sys.foglio": "Foglio pronto: puoi stamparlo o salvarlo come PDF.",
  "sys.handoff": "Su questo ti indico a chi chiedere.",
  "foglio.titolo": "Foglio da portare allo sportello",
  "foglio.stampa": "Stampa / salva PDF",
  "foglio.chiudi": "Chiudi",
  "trad.auto": "Interfaccia tradotta automaticamente: non ancora rivista da madrelingua.",
};

const en = {
  "onb.title": "Which language do you want to speak?",
  "onb.sub": "I'm Pino. I help you understand in which order to do your paperwork in Rome.",
  "onb.altre": "Other languages",
  "onb.cerca": "Search for a language",
  "onb.nessuna": "No language found",
  "onb.avanti": "Next",
  "onb.nonProvata": "Pino speaks this language, but we haven't tested it by voice yet.",
  privacy: "Automatic assistant (AI): it does not replace the offices. No data is saved.",
  "lingua.cambia": "Change language",
  "stato.idle": "Tap Pino to talk",
  "stato.idleTesto": "Type your question",
  "stato.listening": "I'm listening",
  "stato.thinking": "Thinking…",
  "stato.speaking": "I'm answering",
  "stato.success": "Done!",
  "parla.aria": "Talk to Pino by voice",
  scrivi: "Write",
  fine: "End",
  placeholder: "Write your question here…",
  invia: "Send",
  percorso: "Your path",
  "percorso.vuoto": "The steps will appear here.",
  "err.mic": "I can't use the microphone. You can write to Pino instead.",
  "err.rete": "The connection was lost. Tap Pino to try again.",
  "err.avvio": "Pino can't start. Check your connection and try again.",
  "err.sessione": "Something went wrong. If Pino doesn't answer, tap End and try again.",
  "passo.dichiarato": "Declared by the user",
  "passo.info": "Information",
  "sys.promemoria": "Reminder downloaded: {nome}",
  "sys.foglio": "Sheet ready: you can print it or save it as PDF.",
  "sys.handoff": "For this, I'll tell you who to ask.",
  "foglio.titolo": "Sheet to bring to the counter",
  "foglio.stampa": "Print / save PDF",
  "foglio.chiudi": "Close",
  "trad.auto": "Automatic translation, not yet reviewed by native speakers.",
};

const ro = {
  "onb.title": "În ce limbă vrei să vorbești?",
  "onb.sub": "Sunt Pino. Te ajut să înțelegi în ce ordine să faci actele la Roma.",
  "onb.altre": "Alte limbi",
  "onb.cerca": "Caută o limbă",
  "onb.nessuna": "Nicio limbă găsită",
  "onb.avanti": "Înainte",
  "onb.nonProvata": "Pino vorbește această limbă, dar încă nu am testat-o vocal.",
  privacy: "Asistent automat (IA): nu înlocuiește birourile. Nu se salvează nicio dată.",
  "lingua.cambia": "Schimbă limba",
  "stato.idle": "Atinge-l pe Pino ca să vorbești",
  "stato.idleTesto": "Scrie întrebarea ta",
  "stato.listening": "Te ascult",
  "stato.thinking": "Mă gândesc…",
  "stato.speaking": "Îți răspund",
  "stato.success": "Gata!",
  "parla.aria": "Vorbește cu Pino",
  scrivi: "Scrie",
  fine: "Încheie",
  placeholder: "Scrie aici întrebarea ta…",
  invia: "Trimite",
  percorso: "Traseul tău",
  "percorso.vuoto": "Pașii vor apărea aici.",
  "err.mic": "Nu pot folosi microfonul. Îi poți scrie lui Pino.",
  "err.rete": "Conexiunea s-a întrerupt. Atinge-l pe Pino ca să încerci din nou.",
  "err.avvio": "Pino nu poate porni. Verifică conexiunea și încearcă din nou.",
  "err.sessione": "Ceva nu a funcționat. Dacă Pino nu răspunde, atinge Încheie și încearcă din nou.",
  "passo.dichiarato": "Declarat de utilizator",
  "passo.info": "Informație",
  "sys.promemoria": "Memento descărcat: {nome}",
  "sys.foglio": "Foaia e gata: o poți tipări sau salva ca PDF.",
  "sys.handoff": "Pentru asta, îți spun pe cine să întrebi.",
  "foglio.titolo": "Foaie de dus la ghișeu",
  "foglio.stampa": "Tipărește / salvează PDF",
  "foglio.chiudi": "Închide",
  "trad.auto": "Traducere automată, încă nerevizuită de vorbitori nativi.",
};

const ar = {
  "onb.title": "بأي لغة تريد أن تتحدث؟",
  "onb.sub": "أنا Pino. أساعدك على فهم ترتيب المعاملات في روما.",
  "onb.altre": "لغات أخرى",
  "onb.cerca": "ابحث عن لغة",
  "onb.nessuna": "لم يتم العثور على لغة",
  "onb.avanti": "التالي",
  "onb.nonProvata": "Pino يتحدث هذه اللغة، لكننا لم نجرّبها صوتيًا بعد.",
  privacy: "مساعد آلي (ذكاء اصطناعي): لا يحل محل المكاتب. لا يتم حفظ أي بيانات.",
  "lingua.cambia": "غيّر اللغة",
  "stato.idle": "المس Pino لتتحدث",
  "stato.idleTesto": "اكتب سؤالك",
  "stato.listening": "أنا أستمع",
  "stato.thinking": "أفكّر…",
  "stato.speaking": "أجيبك",
  "stato.success": "تم!",
  "parla.aria": "تحدّث مع Pino بالصوت",
  scrivi: "اكتب",
  fine: "إنهاء",
  placeholder: "اكتب سؤالك هنا…",
  invia: "إرسال",
  percorso: "مسارك",
  "percorso.vuoto": "ستظهر الخطوات هنا.",
  "err.mic": "لا أستطيع استخدام الميكروفون. يمكنك الكتابة إلى Pino.",
  "err.rete": "انقطع الاتصال. المس Pino لتحاول مرة أخرى.",
  "err.avvio": "لا يستطيع Pino البدء. تحقّق من الاتصال وحاول مرة أخرى.",
  "err.sessione": "حدث خطأ ما. إذا لم يُجب Pino، المس إنهاء وحاول مرة أخرى.",
  "passo.dichiarato": "مُصرَّح به من المستخدم",
  "passo.info": "معلومة",
  "sys.promemoria": "تم تنزيل التذكير: {nome}",
  "sys.foglio": "الورقة جاهزة: يمكنك طباعتها أو حفظها بصيغة PDF.",
  "sys.handoff": "في هذا الأمر، سأدلّك على من تسأل.",
  "foglio.titolo": "ورقة تأخذها إلى الشبّاك",
  "foglio.stampa": "اطبع / احفظ PDF",
  "foglio.chiudi": "إغلاق",
  "trad.auto": "ترجمة آلية، لم يراجعها بعد ناطقون أصليون.",
};

const uk = {
  "onb.title": "Якою мовою ти хочеш говорити?",
  "onb.sub": "Я Pino. Допомагаю зрозуміти, у якому порядку оформлювати документи в Римі.",
  "onb.altre": "Інші мови",
  "onb.cerca": "Знайди мову",
  "onb.nessuna": "Мову не знайдено",
  "onb.avanti": "Далі",
  "onb.nonProvata": "Pino розмовляє цією мовою, але голосом ми її ще не перевіряли.",
  privacy: "Автоматичний помічник (ШІ): не замінює установи. Дані не зберігаються.",
  "lingua.cambia": "Змінити мову",
  "stato.idle": "Торкнись Pino, щоб говорити",
  "stato.idleTesto": "Напиши своє питання",
  "stato.listening": "Слухаю тебе",
  "stato.thinking": "Думаю…",
  "stato.speaking": "Відповідаю",
  "stato.success": "Готово!",
  "parla.aria": "Говори з Pino голосом",
  scrivi: "Написати",
  fine: "Завершити",
  placeholder: "Напиши тут своє питання…",
  invia: "Надіслати",
  percorso: "Твій маршрут",
  "percorso.vuoto": "Кроки з'являться тут.",
  "err.mic": "Не можу використати мікрофон. Можеш написати Pino.",
  "err.rete": "З'єднання перервалося. Торкнись Pino, щоб спробувати знову.",
  "err.avvio": "Pino не може запуститися. Перевір з'єднання і спробуй знову.",
  "err.sessione": "Щось пішло не так. Якщо Pino не відповідає, торкнись «Завершити» і спробуй знову.",
  "passo.dichiarato": "Заявлено користувачем",
  "passo.info": "Інформація",
  "sys.promemoria": "Нагадування завантажено: {nome}",
  "sys.foglio": "Аркуш готовий: можеш роздрукувати його або зберегти як PDF.",
  "sys.handoff": "З цього питання я підкажу, куди звернутися.",
  "foglio.titolo": "Аркуш для віконця",
  "foglio.stampa": "Друк / зберегти PDF",
  "foglio.chiudi": "Закрити",
  "trad.auto": "Автоматичний переклад, ще не перевірений носіями мови.",
};

const fil = {
  "onb.title": "Anong wika ang gusto mong gamitin?",
  "onb.sub": "Ako si Pino. Tutulungan kitang malaman ang tamang pagkakasunod-sunod ng mga papeles sa Roma.",
  "onb.altre": "Iba pang wika",
  "onb.cerca": "Maghanap ng wika",
  "onb.nessuna": "Walang nahanap na wika",
  "onb.avanti": "Susunod",
  "onb.nonProvata": "Nagsasalita si Pino ng wikang ito, pero hindi pa namin ito nasusubukan sa boses.",
  privacy: "Awtomatikong katulong (AI): hindi nito pinapalitan ang mga opisina. Walang datos na sine-save.",
  "lingua.cambia": "Palitan ang wika",
  "stato.idle": "Pindutin si Pino para magsalita",
  "stato.idleTesto": "Isulat ang tanong mo",
  "stato.listening": "Nakikinig ako",
  "stato.thinking": "Nag-iisip…",
  "stato.speaking": "Sumasagot ako",
  "stato.success": "Tapos na!",
  "parla.aria": "Kausapin si Pino gamit ang boses",
  scrivi: "Sumulat",
  fine: "Tapusin",
  placeholder: "Isulat dito ang tanong mo…",
  invia: "Ipadala",
  percorso: "Ang ruta mo",
  "percorso.vuoto": "Lalabas dito ang mga hakbang.",
  "err.mic": "Hindi ko magamit ang mikropono. Puwede kang sumulat kay Pino.",
  "err.rete": "Naputol ang koneksyon. Pindutin si Pino para subukan ulit.",
  "err.avvio": "Hindi makapagsimula si Pino. Tingnan ang koneksyon at subukan ulit.",
  "err.sessione": "May nangyaring mali. Kung hindi sumasagot si Pino, pindutin ang Tapusin at subukan ulit.",
  "passo.dichiarato": "Idineklara ng user",
  "passo.info": "Impormasyon",
  "sys.promemoria": "Na-download ang paalala: {nome}",
  "sys.foglio": "Handa na ang papel: puwede mo itong i-print o i-save bilang PDF.",
  "sys.handoff": "Para dito, sasabihin ko kung kanino ka magtatanong.",
  "foglio.titolo": "Papel na dadalhin sa counter",
  "foglio.stampa": "I-print / i-save ang PDF",
  "foglio.chiudi": "Isara",
  "trad.auto": "Awtomatikong salin, hindi pa nasusuri ng mga katutubong tagapagsalita.",
};

const bn = {
  "onb.title": "আপনি কোন ভাষায় কথা বলতে চান?",
  "onb.sub": "আমি Pino। রোমে কাগজপত্রের কাজ কোন ক্রমে করবেন, তা বুঝতে সাহায্য করি।",
  "onb.altre": "অন্যান্য ভাষা",
  "onb.cerca": "ভাষা খুঁজুন",
  "onb.nessuna": "কোনো ভাষা পাওয়া যায়নি",
  "onb.avanti": "এগিয়ে যান",
  "onb.nonProvata": "Pino এই ভাষায় কথা বলে, কিন্তু আমরা এখনো কণ্ঠে পরীক্ষা করিনি।",
  privacy: "স্বয়ংক্রিয় সহকারী (AI): এটি অফিসের বিকল্প নয়। কোনো তথ্য সংরক্ষণ করা হয় না।",
  "lingua.cambia": "ভাষা বদলান",
  "stato.idle": "কথা বলতে Pino-কে চাপুন",
  "stato.idleTesto": "আপনার প্রশ্ন লিখুন",
  "stato.listening": "শুনছি",
  "stato.thinking": "ভাবছি…",
  "stato.speaking": "উত্তর দিচ্ছি",
  "stato.success": "হয়ে গেছে!",
  "parla.aria": "কণ্ঠে Pino-র সাথে কথা বলুন",
  scrivi: "লিখুন",
  fine: "শেষ",
  placeholder: "আপনার প্রশ্ন এখানে লিখুন…",
  invia: "পাঠান",
  percorso: "আপনার পথ",
  "percorso.vuoto": "ধাপগুলো এখানে দেখা যাবে।",
  "err.mic": "মাইক্রোফোন ব্যবহার করতে পারছি না। আপনি Pino-কে লিখতে পারেন।",
  "err.rete": "সংযোগ বিচ্ছিন্ন হয়েছে। আবার চেষ্টা করতে Pino-কে চাপুন।",
  "err.avvio": "Pino শুরু হতে পারছে না। সংযোগ দেখে আবার চেষ্টা করুন।",
  "err.sessione": "কিছু একটা ভুল হয়েছে। Pino উত্তর না দিলে শেষ চাপুন এবং আবার চেষ্টা করুন।",
  "passo.dichiarato": "ব্যবহারকারী ঘোষিত",
  "passo.info": "তথ্য",
  "sys.promemoria": "রিমাইন্ডার ডাউনলোড হয়েছে: {nome}",
  "sys.foglio": "কাগজ তৈরি: প্রিন্ট করতে বা PDF হিসেবে সেভ করতে পারেন।",
  "sys.handoff": "এ বিষয়ে কাকে জিজ্ঞেস করবেন, তা জানাচ্ছি।",
  "foglio.titolo": "কাউন্টারে নেওয়ার কাগজ",
  "foglio.stampa": "প্রিন্ট / PDF সেভ",
  "foglio.chiudi": "বন্ধ করুন",
  "trad.auto": "স্বয়ংক্রিয় অনুবাদ, মাতৃভাষীরা এখনো পর্যালোচনা করেননি।",
};

// Le 7 lingue scritte per la demo + le 82 automatiche di i18n-auto.js (tutte da rivedere).
export const TESTI = { ...AUTO, it, en, ro, ar, uk, fil, bn };

// Italiano e inglese sono scritti da noi; tutte le altre interfacce sono traduzioni automatiche.
export const traduzioneAutomatica = (code) => code !== "it" && code !== "en";

// Lingua dei testi dell'interfaccia: ora ce l'hanno tutte; l'inglese resta la rete di sicurezza.
export const linguaUI = (code) => (TESTI[code] ? code : "en");

export function traduttore(code) {
  const d = TESTI[linguaUI(code)];
  return (chiave, valori = {}) => (d[chiave] ?? it[chiave] ?? chiave).replace(/\{(\w+)\}/g, (_, k) => valori[k] ?? "");
}

// Saluti che scorrono nella prima schermata (non dipendono dalla lingua scelta).
export const SALUTI = ["Ciao!", "Hello!", "Bună!", "مرحبا!", "Привіт!", "Kumusta!", "নমস্কার!"];

// La lingua scelta resta solo in questo browser. Se il browser non lo consente, si sceglie ogni volta.
const CHIAVE = "primoPasso.lingua";
export function linguaSalvata(storage = globalThis.localStorage) {
  try {
    const c = storage?.getItem(CHIAVE);
    return c && TUTTE.includes(c) ? c : null;
  } catch {
    return null;
  }
}
export function salvaLingua(code, storage = globalThis.localStorage) {
  try {
    if (code == null) storage?.removeItem(CHIAVE);
    else if (TUTTE.includes(code)) storage?.setItem(CHIAVE, code);
  } catch {
    /* navigazione privata: pazienza */
  }
}
