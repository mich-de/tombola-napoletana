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
  let best = 0, full = false, fullNums = null, fullIdx = -1;
  const rowsInfo = [];
  BANCO_CARDS.forEach((card, b) => {
    const rows = card.map(row => row.filter(n => drawnSet.has(n)).length);
    card.forEach((row, r) => rowsInfo.push({ b, nums: row, cnt: rows[r] }));
    best = Math.max(best, ...rows);
    if (!full && rows.reduce((a, c) => a + c, 0) === 15) { full = true; fullNums = card.flat(); fullIdx = b; }
  });
  return { best, full, rowsInfo, fullNums, fullIdx };
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
// stato di tutte le cartelle in gioco (giocatori + 6 cartelle del banco)
async function gameStatus(st, s) {
  const all = await st.hgetall(K.players);
  const players = Object.values(all).map(parse).filter(p => p.card && p.cardGame === s.game);
  const set = new Set(s.drawn);
  const status = players.map(p => ({ p, ...cardStatus(p.card, set) }));
  if (s.config.bancoPlays !== false) status.push({ p: { id: "banco", name: "Il Banco", av: "banco" }, ...bancoStatus(set), banco: true });
  return { set, status };
}
const mode = s => (s.config.mode === "chiamata" ? "chiamata" : "auto");
// il prossimo premio in palio, in ordine (ambo, terno, … tombola, tombolino)
function nextLevel(s) {
  for (const l of ROW_LEVELS) if (!s.prizes[l.key]) return l;
  if (!s.prizes.tombola) return DATA.LEVELS[4];
  if (!s.prizes.tombolino) return DATA.LEVELS[5];
  return null;
}
function qualifies(s, x, lvl) {
  if (lvl.need <= 5) return x.best >= lvl.need;
  if (lvl.key === "tombolino") return x.full && !(s.prizes.tombola && s.prizes.tombola.winners.some(w => w.id === x.p.id));
  return x.full;
}
function makeAwarder(s, set, changed) {
  const n = s.drawn[s.drawn.length - 1];
  return (lvl, list) => {
    // con quali numeri ha vinto ciascuno (la riga vincente; per tombola e tombolino tutta la cartella)
    const winNums = x => {
      if (x.banco) {
        if (lvl.need <= 5) { const row = x.rowsInfo.find(r => r.cnt >= lvl.need); return row.nums.filter(k => set.has(k)); }
        return x.fullNums;
      }
      if (lvl.need <= 5) { const row = x.p.card.find(r => r.filter(k => k && set.has(k)).length >= lvl.need); return row ? row.filter(k => k && set.has(k)) : []; }
      return x.p.card.flat().filter(Boolean);
    };
    const winners = list.map(x => ({ id: x.p.id, name: x.p.name, av: x.p.av, ph: x.p.ph || null, nums: winNums(x) }));
    const prize = pick((s.config.prizes && s.config.prizes[lvl.key] && s.config.prizes[lvl.key].length) ? s.config.prizes[lvl.key] : DATA.DEFAULT_PRIZES[lvl.key]);
    const verdict = judge(winners, prize);
    const bx = list.find(x => x.banco);
    let banco = null;
    if (bx) {
      if (lvl.need <= 5) { const row = bx.rowsInfo.find(r => r.cnt >= lvl.need); banco = { cartella: row.b + 1, nums: row.nums.filter(k => set.has(k)) }; }
      else banco = { cartella: bx.fullIdx + 1, nums: bx.fullNums };
    }
    const cards = lvl.need === 15 ? Object.fromEntries(list.map(x => [x.p.id, x.banco ? x.fullNums : x.p.card.flat().filter(Boolean)])) : null;
    s.prizes[lvl.key] = { winners, prize, verdict, n, draw: s.drawn.length, banco };
    pushEvent(s, { type: "win", level: lvl.key, label: lvl.label, winners, prize, verdict, n, banco, cards });
    list.filter(x => !x.banco).forEach(x => { x.p.wins = [...(x.p.wins || []), { g: s.game, k: lvl.key, prize }]; changed[x.p.id] = JSON.stringify(x.p); });
    if (lvl.key === "tombola") s.phase = "tombolino";
    if (lvl.key === "tombolino") { s.phase = "over"; pushEvent(s, { type: "over" }); }
  };
}

