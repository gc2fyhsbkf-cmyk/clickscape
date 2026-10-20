'use strict';
/* =========================================================
   CLICKSCAPE v9.21 — a proper character: layered, shaded paper doll where every
   gear type has its own shape (plate, chain, leather, robes, helms, hats, hoods,
   20+ weapon shapes, shields, capes), metals shine, trims and quality glow.
   ========================================================= */

const dhex2rgb = h => { h = String(h || '#888').replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const dshade = (h, a) => { const [r, g, b] = dhex2rgb(h); const f = c => Math.max(0, Math.min(255, Math.round(a >= 0 ? c + (255 - c) * a : c * (1 + a)))); return `rgb(${f(r)},${f(g)},${f(b)})`; };
const OL = '#120d08';                                    // outline colour
let DOLL_N = 0;

function dollSVG() {
  const uid = 'd' + (++DOLL_N);
  const L = s => { const id = lookOf(s); return id ? ITEMS[id] : null; };
  const head = L('head'), body = L('body'), legs = L('legs'), feet = L('feet'), hands = L('hands'), cape = L('cape'), neck = L('neck'), ring = L('ring'), wpn = L('weapon'), shd = L('shield');
  const skin = '#e6b58c', skinD = '#c48d62', hair = '#5a3a1e';
  const defs = [];
  // metallic / cloth gradients
  const grad = (name, col, metal) => { const id = `${uid}${name}`; defs.push(metal
    ? `<linearGradient id="${id}" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${dshade(col, -.45)}"/><stop offset=".35" stop-color="${dshade(col, .35)}"/><stop offset=".55" stop-color="${dshade(col, .05)}"/><stop offset="1" stop-color="${dshade(col, -.5)}"/></linearGradient>`
    : `<linearGradient id="${id}" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${dshade(col, -.3)}"/><stop offset=".45" stop-color="${dshade(col, .12)}"/><stop offset="1" stop-color="${dshade(col, -.35)}"/></linearGradient>`); return `url(#${id})`; };
  const isMetal = it => it && ['platebody', 'platelegs', 'full_helm', 'kiteshield', 'chainbody', 'defender'].includes(it.kind);
  const trimOf = it => it?.trim || (it?.quality ? QUAL?.[it.quality]?.c : null);
  const limb = (pts, w, fill, edge = OL) => `<path d="M${pts.map(p => p.join(' ')).join(' L')}" fill="none" stroke="${edge}" stroke-width="${w + 3}" stroke-linecap="round" stroke-linejoin="round"/><path d="M${pts.map(p => p.join(' ')).join(' L')}" fill="none" stroke="${fill}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const out = [];

  /* ---- aura for special gear ---- */
  const worn = [head, body, legs, feet, hands, cape, neck, ring, wpn, shd].filter(Boolean);
  const bestQ = Math.max(0, ...worn.map(it => it.quality || 0));
  const aura = bestQ >= 3 ? QUAL[bestQ].c : worn.some(it => (it.value || 0) >= 1e8 || /third_age|celestial|godforged|primordial|starmetal|voidsteel/.test(it.id)) ? '#ffd76a' : null;
  if (aura) { defs.push(`<radialGradient id="${uid}aura"><stop offset="0" stop-color="${aura}" stop-opacity=".55"/><stop offset=".6" stop-color="${aura}" stop-opacity=".12"/><stop offset="1" stop-color="${aura}" stop-opacity="0"/></radialGradient>`); out.push(`<ellipse class="doll-aura" cx="100" cy="135" rx="92" ry="118" fill="url(#${uid}aura)"/>`); }
  out.push(`<ellipse cx="100" cy="246" rx="58" ry="9" fill="#000" opacity=".4"/>`);

  /* ---- cape (behind) ---- */
  if (cape) {
    const c = cape.tint || '#8a2a2a', g = grad('cape', c), tr = trimOf(cape);
    const hem = cape.kind === 'batcape' ? 'L138 204 L126 218 L114 206 L100 220 L86 206 L74 218 L62 204 L50 214' : 'Q100 228 50 214';
    out.push(`<path d="M74 68 L126 68 Q142 140 150 214 ${hem} Q58 140 74 68 Z" fill="${g}" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>`);
    out.push(`<path d="M88 80 Q84 150 80 214 M112 80 Q116 150 120 214 M100 78 L100 220" stroke="${dshade(c, -.45)}" stroke-width="1.5" fill="none" opacity=".55"/>`);
    if (tr && cape.kind !== 'batcape') out.push(`<path d="M50 214 Q100 228 150 214" stroke="${tr}" stroke-width="3" fill="none"/>`);
  }

  /* ---- legs ---- */
  const lk = legs?.kind, lc = legs?.tint || '#5a4632';
  const legFill = legs ? grad('legs', lc, isMetal(legs)) : grad('legs', '#5a4632');
  if (lk === 'robeskirt') {
    out.push(limb([[90, 196], [88, 228]], 14, skinD), limb([[110, 196], [112, 228]], 14, skinD));
    out.push(`<path d="M78 146 L122 146 L136 228 Q100 236 64 228 Z" fill="${legFill}" stroke="${OL}" stroke-width="2"/><path d="M100 150 L100 230 M88 150 L80 230 M112 150 L120 230" stroke="${dshade(lc, -.4)}" stroke-width="1.3" opacity=".6"/>`);
    if (trimOf(legs)) out.push(`<path d="M64 228 Q100 236 136 228" stroke="${trimOf(legs)}" stroke-width="3" fill="none"/>`);
  } else {
    out.push(limb([[91, 148], [89, 192], [89, 228]], 19, legFill), limb([[109, 148], [111, 192], [111, 228]], 19, legFill));
    if (lk === 'platelegs') {
      out.push(`<g stroke="${OL}" stroke-width="1.5">${[[89, 192], [111, 192]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="7" fill="${dshade(lc, .25)}"/><circle cx="${x}" cy="${y}" r="2.5" fill="${dshade(lc, -.5)}"/>`).join('')}</g>`);
      out.push(`<path d="M81 172 L99 172 M101 172 L119 172 M81 212 L98 212 M102 212 L120 212" stroke="${dshade(lc, -.5)}" stroke-width="1.5"/>`);
      out.push(`<path d="M78 146 L122 146 L124 162 L100 166 L76 162 Z" fill="${dshade(lc, .1)}" stroke="${OL}" stroke-width="1.5"/>`);
    } else if (lk === 'chaps') {
      out.push(`<path d="M83 160 L83 222 M97 160 L97 222 M103 160 L103 222 M117 160 L117 222" stroke="${dshade(lc, .35)}" stroke-width="1.2" stroke-dasharray="3 3"/>`);
      out.push(`<path d="M78 146 L122 146 L122 156 L78 156 Z" fill="${dshade(lc, -.35)}" stroke="${OL}" stroke-width="1.5"/><rect x="96" y="147" width="8" height="8" rx="1" fill="#d8b040" stroke="${OL}"/>`);
    } else if (lk === 'bonelegs') {
      out.push(`<path d="M83 165 L97 165 M83 180 L97 180 M83 205 L97 205 M103 165 L117 165 M103 180 L117 180 M103 205 L117 205" stroke="#f0ead8" stroke-width="4" stroke-linecap="round"/>`);
    } else if (!legs) {
      out.push(`<path d="M78 146 L122 146 L122 154 L78 154 Z" fill="#3a2a18" stroke="${OL}" stroke-width="1.5"/>`);
    }
    if (trimOf(legs) && legs) out.push(`<path d="M80 226 L98 226 M102 226 L120 226" stroke="${trimOf(legs)}" stroke-width="3"/>`);
  }

  /* ---- feet ---- */
  const fc = feet?.tint || '#3a2614', ff = grad('feet', fc, false);
  for (const x of [87, 113]) {
    const d = x < 100 ? -1 : 1;
    out.push(`<path d="M${x - 11} 226 L${x + 11} 226 L${x + 12 + 4 * d} 236 Q${x + 4 * d} 242 ${x - 12 + 4 * d} 238 Z" fill="${ff}" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>`);
    if (feet) out.push(`<path d="M${x - 11} 226 L${x + 11} 226 L${x + 11} 220 L${x - 11} 220 Z" fill="${dshade(fc, .2)}" stroke="${OL}" stroke-width="1.5"/>`);
    if (trimOf(feet)) out.push(`<path d="M${x - 11} 221 L${x + 11} 221" stroke="${trimOf(feet)}" stroke-width="2.5"/>`);
  }

  /* ---- torso & arms ---- */
  const bk = body?.kind, bc = body?.tint || '#8a7a5a', bf = body ? grad('body', bc, isMetal(body)) : grad('body', '#9a8a62'), btr = trimOf(body);
  const sleeve = bk === 'robe' || bk === 'ghostrobe' ? 'robe' : isMetal(body) ? 'plate' : bk === 'dhidebody' ? 'leather' : body ? 'cloth' : 'bare';
  const armFill = sleeve === 'bare' ? skin : sleeve === 'leather' ? skin : bf;
  const hc = hands?.tint || skin, hf = hands ? grad('hands', hc, false) : skin;
  const armL = [[72, 76], [62, 112], [58, 140]], armR = [[128, 76], [138, 112], [142, 140]];
  if (sleeve === 'robe') {
    out.push(limb(armL, 15, bf), limb(armR, 15, bf));
    out.push(`<path d="M50 128 L66 128 L68 146 L48 146 Z" fill="${bf}" stroke="${OL}" stroke-width="2"/><path d="M134 128 L150 128 L152 146 L132 146 Z" fill="${bf}" stroke="${OL}" stroke-width="2"/>`);
  } else {
    out.push(limb(armL, 14, armFill), limb(armR, 14, armFill));
    if (sleeve === 'leather') out.push(`<path d="M54 124 L66 124 M134 124 L146 124 M55 130 L65 130 M135 130 L145 130" stroke="${dshade(bc, -.2)}" stroke-width="5" stroke-linecap="round"/>`);
    if (sleeve === 'plate') out.push(limb([[61, 118], [58, 136]], 15, dshade(bc, .15)), limb([[139, 118], [142, 136]], 15, dshade(bc, .15)));
  }
  // hands / gloves
  for (const [x, y] of [[58, 146], [142, 146]]) out.push(`<circle cx="${x}" cy="${y}" r="8" fill="${hf}" stroke="${OL}" stroke-width="2"/>`);
  if (hands && trimOf(hands)) out.push(`<path d="M51 140 L65 140 M135 140 L149 140" stroke="${trimOf(hands)}" stroke-width="2.5"/>`);
  if (ring) out.push(`<circle cx="63" cy="149" r="2.6" fill="${ring.tint || '#e0b030'}" stroke="#fff6c0" stroke-width="1"/>`);
  // torso
  const torso = sleeve === 'robe' ? 'M74 68 Q100 62 126 68 L130 150 Q100 158 70 150 Z' : 'M72 68 Q100 62 128 68 L123 142 Q100 150 77 142 Z';
  out.push(`<path d="${torso}" fill="${bf}" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>`);
  if (!body) out.push(`<path d="M92 68 L100 80 L108 68" stroke="${dshade('#9a8a62', -.4)}" stroke-width="1.5" fill="none"/><path d="M77 132 L123 132 L123 140 L77 140 Z" fill="#4a3018" stroke="${OL}" stroke-width="1.2"/><rect x="96" y="131" width="8" height="10" rx="1" fill="#c8a040" stroke="${OL}"/>`);
  if (bk === 'platebody') {
    out.push(`<path d="M80 92 Q90 104 100 96 Q110 104 120 92" stroke="${dshade(bc, -.5)}" stroke-width="1.8" fill="none"/><path d="M100 72 L100 136" stroke="${dshade(bc, .5)}" stroke-width="1.2" opacity=".7"/>`);
    out.push(`<path d="M78 120 L122 120 M77 130 L123 130" stroke="${dshade(bc, -.45)}" stroke-width="1.5"/>`);
    out.push(`<path d="M76 140 L124 140 L120 154 L80 154 Z" fill="${dshade(bc, -.1)}" stroke="${OL}" stroke-width="1.5"/>`);
    for (const [x, d] of [[72, -1], [128, 1]]) out.push(`<path d="M${x - 4 * d} 66 Q${x + 18 * d} 62 ${x + 18 * d} 84 Q${x + 6 * d} 90 ${x - 6 * d} 84 Z" fill="${grad('pd' + x, bc, true)}" stroke="${OL}" stroke-width="2"/><path d="M${x + 2 * d} 76 Q${x + 12 * d} 74 ${x + 15 * d} 82" stroke="${dshade(bc, -.4)}" stroke-width="1.3" fill="none"/>`);
  } else if (bk === 'chainbody') {
    defs.push(`<pattern id="${uid}chain" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="1.6" fill="none" stroke="${dshade(bc, -.45)}" stroke-width=".9"/></pattern>`);
    out.push(`<path d="${torso}" fill="url(#${uid}chain)" opacity=".85"/><path d="M76 138 L124 138 L124 146 L76 146 Z" fill="#4a3018" stroke="${OL}" stroke-width="1.2"/>`);
    for (const [x, d] of [[72, -1], [128, 1]]) out.push(`<path d="M${x - 2 * d} 67 Q${x + 12 * d} 64 ${x + 13 * d} 80 Q${x + 4 * d} 84 ${x - 4 * d} 80 Z" fill="${grad('cs' + x, bc, true)}" stroke="${OL}" stroke-width="1.8"/>`);
  } else if (bk === 'dhidebody') {
    defs.push(`<pattern id="${uid}scale" width="7" height="6" patternUnits="userSpaceOnUse"><path d="M0 6 Q3.5 0 7 6" fill="none" stroke="${dshade(bc, -.45)}" stroke-width=".9"/></pattern>`);
    out.push(`<path d="${torso}" fill="url(#${uid}scale)" opacity=".8"/><path d="M78 70 L120 140 M122 70 L80 140" stroke="${dshade(bc, -.55)}" stroke-width="4" opacity=".75"/><circle cx="100" cy="104" r="4" fill="#c8a040" stroke="${OL}"/>`);
  } else if (bk === 'robe' || bk === 'ghostrobe') {
    out.push(`<path d="M88 66 L100 96 L112 66" fill="${dshade(bc, -.35)}" stroke="${OL}" stroke-width="1.5"/><path d="M72 120 Q100 128 128 120 L129 130 Q100 138 71 130 Z" fill="${btr || dshade(bc, -.45)}" stroke="${OL}" stroke-width="1.3"/>`);
    out.push(`<path d="M100 96 L100 150" stroke="${dshade(bc, -.4)}" stroke-width="1.4"/>`);
  } else if (bk === 'ribcage') {
    out.push(`<path d="M82 84 Q100 92 118 84 M80 98 Q100 106 120 98 M80 112 Q100 120 120 112 M100 74 L100 132" stroke="#f0ead8" stroke-width="3.5" fill="none" stroke-linecap="round"/>`);
  }
  if (btr && body && bk !== 'robe') out.push(`<path d="${torso}" fill="none" stroke="${btr}" stroke-width="2.2" opacity=".9"/>`);

  /* ---- neck & amulet ---- */
  out.push(`<path d="M92 54 L108 54 L107 68 L93 68 Z" fill="${skinD}" stroke="${OL}" stroke-width="1.5"/>`);
  if (neck) out.push(`<path d="M88 68 Q100 86 112 68" stroke="#d8b040" stroke-width="1.6" fill="none"/><path d="M100 80 L106 86 L100 94 L94 86 Z" fill="${neck.tint || '#c03030'}" stroke="#ffe08a" stroke-width="1.5"/><circle cx="98" cy="85" r="1.5" fill="#fff" opacity=".8"/>`);

  /* ---- head ---- */
  out.push(`<circle cx="100" cy="40" r="17.5" fill="${skin}" stroke="${OL}" stroke-width="2"/>`);
  const face = `<ellipse cx="94" cy="41" rx="1.9" ry="2.4" fill="${OL}"/><ellipse cx="106" cy="41" rx="1.9" ry="2.4" fill="${OL}"/><path d="M95 49 Q100 52 105 49" stroke="${OL}" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M90 35 L97 34 M103 34 L110 35" stroke="${hair}" stroke-width="2" stroke-linecap="round"/>`;
  const hk = head?.kind, hcol = head?.tint || '#777', htr = trimOf(head), hn = (head?.name || '').toLowerCase();
  if (!head) out.push(face, `<path d="M82 38 Q82 18 100 18 Q120 18 118 38 Q114 28 106 30 Q100 24 92 30 Q86 28 82 38 Z" fill="${hair}" stroke="${OL}" stroke-width="1.8"/>`);
  else if (hk === 'full_helm') {
    const g = grad('helm', hcol, true);
    out.push(`<path d="M80 46 Q78 16 100 16 Q122 16 120 46 L120 56 Q100 62 80 56 Z" fill="${g}" stroke="${OL}" stroke-width="2.2"/>`);
    out.push(`<path d="M84 38 L116 38 L115 43 L85 43 Z" fill="#0c0805"/><path d="M100 18 L100 58" stroke="${dshade(hcol, .5)}" stroke-width="2" opacity=".6"/><path d="M90 48 L90 54 M95 48 L95 55 M105 48 L105 55 M110 48 L110 54" stroke="#0c0805" stroke-width="1.8"/>`);
    if (htr) out.push(`<path d="M80 46 Q78 16 100 16 Q122 16 120 46" stroke="${htr}" stroke-width="2.5" fill="none"/>`);
    if ((head.value || 0) > 2e5 || head.quality >= 3) out.push(`<path d="M100 16 Q112 0 128 4 Q114 8 104 18 Z" fill="${htr || '#c02020'}" stroke="${OL}" stroke-width="1.5"/>`);
  } else if (hk === 'coif') {
    out.push(face, `<path d="M80 52 Q76 14 100 14 Q124 14 120 52 L114 52 Q118 28 100 26 Q82 28 86 52 Z" fill="${grad('coif', hcol, false)}" stroke="${OL}" stroke-width="2"/><path d="M80 52 Q100 66 120 52" stroke="${OL}" stroke-width="2" fill="${dshade(hcol, -.2)}"/>`);
  } else if (hk === 'hweenmask' || hk === 'skullmask' || hk === 'pumpkinhead') {
    const c = hk === 'pumpkinhead' ? '#e8781a' : hk === 'skullmask' ? '#f0ead8' : hcol;
    out.push(`<circle cx="100" cy="40" r="19" fill="${c}" stroke="${OL}" stroke-width="2"/><path d="M90 36 L96 40 L90 42 Z M110 36 L104 40 L110 42 Z" fill="${OL}"/><path d="M90 48 Q100 54 110 48" stroke="${OL}" stroke-width="2.5" fill="none"/>${hk === 'pumpkinhead' ? `<path d="M98 21 L100 14 L104 16 L102 22" fill="#3a7a2a" stroke="${OL}"/>` : ''}`);
  } else {
    out.push(face, `<path d="M82 38 Q82 20 100 20 Q118 20 118 38 Z" fill="${hair}" stroke="${OL}" stroke-width="1.5"/>`);
    const g = grad('hat', hcol, false);
    if (/beret/.test(hn)) out.push(`<path d="M80 32 Q84 16 104 18 Q124 20 122 30 Q100 36 80 32 Z" fill="${g}" stroke="${OL}" stroke-width="2"/><circle cx="104" cy="17" r="2" fill="${dshade(hcol, -.4)}"/>`);
    else if (/headband|bandana/.test(hn)) out.push(`<path d="M82 32 L118 32 L118 38 L82 38 Z" fill="${g}" stroke="${OL}" stroke-width="1.8"/><path d="M118 34 L128 30 L126 40 Z" fill="${hcol}" stroke="${OL}" stroke-width="1.5"/>`);
    else if (/crown|tiara|circlet|halo/.test(hn)) out.push(`<path d="M82 30 L86 16 L93 26 L100 12 L107 26 L114 16 L118 30 Z" fill="${grad('crown', hcol || '#e0b030', true)}" stroke="${OL}" stroke-width="1.8"/><circle cx="100" cy="24" r="2.5" fill="#d02040"/>`);
    else if (/hood|cowl/.test(hn)) out.push(`<path d="M78 56 Q74 10 100 10 Q126 10 122 56 L114 56 Q118 26 100 24 Q82 26 86 56 Z" fill="${g}" stroke="${OL}" stroke-width="2"/>`);
    else if (/mask/.test(hn)) out.push(`<path d="M84 34 L116 34 L114 46 Q100 50 86 46 Z" fill="${g}" stroke="${OL}" stroke-width="1.8"/><ellipse cx="94" cy="40" rx="3" ry="2" fill="${OL}"/><ellipse cx="106" cy="40" rx="3" ry="2" fill="${OL}"/>`);
    else if (head.matk > 0 || /wizard|mystic|witch|infinity|mage|ahrim|ancestral/.test(hn) || hk === 'witchhat') out.push(`<path d="M74 32 Q100 40 126 32 Q122 26 112 26 Q106 6 96 -2 Q94 14 88 26 Q78 26 74 32 Z" fill="${g}" stroke="${OL}" stroke-width="2"/>${htr ? `<path d="M88 27 Q100 31 112 27" stroke="${htr}" stroke-width="3" fill="none"/>` : `<path d="M88 27 Q100 31 112 27" stroke="${dshade(hcol, -.45)}" stroke-width="3" fill="none"/>`}<path d="M98 8 L100 4 L102 8 L106 9 L102 11 L100 15 L98 11 L94 9 Z" fill="#ffe08a" opacity=".9"/>`);
    else out.push(`<path d="M78 34 Q100 40 122 34 Q118 28 112 28 Q110 14 100 14 Q90 14 88 28 Q82 28 78 34 Z" fill="${g}" stroke="${OL}" stroke-width="2"/>${/robin|ranger/.test(hn) ? `<path d="M110 18 Q126 4 132 8 Q120 12 114 24 Z" fill="#c03030" stroke="${OL}" stroke-width="1.3"/>` : ''}`);
  }

  /* ---- shield (character's left arm, viewer's right) ---- */
  if (shd) {
    const sc = shd.tint || '#888', sg = grad('shd', sc, isMetal(shd)), str = trimOf(shd);
    if (shd.kind === 'defender') out.push(`<g transform="translate(142 146) rotate(28)"><path d="M-4 0 L4 0 L3 -30 L0 -36 L-3 -30 Z" fill="${sg}" stroke="${OL}" stroke-width="1.6"/><path d="M-9 -2 L9 -2 L7 4 L-7 4 Z" fill="${dshade(sc, -.3)}" stroke="${OL}" stroke-width="1.4"/></g>`);
    else if (shd.kind === 'orb' || shd.kind === 'lantern') out.push(`<circle cx="146" cy="134" r="11" fill="${sc}" stroke="${OL}" stroke-width="2" opacity=".95"/><circle cx="142" cy="130" r="4" fill="#fff" opacity=".6"/><circle cx="146" cy="134" r="16" fill="${sc}" opacity=".2"/>`);
    else if (shd.kind === 'dfs') {
      out.push(`<path d="M126 104 Q148 97 170 104 Q172 141 148 168 Q124 141 126 104 Z" fill="${sg}" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>`);
      out.push(`<path d="M131 108 Q148 102 165 108 Q166 139 148 161 Q130 139 131 108 Z" fill="${dshade(sc, -.4)}" stroke="${str || '#ff7a1a'}" stroke-width="2.4"/>`);
      out.push(`<path d="M136 118 Q141 112 148 116 Q155 112 160 118 L157 122 Q162 127 158 135 Q153 132 148 140 Q143 132 138 135 Q134 127 139 122 Z" fill="#e8501a" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>`);
      out.push(`<path d="M142 122 L144.5 124 M154 122 L151.5 124" stroke="#ffe08a" stroke-width="2.2" stroke-linecap="round"/><path d="M137 114 L133 108 M159 114 L163 108" stroke="#3a1a0a" stroke-width="2.4" stroke-linecap="round"/>`);
      if (shd.dragonbane) out.push(`<path d="M148 168 Q140 174 144 182 Q148 176 152 182 Q156 174 148 168 Z" fill="#ffb02a" opacity=".9"/><circle cx="148" cy="135" r="28" fill="#ff7a1a" opacity=".12"/>`);
    }
    else {
      out.push(`<path d="M126 104 Q148 98 170 104 Q172 140 148 166 Q124 140 126 104 Z" fill="${sg}" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>`);
      out.push(`<path d="M131 108 Q148 103 165 108 Q166 138 148 159 Q130 138 131 108 Z" fill="none" stroke="${str || dshade(sc, .45)}" stroke-width="${str ? 2.6 : 1.4}" opacity=".9"/>`);
      out.push(`<path d="M148 112 L148 150 M136 124 L160 124" stroke="${str || dshade(sc, -.5)}" stroke-width="3" stroke-linecap="round" opacity=".85"/>`);
    }
  }

  /* ---- weapon (character's right hand, viewer's left) ---- */
  if (wpn) out.push(`<g transform="translate(58 146) rotate(${['longbow', 'shortbow', 'crossbow'].includes(wpn.kind) ? -8 : -28})">${weaponSVG(wpn, uid, defs)}</g>`);
  // hand over the grip
  if (wpn && !['longbow', 'shortbow', 'crossbow', 'claws'].includes(wpn.kind)) out.push(`<circle cx="58" cy="146" r="7.5" fill="${hf}" stroke="${OL}" stroke-width="2"/>`);

  return `<svg class="doll v2" viewBox="0 -6 200 262"><defs>${defs.join('')}</defs>${out.join('')}</svg>`;
}

