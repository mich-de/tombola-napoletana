// Logica di gioco della Tombola Napoletana.
// Un'idea di Michele De Angelis · mdeangelis.me
const crypto = require("crypto");
const { getStore, hasRedis } = require("./store");
const DATA = require("../assets/data.js");

const K = { state: "tmb:state", players: "tmb:players", avatars: "tmb:avatars", reacts: "tmb:reacts", lock: "tmb:lock" };
const PIN = String(process.env.HOST_PIN || "1734");
const ROW_LEVELS = DATA.LEVELS.filter(l => l.need <= 5);

const rnd = n => crypto.randomInt(n);
const pick = a => a[rnd(a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const uid = () => crypto.randomBytes(8).toString("hex");
const clean = s => String(s || "").replace(/[<>&"]/g, "").replace(/\s+/g, " ").trim().slice(0, 24);

// ---------- Cartella: 3 righe × 9 colonne, 5 numeri per riga, decine per colonna ----------
function makeCard() {
  // quanti numeri per colonna (1..3), totale 15
  const cnt = Array(9).fill(1);
  let extra = 6;
  while (extra > 0) { const j = rnd(9); if (cnt[j] < 3) { cnt[j]++; extra--; } }
  // assegna le righe: greedy sulle colonne più piene
  const rowsLeft = [5, 5, 5];
  const grid = [Array(9).fill(0), Array(9).fill(0), Array(9).fill(0)];
  const order = shuffle([...Array(9).keys()]).sort((a, b) => cnt[b] - cnt[a]);
  for (const j of order) {
    const rows = shuffle([0, 1, 2]).sort((a, b) => rowsLeft[b] - rowsLeft[a]).slice(0, cnt[j]).sort();
    rows.forEach(r => { grid[r][j] = -1; rowsLeft[r]--; });
  }
  if (rowsLeft.some(x => x !== 0)) return makeCard();
  for (let j = 0; j < 9; j++) {
    const lo = j === 0 ? 1 : j * 10, hi = j === 8 ? 90 : j * 10 + 9;
    const pool = shuffle(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)).slice(0, cnt[j]).sort((a, b) => a - b);
    let k = 0;
    for (let r = 0; r < 3; r++) if (grid[r][j] === -1) grid[r][j] = pool[k++];
  }
  return grid;
}

// Il cartellone del banco: 6 cartelle (2 colonne × 3 file), ognuna 3 righe × 5 numeri
function bancoCards() {
  const cards = [];
  for (let b = 0; b < 6; b++) {
    const br = Math.floor(b / 2), bc = b % 2;
    cards.push([0, 1, 2].map(r => [0, 1, 2, 3, 4].map(c => (br * 3 + r) * 10 + bc * 5 + c + 1)));
  }
  return cards;
}
const BANCO_CARDS = bancoCards();
function bancoStatus(drawnSet) {
  let best = 0, full = false;
  for (const card of BANCO_CARDS) {
    const rows = card.map(row => row.filter(n => drawnSet.has(n)).length);
    best = Math.max(best, ...rows);
    if (rows.reduce((a, b) => a + b, 0) === 15) full = true;
  }
  return { best, full };
}

function cardStatus(card, drawnSet) {
  const rows = card.map(row => row.filter(n => n && drawnSet.has(n)).length);
  return { best: Math.max(...rows), full: rows.reduce((a, b) => a + b, 0) === 15 };
}

// ---------- Stato ----------
function freshState(prev) {
  return {
    v: 1, game: 1, phase: "lobby", drawn: [], prizes: {}, events: [], seq: 0,
    config: prev?.config || { interval: 12, prizes: DATA.DEFAULT_PRIZES },
    startedAt: null, updatedAt: Date.now()
  };
}
async function loadState(st) {
  const raw = await st.get(K.state);
  if (!raw) return freshState();
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}
const saveState = (st, s) => { s.updatedAt = Date.now(); return st.set(K.state, JSON.stringify(s)); };
const parse = v => (typeof v === "string" ? JSON.parse(v) : v);

// ---------- Il Tribunale della Smorfia: come si spartisce un premio ----------
const PEGNI = [
  "{W} si porta a casa il premio, ma offre un caffè a {O} ☕",
  "{W} prende il premio, {O} si prende la prima fetta (o il primo assaggio) 🍰",
  "{O} riceve da {W} un abbraccio ufficiale davanti a tutto l'ufficio 🤗",
  "{W} deve cantare un ritornello natalizio dedicato a {O} 🎶",
  "{O} sceglie la prossima canzone della festa, e {W} la deve ballare 💃",
  "{W} si tiene il premio, {O} si tiene la gloria e il fiocco del pacchetto 🎀",
  "{W} fa un selfie di gruppo con {O} e il premio, da mettere nella chat dell'ufficio 📸",
  "{O} ha diritto a un \"ti voglio bene\" pubblico da parte di {W} ❤️",
  "{W} deve raccontare a {O} il significato del suo numero preferito della smorfia 📜",
  "{O} può chiedere a {W} un favore piccolo piccolo entro Capodanno 🤝"
];
function judge(winners, prize) {
  if (winners.length < 2) return null;
  const m = String(prize).match(/(\d+(?:[.,]\d+)?)\s*€/);
  if (m) {
    const each = (parseFloat(m[1].replace(",", ".")) / winners.length);
    const fmt = (Math.floor(each * 100) / 100).toFixed(2).replace(".", ",").replace(",00", "");
    return {
      mode: "split", each: fmt,
      lines: [`Il Tribunale della Smorfia ha deciso: si fa a metà, anzi in ${winners.length}! ${fmt} € a testa.`,
        "Gli eventuali centesimi avanzati vanno al Munaciello, che come al solito sparisce con il resto 🧙"]
    };
  }
  const chosen = pick(winners);
  const others = winners.filter(w => w.id !== chosen.id);
  const pegni = shuffle(PEGNI);
  return {
    mode: "wheel", chosen: chosen.id,
    lines: [`La ruota della Smorfia ha scelto ${chosen.name}: si porta a casa ${prize}.`,
      ...others.map((o, i) => pegni[i % pegni.length].replace(/\{W\}/g, chosen.name).replace(/\{O\}/g, o.name))]
  };
}

function pushEvent(s, ev) {
  s.seq = (s.seq || 0) + 1;
  ev.id = s.seq; ev.at = Date.now(); ev.game = s.game;
  s.events = [...(s.events || []), ev].slice(-15);
}

// ---------- Estrazione e controllo vincite ----------
async function doDraw(st, s) {
  if (s.phase !== "playing" && s.phase !== "tombolino") return { error: "La partita non è in corso" };
  const remaining = [];
  for (let n = 1; n <= 90; n++) if (!s.drawn.includes(n)) remaining.push(n);
  if (!remaining.length) { s.phase = "over"; return { ok: true }; }
  const n = pick(remaining);
  s.drawn.push(n);
  s.lastDrawAt = Date.now();

  const all = await st.hgetall(K.players);
  const players = Object.values(all).map(parse).filter(p => p.card && p.cardGame === s.game);
  const set = new Set(s.drawn);
  const status = players.map(p => ({ p, ...cardStatus(p.card, set) }));
  if (s.config.bancoPlays !== false) status.push({ p: { id: "banco", name: "Il Banco", av: "banco" }, ...bancoStatus(set), banco: true });
  const changed = {};
  const award = (lvl, list) => {
    const winners = list.map(x => ({ id: x.p.id, name: x.p.name, av: x.p.av }));
    const prize = pick((s.config.prizes && s.config.prizes[lvl.key] && s.config.prizes[lvl.key].length) ? s.config.prizes[lvl.key] : DATA.DEFAULT_PRIZES[lvl.key]);
    const verdict = judge(winners, prize);
    s.prizes[lvl.key] = { winners, prize, verdict, n, draw: s.drawn.length };
    pushEvent(s, { type: "win", level: lvl.key, label: lvl.label, winners, prize, verdict, n });
    list.filter(x => !x.banco).forEach(x => { x.p.wins = [...(x.p.wins || []), { g: s.game, k: lvl.key, prize }]; changed[x.p.id] = JSON.stringify(x.p); });
  };
  for (const lvl of ROW_LEVELS) {
    if (s.prizes[lvl.key]) continue;
    const w = status.filter(x => x.best >= lvl.need);
    if (w.length) award(lvl, w);
  }
  const tombolaBefore = !!s.prizes.tombola;
  if (!s.prizes.tombola) {
    const w = status.filter(x => x.full);
    if (w.length) { award(DATA.LEVELS[4], w); s.phase = "tombolino"; }
  }
  if (tombolaBefore && !s.prizes.tombolino) {
    const tw = new Set(s.prizes.tombola.winners.map(x => x.id));
    const w = status.filter(x => x.full && !tw.has(x.p.id));
    if (w.length) { award(DATA.LEVELS[5], w); s.phase = "over"; pushEvent(s, { type: "over" }); }
  }
  if (s.drawn.length >= 90 && s.phase !== "over") { s.phase = "over"; pushEvent(s, { type: "over" }); }
  if (Object.keys(changed).length) await st.hmset(K.players, changed);
  return { ok: true, n };
}

async function newCards(st, s) {
  const all = await st.hgetall(K.players);
  const upd = {};
  for (const [id, raw] of Object.entries(all)) { const p = parse(raw); p.card = makeCard(); p.cardGame = s.game; upd[id] = JSON.stringify(p); }
  await st.hmset(K.players, upd);
}

// ---------- API ----------
async function handle({ method, query, body }) {
  const st = getStore();
  const a = query.a || body.a;
  if (process.env.VERCEL && !hasRedis()) {
    return { status: 503, json: { error: "setup", message: "Manca il database Redis: collega Upstash Redis al progetto su Vercel (Storage → Upstash → Connect)." } };
  }

  if (a === "state") {
    const s = await loadState(st);
    const [count, reacts] = await Promise.all([st.hlen(K.players), st.lrange(K.reacts, 0, 29)]);
    return {
      cache: !query.h, status: 200,
      json: {
        game: s.game, phase: s.phase, drawn: s.drawn, prizes: s.prizes, events: s.events, seq: s.seq,
        interval: s.config.interval, bancoPlays: s.config.bancoPlays !== false, lastDrawAt: s.lastDrawAt || null, count,
        reacts: (reacts || []).map(parse), now: Date.now()
      }
    };
  }

  if (a === "roster") {
    const all = await st.hgetall(K.players);
    const players = Object.values(all).map(parse).map(p => ({ id: p.id, name: p.name, av: p.av, wins: p.wins || [] }));
    return { cache: !query.h, status: 200, json: { players } };
  }

  if (a === "me") {
    const raw = await st.hget(K.players, String(query.id || ""));
    if (!raw) return { status: 404, json: { error: "Giocatore non trovato" } };
    const p = parse(raw);
    if (p.tk !== query.tk) return { status: 403, json: { error: "Accesso non valido" } };
    const s = await loadState(st);
    if (p.cardGame !== s.game) { p.card = makeCard(); p.cardGame = s.game; await st.hset(K.players, p.id, JSON.stringify(p)); }
    return { status: 200, json: { id: p.id, name: p.name, av: p.av, card: p.card, cardGame: p.cardGame, wins: p.wins || [] } };
  }

  if (method !== "POST") return { status: 405, json: { error: "Metodo non consentito" } };

  if (a === "join") {
    const name = clean(body.name);
    const av = String(body.av || "");
    if (!name) return { status: 400, json: { error: "Scrivi il tuo nome" } };
    if (!DATA.AVATAR_BY_ID[av] || av === "banco") return { status: 400, json: { error: "Scegli un personaggio" } };
    let p = null;
    if (body.id) { const raw = await st.hget(K.players, String(body.id)); if (raw) { p = parse(raw); if (p.tk !== body.tk) p = null; } }
    const id = p ? p.id : uid();
    if (!p || p.av !== av) {
      const ok = await st.hsetnx(K.avatars, av, id);
      if (!ok) { const owner = await st.hget(K.avatars, av); if (owner !== id) return { status: 409, json: { error: "Questo personaggio è già stato scelto da un altro giocatore" } }; }
      if (p && p.av) await st.hdel(K.avatars, p.av);
    }
    const s = await loadState(st);
    if (!p) p = { id, tk: uid(), wins: [], t: Date.now() };
    p.name = name; p.av = av;
    if (!p.card || p.cardGame !== s.game) { p.card = makeCard(); p.cardGame = s.game; }
    await st.hset(K.players, id, JSON.stringify(p));
    return { status: 200, json: { id: p.id, tk: p.tk, name: p.name, av: p.av, card: p.card, cardGame: p.cardGame, wins: p.wins } };
  }

  if (a === "react") {
    const e = String(body.e || "");
    if (!DATA.REACTIONS.includes(e)) return { status: 400, json: { error: "Reazione non valida" } };
    const raw = await st.hget(K.players, String(body.id || ""));
    if (!raw) return { status: 404, json: { error: "Giocatore non trovato" } };
    const p = parse(raw);
    if (p.tk !== body.tk) return { status: 403, json: { error: "Accesso non valido" } };
    await st.pushTrim(K.reacts, JSON.stringify({ i: uid(), p: p.id, n: p.name, a: p.av, e, t: Date.now() }), 40);
    return { status: 200, json: { ok: true } };
  }

  if (a === "host") {
    if (String(body.pin || "") !== PIN) return { status: 403, json: { error: "PIN del banco errato" } };
    const op = body.op;
    if (op === "check") return { status: 200, json: { ok: true, storage: st.kind } };
    if (op === "reset") {
      await st.del(K.state, K.players, K.avatars, K.reacts);
      return { status: 200, json: { ok: true } };
    }
    if (!(await st.lock(K.lock, 5000))) return { status: 429, json: { error: "Operazione in corso, riprova" } };
    try {
      const s = await loadState(st);
      let res = { ok: true };
      if (op === "start") {
        if (s.phase === "lobby") { s.phase = "playing"; s.startedAt = Date.now(); pushEvent(s, { type: "start" }); }
      } else if (op === "draw") {
        if (body.expect != null && Number(body.expect) !== s.drawn.length) return { status: 200, json: { ok: true, skipped: true } };
        res = await doDraw(st, s);
        if (res.error) return { status: 400, json: res };
      } else if (op === "newgame") {
        s.game += 1; s.phase = "lobby"; s.drawn = []; s.prizes = {}; s.lastDrawAt = null;
        pushEvent(s, { type: "newgame" });
        await newCards(st, s);
      } else if (op === "config") {
        const c = body.config || {};
        if (typeof c.bancoPlays === "boolean") s.config.bancoPlays = c.bancoPlays;
        if (c.interval) s.config.interval = Math.max(5, Math.min(60, Number(c.interval) || 12));
        if (c.prizes && typeof c.prizes === "object") {
          const pz = {};
          for (const l of DATA.LEVELS) {
            const arr = Array.isArray(c.prizes[l.key]) ? c.prizes[l.key].map(x => String(x).slice(0, 60).trim()).filter(Boolean).slice(0, 20) : [];
            pz[l.key] = arr.length ? arr : DATA.DEFAULT_PRIZES[l.key];
          }
          s.config.prizes = pz;
        }
        res = { ok: true, config: s.config };
      } else if (op === "getconfig") {
        return { status: 200, json: { ok: true, config: s.config } };
      } else if (op === "kick") {
        const raw = await st.hget(K.players, String(body.id || ""));
        if (raw) { const p = parse(raw); await st.hdel(K.players, p.id); await st.hdel(K.avatars, p.av); }
        return { status: 200, json: { ok: true } };
      } else return { status: 400, json: { error: "Operazione sconosciuta" } };
      await saveState(st, s);
      return { status: 200, json: res };
    } finally { await st.unlock(K.lock); }
  }
  return { status: 400, json: { error: "Azione sconosciuta" } };
}

module.exports = { handle, makeCard, cardStatus, BANCO_CARDS };