// chiude una chiamata "a dividere" quando scade il tempo
async function finalizePending(st, s, force) {
  const pd = s.pending;
  if (!pd || (!force && Date.now() < pd.until)) return false;
  s.pending = null;
  const { set, status } = await gameStatus(st, s);
  const lvl = DATA.LEVELS.find(l => l.key === pd.level);
  const list = status.filter(x => pd.ids.includes(x.p.id));
  if (list.length && !s.prizes[lvl.key]) {
    const changed = {};
    makeAwarder(s, set, changed)(lvl, list);
    if (Object.keys(changed).length) await st.hmset(K.players, changed);
  }
  return true;
}

async function doDraw(st, s) {
  if (s.phase !== "playing" && s.phase !== "tombolino") return { error: "La partita non è in corso" };
  if (s.pending) await finalizePending(st, s, true);
  if (s.phase === "over") return { ok: true };
  const remaining = [];
  for (let n = 1; n <= 90; n++) if (!s.drawn.includes(n)) remaining.push(n);
  if (!remaining.length) { s.phase = "over"; return { ok: true }; }
  const n = pick(remaining);
  s.drawn.push(n);
  s.lastDrawAt = Date.now();

  if (mode(s) === "auto") {
    const { set, status } = await gameStatus(st, s);
    const changed = {};
    const award = makeAwarder(s, set, changed);
    for (const lvl of ROW_LEVELS) {
      if (s.prizes[lvl.key]) continue;
      const w = status.filter(x => x.best >= lvl.need);
      if (w.length) award(lvl, w);
    }
    const tombolaBefore = !!s.prizes.tombola;
    if (!s.prizes.tombola) { const w = status.filter(x => x.full); if (w.length) award(DATA.LEVELS[4], w); }
    if (tombolaBefore && !s.prizes.tombolino) { const w = status.filter(x => qualifies(s, x, DATA.LEVELS[5])); if (w.length) award(DATA.LEVELS[5], w); }
    if (Object.keys(changed).length) await st.hmset(K.players, changed);
  }
  if (s.drawn.length >= 90 && s.phase !== "over") { s.phase = "over"; pushEvent(s, { type: "over" }); }
  return { ok: true, n };
}

// un giocatore (o il banco) chiama un premio: "Ambo!"
async function doCall(st, s, who, levelKey) {
  if (mode(s) !== "chiamata") return { status: 400, json: { error: "In questa partita le vincite sono automatiche" } };
  if (s.phase !== "playing" && s.phase !== "tombolino") return { status: 400, json: { error: "La partita non è in corso" } };
  if (s.pending) await finalizePending(st, s);
  const lvl = DATA.LEVELS.find(l => l.key === levelKey);
  const next = nextLevel(s);
  const pend = s.pending && s.pending.level === levelKey;
  if (!lvl || (!pend && (!next || next.key !== lvl.key))) return { status: 200, json: { result: "late", message: s.prizes[levelKey] ? `${lvl ? lvl.label : "Il premio"} è già stato assegnato!` : "Prima tocca a " + (next ? next.label : "nessuno") } };
  const { set, status } = await gameStatus(st, s);
  const me = status.find(x => x.p.id === who);
  if (!me) return { status: 200, json: { result: "nocard", message: "Non hai una cartella in questa partita" } };
  if (!qualifies(s, me, lvl)) {
    const p = me.p;
    s.falseCalls = s.falseCalls || {};
    if (!s.falseCalls[who] || Date.now() - s.falseCalls[who] > 8000) { s.falseCalls[who] = Date.now(); pushEvent(s, { type: "falsecall", name: p.name, av: p.av, label: lvl.label }); }
    return { status: 200, json: { result: "false", message: `Nun è overo! ${lvl.label} a vuoto 🙈` } };
  }
  const changed = {};
  if (s.config.tie === "dividi") {
    if (pend) { if (!s.pending.ids.includes(who)) { s.pending.ids.push(who); s.pending.names.push(me.p.name); pushEvent(s, { type: "call", name: me.p.name, av: me.p.av, label: lvl.label, join: true }); } }
    else { s.pending = { level: lvl.key, label: lvl.label, ids: [who], names: [me.p.name], until: Date.now() + 8000 }; pushEvent(s, { type: "call", name: me.p.name, av: me.p.av, label: lvl.label }); }
    return { status: 200, json: { result: "pending", message: `${lvl.label} chiamato! Se lo chiama anche qualcun altro entro pochi secondi, si divide.` } };
  }
  pushEvent(s, { type: "call", name: me.p.name, av: me.p.av, label: lvl.label });
  makeAwarder(s, set, changed)(lvl, [me]);
  if (Object.keys(changed).length) await st.hmset(K.players, changed);
  return { status: 200, json: { result: "won", message: `${lvl.label}! Sei stato il più veloce 🏆` } };
}