// every weapon drawn with its grip at (0,0), pointing up (−y)
function weaponSVG(it, uid, defs) {
  const k = it.kind, c = it.tint || '#b8b8c0', tr = it.trim || (it.quality ? QUAL[it.quality].c : null);
  const gid = `${uid}w`; defs.push(`<linearGradient id="${gid}" x1="0" x2="1"><stop offset="0" stop-color="${dshade(c, -.4)}"/><stop offset=".45" stop-color="${dshade(c, .45)}"/><stop offset="1" stop-color="${dshade(c, -.35)}"/></linearGradient>`);
  const M = `url(#${gid})`, wood = '#6a4426', woodD = '#3a2412';
  const grip = (len = 16) => `<rect x="-2.6" y="-4" width="5.2" height="${len}" rx="2" fill="${woodD}" stroke="${OL}" stroke-width="1.3"/>`;
  const guard = (w = 22) => `<rect x="${-w / 2}" y="-7" width="${w}" height="5" rx="2" fill="${tr || dshade(c, -.25)}" stroke="${OL}" stroke-width="1.4"/>`;
  const blade = (len, w, curve = 0) => curve
    ? `<path d="M${-w / 2} -6 Q${-w / 2 - curve} ${-len * 0.6} ${-w / 2 + curve * 0.4} ${-len} Q${w / 2 + curve * 0.6} ${-len * 0.7} ${w / 2} -6 Z" fill="${M}" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>`
    : `<path d="M${-w / 2} -6 L${-w / 2} ${-len + w} L0 ${-len} L${w / 2} ${-len + w} L${w / 2} -6 Z" fill="${M}" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/><path d="M0 -8 L0 ${-len + w}" stroke="${dshade(c, -.35)}" stroke-width="1"/>`;
  const haft = (len, col = wood) => `<rect x="-2.4" y="${-len}" width="4.8" height="${len + 14}" rx="2" fill="${col}" stroke="${OL}" stroke-width="1.3"/>`;
  switch (k) {
    case 'dagger': return grip(12) + guard(14) + blade(30, 8);
    case 'scimitar': return grip() + guard(16) + blade(56, 10, 12);
    case 'sword': return grip() + guard(22) + blade(62, 9);
    case 'godsword': return grip(20) + `<rect x="-14" y="-12" width="28" height="9" rx="2" fill="${tr || '#c8a040'}" stroke="${OL}" stroke-width="1.6"/>` + blade(92, 15);
    case 'battleaxe': return haft(58) + `<path d="M2 -58 Q24 -66 24 -46 Q24 -30 2 -36 Z M-2 -58 Q-24 -66 -24 -46 Q-24 -30 -2 -36 Z" fill="${M}" stroke="${OL}" stroke-width="1.6"/>`;
    case 'maul': return haft(60) + `<rect x="-16" y="-74" width="32" height="20" rx="3" fill="${M}" stroke="${OL}" stroke-width="1.8"/><path d="M-16 -64 L16 -64" stroke="${dshade(c, -.4)}" stroke-width="1.5"/>`;
    case 'spear': return haft(70) + `<path d="M-5 -70 L0 -92 L5 -70 Z" fill="${M}" stroke="${OL}" stroke-width="1.5"/><rect x="-4" y="-71" width="8" height="4" fill="${tr || '#c03030'}" stroke="${OL}"/>`;
    case 'trident': return haft(70, dshade(c, -.3)) + `<path d="M-12 -70 L-12 -86 M0 -70 L0 -94 M12 -70 L12 -86 M-12 -70 L12 -70" stroke="${OL}" stroke-width="5" stroke-linecap="round"/><path d="M-12 -70 L-12 -86 M0 -70 L0 -94 M12 -70 L12 -86 M-12 -70 L12 -70" stroke="${dshade(c, .3)}" stroke-width="3" stroke-linecap="round"/><circle cx="0" cy="-60" r="4" fill="#4ac8ff" stroke="${OL}"/>`;
    case 'scythe': case 'scythe2': return haft(80, '#3a2a3a') + `<path d="M0 -80 Q-40 -92 -54 -64 Q-36 -80 0 -72 Z" fill="${M}" stroke="${OL}" stroke-width="1.6"/>`;
    case 'staff': return haft(82) + `<circle cx="0" cy="-88" r="8" fill="${c}" stroke="${OL}" stroke-width="1.8"/><circle cx="-2.5" cy="-91" r="2.5" fill="#fff" opacity=".7"/><circle cx="0" cy="-88" r="14" fill="${c}" opacity=".18"/><path d="M-6 -80 Q0 -76 6 -80" stroke="${tr || '#c8a040'}" stroke-width="2.5" fill="none"/>`;
    case 'wand': return `<rect x="-2" y="-34" width="4" height="40" rx="2" fill="${woodD}" stroke="${OL}" stroke-width="1.2"/><circle cx="0" cy="-37" r="5" fill="${c}" stroke="${OL}" stroke-width="1.4"/><circle cx="0" cy="-37" r="10" fill="${c}" opacity=".25"/>`;
    case 'whip': return grip(14) + `<path d="M0 -4 Q-30 -20 -14 -44 Q4 -60 -22 -76" stroke="${OL}" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M0 -4 Q-30 -20 -14 -44 Q4 -60 -22 -76" stroke="${c}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    case 'claws': return `<g transform="rotate(28)">${[-6, 0, 6].map(x => `<path d="M${x - 2} -2 Q${x - 4} -22 ${x + 4} -30 Q${x + 2} -18 ${x + 2} -2 Z" fill="${M}" stroke="${OL}" stroke-width="1.3"/>`).join('')}<circle cx="0" cy="0" r="8" fill="${dshade(c, -.3)}" stroke="${OL}" stroke-width="1.8"/></g>`;
    case 'blowpipe': return `<rect x="-3" y="-60" width="6" height="68" rx="3" fill="${M}" stroke="${OL}" stroke-width="1.4"/><rect x="-5" y="-30" width="10" height="8" rx="2" fill="#2a8a4a" stroke="${OL}"/>`;
    case 'shortbow': case 'longbow': {
      const h = k === 'longbow' ? 62 : 44;
      return `<path d="M-4 ${h} Q-30 0 -4 ${-h}" stroke="${OL}" stroke-width="6.5" fill="none" stroke-linecap="round"/><path d="M-4 ${h} Q-30 0 -4 ${-h}" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M-4 ${h} L-4 ${-h}" stroke="#e8e0c8" stroke-width="1.1"/><rect x="-22" y="-6" width="8" height="12" rx="2" fill="${tr || woodD}" stroke="${OL}"/>`;
    }
    case 'crossbow': return `<g transform="rotate(80)"><rect x="-4" y="-46" width="8" height="54" rx="2" fill="${wood}" stroke="${OL}" stroke-width="1.4"/><path d="M-26 -36 Q0 -48 26 -36" stroke="${OL}" stroke-width="6" fill="none"/><path d="M-26 -36 Q0 -48 26 -36" stroke="${c}" stroke-width="3.5" fill="none"/><path d="M-26 -36 L0 -24 L26 -36" stroke="#e8e0c8" stroke-width="1"/></g>`;
    default: return grip() + guard(18) + blade(54, 9);
  }
}

