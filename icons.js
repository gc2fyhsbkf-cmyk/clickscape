'use strict';
/* Hand-drawn SVG item icons. Same model, recoloured per tier —
   the classic "bronze → rune" look. */
function shade(hex, amt) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const n = parseInt(c, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = v => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  return '#' + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2, '0')).join('');
}
const K = 'stroke="#000" stroke-width="1.2" stroke-linejoin="round"';
const WOOD = '#7a4a22';
const SHAPES = {
  ore: t => `<path d="M5 21 L8 11 L15 6 L24 8 L28 17 L24 26 L11 27 Z" fill="#6e6152" ${K}/>
    <path d="M8 11 L15 6 L24 8 L18 13 Z" fill="#8a7b69"/>
    <circle cx="13" cy="17" r="2.6" fill="${t}" ${K}/><circle cx="20" cy="20" r="2.2" fill="${t}" ${K}/><circle cx="19" cy="12" r="1.7" fill="${t}" ${K}/><circle cx="11" cy="23" r="1.4" fill="${t}" ${K}/>`,
  bar: t => `<path d="M3 20 L9 12 L29 12 L23 20 Z" fill="${shade(t, .35)}" ${K}/>
    <path d="M3 20 L23 20 L23 25 L3 25 Z" fill="${t}" ${K}/><path d="M23 20 L29 12 L29 17 L23 25 Z" fill="${shade(t, -.35)}" ${K}/>`,
  dagger: t => `<path d="M16 3 L19 8 L18 20 L14 20 L13 8 Z" fill="${shade(t, .15)}" ${K}/><path d="M16 4 L16 19" stroke="${shade(t, .5)}" stroke-width="1"/>
    <rect x="10" y="20" width="12" height="3" rx="1" fill="${shade(t, -.2)}" ${K}/><rect x="14.5" y="23" width="3" height="5" fill="${WOOD}" ${K}/><circle cx="16" cy="29" r="1.6" fill="${shade(t, -.2)}" ${K}/>`,
  scimitar: t => `<path d="M9 23 C 9 14, 14 6, 25 3 C 20 9, 15 16, 13 24 Z" fill="${shade(t, .1)}" ${K}/><path d="M11 21 C 13 14, 17 9, 23 5" stroke="${shade(t, .5)}" stroke-width="1" fill="none"/>
    <rect x="6" y="22" width="11" height="3" rx="1" transform="rotate(-20 11 23)" fill="#c9a227" ${K}/><path d="M9 25 L6 30" stroke="#000" stroke-width="4" stroke-linecap="round"/><path d="M9 25 L6 30" stroke="${WOOD}" stroke-width="2.4" stroke-linecap="round"/>`,
  whip: t => `<path d="M6 27 C 4 14, 18 6, 27 9 C 22 10, 12 13, 9 27" fill="none" stroke="#000" stroke-width="4" stroke-linecap="round"/>
    <path d="M6 27 C 4 14, 18 6, 27 9" fill="none" stroke="${t}" stroke-width="2.4" stroke-linecap="round"/><rect x="4" y="24" width="5" height="6" rx="1" fill="#222" ${K}/>`,
  pickaxe: t => `<path d="M8 28 L22 9" stroke="#000" stroke-width="4.2" stroke-linecap="round"/><path d="M8 28 L22 9" stroke="${WOOD}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M6 9 C 12 3, 24 3, 30 10 C 24 7, 14 7, 6 9 Z" fill="${t}" ${K}/><path d="M9 8 C 14 5, 22 5, 27 8" stroke="${shade(t, .45)}" stroke-width="1" fill="none"/>`,
  hatchet: t => `<path d="M10 29 L20 5" stroke="#000" stroke-width="4.2" stroke-linecap="round"/><path d="M10 29 L20 5" stroke="${WOOD}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M17 7 L27 5 C 30 10, 29 16, 25 18 L17 14 Z" fill="${t}" ${K}/><path d="M26 7 C 28 10, 28 14, 25 16" stroke="${shade(t, .5)}" stroke-width="1" fill="none"/>`,
  mattock: t => `<path d="M9 29 L19 6" stroke="#000" stroke-width="4.2" stroke-linecap="round"/><path d="M9 29 L19 6" stroke="${WOOD}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M6 7 L28 9 L27 13 L18 12 L7 11 Z" fill="${t}" ${K}/><path d="M28 9 L30 14 L26 13 Z" fill="${shade(t, -.3)}" ${K}/>`,
  full_helm: t => `<path d="M6 24 C 5 12, 10 5, 16 5 C 22 5, 27 12, 26 24 Z" fill="${t}" ${K}/>
    <path d="M9 14 L23 14 L22 17 L10 17 Z" fill="#111"/><path d="M16 5 L16 13" stroke="${shade(t, -.35)}" stroke-width="1.4"/><path d="M8 13 C 9 9, 12 7, 15 6" stroke="${shade(t, .45)}" stroke-width="1" fill="none"/>
    <path d="M6 24 L26 24 L25 27 L7 27 Z" fill="${shade(t, -.3)}" ${K}/>`,
  platebody: t => `<path d="M9 5 L13 4 C 14 7, 18 7, 19 4 L23 5 L29 10 L26 16 L24 14 L24 28 L8 28 L8 14 L6 16 L3 10 Z" fill="${t}" ${K}/>
    <path d="M16 8 L16 27" stroke="${shade(t, -.35)}" stroke-width="1.2"/><path d="M10 12 C 12 15, 20 15, 22 12" stroke="${shade(t, .45)}" stroke-width="1" fill="none"/>
    <path d="M8 22 L24 22" stroke="${shade(t, -.35)}" stroke-width="1"/>`,
  platelegs: t => `<path d="M8 4 L24 4 L25 28 L18 28 L16 13 L14 28 L7 28 Z" fill="${t}" ${K}/>
    <path d="M8 8 L24 8" stroke="${shade(t, -.35)}" stroke-width="1.2"/><path d="M10 18 L13 18 M19 18 L22 18" stroke="${shade(t, .45)}" stroke-width="1.4"/>`,
  kiteshield: t => `<path d="M16 3 L27 7 C 27 17, 23 24, 16 30 C 9 24, 5 17, 5 7 Z" fill="${t}" ${K}/>
    <path d="M16 6 L24 9 C 24 16, 21 21, 16 26 C 11 21, 8 16, 8 9 Z" fill="${shade(t, .25)}"/>
    <path d="M16 6 L16 26 M9 12 L23 12" stroke="${shade(t, -.35)}" stroke-width="1.4"/>`,
  rod: t => `<path d="M5 29 L27 3" stroke="#000" stroke-width="3" stroke-linecap="round"/><path d="M5 29 L27 3" stroke="${t}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M27 3 C 29 10, 28 18, 26 24" stroke="#ddd" stroke-width=".8" fill="none"/><circle cx="9" cy="24" r="2.4" fill="#555" ${K}/><path d="M26 24 C 24 27, 27 28, 27 26" stroke="#ccc" fill="none"/>`,
  harpoon: t => `<path d="M6 28 L24 6" stroke="#000" stroke-width="3.6" stroke-linecap="round"/><path d="M6 28 L24 6" stroke="${WOOD}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M22 4 L29 2 L27 9 Z M21 11 L18 7 M26 5 L30 8" fill="${t}" stroke="#000" stroke-width="1.2"/><path d="M22 9 L17 8 L20 12 Z" fill="${t}" ${K}/>`,
  log: t => `<path d="M5 12 L23 6 L28 20 L10 26 Z" fill="${t}" ${K}/>
    <ellipse cx="7.5" cy="19" rx="3.2" ry="7" transform="rotate(-18 7.5 19)" fill="${shade(t, .45)}" ${K}/>
    <ellipse cx="7.5" cy="19" rx="1.4" ry="3.2" transform="rotate(-18 7.5 19)" fill="none" stroke="${shade(t, -.2)}" stroke-width="1"/>
    <path d="M12 13 L24 9 M14 20 L26 16" stroke="${shade(t, -.35)}" stroke-width="1"/>`,
  fish: t => `<path d="M3 16 C 8 8, 19 8, 24 16 C 19 24, 8 24, 3 16 Z" fill="${t}" ${K}/><path d="M23 16 L30 10 L29 22 Z" fill="${shade(t, -.25)}" ${K}/>
    <circle cx="8" cy="15" r="1.4" fill="#000"/><path d="M12 11 C 14 14, 14 18, 12 21" stroke="${shade(t, -.3)}" fill="none"/><path d="M6 13 C 10 10, 16 10, 20 12" stroke="${shade(t, .45)}" fill="none"/>`,
  cookedfish: t => SHAPES.fish(shade(mixHex(t, '#c07a3a', .6), -.05)) + `<path d="M10 18 L16 14 M14 20 L20 15" stroke="#5a2a10" stroke-width="1.2"/>`,
  burnt: () => SHAPES.fish('#2a1e18'),
  gem: t => `<path d="M8 11 L13 6 L19 6 L24 11 L16 27 Z" fill="${t}" ${K}/><path d="M8 11 L24 11 M13 6 L12 11 L16 27 L20 11 L19 6" stroke="${shade(t, -.35)}" fill="none"/>
    <path d="M13 7 L11 10" stroke="#fff" stroke-width="1.2" opacity=".8"/>`,
  seed: t => `<ellipse cx="11" cy="17" rx="3.4" ry="5" transform="rotate(-25 11 17)" fill="${t}" ${K}/><ellipse cx="20" cy="13" rx="3" ry="4.5" transform="rotate(20 20 13)" fill="${shade(t, -.15)}" ${K}/>
    <ellipse cx="19" cy="23" rx="3" ry="4.3" transform="rotate(-60 19 23)" fill="${shade(t, .15)}" ${K}/>`,
  herb: t => `<path d="M16 29 L16 14" stroke="#2a4a1a" stroke-width="2"/><path d="M16 15 C 8 15, 6 7, 8 4 C 14 5, 17 10, 16 15 Z" fill="${t}" ${K}/>
    <path d="M16 18 C 23 18, 27 11, 25 7 C 19 8, 15 13, 16 18 Z" fill="${shade(t, .2)}" ${K}/><path d="M16 23 C 10 24, 7 20, 7 18 C 12 17, 15 19, 16 23 Z" fill="${shade(t, -.15)}" ${K}/>`,
  bone: t => `<path d="M9 23 L23 9" stroke="#000" stroke-width="5.6" stroke-linecap="round"/><path d="M9 23 L23 9" stroke="${t}" stroke-width="3.6" stroke-linecap="round"/>
    <circle cx="7" cy="22" r="2.8" fill="${t}" ${K}/><circle cx="10" cy="25.5" r="2.8" fill="${t}" ${K}/><circle cx="22" cy="6.5" r="2.8" fill="${t}" ${K}/><circle cx="25.5" cy="10" r="2.8" fill="${t}" ${K}/>`,
  hide: t => `<path d="M6 8 C 10 5, 22 5, 26 8 L28 14 L25 16 L27 24 C 22 27, 10 27, 5 24 L7 16 L4 14 Z" fill="${t}" ${K}/>
    <path d="M10 12 C 13 14, 19 14, 22 12" stroke="${shade(t, -.3)}" fill="none"/><circle cx="13" cy="19" r="2" fill="${shade(t, -.25)}"/><circle cx="20" cy="17" r="1.5" fill="${shade(t, -.25)}"/>`,
  ashes: t => `<path d="M4 25 C 6 18, 12 14, 16 14 C 20 14, 26 18, 28 25 Z" fill="${t}" ${K}/><circle cx="12" cy="20" r="1" fill="#555"/><circle cx="19" cy="18" r="1" fill="#555"/><circle cx="21" cy="22" r="1" fill="#555"/>`,
  material: t => `<path d="M6 20 L10 9 L20 7 L26 14 L23 24 L12 26 Z" fill="${t}" ${K}/><path d="M10 9 L15 16 L26 14 M15 16 L12 26" stroke="${shade(t, -.3)}" fill="none"/>`,
  artifact: t => `<path d="M11 4 L21 4 L20 8 C 26 11, 27 19, 23 25 L24 28 L8 28 L9 25 C 5 19, 6 11, 12 8 Z" fill="${t}" ${K}/>
    <path d="M9 15 L23 15 M9 19 L23 19" stroke="${shade(t, -.4)}" stroke-width="1.2"/><path d="M12 16.5 L14 17.5 L16 16.5 L18 17.5 L20 16.5" stroke="#ffd54a" fill="none"/>
    <path d="M11 10 C 9 12, 9 14, 9 14" stroke="${shade(t, .5)}" fill="none"/>`,
  sword: t => `<path d="M24 3 L28 4 L27 8 L12 22 L9 19 Z" fill="${shade(t, .1)}" ${K}/><path d="M26 5 L11 20" stroke="${shade(t, .5)}"/>
    <path d="M6 18 L13 25" stroke="#000" stroke-width="4" stroke-linecap="round"/><path d="M6 18 L13 25" stroke="#c9a227" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M9 23 L4 28" stroke="#000" stroke-width="4" stroke-linecap="round"/><path d="M9 23 L4 28" stroke="${WOOD}" stroke-width="2.4" stroke-linecap="round"/>`,
  godsword: t => `<path d="M25 2 L30 3 L29 8 L13 24 L8 19 Z" fill="#d8d8e4" ${K}/><path d="M27 4 L11 21" stroke="#fff" opacity=".7"/>
    <path d="M3 17 C 6 15, 9 18, 8 19 L13 24 C 14 23, 17 26, 15 29 Z" fill="${t}" ${K}/><path d="M8 25 L3 30" stroke="#000" stroke-width="4.4" stroke-linecap="round"/><path d="M8 25 L3 30" stroke="${shade(t, -.3)}" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="10.5" cy="21.5" r="2" fill="${shade(t, .4)}" ${K}/>`,
  spear: t => `<path d="M5 29 L23 9" stroke="#000" stroke-width="3.6" stroke-linecap="round"/><path d="M5 29 L23 9" stroke="#3a2a20" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M21 8 L29 2 L25 11 Z" fill="${t}" ${K}/><path d="M19 10 L23 14 M17 9 L21 7" stroke="${t}" stroke-width="2"/>`,
  battleaxe: t => `<path d="M8 29 L22 6" stroke="#000" stroke-width="4" stroke-linecap="round"/><path d="M8 29 L22 6" stroke="${WOOD}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M18 7 C 22 2, 29 4, 30 10 C 27 12, 22 13, 19 12 Z" fill="${t}" ${K}/><path d="M19 9 C 15 6, 10 8, 9 13 C 12 15, 16 14, 19 12 Z" fill="${shade(t, -.15)}" ${K}/>`,
  maul: t => `<path d="M8 29 L19 13" stroke="#000" stroke-width="4" stroke-linecap="round"/><path d="M8 29 L19 13" stroke="#6a6a66" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M12 9 L22 3 L29 13 L19 19 Z" fill="${t}" ${K}/><path d="M12 9 L22 3 L23 5 L13 11 Z" fill="${shade(t, .35)}"/>`,
  claws: t => `<path d="M8 28 C 6 20, 10 14, 14 10 L16 13 C 13 17, 11 22, 12 28 Z" fill="${t}" ${K}/><path d="M14 28 C 13 20, 17 12, 22 8 L24 11 C 20 15, 18 21, 18 28 Z" fill="${t}" ${K}/>
    <path d="M20 28 C 20 22, 23 16, 28 13 L29 16 C 26 19, 24 23, 24 28 Z" fill="${t}" ${K}/><rect x="6" y="26" width="20" height="4" rx="1" fill="#555" ${K}/>`,
  chainbody: t => SHAPES.platebody(t) + `<path d="M10 17 L22 17 M10 20 L22 20 M10 25 L22 25" stroke="${shade(t, .3)}" stroke-dasharray="1.5 1.5"/>`,
  boots: t => `<path d="M6 5 L14 5 L14 20 L24 22 C 28 23, 28 28, 26 28 L6 28 Z" fill="${t}" ${K}/><path d="M6 24 L27 24" stroke="${shade(t, -.3)}"/><path d="M8 8 L12 8" stroke="${shade(t, .45)}"/>`,
  gloves: t => `<path d="M9 28 L9 14 L7 9 C 7 6, 10 6, 11 9 L12 12 L12 5 C 12 3, 15 3, 15 5 L15 11 L16 4 C 16 2, 19 2, 19 4 L19 11 L20 6 C 20 4, 23 4, 23 6 L23 20 L21 28 Z" fill="${t}" ${K}/>
    <path d="M9 24 L22 24" stroke="${shade(t, -.35)}" stroke-width="1.6"/>`,
  amulet: t => `<path d="M7 3 C 7 13, 12 18, 16 19 C 20 18, 25 13, 25 3" fill="none" stroke="#000" stroke-width="2.6"/><path d="M7 3 C 7 13, 12 18, 16 19 C 20 18, 25 13, 25 3" fill="none" stroke="#e0b030" stroke-width="1.4"/>
    <circle cx="16" cy="23" r="6" fill="#e0b030" ${K}/><circle cx="16" cy="23" r="3.6" fill="${t}" ${K}/>`,
  ring: t => `<ellipse cx="16" cy="19" rx="10" ry="8" fill="none" stroke="#000" stroke-width="5"/><ellipse cx="16" cy="19" rx="10" ry="8" fill="none" stroke="#e0b030" stroke-width="3"/>
    <path d="M11 9 L16 4 L21 9 L16 14 Z" fill="${t}" ${K}/>`,
  cape: t => `<path d="M10 4 L22 4 L25 10 L28 29 L4 29 L7 10 Z" fill="${t}" ${K}/><path d="M10 4 L22 4 L21 8 L11 8 Z" fill="${shade(t, -.35)}" ${K}/>
    <path d="M7 27 L25 27" stroke="${shade(t, .45)}" stroke-width="2"/><path d="M13 12 L12 26 M19 12 L20 26" stroke="${shade(t, -.25)}"/>`,
  shard: t => `<path d="M8 26 L12 6 L22 4 L18 14 L24 18 Z" fill="${t}" ${K}/><path d="M12 6 L16 15 L24 18" stroke="${shade(t, .5)}" fill="none"/>`,
  hilt: t => `<path d="M4 12 C 8 8, 12 12, 13 14 L19 14 C 20 12, 24 8, 28 12 C 26 18, 21 18, 19 18 L13 18 C 11 18, 6 18, 4 12 Z" fill="${t}" ${K}/>
    <rect x="14" y="18" width="4" height="9" fill="${shade(t, -.35)}" ${K}/><circle cx="16" cy="16" r="2.4" fill="${shade(t, .5)}" ${K}/>`,
  key: t => `<circle cx="10" cy="11" r="6.5" fill="${t}" ${K}/><circle cx="10" cy="11" r="2.6" fill="#1a140e" ${K}/>
    <path d="M14 15 L27 28 M21 22 L24 19 M24 25 L27 22" stroke="#000" stroke-width="4" stroke-linecap="round"/><path d="M14 15 L27 28 M21 22 L24 19 M24 25 L27 22" stroke="${t}" stroke-width="2.2" stroke-linecap="round"/>`,
  orb: t => `<circle cx="16" cy="16" r="11" fill="${t}" ${K}/><circle cx="16" cy="16" r="11" fill="url(#none)" stroke="${shade(t, -.35)}" stroke-width="1"/>
    <ellipse cx="12" cy="11" rx="4" ry="2.6" fill="#fff" opacity=".55"/><circle cx="20" cy="21" r="2" fill="${shade(t, .4)}" opacity=".6"/>`,
  tentacle: t => `<path d="M5 27 C 3 14, 16 4, 28 7 C 18 9, 10 15, 10 27 Z" fill="${t}" ${K}/><circle cx="13" cy="16" r="1.4" fill="${shade(t, .5)}"/><circle cx="17" cy="11" r="1.2" fill="${shade(t, .5)}"/><circle cx="22" cy="8.5" r="1" fill="${shade(t, .5)}"/>`,
  coif: t => `<path d="M6 26 C 4 14, 9 4, 16 4 C 23 4, 28 14, 26 26 L21 26 L21 16 C 21 12, 11 12, 11 16 L11 26 Z" fill="${t}" ${K}/><path d="M11 18 C 13 15, 19 15, 21 18" stroke="${shade(t, -.35)}" fill="none"/><path d="M9 9 C 11 6, 14 5, 16 5" stroke="${shade(t, .45)}" fill="none"/>`,
  dhidebody: t => `<path d="M9 5 L13 4 C 14 8, 18 8, 19 4 L23 5 L28 11 L25 15 L23 13 L23 28 L9 28 L9 13 L7 15 L4 11 Z" fill="${t}" ${K}/>
    <path d="M12 12 L14 14 L12 16 L14 18 L12 20 M20 12 L18 14 L20 16 L18 18 L20 20" stroke="${shade(t, .4)}" fill="none"/><path d="M16 8 L16 27" stroke="${shade(t, -.35)}" stroke-dasharray="2 1.5"/>`,
  chaps: t => `<path d="M8 4 L24 4 L25 28 L19 28 L16 13 L13 28 L7 28 Z" fill="${t}" ${K}/><path d="M9 9 L15 9 M17 9 L23 9" stroke="${shade(t, .4)}" stroke-dasharray="1.5 1.5"/><path d="M10 15 L10 26 M22 15 L22 26" stroke="${shade(t, -.3)}"/>`,
  hat: t => `<path d="M5 24 C 9 22, 23 22, 27 24 L25 27 L7 27 Z" fill="${shade(t, -.2)}" ${K}/><path d="M9 23 C 10 15, 14 6, 20 3 C 19 9, 22 16, 23 23 Z" fill="${t}" ${K}/><circle cx="20" cy="4" r="1.6" fill="#e0c040" ${K}/>`,
  robe: t => `<path d="M10 4 L13 3 C 14 6, 18 6, 19 3 L22 4 L28 12 L24 15 L23 12 L25 29 L7 29 L9 12 L8 15 L4 12 Z" fill="${t}" ${K}/><path d="M16 6 L16 28" stroke="${shade(t, .45)}" stroke-width="1.6"/><path d="M11 16 L21 16" stroke="#e0c040" stroke-width="1.2"/>`,
  robeskirt: t => `<path d="M10 4 L22 4 L27 29 L5 29 Z" fill="${t}" ${K}/><path d="M10 7 L22 7" stroke="#e0c040" stroke-width="1.4"/><path d="M13 9 L11 28 M19 9 L21 28" stroke="${shade(t, -.3)}"/>`,
  staff: t => `<path d="M8 30 L22 6" stroke="#000" stroke-width="4" stroke-linecap="round"/><path d="M8 30 L22 6" stroke="#7a4a22" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="23" cy="5" r="4" fill="${t}" ${K}/><circle cx="21.6" cy="3.8" r="1.3" fill="#fff" opacity=".7"/>`,
  trident: t => `<path d="M9 30 L21 8" stroke="#000" stroke-width="3.6" stroke-linecap="round"/><path d="M9 30 L21 8" stroke="${shade(t, -.25)}" stroke-width="2" stroke-linecap="round"/>
    <path d="M16 6 L21 9 L26 4 M21 9 L23 2 M18 12 L28 7" stroke="#000" stroke-width="3.4" stroke-linecap="round" fill="none"/><path d="M16 6 L21 9 L26 4 M21 9 L23 2 M18 12 L28 7" stroke="${t}" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,
  shortbow: t => `<path d="M10 4 C 26 8, 26 24, 10 28" fill="none" stroke="#000" stroke-width="4" stroke-linecap="round"/><path d="M10 4 C 26 8, 26 24, 10 28" fill="none" stroke="${t}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M10 4 L10 28" stroke="#ddd" stroke-width=".9"/><rect x="18" y="14" width="4" height="4" fill="#5a3a1a" ${K}/>`,
  longbow: t => `<path d="M7 2 C 30 6, 30 26, 7 30" fill="none" stroke="#000" stroke-width="4" stroke-linecap="round"/><path d="M7 2 C 30 6, 30 26, 7 30" fill="none" stroke="${t}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M7 2 L7 30" stroke="#ddd" stroke-width=".9"/><rect x="21" y="14" width="4" height="4" fill="#5a3a1a" ${K}/>`,
  crossbow: t => `<path d="M16 30 L16 8" stroke="#000" stroke-width="4" stroke-linecap="round"/><path d="M16 30 L16 8" stroke="#6a4a2a" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M4 12 C 10 7, 22 7, 28 12" fill="none" stroke="#000" stroke-width="3.6"/><path d="M4 12 C 10 7, 22 7, 28 12" fill="none" stroke="${t}" stroke-width="2"/><path d="M4 12 L16 15 L28 12" stroke="#ddd" stroke-width=".8" fill="none"/>`,
  arrow: t => `<path d="M6 26 L24 8" stroke="#000" stroke-width="2.6"/><path d="M6 26 L24 8" stroke="#a0703a" stroke-width="1.4"/><path d="M22 6 L29 3 L26 10 Z" fill="${t}" ${K}/>
    <path d="M5 23 L8 28 L4 27 Z M7 21 L11 26" fill="#eee" stroke="#000" stroke-width=".8"/><path d="M11 26 L14 22" stroke="#000" stroke-width="2.6"/><path d="M8 25 L13 20" stroke="#fff" stroke-width="1.5"/>
    <path d="M10 28 L16 22" stroke="#000" stroke-width="2.6" opacity="0"/>`,
  arrowtips: t => `<path d="M6 14 L12 8 L10 16 Z M14 22 L20 16 L18 24 Z M20 10 L26 4 L24 12 Z" fill="${t}" ${K}/>`,
  bolt: t => `<path d="M6 26 L22 10" stroke="#000" stroke-width="3"/><path d="M6 26 L22 10" stroke="#9aa0a8" stroke-width="1.8"/><path d="M20 8 L27 5 L24 12 Z" fill="${t}" ${K}/><path d="M5 22 L10 27" stroke="#ccc" stroke-width="2"/>`,
  shaft: t => `<path d="M5 25 L25 5 M8 27 L27 8 M4 21 L21 4" stroke="#000" stroke-width="2.4" stroke-linecap="round"/><path d="M5 25 L25 5 M8 27 L27 8 M4 21 L21 4" stroke="${t}" stroke-width="1.2" stroke-linecap="round"/>`,
  potion: t => `<path d="M12 3 L20 3 L20 6 L19 6 L19 11 C 25 13, 27 18, 26 22 C 25 28, 20 30, 16 30 C 12 30, 7 28, 6 22 C 5 18, 7 13, 13 11 L13 6 L12 6 Z" fill="#cfe8f4" fill-opacity=".45" ${K}/>
    <path d="M7.5 19 C 11 17, 21 21, 24.5 19 C 25 25, 21 28.5, 16 28.5 C 11 28.5, 7 25, 7.5 19 Z" fill="${t}"/><rect x="12" y="1.5" width="8" height="3" rx="1" fill="#8a5a2b" ${K}/><ellipse cx="11" cy="17" rx="1.6" ry="3" fill="#fff" opacity=".6"/>`,
  scroll: t => `<path d="M7 6 L25 6 L25 26 L7 26 Z" fill="#e8dcb0" ${K}/><rect x="4" y="4" width="5" height="24" rx="2.5" fill="${t}" ${K}/><rect x="23" y="4" width="5" height="24" rx="2.5" fill="${t}" ${K}/>
    <path d="M11 11 L21 11 M11 15 L20 15 M11 19 L18 19" stroke="#6a5a3a" stroke-width="1.2"/>`,
  scythe: t => `<path d="M10 30 L22 4" stroke="#000" stroke-width="3.6" stroke-linecap="round"/><path d="M10 30 L22 4" stroke="#5a3a1a" stroke-width="2" stroke-linecap="round"/>
    <path d="M21 5 C 12 2, 4 6, 2 14 C 8 8, 15 7, 20 9 Z" fill="${t}" ${K}/>`,
};
function mixHex(a, b, t) {
  const p = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
const _iconCache = {};
function itemIcon(id) {
  if (_iconCache[id]) return _iconCache[id];
  const it = ITEMS[id];
  let html;
  if (!it) html = '<span class="emo">❔</span>';
  else if (it.emoji) html = `<span class="emo">${it.emoji}</span>`;
  else {
    const fn = SHAPES[it.kind] || SHAPES.material;
    const trim = it.trim ? `<path d="M3 29 L29 29" stroke="${it.trim}" stroke-width="2" opacity=".9"/>` : '';
    html = `<svg viewBox="0 0 32 32" class="ico" aria-hidden="true">${fn(it.tint || '#999')}${it.trim ? `<g opacity=".85">${fn(it.trim).replace(/fill="[^"]*"/g, 'fill="none"').replace(/stroke="#000"/g, 'stroke="' + it.trim + '"')}</g>` : ''}</svg>`;
  }
  return (_iconCache[id] = html);
}
