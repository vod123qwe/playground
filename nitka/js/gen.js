// Nitka: generator plansz. Działa w workerze (importScripts) i w głównym wątku.
// Plansza = losowa ścieżka przez wszystkie pola kształtu (prostokąt, krzyż, pierścień, dziury...),
// na niej cyfry, ściany, zakręty/prosto, strzałki i portale. Solver szuka drugiego rozwiązania;
// jeśli je znajdzie, dokładamy wskazówkę dokładnie w miejscu rozjazdu, aż zostanie jedno.
(function (root) {
  'use strict';

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  const edgeKey = (a, b) => (a < b ? a * 4096 + b : b * 4096 + a);
  const pick = (arr, R) => arr[(R() * arr.length) | 0];

  // ---------- kształty ----------
  function shapeMask(shape, w, h, R) {
    const m = new Uint8Array(w * h).fill(1);
    const off = (x, y) => { if (x >= 0 && y >= 0 && x < w && y < h) m[y * w + x] = 0; };
    const rect = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) off(x, y); };
    switch (shape) {
      case 'holes': {
        const k = 1 + ((R() * Math.min(4, Math.floor(w * h / 14))) | 0);
        for (let i = 0; i < k; i++) off(1 + ((R() * (w - 2)) | 0), 1 + ((R() * (h - 2)) | 0));
        break;
      }
      case 'octagon': {
        const c = Math.max(1, Math.floor(Math.min(w, h) / 3.2));
        for (let y = 0; y < c; y++) for (let x = 0; x < c - y; x++) { off(x, y); off(w - 1 - x, y); off(x, h - 1 - y); off(w - 1 - x, h - 1 - y); }
        break;
      }
      case 'cross': {
        const a = Math.max(1, Math.round(w * 0.27)), b = Math.max(1, Math.round(h * 0.27));
        rect(0, 0, a - 1, b - 1); rect(w - a, 0, w - 1, b - 1); rect(0, h - b, a - 1, h - 1); rect(w - a, h - b, w - 1, h - 1);
        break;
      }
      case 'donut': {
        const t = w >= 7 && h >= 7 ? 2 : 2;
        rect(t, t, w - 1 - t, h - 1 - t);
        break;
      }
      case 'L': {
        const a = Math.floor(w / 2), b = Math.floor(h / 2);
        if (R() < 0.5) rect(w - a, 0, w - 1, b - 1); else rect(0, 0, a - 1, b - 1);
        break;
      }
      case 'U': {
        const a = Math.max(1, w - 4), b = Math.floor(h / 2);
        rect(2, 0, 2 + a - 1, b - 1);
        break;
      }
      case 'stairs': {
        const s = Math.min(w, h) - 3;
        for (let y = 0; y < s; y++) for (let x = w - (s - y); x < w; x++) off(x, y);
        break;
      }
      case 'heart': {
        // wcięcie na górze w środku + ścięte dolne rogi
        const mid = Math.floor(w / 2);
        off(mid, 0); if (w % 2 === 0) off(mid - 1, 0);
        off(0, 0); off(w - 1, 0);
        const c = Math.floor(h / 2.4);
        for (let y = 0; y < c; y++) for (let x = 0; x < c - y; x++) { off(x, h - 1 - y); off(w - 1 - x, h - 1 - y); }
        break;
      }
      default: break;
    }
    return m;
  }
  function gridNbrs(w, h, mask) {
    const T = w * h, nb = new Array(T);
    for (let c = 0; c < T; c++) {
      nb[c] = [];
      if (!mask[c]) continue;
      const x = c % w, y = (c / w) | 0;
      if (x > 0 && mask[c - 1]) nb[c].push(c - 1);
      if (x < w - 1 && mask[c + 1]) nb[c].push(c + 1);
      if (y > 0 && mask[c - w]) nb[c].push(c - w);
      if (y < h - 1 && mask[c + w]) nb[c].push(c + w);
    }
    return nb;
  }
  function maskOk(w, h, mask, nb) {
    const cells = [];
    for (let c = 0; c < w * h; c++) if (mask[c]) cells.push(c);
    if (cells.length < 16) return false;
    let b = 0;
    for (const c of cells) if (((c % w) + ((c / w) | 0)) % 2 === 0) b++;
    if (Math.abs(cells.length - 2 * b) > 1) return false;
    const seen = new Uint8Array(w * h), st = [cells[0]]; seen[cells[0]] = 1; let n = 0;
    while (st.length) { const c = st.pop(); n++; for (const m of nb[c]) if (!seen[m]) { seen[m] = 1; st.push(m); } }
    if (n !== cells.length) return false;
    let ones = 0;
    for (const c of cells) if (nb[c].length === 1) ones++;
    return ones <= 2;
  }

  // ---------- losowa ścieżka przez wszystkie pola ----------
  function warnsdorff(w, h, mask, nb, R) {
    const cells = [];
    for (let c = 0; c < w * h; c++) if (mask[c]) cells.push(c);
    const T = cells.length;
    let blacks = 0;
    for (const c of cells) if (((c % w) + ((c / w) | 0)) % 2 === 0) blacks++;
    const need = blacks * 2 > T ? 0 : blacks * 2 < T ? 1 : -1; // wymagany kolor startu
    const ones = cells.filter((c) => nb[c].length === 1);
    for (let attempt = 0; attempt < 40; attempt++) {
      let start;
      if (ones.length && R() < 0.8) start = pick(ones, R);
      else { const pool = cells.filter((c) => need < 0 || (((c % w) + ((c / w) | 0)) % 2) === need); start = pick(pool, R); }
      const vis = new Uint8Array(w * h), path = [start]; vis[start] = 1;
      let nodes = 0, ok = false;
      const free = (c) => { let d = 0; for (const m of nb[c]) if (!vis[m]) d++; return d; };
      const dfs = (c) => {
        if (path.length === T) return true;
        if (++nodes > 6000) return false;
        const cand = nb[c].filter((m) => !vis[m]).map((m) => [m, free(m) + R() * 0.9]);
        cand.sort((a, b) => a[1] - b[1]);
        for (const [m] of cand) {
          vis[m] = 1; path.push(m);
          // ślepe zaułki: ile nieodwiedzonych pól ma 0 wolnych sąsiadów (poza głową)
          let dead = 0;
          for (const q of nb[c]) if (!vis[q] && free(q) === 0 && !nb[m].includes(q)) dead++;
          if (dead === 0 && dfs(m)) return true;
          vis[m] = 0; path.pop();
          if (nodes > 6000) return false;
        }
        return false;
      };
      ok = dfs(start);
      if (ok) return path;
    }
    return null;
  }
  function backbite(p, nb, R, steps) {
    const T = p.length, pos = new Map();
    p.forEach((c, i) => pos.set(c, i));
    const rev = (a, b) => { for (let i = a, j = b; i < j; i++, j--) { const t = p[i]; p[i] = p[j]; p[j] = t; } for (let i = a; i <= b; i++) pos.set(p[i], i); };
    for (let s = 0; s < steps; s++) {
      if (R() < 0.5) {
        const e = p[T - 1], opts = nb[e].filter((v) => v !== p[T - 2]);
        if (!opts.length) continue;
        rev(pos.get(pick(opts, R)) + 1, T - 1);
      } else {
        const e = p[0], opts = nb[e].filter((v) => v !== p[1]);
        if (!opts.length) continue;
        rev(0, pos.get(pick(opts, R)) - 1);
      }
    }
    return p;
  }

  // portal: ścieżka A + [skok] + odwrócony ogon. Para = (p[i], dawny koniec).
  function addPortal(p, portals, w, R) {
    const T = p.length, isP = new Set(portals.flat());
    const man = (a, b) => Math.abs((a % w) - (b % w)) + Math.abs(((a / w) | 0) - ((b / w) | 0));
    const end = p[T - 1], cands = [];
    for (let i = Math.floor(T * 0.22); i < Math.floor(T * 0.72); i++) {
      const a = p[i];
      if (i < 1 || isP.has(a) || isP.has(end) || isP.has(p[i + 1]) || man(a, end) < 3) continue;
      cands.push(i);
    }
    if (!cands.length) return p;
    const i = pick(cands, R);
    portals.push([p[i], end]);
    return p.slice(0, i + 1).concat(p.slice(i + 1).reverse());
  }

  // ---------- problem i solver ----------
  function buildProblem(pz, clueCells, walls, markers, arrows) {
    const { w, h, mask, portals } = pz, T = w * h;
    const base = gridNbrs(w, h, mask);
    const adj = base.map((l, c) => l.filter((m) => !walls.has(edgeKey(c, m))));
    const clueAt = new Int16Array(T), partner = new Int32Array(T).fill(-1), mark = new Int8Array(T), arrow = new Int32Array(T).fill(-1);
    clueCells.forEach((c, i) => { clueAt[c] = i + 1; });
    for (const [a, b] of portals) { partner[a] = b; partner[b] = a; }
    for (const [c, t] of markers) mark[c] = t;
    for (const [c, to] of arrows) arrow[c] = to;
    let count = 0;
    for (let c = 0; c < T; c++) if (mask[c]) count++;
    return { w, h, T, count, adj, clueAt, partner, mark, arrow, start: clueCells[0], end: clueCells[clueCells.length - 1] };
  }

  function solve(P, maxSol, budget) {
    const { T, count, adj, clueAt, partner, mark, arrow, start, end } = P;
    const vis = new Uint8Array(T), path = new Int32Array(count), stack = new Int32Array(T), seen = new Int32Array(T);
    const sols = [];
    let nodes = 0, aborted = false, stamp = 0;
    const okDeg = (c, head) => {
      let d = 0;
      const a = adj[c];
      for (let i = 0; i < a.length; i++) if (!vis[a[i]] || a[i] === head) d++;
      return d >= (c === end || partner[c] >= 0 ? 1 : 2);
    };
    const connected = (head, remaining) => {
      stamp++;
      let sp = 0, cnt = 0;
      const push = (m) => { if (!vis[m] && seen[m] !== stamp) { seen[m] = stamp; stack[sp++] = m; } };
      for (const m of adj[head]) push(m);
      if (partner[head] >= 0) push(partner[head]);
      while (sp) {
        const c = stack[--sp]; cnt++;
        for (const m of adj[c]) push(m);
        if (partner[c] >= 0) push(partner[c]);
      }
      return cnt === remaining;
    };
    function dfs(head, prev, len, next) {
      if (++nodes > budget) { aborted = true; return; }
      if (len === count) { if (head === end) sols.push(Array.from(path)); return; }
      const jump = partner[head] >= 0 && prev !== partner[head];
      const cands = jump ? [partner[head]] : adj[head];
      for (let i = 0; i < cands.length; i++) {
        const nb = cands[i];
        if (vis[nb]) continue;
        if (!jump) {
          if (arrow[head] >= 0 && nb !== arrow[head]) continue;
          if (mark[head] && prev >= 0) {
            const straight = head - prev === nb - head;
            if (mark[head] === 1 && straight) continue;
            if (mark[head] === 2 && !straight) continue;
          }
          if (partner[nb] >= 0 && vis[partner[nb]]) continue;
        }
        const cl = clueAt[nb];
        if (cl && cl !== next) continue;
        if (nb === end && len + 1 < count) continue;
        vis[nb] = 1; path[len] = nb;
        let ok = true;
        const a = adj[head];
        for (let j = 0; j < a.length; j++) { const m = a[j]; if (!vis[m] && !okDeg(m, nb)) { ok = false; break; } }
        if (ok && len + 1 < count && !connected(nb, count - len - 1)) ok = false;
        if (ok) dfs(nb, head, len + 1, cl ? next + 1 : next);
        vis[nb] = 0;
        if (aborted || sols.length >= maxSol) return;
      }
    }
    vis[start] = 1; path[0] = start;
    dfs(start, -1, 1, 2);
    return { sols, aborted, nodes };
  }

  // ---------- generowanie ----------
  // opts: { w, h, shape, seed, clueFrac, wallRate, turns, arrows, portals, initTurns, initArrows, budget }
  function generate(opts) {
    const R = rng(opts.seed);
    let w = opts.w, h = opts.h, mask, nb, sol = null, shape = opts.shape || 'rect';
    for (let tries = 0; tries < 30 && !sol; tries++) {
      const sh = tries < 22 ? shape : 'rect';
      mask = shapeMask(sh, w, h, R);
      nb = gridNbrs(w, h, mask);
      if (!maskOk(w, h, mask, nb)) continue;
      sol = warnsdorff(w, h, mask, nb, R);
      if (sol) shape = sh;
    }
    const T = sol.length;
    backbite(sol, nb, R, T * 40);
    const portals = [];
    for (let k = 0; k < (opts.portals || 0); k++) sol = addPortal(sol, portals, w, R);
    const portalSet = new Set(portals.flat());
    const pos = new Map(); sol.forEach((c, i) => pos.set(c, i));
    const walkAdj = (a, b) => nb[a].includes(b);

    // cyfry startowe
    const idx = new Set([0, T - 1]);
    const k0 = Math.max(0, Math.round(T * opts.clueFrac));
    for (let i = 1; i <= k0; i++) {
      let j = Math.round((i * (T - 1)) / (k0 + 1) + (R() - 0.5) * ((T - 1) / (k0 + 1)) * 0.7);
      while (j > 0 && j < T - 1 && portalSet.has(sol[j])) j++;
      if (j > 0 && j < T - 1) idx.add(j);
    }
    const markers = new Map(), arrows = new Map(), walls = new Set(), wallList = [];
    const taken = (c) => portalSet.has(c) || markers.has(c) || arrows.has(c) || [...idx].some((j) => sol[j] === c);
    const canMark = (i) => i >= 1 && i < T - 1 && !taken(sol[i]) && walkAdj(sol[i - 1], sol[i]) && walkAdj(sol[i], sol[i + 1]);
    const canArrow = (i) => i >= 0 && i < T - 1 && !taken(sol[i]) && walkAdj(sol[i], sol[i + 1]);
    const markType = (i) => (sol[i] - sol[i - 1] === sol[i + 1] - sol[i] ? 2 : 1); // 2 prosto, 1 zakręt
    const place = (n, can, put) => {
      for (let t = 0, done = 0; t < n * 12 && done < n; t++) { const i = 1 + ((R() * (T - 2)) | 0); if (can(i)) { put(i); done++; } }
    };
    if (opts.turns) place(opts.initTurns || 0, canMark, (i) => markers.set(sol[i], markType(i)));
    if (opts.arrows) place(opts.initArrows || 0, canArrow, (i) => arrows.set(sol[i], sol[i + 1]));

    const pz = { w, h, mask, portals };
    const budget = opts.budget || 150000;
    let unique = false, iter = 0;
    const wW = opts.wallRate || 0, wT = opts.turns ? 0.9 : 0, wA = opts.arrows ? 0.6 : 0;
    for (; iter < 80; iter++) {
      const sorted = [...idx].sort((a, b) => a - b);
      const P = buildProblem(pz, sorted.map((i) => sol[i]), walls, [...markers], [...arrows]);
      const res = solve(P, 2, budget);
      const alt = res.sols.find((s) => s.some((c, i) => c !== sol[i]));
      if (!alt && !res.aborted) { unique = true; break; }
      if (!alt) {
        let best = 0, at = 1;
        for (let j = 1; j < sorted.length; j++) if (sorted[j] - sorted[j - 1] > best) { best = sorted[j] - sorted[j - 1]; at = (sorted[j] + sorted[j - 1]) >> 1; }
        while (at < T - 1 && portalSet.has(sol[at])) at++;
        idx.add(at);
        continue;
      }
      let i = 1;
      while (alt[i] === sol[i]) i++;
      const u = sol[i - 1];
      // dostępne sposoby rozbicia niejednoznaczności, z wagami
      const opt = [];
      const m = pos.get(alt[i]);
      const between = sorted.some((j) => j > i && j < m);
      const numCands = (between ? [m, i] : [i, m]).concat([i + 1 + ((R() * Math.max(1, m - i - 1)) | 0)]);
      const numPick = numCands.find((j) => j > 0 && j < T - 1 && !idx.has(j) && !taken(sol[j]));
      if (numPick !== undefined) opt.push(['num', 1]);
      if (wW && walkAdj(u, alt[i])) opt.push(['wall', wW * 2]);
      if (wT && canMark(i - 1)) opt.push(['mark', wT * (markType(i - 1) === 2 ? 1.6 : 0.8)]);
      if (wA && canArrow(i - 1)) opt.push(['arrow', wA]);
      if (!opt.length) { if (walkAdj(u, alt[i])) opt.push(['wall', 1]); else break; }
      let r = R() * opt.reduce((s, o) => s + o[1], 0), kind = opt[0][0];
      for (const o of opt) { r -= o[1]; if (r <= 0) { kind = o[0]; break; } }
      if (kind === 'num') idx.add(numPick);
      else if (kind === 'wall') { walls.add(edgeKey(u, alt[i])); wallList.push([u, alt[i]]); }
      else if (kind === 'mark') markers.set(u, markType(i - 1));
      else arrows.set(u, sol[i]);
    }
    const sorted = [...idx].sort((a, b) => a - b);
    return {
      w, h, shape, mask: Array.from(mask).join(''),
      clues: sorted.map((i) => sol[i]),
      walls: wallList, markers: [...markers], arrows: [...arrows], portals,
      sol, unique, iter, seed: opts.seed,
    };
  }

  // ---------- światy i poziomy ----------
  const WORLDS = [
    { name: 'Łąka', pal: 0, shapes: ['rect'], sizes: [[5, 5], [5, 6], [6, 6]], boss: [7, 7], bossShape: ['rect'], mech: {} },
    { name: 'Ogród', pal: 4, shapes: ['rect', 'holes', 'octagon'], sizes: [[6, 6], [6, 7], [7, 7]], boss: [7, 8], bossShape: ['heart', 'octagon'], mech: { walls: 0.45 }, intro: 'shapes' },
    { name: 'Kręte ścieżki', pal: 1, shapes: ['rect', 'cross', 'holes', 'L'], sizes: [[6, 6], [6, 7], [7, 7]], boss: [8, 8], bossShape: ['cross', 'octagon'], mech: { walls: 0.25, turns: true }, intro: 'turns' },
    { name: 'Wiatr', pal: 2, shapes: ['rect', 'U', 'octagon', 'stairs'], sizes: [[6, 7], [7, 7], [7, 8]], boss: [8, 9], bossShape: ['U', 'heart'], mech: { walls: 0.25, turns: true, arrows: true }, intro: 'arrows' },
    { name: 'Portale', pal: 3, shapes: ['rect', 'donut', 'cross', 'holes'], sizes: [[6, 7], [7, 7], [7, 8]], boss: [8, 9], bossShape: ['donut', 'cross'], mech: { walls: 0.3, turns: true, arrows: true, portals: 1 }, intro: 'portals' },
    { name: 'Labirynt', pal: 5, shapes: ['rect', 'holes', 'octagon', 'cross', 'donut', 'L', 'U', 'stairs', 'heart'], sizes: [[7, 7], [7, 8], [8, 8]], boss: [8, 9], bossShape: ['heart', 'donut', 'cross'], mech: { walls: 0.35, turns: true, arrows: true, portals: 1 } },
  ];
  function worldOf(level) {
    const wi = Math.floor((level - 1) / 10);
    const W = WORLDS[Math.min(wi, WORLDS.length - 1)];
    return { index: wi, def: W, name: wi >= WORLDS.length - 1 ? `${W.name} ${wi - WORLDS.length + 2}` : W.name, k: ((level - 1) % 10) + 1 };
  }
  function levelConfig(level, R) {
    R = R || Math.random;
    const { index, def, k } = worldOf(level);
    const m = def.mech, boss = k === 10;
    const hard = Math.min(1, index / 6);
    let size = boss ? def.boss : def.sizes[k <= 3 ? 0 : k <= 6 ? 1 : 2];
    if (R() < 0.5 && size[0] !== size[1]) size = [size[1], size[0]];
    if (size[0] > 8) size = [size[1], size[0]]; // szerokość max 8 (telefon)
    const shape = boss ? pick(def.bossShape, R) : (level <= 2 ? 'rect' : pick(def.shapes, R));
    const clueFrac = boss ? 0.05 : Math.max(0.045, (level <= 1 ? 0.2 : 0.14) - k * 0.008 - hard * 0.03);
    const intro = k === 1 && def.intro;
    return {
      w: size[0], h: size[1], shape,
      clueFrac,
      wallRate: m.walls ? m.walls + hard * 0.1 : (index === 0 && k >= 6 ? 0.3 : 0),
      turns: !!m.turns, arrows: !!m.arrows,
      initTurns: m.turns ? (intro === 'turns' ? 5 : 2 + ((R() * 3) | 0)) : 0,
      initArrows: m.arrows ? (intro === 'arrows' ? 4 : 1 + ((R() * 2) | 0)) : 0,
      portals: m.portals ? (boss || (index >= 5 && R() < 0.4) ? 2 : 1) : 0,
      boss, world: index, k,
    };
  }
  function dailyConfig(dateStr) {
    const seed = hashStr('nitka-' + dateStr), R = rng(seed);
    const shapes = ['rect', 'octagon', 'cross', 'holes', 'donut', 'heart', 'U'];
    return { w: 7, h: 8, shape: pick(shapes, R), clueFrac: 0.06, wallRate: 0.35, turns: true, arrows: R() < 0.5, initTurns: 3, initArrows: 1, portals: R() < 0.4 ? 1 : 0, seed };
  }

  root.NitkaGen = { generate, levelConfig, dailyConfig, worldOf, WORLDS, hashStr, rng, solve, buildProblem, edgeKey, shapeMask };
})(typeof self !== 'undefined' ? self : this);
