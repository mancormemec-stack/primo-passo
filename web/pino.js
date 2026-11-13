// Pino, la mascotte di Primo Passo. Un solo disegno (lo stesso del prototipo Lovable),
// riusato in ogni schermata: cambiano solo l'attributo data-stato e le classi CSS (pino.css).
// Le animazioni usano solo transform e opacity.

const L = "var(--pino-line)";

// Geometria identica a Pino.tsx del prototipo. Gli occhi felici e quelli aperti ci sono
// entrambi: il CSS mostra quelli giusti per lo stato, senza ridisegnare.
const SVG = `
<g class="pino-root" stroke-linejoin="round" stroke-linecap="round">
  <g class="pino-pack">
    <rect x="26" y="122" width="48" height="74" rx="18" fill="var(--pino-orange)" stroke="${L}" stroke-width="5" transform="rotate(-8 50 160)"/>
    <rect x="32" y="150" width="30" height="22" rx="8" fill="var(--pino-orange-dark)" transform="rotate(-8 50 160)"/>
  </g>
  <g class="pino-body">
    <path d="M62 128 Q56 176 64 214 L136 214 Q144 176 138 128 Q100 112 62 128 Z" fill="var(--pino-skin)" stroke="${L}" stroke-width="5"/>
    <path d="M70 130 Q66 170 70 200" fill="none" stroke="var(--pino-orange)" stroke-width="8"/>
    <path d="M96 196 V214 M104 196 V214" stroke="${L}" stroke-width="4"/>
    <g class="pino-flag">
      <rect x="106" y="146" width="7" height="12" fill="var(--flag-green)"/>
      <rect x="113" y="146" width="7" height="12" fill="var(--flag-white)"/>
      <rect x="120" y="146" width="7" height="12" fill="var(--flag-red)"/>
      <rect x="106" y="146" width="21" height="12" rx="1.5" fill="none" stroke="${L}" stroke-width="1.5"/>
    </g>
    <ellipse cx="60" cy="172" rx="12" ry="24" fill="var(--pino-skin)" stroke="${L}" stroke-width="5" transform="rotate(12 60 172)"/>
  </g>
  <g class="pino-arm-r">
    <path d="M134 140 Q154 120 156 96" fill="none" stroke="${L}" stroke-width="27"/>
    <path d="M134 140 Q154 120 156 96" fill="none" stroke="var(--pino-skin)" stroke-width="17"/>
    <circle cx="157" cy="90" r="13" fill="var(--pino-skin)" stroke="${L}" stroke-width="5"/>
  </g>
  <g class="pino-head">
    <circle cx="100" cy="74" r="46" fill="var(--pino-skin)" stroke="${L}" stroke-width="5"/>
    <g class="pino-cap">
      <path d="M56 66 Q56 18 102 18 Q146 20 148 62 Q100 48 56 66 Z" fill="var(--pino-orange)" stroke="${L}" stroke-width="5"/>
      <path d="M126 54 Q162 42 182 58 Q158 68 132 64 Z" fill="var(--pino-orange-dark)" stroke="${L}" stroke-width="5"/>
      <circle cx="102" cy="20" r="4" fill="var(--pino-orange-dark)"/>
    </g>
    <g class="pino-brows" fill="none" stroke="${L}" stroke-width="3">
      <path d="M78 66 Q84 62 90 65"/><path d="M110 65 Q116 62 122 66"/>
    </g>
    <g class="pino-eyes">
      <g class="pino-eyes-open">
        <g fill="${L}">
          <ellipse cx="84" cy="80" rx="5" ry="6.5"/><ellipse cx="116" cy="80" rx="5" ry="6.5"/>
          <circle cx="86" cy="77" r="1.6" fill="var(--pino-skin)"/><circle cx="118" cy="77" r="1.6" fill="var(--pino-skin)"/>
        </g>
        <g fill="var(--pino-skin)">
          <rect class="pino-lid" x="77" y="72" width="14" height="16"/>
          <rect class="pino-lid" x="109" y="72" width="14" height="16"/>
        </g>
      </g>
      <g class="pino-eyes-happy" fill="none" stroke="${L}" stroke-width="4.5">
        <path d="M78 82 Q84 74 90 82"/><path d="M110 82 Q116 74 122 82"/>
      </g>
    </g>
    <g class="pino-mouth">
      <path d="M88 94 Q100 96 112 94 Q110 110 100 110 Q90 110 88 94 Z" fill="${L}"/>
      <ellipse cx="100" cy="105" rx="6" ry="3.5" fill="var(--pino-orange)"/>
    </g>
  </g>
  <g class="pino-sparks" stroke="var(--pino-orange)" stroke-width="5">
    <line x1="164" y1="30" x2="170" y2="16"/><line x1="174" y1="40" x2="188" y2="30"/><line x1="178" y1="54" x2="194" y2="52"/>
  </g>
  <g class="pino-dots" fill="${L}">
    <circle cx="160" cy="22" r="4.5"/><circle cx="174" cy="16" r="4.5"/><circle cx="188" cy="10" r="4.5"/>
  </g>
  <g class="pino-check">
    <circle cx="36" cy="40" r="17" fill="var(--pino-ok)" stroke="${L}" stroke-width="4"/>
    <path d="M28 40 L34 46 L45 34" fill="none" stroke="#fff" stroke-width="5"/>
  </g>
</g>`;

export const STATI_PINO = ["idle", "listening", "thinking", "speaking", "success"];

// Crea un Pino dentro `contenitore`. `etichetta` (facoltativa) lo rende un'immagine con nome;
// altrimenti è decorativo e nascosto agli screen reader.
export function creaPino(contenitore, { etichetta, classe = "" } = {}) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 200 230");
  svg.setAttribute("class", `pino ${classe}`.trim());
  svg.setAttribute("data-stato", "idle");
  if (etichetta) {
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", etichetta);
  } else {
    svg.setAttribute("aria-hidden", "true");
  }
  svg.innerHTML = SVG;
  contenitore.append(svg);

  let ultimoLivello = -1;
  return {
    el: svg,
    // Uno dei cinque stati. Cambia solo un attributo: niente nuovo disegno.
    stato(s) {
      if (!STATI_PINO.includes(s)) s = "idle";
      if (svg.getAttribute("data-stato") !== s) svg.setAttribute("data-stato", s);
      if (s !== "speaking") this.livello(null);
    },
    // Apertura della bocca 0..1 dal volume reale; null = animazione generica.
    livello(x) {
      if (x == null) {
        if (ultimoLivello !== -1) {
          svg.removeAttribute("data-livello");
          svg.style.removeProperty("--bocca");
          ultimoLivello = -1;
        }
        return;
      }
      const v = Math.round((0.3 + 0.75 * Math.min(1, Math.max(0, x))) * 20) / 20; // passi di 0,05: meno ridisegni
      if (v === ultimoLivello) return;
      ultimoLivello = v;
      svg.setAttribute("data-livello", "");
      svg.style.setProperty("--bocca", v);
    },
    // L'utente sta parlando (solo in ascolto): Pino si sporge un po' di più.
    sente(on) {
      svg.toggleAttribute("data-sente", !!on);
    },
  };
}