// messaggi vocali (walkie-talkie): il banco e, se il banco lo permette, i giocatori
async function saveSay(st, body, who, max) {
  const b64 = String(body.b64 || ""), mime = String(body.mime || "audio/webm").slice(0, 60);
  if (!b64 || b64.length > max) return { status: 400, json: { error: "Messaggio troppo lungo" } };
  const id = Date.now() * 1000 + crypto.randomInt(1000);
  await st.set("tmb:say:" + id, JSON.stringify({ mime, b64 }));
  return withLock(st, async () => {
    const s = await loadState(st);
    s.says = [...(s.says || []), { id, at: Date.now(), ...who }];
    const old = s.says.length > 12 ? s.says.splice(0, s.says.length - 12) : [];
    await saveState(st, s);
    for (const o of old) await st.del("tmb:say:" + o.id);
    return { status: 200, json: { ok: true, id } };
  });
}

async function withLock(st, fn) {
  for (let i = 0; i < 25; i++) {
    if (await st.lock(K.lock, 5000)) { try { return await fn(); } finally { await st.unlock(K.lock); } }
    await new Promise(r => setTimeout(r, 120 + Math.random() * 120));
  }
  return { status: 429, json: { error: "Troppa gente insieme, riprova!" } };
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
    let s = await loadState(st);
    if (s.pending && Date.now() >= s.pending.until) {
      await withLock(st, async () => { const s2 = await loadState(st); if (await finalizePending(st, s2)) await saveState(st, s2); });
      s = await loadState(st);
    }
    const [count, reacts] = await Promise.all([st.hlen(K.players), st.lrange(K.reacts, 0, 29)]);
    const inGame = s.inGame != null ? s.inGame : count;
    return {
      cache: !query.h, status: 200,
      json: {
        game: s.game, phase: s.phase, drawn: s.drawn, prizes: s.prizes, events: s.events, seq: s.seq,
        interval: s.config.interval, bancoPlays: s.config.bancoPlays !== false,
        recs: s.recs || {}, says: s.says || [], playersTalk: !!s.config.playersTalk, lateJoin: s.config.lateJoin !== false,
        mode: mode(s), tie: s.config.tie === "dividi" ? "dividi" : "primo", next: (nextLevel(s) || {}).key || null,
        pending: s.pending ? { level: s.pending.level, label: s.pending.label, names: s.pending.names, until: s.pending.until } : null, lastDrawAt: s.lastDrawAt || null, count, inGame,
        reacts: (reacts || []).map(parse), now: Date.now()
      }
    };
  }

  if (a === "photo") {
    if (method === "POST") {
      const raw = await st.hget(K.players, String(body.id || ""));
      if (!raw) return { status: 404, json: { error: "Giocatore non trovato" } };
      const p = parse(raw);
      if (p.tk !== body.tk) return { status: 403, json: { error: "Accesso non valido" } };
      const b64 = String(body.b64 || "");
      if (b64.length > 90000) return { status: 400, json: { error: "Foto troppo grande" } };
      if (b64) { await st.set("tmb:photo:" + p.id, b64); p.ph = Date.now(); } else { await st.del("tmb:photo:" + p.id); delete p.ph; }
      await st.hset(K.players, p.id, JSON.stringify(p));
      return { status: 200, json: { ok: true, ph: p.ph || null } };
    }
    const b64 = await st.get("tmb:photo:" + String(query.id || "").replace(/[^a-f0-9]/g, ""));
    if (!b64) return { status: 404, json: { error: "Nessuna foto" } };
    return { status: 200, cache: true, binary: Buffer.from(b64, "base64"), type: "image/jpeg" };
  }

  if (a === "say") {
    const raw = await st.get("tmb:say:" + String(query.id || "").replace(/\D/g, ""));
    if (!raw) return { status: 404, json: { error: "Messaggio non trovato" } };
    const j = parse(raw);
    return { status: 200, cache: true, json: { mime: j.mime, b64: j.b64 } };
  }

  if (a === "talk") {
    const raw = await st.hget(K.players, String(body.id || ""));
    if (!raw) return { status: 404, json: { error: "Giocatore non trovato" } };
    const p = parse(raw);
    if (p.tk !== body.tk) return { status: 403, json: { error: "Accesso non valido" } };
    const s0 = await loadState(st);
    if (!s0.config.playersTalk) return { status: 403, json: { error: "Il banco non ha dato la parola ai giocatori" } };
    const last = (s0.says || []).filter(x => x.pid === p.id).pop();
    if (last && Date.now() - last.at < 12000) return { status: 429, json: { error: "Aspetta qualche secondo prima di parlare di nuovo" } };
    return saveSay(st, body, { pid: p.id, name: p.name, av: p.av }, 800000);
  }

  if (a === "rec") {
    const raw = await st.get("tmb:rec:" + (query.n === "late" ? "late" : Number(query.n)));
    if (!raw) return { status: 404, json: { error: "Nessuna registrazione" } };
    return { status: 200, cache: true, json: parse(raw) };
  }

  if (a === "roster") {
    const all = await st.hgetall(K.players);
    const players = Object.values(all).map(parse).map(p => ({ id: p.id, name: p.name, av: p.av, ph: p.ph || null, wins: p.wins || [] }));
    return { cache: !query.h, status: 200, json: { players } };
  }

  if (a === "me") {
    const raw = await st.hget(K.players, String(query.id || ""));
    if (!raw) return { status: 404, json: { error: "Giocatore non trovato" } };
    const p = parse(raw);
    if (p.tk !== query.tk) return { status: 403, json: { error: "Accesso non valido" } };
    const s = await loadState(st);
    if (p.cardGame !== s.game && s.phase === "lobby") { p.card = makeCard(); p.cardGame = s.game; await st.hset(K.players, p.id, JSON.stringify(p)); }
    const playing = p.cardGame === s.game;
    return { status: 200, json: { id: p.id, name: p.name, av: p.av, ph: p.ph || null, card: playing ? p.card : null, cardGame: playing ? p.cardGame : null, spectator: !playing, wins: p.wins || [] } };
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
    // a partita iniziata: se il banco lo permette si entra subito (senza i premi già usciti, e con pernacchione),
    // altrimenti si guarda e si gioca dalla prossima
    let late = false;
    if ((!p.card || p.cardGame !== s.game) && s.phase === "lobby") { p.card = makeCard(); p.cardGame = s.game; }
    else if (p.cardGame !== s.game && (s.phase === "playing" || s.phase === "tombolino") && s.config.lateJoin !== false) {
      p.card = makeCard(); p.cardGame = s.game; p.lateFrom = s.drawn.length; late = true;
    }
    await st.hset(K.players, id, JSON.stringify(p));
    const playing = p.cardGame === s.game;
    if (late) await withLock(st, async () => {
      const s2 = await loadState(st);
      const missed = DATA.LEVELS.filter(l => s2.prizes[l.key]).map(l => l.label);
      pushEvent(s2, { type: "late", id: p.id, ph: p.ph || null, name: p.name, av: p.av, missed, drawn: s2.drawn.length });
      await saveState(st, s2);
    });
    return { status: 200, json: { id: p.id, tk: p.tk, name: p.name, av: p.av, ph: p.ph || null, card: playing ? p.card : null, cardGame: playing ? p.cardGame : null, spectator: !playing, late, wins: p.wins, phase: s.phase } };
  }

  if (a === "call") {
    const raw = await st.hget(K.players, String(body.id || ""));
    if (!raw) return { status: 404, json: { error: "Giocatore non trovato" } };
    const p = parse(raw);
    if (p.tk !== body.tk) return { status: 403, json: { error: "Accesso non valido" } };
    return withLock(st, async () => { const s = await loadState(st); const r = await doCall(st, s, p.id, String(body.level || "")); await saveState(st, s); return r; });
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
    if (op === "say") return saveSay(st, body, { pid: "banco", name: "Il Banco", av: "banco" }, 1500000);
    if (op === "rec" || op === "recdel") {
      const n = body.n === "late" ? "late" : Number(body.n);
      if (n !== "late" && !(n >= 1 && n <= 90)) return { status: 400, json: { error: "Numero non valido" } };
      if (op === "rec") {
        const b64 = String(body.b64 || ""), mime = String(body.mime || "audio/webm").slice(0, 60);
        if (!b64 || b64.length > 1500000) return { status: 400, json: { error: "Registrazione troppo lunga (max ~20 secondi)" } };
        await st.set("tmb:rec:" + n, JSON.stringify({ mime, b64 }));
      } else await st.del("tmb:rec:" + n);
      return withLock(st, async () => {
        const s = await loadState(st); s.recs = s.recs || {};
        if (op === "rec") s.recs[n] = Date.now(); else delete s.recs[n];
        await saveState(st, s); return { status: 200, json: { ok: true, recs: s.recs } };
      });
    }
    if (op === "reset") {
      const old = await loadState(st);
      const ids = Object.keys(await st.hgetall(K.players));
      for (const id of ids) await st.del("tmb:photo:" + id);
      await st.del(K.state, K.players, K.avatars, K.reacts);
      if (old.recs && Object.keys(old.recs).length) { const f = freshState(old); f.recs = old.recs; await saveState(st, f); }
      return { status: 200, json: { ok: true } };
    }
    let got = false;
    for (let i = 0; i < 25 && !got; i++) { got = await st.lock(K.lock, 5000); if (!got) await new Promise(r => setTimeout(r, 120)); }
    if (!got) return { status: 429, json: { error: "Operazione in corso, riprova" } };
    try {
      const s = await loadState(st);
      let res = { ok: true };
      if (op === "start") {
        if (s.phase === "lobby") {
          s.phase = "playing"; s.startedAt = Date.now();
          const all = await st.hgetall(K.players);
          s.inGame = Object.values(all).map(parse).filter(p => p.cardGame === s.game).length;
          pushEvent(s, { type: "start" });
        }
      } else if (op === "draw") {
        if (body.expect != null && Number(body.expect) !== s.drawn.length) return { status: 200, json: { ok: true, skipped: true } };
        res = await doDraw(st, s);
        if (res.error) return { status: 400, json: res };
      } else if (op === "newgame") {
        s.game += 1; s.phase = "lobby"; s.drawn = []; s.prizes = {}; s.lastDrawAt = null; s.inGame = null;
        pushEvent(s, { type: "newgame" });
        await newCards(st, s);
      } else if (op === "config") {
        const c = body.config || {};
        if (typeof c.bancoPlays === "boolean") s.config.bancoPlays = c.bancoPlays;
        if (typeof c.playersTalk === "boolean") s.config.playersTalk = c.playersTalk;
        if (typeof c.lateJoin === "boolean") s.config.lateJoin = c.lateJoin;
        if (c.mode && s.phase !== "playing" && s.phase !== "tombolino") s.config.mode = c.mode === "chiamata" ? "chiamata" : "auto";
        if (c.tie && s.phase !== "playing" && s.phase !== "tombolino") s.config.tie = c.tie === "dividi" ? "dividi" : "primo";
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
      } else if (op === "call") {
        const r = await doCall(st, s, "banco", String(body.level || ""));
        await saveState(st, s);
        return r;
      } else if (op === "getconfig") {
        return { status: 200, json: { ok: true, config: s.config } };
      } else if (op === "kick") {
        const raw = await st.hget(K.players, String(body.id || ""));
        if (raw) { const p = parse(raw); await st.hdel(K.players, p.id); await st.hdel(K.avatars, p.av); await st.del("tmb:photo:" + p.id); }
        return { status: 200, json: { ok: true } };
      } else return { status: 400, json: { error: "Operazione sconosciuta" } };
      await saveState(st, s);
      return { status: 200, json: res };
    } finally { await st.unlock(K.lock); }
  }
  return { status: 400, json: { error: "Azione sconosciuta" } };
}

module.exports = { handle, makeCard, cardStatus, BANCO_CARDS };
