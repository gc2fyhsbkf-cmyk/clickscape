'use strict';
/* =========================================================
   CLICKSCAPE v9.27 — skilling scenes: your character (in your gear) and follower pet work
   each station with the right tool and motion; taps animate, workers keep a gentle rhythm,
   and each skill throws its own particles (rock chips, sparks, splashes, embers, steam…)
   ========================================================= */

// tools drawn with the grip at (0,0), pointing up
function toolSVG(kind, tint) {
  const c = tint || '#9a9aa2', O = '#120d08', wood = '#6a4426';
  const haft = (len, col = wood) => `<rect x="-2" y="${-len}" width="4" height="${len + 8}" rx="2" fill="${col}" stroke="${O}" stroke-width="1.2"/>`;
  switch (kind) {
    case 'pickaxe': return haft(34) + `<path d="M-18 -30 Q0 -42 18 -30 L16 -27 Q0 -36 -16 -27 Z" fill="${c}" stroke="${O}" stroke-width="1.4"/>`;
    case 'hatchet': return haft(32) + `<path d="M2 -32 Q16 -36 16 -24 Q16 -16 2 -20 Z" fill="${c}" stroke="${O}" stroke-width="1.4"/>`;
    case 'mattock': { const bar = 'M2 8 L1 -28 Q1 -40 -8 -40 Q-14 -40 -14 -34'; return `<path d="${bar}" fill="none" stroke="${O}" stroke-width="6.4" stroke-linecap="round"/><path d="${bar}" fill="none" stroke="${c}" stroke-width="3.6" stroke-linecap="round"/><path d="M2 8 L6 12" stroke="${O}" stroke-width="6.4" stroke-linecap="round"/><path d="M2 8 L6 12" stroke="${c}" stroke-width="3.6" stroke-linecap="round"/>`; } // salvage crowbar
    case 'rod': return `<path d="M0 6 L0 -46" stroke="${O}" stroke-width="4" stroke-linecap="round"/><path d="M0 6 L0 -46" stroke="${c === '#9a9aa2' ? '#8a6a3a' : c}" stroke-width="2.4" stroke-linecap="round"/><path class="sk-line" d="M0 -46 Q14 -30 22 12" stroke="#e8e0c8" stroke-width=".9" fill="none"/>`;
    case 'hammer': return haft(24) + `<rect x="-9" y="-30" width="18" height="10" rx="2" fill="#7a7a82" stroke="${O}" stroke-width="1.4"/>`;
    case 'shovel': return haft(28) + `<path d="M-6 -28 L6 -28 L5 -38 Q0 -42 -5 -38 Z" fill="#7a7a82" stroke="${O}" stroke-width="1.3"/>`;
    case 'pan': return `<rect x="-2" y="-14" width="4" height="18" rx="2" fill="#3a2a1a" stroke="${O}"/><ellipse cx="0" cy="-20" rx="12" ry="5" fill="#3a3a40" stroke="${O}" stroke-width="1.3"/>`;
    case 'pestle': return `<rect x="-2.5" y="-20" width="5" height="24" rx="2.5" fill="#d8d0c0" stroke="${O}" stroke-width="1.2"/>`;
    case 'knife': return `<rect x="-2" y="-4" width="4" height="10" rx="1.5" fill="#3a2a1a" stroke="${O}"/><path d="M-2 -4 L-2 -18 L2 -22 L2 -4 Z" fill="#c8c8d0" stroke="${O}" stroke-width="1.1"/>`;
    case 'needle': return `<path d="M0 4 L0 -18" stroke="#c8c8d0" stroke-width="1.6"/><circle cx="0" cy="-18" r="1.4" fill="none" stroke="#c8c8d0"/>`;
    case 'saw': return `<rect x="-3" y="-4" width="6" height="10" rx="2" fill="${wood}" stroke="${O}"/><path d="M-3 -4 L-3 -34 L5 -34 L5 -4 Z" fill="#b8b8c0" stroke="${O}" stroke-width="1.1"/><path d="M-3 -10 L-6 -12 L-3 -14 L-6 -16 L-3 -18 L-6 -20 L-3 -22 L-6 -24 L-3 -26 L-6 -28 L-3 -30" stroke="${O}" stroke-width=".8" fill="none"/>`;
    case 'net': return haft(26) + `<ellipse cx="0" cy="-34" rx="10" ry="8" fill="none" stroke="${O}" stroke-width="1.8"/><path d="M-8 -38 L8 -30 M-8 -30 L8 -38 M0 -42 L0 -26" stroke="#e8e0c8" stroke-width=".7"/>`;
    case 'brush': return `<rect x="-2" y="-12" width="4" height="16" rx="2" fill="${wood}" stroke="${O}"/><rect x="-4" y="-20" width="8" height="8" rx="2" fill="#d8b878" stroke="${O}"/>`;
    case 'tinder': return `<rect x="-5" y="-8" width="10" height="8" rx="1.5" fill="#7a5a3a" stroke="${O}" stroke-width="1.2"/>`;
    case 'rune': return `<circle cx="0" cy="-8" r="6" fill="#8ac8ff" stroke="${O}" stroke-width="1.2"/><circle cx="0" cy="-8" r="10" fill="#8ac8ff" opacity=".25"/>`;
    case 'hand': return '';
    default: return '';
  }
}
const SK_POSE = {
  mine: ['pickaxe', 'chop', 'chips'], forest: ['hatchet', 'chop', 'wood'], dig: ['mattock', 'chop', 'chips'], fish: ['rod', 'cast', 'splash'],
  anvil: ['hammer', 'chop', 'sparks'], furnace: ['shovel', 'stoke', 'embers'], range: ['pan', 'stir', 'steam'], herb: ['pestle', 'grind', 'herbs'],
  craft: ['needle', 'tap', 'sparkle'], fletch: ['knife', 'whittle', 'wood'], fire: ['tinder', 'strike', 'embers'], runealtar: ['rune', 'raise', 'glow'],
  sawmill: ['saw', 'saw', 'wood'], workbench: ['hammer', 'chop', 'wood'], hunt: ['net', 'swing', 'leaf'], restore: ['brush', 'tap', 'dust'],
  altar: ['hand', 'pray', 'glow'], thieve: ['hand', 'reach', 'coin'], course: ['hand', 'run', 'dust'], harbour: ['hand', 'pray', 'splash'],
};
function skillHeroSVG(st) {
  const [tool, pose] = SK_POSE[st] || ['hand', 'tap'];
  const toolItem = STATIONS[st]?.tool && ITEMS[S.equip[STATIONS[st].tool]];
  const t = toolSVG(tool, toolItem?.tint);
  const skin = '#e6b58c', hc = skin, O = '#120d08';
  const ok = Object.keys(OUTFITS).find(o => OUTFITS[o][0] === STATIONS[st]?.skill), body = typeof skillLookFor === 'function' ? ITEMS[skillLookFor(STATIONS[st]?.skill, 'body')] || null : ok && (have(`${ok}_top`) || S.costume?.[`${ok}_top`]) ? ITEMS[`${ok}_top`] : null;
  const sleeve = body ? `url(#hb)` : skin;
  const lim = (d) => `<path d="${d}" stroke="${O}" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="${sleeve}" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  const arm = pose === 'pray' ? `${lim('M58 58 L68 66 L70 54')}<circle cx="70" cy="52" r="4.5" fill="${hc}" stroke="${O}" stroke-width="1.5"/>`
    : pose === 'raise' ? `${lim('M58 58 L70 48 L76 34')}<g transform="translate(76 34)">${t}</g><circle cx="76" cy="34" r="4.5" fill="${hc}" stroke="${O}" stroke-width="1.5"/>`
    : pose === 'cast' ? `${lim('M58 58 L70 66 L80 62')}<g transform="translate(80 62) rotate(35)">${t}</g><circle cx="80" cy="62" r="4.5" fill="${hc}" stroke="${O}" stroke-width="1.5"/>`
    : `${lim('M58 58 L66 74 L78 76')}<g transform="translate(78 76) rotate(${pose === 'chop' ? 20 : pose === 'saw' ? 90 : 60})">${t}</g><circle cx="78" cy="76" r="4.5" fill="${hc}" stroke="${O}" stroke-width="1.5"/>`;
  const k = Object.keys(OUTFITS).find(o => OUTFITS[o][0] === STATIONS[st]?.skill);
  const owns = id => have(id) > 0 || (S.costume?.[id] || 0) > 0 || Object.values(S.equip).includes(id);
  HERO_LOOK = slot => { if (typeof skillLookFor === 'function') return ['head', 'body', 'legs', 'feet'].includes(slot) ? skillLookFor(STATIONS[st]?.skill, slot) : null; if (!k) return null; const pc = OUTFIT_PIECES.find(([, sl]) => sl === slot); const id = pc && `${k}_${pc[0]}`; return id && ITEMS[id] && owns(id) ? id : null; };
  let svg; try { svg = heroSVG(); } finally { HERO_LOOK = null; }
  return svg.replace(/<g class="h-arm[\s\S]*<\/g><\/svg>$/, `<g class="h-arm sk-${pose}" style="transform-origin:58px 58px">${arm}</g></svg>`);
}

/* ---------- put the scene into the pinned stage ---------- */
viewSkill = (orig => function () {
  const h = orig(), st = UI.curStation; if (!st || SK_SKIP() || !STATIONS[st]) return h;
  const busy = (M.rate?.[st] || 0) > 0;
  return h.replace(/<div class="stage-icon">([\s\S]*?)<\/div>/, (m, icon) => `<div class="sk-scene ${busy ? 'busy' : ''}" id="skscene"><div class="sk-hero" id="skhero">${skillHeroSVG(st)}${petHTML()}</div><div class="stage-icon">${icon}</div></div>`);
})(viewSkill);
VIEWS.skill = (orig => function () { return rebrand(orig()); })(viewSkill);
viewSig = (orig => function () { return UI.view === 'skill' ? orig() + '|sh' + ((M.rate?.[UI.curStation] || 0) > 0) + (S.follow?.id || '') : orig(); })(viewSig);

const PART = { chips: ['#8a7a6a', '#5a4a3a'], wood: ['#a8783a', '#6a4426'], dirt: ['#7a5a3a', '#4a3420'], splash: ['#8ad8ff', '#ffffff'], sparks: ['#ffd040', '#ff8a1a'],
  embers: ['#ffb02a', '#ff4a0a'], steam: ['rgba(255,255,255,.7)', 'rgba(220,220,220,.5)'], herbs: ['#5ad85a', '#2a8a3a'], sparkle: ['#fff6a0', '#ffffff'], glow: ['#8ac8ff', '#c080ff'],
  leaf: ['#5ac85a', '#a8d84a'], dust: ['#d8c8a0', '#a89878'], coin: ['#ffd040', '#e0b030'] };
let skAnimT = 0;
tapStation = (orig => function (st, x, y) {
  const r = orig.apply(this, arguments);
  try {
    if (UI.view !== 'skill') return r; const t = performance.now(); if (t - skAnimT < 110) return r; skAnimT = t;
    const hero = $('#skhero'), arm = hero?.querySelector('.h-arm'), icon = $('#skscene .stage-icon'), stage = $('.stage');
    if (arm) { arm.classList.remove('act'); void arm.getBoundingClientRect(); arm.classList.add('act'); }
    if (icon && stage) {
      const sr = stage.getBoundingClientRect(), ir = icon.getBoundingClientRect(), cx = ir.left - sr.left + ir.width * 0.4, cy = ir.top - sr.top + ir.height * 0.5;
      const kind = (SK_POSE[st] || [])[2], cols = PART[kind] || PART.dust, up = ['steam', 'embers', 'glow', 'sparkle'].includes(kind);
      for (let i = 0; i < 6; i++) {
        const d = document.createElement('i'); d.className = 'sk-p ' + kind; d.style.left = cx + 'px'; d.style.top = cy + 'px'; d.style.background = cols[i % 2];
        d.style.setProperty('--dx', ((Math.random() - 0.3) * 50) + 'px'); d.style.setProperty('--dy', (up ? -20 - Math.random() * 30 : (Math.random() - 0.7) * 40) + 'px');
        stage.appendChild(d); setTimeout(() => d.remove(), 650);
      }
    }
  } catch (e) {}
  return r;
})(tapStation);
function boot51() { boot50(); UI.force = true; render(); }

