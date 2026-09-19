export const FIGURE_PRESETS = {
  "triangle-right":
    '<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Right triangle">' +
    '<polygon points="15,85 105,85 15,15" fill="#ddf4ff" stroke="#1cb0f6" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M15 73 h12 v12" fill="none" stroke="#1cb0f6" stroke-width="2.5"/>' +
    '<text x="55" y="98" font-size="13" text-anchor="middle" fill="#4b4b4b">a</text>' +
    '<text x="8" y="55" font-size="13" text-anchor="middle" fill="#4b4b4b">b</text>' +
    '<text x="68" y="48" font-size="13" text-anchor="middle" fill="#4b4b4b">c</text></svg>',
  circle:
    '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Circle with radius">' +
    '<circle cx="50" cy="50" r="38" fill="#f0f9df" stroke="#58cc02" stroke-width="3"/>' +
    '<line x1="50" y1="50" x2="88" y2="50" stroke="#1cb0f6" stroke-width="3" stroke-linecap="round"/>' +
    '<circle cx="50" cy="50" r="4" fill="#1cb0f6"/>' +
    '<text x="70" y="42" font-size="13" text-anchor="middle" fill="#4b4b4b">r</text></svg>',
  "slots-3":
    '<svg viewBox="0 0 150 60" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Three decision slots">' +
    '<rect x="5" y="8" width="40" height="44" rx="8" fill="#ffffff" stroke="#1cb0f6" stroke-width="3"/>' +
    '<rect x="55" y="8" width="40" height="44" rx="8" fill="#ffffff" stroke="#1cb0f6" stroke-width="3"/>' +
    '<rect x="105" y="8" width="40" height="44" rx="8" fill="#ffffff" stroke="#1cb0f6" stroke-width="3"/>' +
    '<text x="25" y="39" font-size="20" text-anchor="middle" fill="#afafaf">?</text>' +
    '<text x="75" y="39" font-size="20" text-anchor="middle" fill="#afafaf">?</text>' +
    '<text x="125" y="39" font-size="20" text-anchor="middle" fill="#afafaf">?</text></svg>',
  dice:
    '<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Die showing five">' +
    '<rect x="5" y="5" width="70" height="70" rx="14" fill="#ffffff" stroke="#1cb0f6" stroke-width="3"/>' +
    '<circle cx="25" cy="25" r="6" fill="#1cb0f6"/><circle cx="55" cy="25" r="6" fill="#1cb0f6"/>' +
    '<circle cx="40" cy="40" r="6" fill="#1cb0f6"/>' +
    '<circle cx="25" cy="55" r="6" fill="#1cb0f6"/><circle cx="55" cy="55" r="6" fill="#1cb0f6"/></svg>',
  "venn-2":
    '<svg viewBox="0 0 140 90" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Two overlapping sets">' +
    '<circle cx="50" cy="45" r="32" fill="#1cb0f6" fill-opacity="0.25" stroke="#1cb0f6" stroke-width="3"/>' +
    '<circle cx="90" cy="45" r="32" fill="#58cc02" fill-opacity="0.25" stroke="#58cc02" stroke-width="3"/>' +
    '<text x="35" y="49" font-size="13" text-anchor="middle" fill="#4b4b4b">A</text>' +
    '<text x="105" y="49" font-size="13" text-anchor="middle" fill="#4b4b4b">B</text></svg>',
  "grid-path":
    '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Grid path">' +
    '<path d="M10 10 H90 M10 30 H90 M10 50 H90 M10 70 H90 M10 90 H90 M10 10 V90 M30 10 V90 M50 10 V90 M70 10 V90 M90 10 V90" stroke="#afafaf" stroke-width="1.5"/>' +
    '<polyline points="10,90 50,90 50,50 90,50" fill="none" stroke="#58cc02" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="10" cy="90" r="4" fill="#1cb0f6"/><circle cx="90" cy="50" r="4" fill="#1cb0f6"/></svg>',
  "people-3":
    '<svg viewBox="0 0 150 70" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Three people">' +
    '<g fill="#ddf4ff" stroke="#1cb0f6" stroke-width="3">' +
    '<circle cx="25" cy="18" r="10"/><path d="M10 62 v-8 a15 15 0 0 1 30 0 v8 z"/>' +
    '<circle cx="75" cy="18" r="10"/><path d="M60 62 v-8 a15 15 0 0 1 30 0 v8 z"/>' +
    '<circle cx="125" cy="18" r="10"/><path d="M110 62 v-8 a15 15 0 0 1 30 0 v8 z"/>' +
    "</g></svg>",
  "lock-dials":
    '<svg viewBox="0 0 160 60" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Four lock dials">' +
    '<g fill="#ffffff" stroke="#1cb0f6" stroke-width="3">' +
    '<circle cx="20" cy="30" r="16"/><circle cx="60" cy="30" r="16"/>' +
    '<circle cx="100" cy="30" r="16"/><circle cx="140" cy="30" r="16"/>' +
    "</g>" +
    '<g fill="#1cb0f6"><circle cx="20" cy="30" r="3"/><circle cx="60" cy="30" r="3"/>' +
    '<circle cx="100" cy="30" r="3"/><circle cx="140" cy="30" r="3"/></g></svg>',
};

export const FIGURE_NAMES = Object.keys(FIGURE_PRESETS);