/* ---------- the character screen: equipment slots around the doll ---------- */
viewCharacter = (orig => function () {
  const h = orig();
  const slot = (s, ph) => { const id = S.equip[s], look = S.cosmetic?.[s]; const it = id ? ITEMS[id] : null, q = it?.quality ? QUAL[it.quality].c : null;
    return `<button class="cslot ${id ? '' : 'empty'}" data-act="${id ? 'item-eq' : ''}" data-slot="${s}" ${q ? `style="--q:${q}"` : ''}>${id ? itemIcon(id) : `<span class="emo ph">${ph}</span>`}${look ? '<i class="look">👁️</i>' : ''}<small>${s}</small></button>`; };
  const left = [['head', '⛑️'], ['neck', '📿'], ['body', '🦺'], ['legs', '👖'], ['feet', '👢']], right = [['cape', '🧣'], ['weapon', '🗡️'], ['shield', '🛡️'], ['hands', '🧤'], ['ring', '💍']];
  const stage = `<div class="char-stage"><div class="cs-col">${left.map(([s, p]) => slot(s, p)).join('')}</div><div class="doll-wrap v2">${dollSVG()}</div><div class="cs-col">${right.map(([s, p]) => slot(s, p)).join('')}</div></div>`;
  return h.replace(/<div class="panel char"><div class="doll-wrap">[\s\S]*?<\/svg><\/div>/, `<div class="panel char v2">${stage}`);
})(viewCharacter);
VIEWS.character = (orig => function () { return rebrand(orig()); })(viewCharacter);
viewSig = (orig => function () { return UI.view === 'character' ? orig() + JSON.stringify(S.equip) + JSON.stringify(S.cosmetic || {}) : orig(); })(viewSig);
function boot45() { boot44(); UI.force = true; render(); }

