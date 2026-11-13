/* Tombola Napoletana – funzioni comuni (giocatore e banco)
   Un'idea di Michele De Angelis · mdeangelis.me */
(function () {
  const D = window.TOMBOLA_DATA;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const smorfia = n => { const r = D.SMORFIA[n - 1]; return r && { n: r[0], nap: r[1], it: r[2], e: r[3], story: r[4] }; };
  const LEVEL = Object.fromEntries(D.LEVELS.map((l, i) => [l.key, { ...l, i }]));

  // il tavolo: ?t=CODICE nell'indirizzo (senza codice = tavolo principale)
  let room = (new URLSearchParams(location.search).get("t") || "main").toLowerCase().replace(/[^a-z0-9]/g, "") || "main";
  const setRoom = code => {
    room = code || "main";
    const u = new URL(location.href); if (room === "main") u.searchParams.delete("t"); else u.searchParams.set("t", room);
    history.replaceState(null, "", u);
  };
  const getRoom = () => room;
  const roomQS = () => (room === "main" ? "" : "?t=" + room);
  async function api(a, body, extra = "") {
    const opt = body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ a, t: room, ...body }) } : {};
    const r = await fetch("/api/t?a=" + a + "&t=" + room + extra, opt);
    let j = {}; try { j = await r.json(); } catch {}
    if (!r.ok) { const e = new Error(j.message || j.error || ("Errore " + r.status)); e.status = r.status; e.data = j; throw e; }
    return j;
  }

  // la bandiera italiana come emoji non si vede su Windows: la disegniamo noi
  const FLAG = '<span class="flag-it"><i></i><i></i><i></i></span>';
  const fig = e => (e === "🇮🇹" ? FLAG : e);
  // i numeri con cui si è vinto (il numero decisivo in oro)
  function numsHTML(nums, key, max = 6) {
    if (!nums || !nums.length) return "";
    const list = nums.length > max ? null : nums;
    if (!list) return `<div class="wnums"><span class="k">${key} <small>${fig(smorfia(key).e)}</small></span><span>cartella completa ✔</span></div>`;
    return `<div class="wnums">${list.map(n => `<span class="${n === key ? "k" : ""}" title="${esc(smorfia(n).nap)}">${n} <small>${fig(smorfia(n).e)}</small></span>`).join("")}</div>`;
  }
  // avatar: la foto del giocatore (se l'ha scattata) con il personaggio della smorfia come spilla
  function avatarHTML(id, size = "", who = null) {
    const a = D.AVATAR_BY_ID[id] || { e: "❓", color: "#777", name: "?" };
    const photo = who && who.ph && who.id && who.id !== "banco";
    if (photo || (who && who.photoURL)) {
      const src = who.photoURL || `/api/t?a=photo&id=${encodeURIComponent(who.id)}&v=${who.ph}`;
      return `<div class="av ${size} photo" style="--c:${a.color}" title="${esc(a.name)}"><img src="${src}" alt="" loading="lazy"><span class="badge">${fig(a.e)}</span>${a.num ? `<span class="num">${a.num}</span>` : ""}</div>`;
    }
    return `<div class="av ${size}" style="--c:${a.color}" title="${esc(a.name)}">${fig(a.e)}${a.num ? `<span class="num">${a.num}</span>` : ""}</div>`;
  }

  // ---- neve ----
  function snow() {
    const c = document.createElement("canvas"); c.id = "snow"; document.body.prepend(c);
    const x = c.getContext("2d"); let W, H, flakes = [];
    const rs = () => { W = c.width = innerWidth; H = c.height = innerHeight; };
    rs(); addEventListener("resize", rs);
    const N = Math.min(90, Math.floor(innerWidth / 12));
    for (let i = 0; i < N; i++) flakes.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 2.4 + .6, s: Math.random() * .6 + .25, d: Math.random() * 6 });
    (function loop(t) {
      x.clearRect(0, 0, W, H); x.fillStyle = "rgba(255,255,255,.8)";
      for (const f of flakes) {
        f.y += f.s; f.x += Math.sin((t / 1600) + f.d) * .35;
        if (f.y > H + 4) { f.y = -4; f.x = Math.random() * W; }
        x.beginPath(); x.arc(f.x, f.y, f.r, 0, 7); x.fill();
      }
      requestAnimationFrame(loop);
    })(0);
  }

  // ---- coriandoli e fuochi ----
  let fx, fxx, parts = [], fxRunning = false;
  function ensureFx() {
    if (fx) return;
    fx = document.createElement("canvas"); fx.id = "fx"; document.body.appendChild(fx);
    fxx = fx.getContext("2d");
    const rs = () => { fx.width = innerWidth; fx.height = innerHeight; }; rs(); addEventListener("resize", rs);
  }
  const PAL = ["#ffd86b", "#e9b949", "#c62828", "#2e7d4f", "#ffffff", "#ff8a65", "#81d4fa"];
  function confetti(n = 120, fromY = 0.3) {
    ensureFx();
    for (let i = 0; i < n; i++) parts.push({ k: "c", x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * fromY, vx: (Math.random() - .5) * 16, vy: -Math.random() * 14 - 4, g: .35, r: Math.random() * 6 + 4, rot: Math.random() * 6, vr: (Math.random() - .5) * .4, c: PAL[i % PAL.length], life: 200 });
    run();
  }
  function firework(x, y) {
    ensureFx();
    const c = PAL[Math.floor(Math.random() * PAL.length)];
    for (let i = 0; i < 70; i++) { const a = Math.random() * 6.283, v = Math.random() * 7 + 2; parts.push({ k: "s", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: .08, r: 2.4, c, life: 70 + Math.random() * 30 }); }
    run();
  }
  function fireworks(count = 6, spread = 2200) {
    for (let i = 0; i < count; i++) setTimeout(() => firework(innerWidth * (.15 + Math.random() * .7), innerHeight * (.12 + Math.random() * .35)), Math.random() * spread);
  }
  function run() {
    if (fxRunning) return; fxRunning = true;
    (function loop() {
      fxx.clearRect(0, 0, fx.width, fx.height);
      parts = parts.filter(p => p.life-- > 0 && p.y < fx.height + 40);
      for (const p of parts) {
        p.vx *= .99; p.vy += p.g; p.x += p.vx; p.y += p.vy;
        fxx.globalAlpha = Math.min(1, p.life / 40);
        fxx.fillStyle = p.c;
        if (p.k === "c") { p.rot += p.vr; fxx.save(); fxx.translate(p.x, p.y); fxx.rotate(p.rot); fxx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); fxx.restore(); }
        else { fxx.beginPath(); fxx.arc(p.x, p.y, p.r, 0, 7); fxx.fill(); }
      }
      fxx.globalAlpha = 1;
      if (parts.length) requestAnimationFrame(loop); else { fxRunning = false; fxx.clearRect(0, 0, fx.width, fx.height); }
    })();
  }

  // ---- suoni (sintetizzati, niente file) ----
  let ac;
  const audio = () => { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); } catch {} return ac; };
  function tone(f, t0, dur, type = "triangle", vol = .18) {
    const a = audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.value = f; o.connect(g); g.connect(a.destination);
    const t = a.currentTime + t0; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .02); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.start(t); o.stop(t + dur + .05);
  }
  const sounds = {
    draw() { tone(880, 0, .12, "sine", .12); tone(1320, .08, .2, "sine", .1); },
    pop() { tone(660, 0, .08, "square", .05); },
    win(level = 0) {
      const base = [523, 659, 784, 1047, 1319];
      const n = 3 + Math.min(level, 4);
      for (let i = 0; i < n; i++) tone(base[i % 5] * (i >= 5 ? 2 : 1), i * .11, .35, "triangle", .16);
      if (level >= 4) [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, .7 + i * .14, .6, "square", .07));
    },
    tick() { tone(1200, 0, .03, "square", .04); }
  };

  // ---- 'a pernacchia: ronzio di labbra, con tremolo e un po' di soffio ----
  function pernacchia(vol = .35, dur = 1.3) {
    const a = audio(); if (!a) return;
    const t = a.currentTime;
    const o = a.createOscillator(); o.type = "sawtooth";
    o.frequency.setValueAtTime(95 + Math.random() * 30, t); o.frequency.linearRampToValueAtTime(140, t + dur * .3); o.frequency.linearRampToValueAtTime(70, t + dur);
    const lfo = a.createOscillator(), lg = a.createGain(); lfo.frequency.value = 28; lg.gain.value = 25; lfo.connect(lg); lg.connect(o.frequency);
    const am = a.createGain(), alfo = a.createOscillator(), alg = a.createGain(); alfo.frequency.value = 33; alg.gain.value = .5; am.gain.value = .5; alfo.connect(alg); alg.connect(am.gain);
    const lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900; lp.Q.value = 4;
    const g = a.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .05); g.gain.setValueAtTime(vol, t + dur * .75); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(am); am.connect(lp); lp.connect(g); g.connect(a.destination);
    [o, lfo, alfo].forEach(x => { x.start(t); x.stop(t + dur + .05); });
  }
  // il ritardatario: il banco gli manda un messaggio audio (registrato prima, o dal vivo)
  function lateOverlay(ev, opts = {}) {
    const ov = document.createElement("div"); ov.className = "overlay";
    ov.innerHTML = `<div class="winbox"><div style="font-size:54px">⏰🎙️</div>
      <h1 class="lvl title-font" style="font-size:clamp(34px,9vw,64px)">Ritardatario!</h1>
      <div class="wn"><div>${avatarHTML(ev.av, "lg", ev)}<span>${esc(ev.name)}</span></div></div>
      <div class="prize">Entra a partita in corso, dopo ${ev.drawn} numeri estratti.</div>
      <div class="verdict"><h4>⚖️ Il Tribunale della Smorfia</h4>
        <p>${ev.missed.length ? `I premi già usciti (<b>${esc(ev.missed.join(", "))}</b>) non li prende: gioca solo per quelli che restano.` : "Nessun premio è ancora uscito: gli è andata bene!"}</p>
        <p>E adesso… <b>il banco ha un messaggio per lui!</b> 🎙️</p></div>
      ${opts.banco ? `<div style="margin-top:12px"><button class="btn red ptt" id="latePtt">🎙️ Tieni premuto e diglielo a voce</button><div class="muted" id="lateStat" style="margin-top:6px;font-weight:800"></div></div>` : ""}
      <div style="margin-top:14px"><button class="btn closebtn">Chiudi</button></div></div>`;
    document.body.appendChild(ov);
    // il messaggio registrato per i ritardatari, se il banco l'ha preparato
    setTimeout(async () => { try { const u = await recURL("late"); if (u) await playURL(u); } catch {} }, 900);
    if (opts.banco) recordPTT(ov.querySelector("#latePtt"), {
      maxMs: 20000, send: opts.send,
      onState: (k, msg) => {
        const b = ov.querySelector("#latePtt"), t = ov.querySelector("#lateStat");
        if (k === "rec") { b.classList.add("on"); b.textContent = "🔴 Parla… lascia per inviare"; clearTimeout(tm); }
        if (k === "stop") { b.classList.remove("on"); b.textContent = "🎙️ Tieni premuto e diglielo a voce"; }
        if (k === "sending") t.textContent = "📡 Invio a tutti…";
        if (k === "sent") { t.textContent = "✅ Messaggio inviato a tutti!"; tm = setTimeout(close, 2500); }
        if (k === "error") t.textContent = "⚠️ " + msg;
        if (k === "nomic") t.textContent = "⚠️ Consenti il microfono nel browser";
      }
    });
    const close = () => ov.remove();
    ov.querySelector(".closebtn").onclick = close;
    let tm = setTimeout(close, opts.banco ? 20000 : 10000);
  }

  // ---- voce: sceglie la voce italiana più naturale disponibile ----
  const VKEY = "tmb_voice";
  function itVoices() {
    if (!("speechSynthesis" in window)) return [];
    return speechSynthesis.getVoices().filter(v => /^it([-_]|$)/i.test(v.lang));
  }
  function voiceScore(v) {
    const n = v.name;
    let s = 0;
    if (/natural|neural|online/i.test(n)) s += 10;        // Edge/Windows: Elsa, Isabella, Diego…
    if (/premium|enhanced|siri/i.test(n)) s += 8;          // Apple voci migliorate
    if (/google/i.test(n)) s += 6;                         // Chrome
    if (/elsa|isabella|diego|giuseppe|alice|federica|paola|luca|emma|chiara/i.test(n)) s += 3;
    if (/compact|espeak/i.test(n)) s -= 10;
    return s;
  }
  function bestVoice() {
    const vs = itVoices();
    const saved = localStorage.getItem(VKEY);
    return vs.find(v => v.name === saved) || vs.sort((a, b) => voiceScore(b) - voiceScore(a))[0] || null;
  }
  const setVoice = name => { try { localStorage.setItem(VKEY, name); } catch {} };
  if ("speechSynthesis" in window) speechSynthesis.onvoiceschanged = () => document.dispatchEvent(new Event("voices"));
  const spoken = t => String(t).replace(/\p{Extended_Pictographic}/gu, "").replace(/['’]/g, "").replace(/\s+/g, " ").trim();
  function speak(text, opts = {}) {
    if (!("speechSynthesis" in window)) return Promise.resolve();
    return new Promise(res => {
      const u = new SpeechSynthesisUtterance(spoken(text));
      u.lang = "it-IT"; u.rate = opts.rate || 0.95; u.pitch = opts.pitch || 1;
      const v = bestVoice(); if (v) u.voice = v;
      u.onend = u.onerror = () => res();
      speechSynthesis.speak(u);
    });
  }
  // ---- voce umana (AI, generata sul server e messa in cache); se non va, si usa la voce del browser ----
  let humanOK = true;
  const audioCache = new Map();
  function humanAudio(qs) {
    if (!humanOK) return null;
    if (!audioCache.has(qs)) { const a = new Audio("/api/voce?" + qs); a.preload = "auto"; audioCache.set(qs, a); }
    return audioCache.get(qs);
  }
  function playHuman(qs) {
    const a = humanAudio(qs);
    if (!a) return Promise.reject();
    return new Promise((res, rej) => {
      let done = false; const fin = ok => { if (done) return; done = true; audioCache.delete(qs); ok ? res() : rej(); };
      a.onended = () => fin(true);
      a.onerror = () => { humanOK = false; fin(false); };
      const t = setTimeout(() => fin(false), 9000);
      a.currentTime = 0;
      a.play().then(() => clearTimeout(t)).catch(() => { clearTimeout(t); fin(false); });
    });
  }
  const prepareNumber = (n, withStory) => { recURL(n); return humanAudio(`n=${n}&s=${withStory ? 1 : 0}`); };
  // ---- tieni premuto per parlare: registra e restituisce {mime, b64} ----
  // il microfono si apre solo mentre si registra e si chiude subito dopo (anche se si cambia scheda)
  const activeRecs = new Set();
  function releaseMic() { activeRecs.forEach(f => f()); }
  document.addEventListener("visibilitychange", () => { if (document.hidden) releaseMic(); });
  window.addEventListener("pagehide", releaseMic);
  window.addEventListener("blur", () => { if (document.hidden) releaseMic(); });
  function recordPTT(btn, { maxMs = 20000, onState = () => {}, send }) {
    let rec = null, stream = null, cancelled = false;
    const closeStream = () => { if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } };
    async function start() {
      if (rec || stream) return;
      cancelled = false;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
        if (cancelled || document.hidden) { closeStream(); return; }
        const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || "";
        const r = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 40000 } : undefined);
        const chunks = []; r.ondataavailable = e => e.data.size && chunks.push(e.data);
        const t0 = Date.now();
        r.onstop = async () => {
          closeStream(); activeRecs.delete(abort);
          if (r._aborted) return onState("stop");
          if (Date.now() - t0 < 400) return onState("short");
          const blob = new Blob(chunks, { type: r.mimeType || mime || "audio/webm" });
          const b64 = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(",")[1]); fr.readAsDataURL(blob); });
          onState("sending");
          try { await send({ mime: blob.type, b64 }); onState("sent"); } catch (e) { onState("error", e.message); }
        };
        r.start(); rec = r; activeRecs.add(abort); onState("rec");
        r._t = setTimeout(stop, maxMs);
      } catch { closeStream(); onState("nomic"); }
    }
    function stop() { cancelled = true; if (!rec) return; clearTimeout(rec._t); const r = rec; rec = null; r.stop(); onState("stop"); }
    // se la pagina va in background: si butta la registrazione e si libera il microfono
    function abort() { cancelled = true; if (rec) { rec._aborted = true; clearTimeout(rec._t); const r = rec; rec = null; try { r.stop(); } catch {} } closeStream(); activeRecs.delete(abort); onState("stop"); }
    btn.addEventListener("pointerdown", e => { e.preventDefault(); start(); });
    ["pointerup", "pointerleave", "pointercancel"].forEach(ev => btn.addEventListener(ev, stop));
    return { start, stop };
  }

  // ---- voci registrate dal banco (la voce vera!) ----
  let recs = {};
  const recCache = new Map();
  const setRecs = r => { recs = r || {}; };
  async function recURL(n) {
    const v = recs[n]; if (!v) return null;
    const k = n + ":" + v;
    if (!recCache.has(k)) recCache.set(k, fetch(`/api/t?a=rec&n=${n}&v=${v}`).then(r => r.ok ? r.json() : null).then(j => j && `data:${j.mime};base64,${j.b64}`).catch(() => null));
    return recCache.get(k);
  }
  function playURL(url) {
    return new Promise((res, rej) => { const a = new Audio(url); a.onended = res; a.onerror = rej; a.play().catch(rej); });
  }
  const prepareRec = n => { recURL(n); };
  // messaggi vocali in arrivo: uno alla volta, nell'ordine
  let sayQueue = Promise.resolve(); const saySeen = new Set(); let sayInit = false;
  function handleSays(says, myId) {
    says = says || [];
    if (!sayInit) { says.forEach(x => saySeen.add(x.id)); sayInit = true; return; }
    for (const m of says) {
      if (saySeen.has(m.id)) continue; saySeen.add(m.id);
      if (m.pid === myId || Date.now() - m.at > 60000) continue;
      sayQueue = sayQueue.then(async () => {
        try {
          const r = await fetch("/api/t?a=say&id=" + m.id); if (!r.ok) return; const j = await r.json();
          toast(m.pid === "banco" ? "🎙️ Il banco parla…" : `🎤 ${m.name} parla…`, 2500);
          await playURL(`data:${j.mime};base64,${j.b64}`);
        } catch {}
      });
    }
  }
  // il numero chiamato come lo chiamerebbe il banco: prima il numero, una pausa, poi la smorfia
  // dopo il numero si legge: "storiella" (default), "filastrocca", "tutte" o "niente" (true = storiella, false = niente)
  async function callNumber(n, extra) {
    const mode = extra === true ? "storiella" : extra === false ? "niente" : (extra || "niente");
    const sm = smorfia(n);
    const pause = ms => new Promise(r => setTimeout(r, ms));
    let done = false;
    try { const u = await recURL(n); if (u) { await playURL(u); done = true; } } catch {}
    if (!done) {
      try { await playHuman(`n=${n}&s=${mode === "niente" ? 0 : 1}`); return; } catch {}
      await speak(`${D.numNap(n)}!`, { rate: 0.88, pitch: 1.05 });
      await pause(200);
      await speak(`${n}. ${sm.nap}… ${sm.it}.`, { rate: 0.95 });
    }
    if (mode === "storiella" || mode === "tutte") { await pause(350); await speak(sm.story, { rate: 0.98 }); }
    if (mode === "filastrocca" || mode === "tutte") { await pause(300); await speak(D.RIME[n - 1], { rate: 0.98 }); }
  }
  async function announce(qs, fallbackText) {
    try { return await playHuman(qs); } catch {}
    if (fallbackText) return speak(fallbackText, { rate: .95, pitch: 1.05 });
  }

  // ---- il panariello: si scuote e salta fuori il numero ----
  const BASKET = `<svg viewBox="0 0 200 230" class="pan-svg"><defs>
      <clipPath id="pc"><path d="M68 18 Q100 8 132 18 L186 196 Q100 222 14 196 Z"/></clipPath>
      <linearGradient id="pw" x1="0" x2="1"><stop offset="0" stop-color="#c9a76b"/><stop offset=".5" stop-color="#f3dfb4"/><stop offset="1" stop-color="#b8935a"/></linearGradient>
      <linearGradient id="pp" x1="0" x2="1"><stop offset="0" stop-color="#b0184f"/><stop offset=".5" stop-color="#ea3f7f"/><stop offset="1" stop-color="#a0123f"/></linearGradient></defs>
    <g clip-path="url(#pc)"><rect width="200" height="230" fill="url(#pw)"/><rect y="150" width="200" height="80" fill="url(#pp)"/>
    ${Array.from({ length: 22 }, (_, i) => `<path d="M0 ${16 + i * 9} Q100 ${24 + i * 9} 200 ${16 + i * 9}" stroke="rgba(90,60,20,.35)" stroke-width="2" fill="none"/>`).join("")}
    ${Array.from({ length: 14 }, (_, i) => `<path d="M${100 + (i - 7) * 5} 10 L${100 + (i - 7) * 13} 230" stroke="rgba(90,60,20,.18)" stroke-width="1.5"/>`).join("")}</g>
    <ellipse cx="100" cy="18" rx="33" ry="7" fill="#7a5a2c"/><ellipse cx="100" cy="17" rx="27" ry="4.5" fill="#3b2a12"/></svg>`;
  // ---- suoni del panariello: numeri di legno che sbattono dentro il cesto di vimini ----
  let noiseBuf;
  function noise() {
    const a = audio(); if (!a) return null;
    if (!noiseBuf) { noiseBuf = a.createBuffer(1, a.sampleRate * .2, a.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    return noiseBuf;
  }
  function woodClick(when, vol = .25, f = 1600) {
    const a = audio(); if (!a) return;
    const t = a.currentTime + when;
    const src = a.createBufferSource(); src.buffer = noise();
    const bp = a.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = 7;
    const g = a.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0005, t + .035);
    src.connect(bp); bp.connect(g); g.connect(a.destination); src.start(t, Math.random() * .1, .05);
    const o = a.createOscillator(), og = a.createGain(); o.type = "sine"; o.frequency.setValueAtTime(f * .55, t); o.frequency.exponentialRampToValueAtTime(f * .4, t + .04);
    og.gain.setValueAtTime(vol * .5, t); og.gain.exponentialRampToValueAtTime(.0005, t + .045); o.connect(og); og.connect(a.destination); o.start(t); o.stop(t + .06);
  }
  function rattle(when, dur, n, vol = .2) {
    for (let i = 0; i < n; i++) { const x = Math.random(); woodClick(when + dur * Math.pow(x, .8), vol * (.4 + Math.random() * .8), 900 + Math.random() * 1900); }
  }
  function wickerSwish(when, dur) {
    const a = audio(); if (!a) return; const t = a.currentTime + when;
    const src = a.createBufferSource(); src.buffer = noise(); src.loop = true;
    const hp = a.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2500;
    const g = a.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + dur * .4); g.gain.linearRampToValueAtTime(0, t + dur);
    src.connect(hp); hp.connect(g); g.connect(a.destination); src.start(t); src.stop(t + dur + .05);
  }
  function tock(when, vol = .5) { woodClick(when, vol, 700); woodClick(when + .004, vol * .6, 1900); }
  function chime(when) { [1318.5, 1975.5, 2637].forEach((f, i) => tone(f, when + i * .06, 1.3, "sine", .07 / (i + 1))); }

  // ---- il panariello: si scuote, si inclina, cade il numero, rotola e si gira ----
  let panBusy = Promise.resolve();
  function panariello(n, opts = {}) {
    const big = !!opts.big;
    const run = () => new Promise(reveal => {
      const sm = smorfia(n);
      const st = document.createElement("div");
      st.className = "pan-stage " + (big ? "big" : "small");
      st.innerHTML = `<div class="pan-table"></div>
        <div class="pan-rays"></div>
        <div class="pan-basket">${BASKET}<div class="pan-inside">${[0, 1, 2, 3, 4].map(i => `<i style="--i:${i}"></i>`).join("")}</div></div>
        <div class="pan-token3"><div class="face front"><span>${n}</span></div><div class="face back"></div></div>
        <div class="pan-label"><b>${sm.e} ${esc(sm.nap)}</b><small>${esc(sm.it)}</small></div>`;
      document.body.appendChild(st);
      const S = big ? 1 : .62;
      const basket = st.querySelector(".pan-basket"), tok = st.querySelector(".pan-token3"), rays = st.querySelector(".pan-rays"), label = st.querySelector(".pan-label");
      const inside = [...st.querySelectorAll(".pan-inside i")];
      const E = "cubic-bezier(.3,.7,.4,1)";
      // 1. il cesto arriva
      basket.animate([{ transform: `translate(-50%,-140%) scale(${S}) rotate(-8deg)`, opacity: 0 }, { transform: `translate(-50%,0) scale(${S}) rotate(4deg)`, opacity: 1, offset: .7 }, { transform: `translate(-50%,0) scale(${S}) rotate(0)` }], { duration: 380, easing: E, fill: "forwards" });
      tock(.3, .25);
      // 2. tre scosse forti, i numeri saltano dentro
      const shake = [];
      for (let k = 0; k < 3; k++) {
        const d = k % 2 ? 1 : -1;
        shake.push({ transform: `translate(-50%,0) scale(${S}) rotate(0)` }, { transform: `translate(calc(-50% + ${d * 14}px),-26px) scale(${S}) rotate(${d * 15}deg)` }, { transform: `translate(calc(-50% - ${d * 10}px),6px) scale(${S}) rotate(${-d * 11}deg)` });
        rattle(.42 + k * .36, .3, 22, .22);
      }
      shake.push({ transform: `translate(-50%,0) scale(${S}) rotate(0)` });
      wickerSwish(.4, 1.1);
      setTimeout(() => {
        basket.animate(shake, { duration: 1080, easing: "ease-in-out", fill: "forwards" });
        inside.forEach((el, i) => el.animate([{ transform: "translateY(0) rotate(0)" }, { transform: `translateY(${-22 - i * 7}px) rotate(${i % 2 ? 160 : -200}deg)` }, { transform: "translateY(0) rotate(360deg)" }], { duration: 360, iterations: 3, delay: i * 40, easing: "ease-in-out" }));
      }, 400);
      // 3. il cesto si inclina e cade fuori un numero
      setTimeout(() => {
        basket.animate([{ transform: `translate(-50%,0) scale(${S}) rotate(0)` }, { transform: `translate(-30%,-10px) scale(${S}) rotate(-112deg)`, offset: .55 }, { transform: `translate(-30%,-10px) scale(${S}) rotate(-112deg)` }], { duration: 650, easing: "ease-out", fill: "forwards" });
        rattle(.15, .35, 10, .18);
      }, 1500);
      setTimeout(() => {
        const sx = big ? -170 : -100, fy = big ? 120 : 70;
        tok.style.display = "block";
        tok.animate([
          { transform: `translate(calc(-50% + ${sx}px), -40px) scale(${.55 * S}) rotateY(180deg) rotate(0)`, opacity: 1 },
          { transform: `translate(calc(-50% + ${sx * .7}px), ${fy}px) scale(${.55 * S}) rotateY(180deg) rotate(-180deg)`, offset: .28, easing: "ease-in" },
          { transform: `translate(calc(-50% + ${sx * .5}px), ${fy * .55}px) scale(${.55 * S}) rotateY(180deg) rotate(-300deg)`, offset: .42 },
          { transform: `translate(calc(-50% + ${sx * .32}px), ${fy}px) scale(${.55 * S}) rotateY(180deg) rotate(-400deg)`, offset: .54 },
          { transform: `translate(calc(-50% + ${sx * .2}px), ${fy * .82}px) scale(${.55 * S}) rotateY(180deg) rotate(-460deg)`, offset: .63 },
          { transform: `translate(calc(-50% + ${sx * .08}px), ${fy}px) scale(${.55 * S}) rotateY(180deg) rotate(-540deg)`, offset: .72 },
          { transform: `translate(-50%, ${fy}px) scale(${.6 * S}) rotateY(180deg) rotate(-720deg)`, offset: .8 },
          { transform: `translate(-50%, -30px) scale(${1.25 * S}) rotateY(0deg) rotate(-720deg)` }
        ], { duration: 1500, easing: "linear", fill: "forwards" });
        tok.animate([{ filter: "brightness(.9)" }, { filter: "brightness(1.15) drop-shadow(0 0 30px rgba(255,216,107,.9))" }], { duration: 400, delay: 1300, fill: "forwards" });
        tock(.42, .55); tock(.63, .32); tock(.8, .2); rattle(.9, .25, 4, .08);
      }, 1950);
      // 4. rivelazione: raggi, campanella, nome della smorfia
      setTimeout(() => {
        basket.animate([{ opacity: 1 }, { opacity: 0, transform: `translate(-30%,30px) scale(${S * .8}) rotate(-112deg)` }], { duration: 400, fill: "forwards" });
        rays.animate([{ opacity: 0, transform: "translate(-50%,-50%) scale(.3) rotate(0)" }, { opacity: 1, transform: `translate(-50%,-50%) scale(${S}) rotate(90deg)` }], { duration: 900, easing: "ease-out", fill: "forwards" });
        label.animate([{ opacity: 0, transform: "translate(-50%,20px) scale(.6)" }, { opacity: 1, transform: "translate(-50%,0) scale(1)" }], { duration: 450, delay: 150, easing: "cubic-bezier(.2,1.6,.4,1)", fill: "forwards" });
        chime(0); confetti(big ? 70 : 30, .38);
        reveal();
      }, 3420);
      setTimeout(() => { st.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450, fill: "forwards" }).onfinish = () => st.remove(); }, big ? 5200 : 4600);
    });
    const p = panBusy.then(run); panBusy = p.catch(() => {}); return p;
  }

  // ---- reazioni volanti ----
  function floater(emoji, name) {
    let box = $("#floaters"); if (!box) { box = document.createElement("div"); box.id = "floaters"; document.body.appendChild(box); }
    const el = document.createElement("div");
    el.className = "floater";
    el.style.left = (8 + Math.random() * 80) + "%";
    el.style.setProperty("--dx", ((Math.random() - .5) * 120) + "px");
    el.innerHTML = `<span class="e">${emoji}</span>${name ? `<span class="n">${esc(name)}</span>` : ""}`;
    if (emoji === "💨" && name) pernacchia(.18, .7);
    box.appendChild(el); setTimeout(() => el.remove(), 3300);
  }

  // ---- ruota della smorfia ----
  function wheel(container, winners, chosenId) {
    return new Promise(res => {
      const wrap = document.createElement("div"); wrap.className = "wheelwrap";
      wrap.innerHTML = `<canvas width="520" height="520"></canvas><div class="pin">🔻</div>`;
      container.appendChild(wrap);
      const c = wrap.querySelector("canvas"), x = c.getContext("2d");
      const n = winners.length, seg = Math.PI * 2 / n, cols = ["#c62828", "#e9b949", "#2e7d4f", "#8e44ad", "#1f618d", "#d35400"];
      const idx = Math.max(0, winners.findIndex(w => w.id === chosenId));
      const target = Math.PI * 2 * 6 + (Math.PI * 1.5 - (idx * seg + seg / 2));
      const t0 = performance.now(), dur = 4200;
      function draw(rot) {
        x.clearRect(0, 0, 520, 520);
        for (let i = 0; i < n; i++) {
          x.beginPath(); x.moveTo(260, 260); x.arc(260, 260, 250, rot + i * seg, rot + (i + 1) * seg); x.closePath();
          x.fillStyle = cols[i % cols.length]; x.fill(); x.strokeStyle = "#fff"; x.lineWidth = 4; x.stroke();
          x.save(); x.translate(260, 260); x.rotate(rot + i * seg + seg / 2);
          x.textAlign = "right"; x.fillStyle = "#fff"; x.font = "bold 30px Nunito,sans-serif";
          const a = D.AVATAR_BY_ID[winners[i].av]; x.fillText((winners[i].name || "").slice(0, 12) + " " + (a && a.e !== "🇮🇹" ? a.e : ""), 236, 10);
          x.restore();
        }
        x.beginPath(); x.arc(260, 260, 34, 0, 7); x.fillStyle = "#fffaf0"; x.fill(); x.font = "34px serif"; x.textAlign = "center"; x.fillText("🎲", 260, 272);
      }
      let lastSeg = -1;
      (function loop(now) {
        const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4), rot = target * e;
        draw(rot);
        const s = Math.floor(((Math.PI * 1.5 - rot) % (Math.PI * 2) + Math.PI * 4) % (Math.PI * 2) / seg);
        if (s !== lastSeg) { lastSeg = s; sounds.tick(); }
        if (p < 1) requestAnimationFrame(loop); else res();
      })(t0);
    });
  }

  // ---- il controllo della tombola (per scherzo, come si fa al tavolo) ----
  const QUIPS = ["Il banco si mette gli occhiali 👓", "Nessuno ha spostato i fagioli? 🫘", "Silenzio in sala, si controlla! 🤫", "Il notaio della smorfia sta verificando… 📜", "Fammi vedere 'sta cartella… 🧐", "Occhio, che qua si bara! 👀"];
  function checkCard(ev, opts = {}) {
    const list = ev.winners.filter(w => ev.cards && ev.cards[w.id]).slice(0, 3);
    let p = Promise.resolve();
    list.forEach(w => { p = p.then(() => new Promise(done => {
      const nums = ev.cards[w.id];
      const ov = document.createElement("div"); ov.className = "overlay";
      ov.innerHTML = `<div class="winbox checkbox"><div style="font-size:40px">🔎</div>
        <h2 class="title-font" style="color:var(--red);margin:4px 0">Un momento… controlliamo ${ev.level === "tombolino" ? "il tombolino" : "la tombola"}!</h2>
        <div class="muted" style="font-weight:800">${esc(QUIPS[Math.floor(Math.random() * QUIPS.length)])}</div>
        <div class="wn" style="margin:12px 0 6px"><div>${avatarHTML(w.av, "lg", w)}<span>${esc(w.name)}</span></div></div>
        <div class="chkgrid">${nums.map(n => `<span data-n="${n}">${n}<small>${fig(smorfia(n).e)}</small></span>`).join("")}</div>
        <div class="chkmsg"></div><div class="stamp">✅ TUTTO REGOLARE!</div></div>`;
      document.body.appendChild(ov);
      const cells = [...ov.querySelectorAll(".chkgrid span")], msg = ov.querySelector(".chkmsg");
      let i = 0;
      const next = () => {
        if (i === cells.length - 1) {
          const n = +cells[i].dataset.n;
          msg.textContent = `…e il ${n}? ${smorfia(n).nap}…`; tone(220, 0, .5, "sine", .12); tone(220, .5, .5, "sine", .12);
          setTimeout(() => { cells[i].classList.add("ok"); tone(1320, 0, .2, "sine", .12); opts.onCheck && opts.onCheck(n); msg.textContent = "C'è!";
            setTimeout(() => { ov.querySelector(".stamp").classList.add("on"); tone(196, 0, .25, "square", .12); confetti(60, .45); setTimeout(() => { ov.remove(); done(); }, 1500); }, 350); }, 1200);
          return;
        }
        const n = +cells[i].dataset.n; cells[i].classList.add("ok"); opts.onCheck && opts.onCheck(n);
        tone(900 + i * 40, 0, .07, "triangle", .1); msg.textContent = `${n}… c'è!`;
        i++; setTimeout(next, 190);
      };
      setTimeout(next, 900);
    })); });
    return p;
  }

  // ---- overlay vincita ----
  let overlayQueue = Promise.resolve();
  function showWin(ev, opts = {}) {
    if (ev.cards) overlayQueue = overlayQueue.then(() => checkCard(ev, opts));
    overlayQueue = overlayQueue.then(() => new Promise(done => {
      const lv = LEVEL[ev.level] || { i: 0, label: ev.label };
      const mega = lv.i >= 4;
      const ov = document.createElement("div"); ov.className = "overlay";
      const amIn = opts.me && ev.winners.some(w => w.id === opts.me);
      ov.innerHTML = `<div class="winbox">
        <div style="font-size:${mega ? 46 : 30}px">${mega ? "🎆🎄🎆" : "✨🎉✨"}</div>
        <h1 class="lvl title-font ${mega ? "mega" : ""}">${esc(lv.label)}!</h1>
        <div class="muted">con il numero <b>${ev.n}</b> · ${esc(smorfia(ev.n)?.nap || "")}</div>
        <div class="wn">${ev.winners.map(w => `<div>${avatarHTML(w.av, "lg", w)}<span>${esc(w.name)}</span>${numsHTML(w.nums, ev.n)}</div>`).join("")}</div>
        ${ev.banco ? `<div class="muted" style="font-weight:800">🧺 Il banco vince con la cartella ${ev.banco.cartella} del tabellone</div>` : ""}
        <div class="prize">🎁 ${esc(ev.prize)}</div>
        <div class="verdictbox"></div>
        ${amIn ? `<div class="me">🥳 HAI VINTO TU! Vai a ritirare il premio dal banco!</div>` : ""}
        <div class="rcount"></div>
        <div style="margin-top:14px"><button class="btn">Chiudi</button></div>
      </div>`;
      document.body.appendChild(ov);
      sounds.win(lv.i);
      confetti(mega ? 260 : 60 + lv.i * 40);
      if (mega) { fireworks(10, 3500); setTimeout(() => confetti(200, .1), 1600); }
      else if (lv.i >= 2) fireworks(3, 1200);
      if (opts.speak) { speechSynthesis.cancel(); announce(`ev=${ev.id}`, `${lv.label}! ${ev.winners.map(w => w.name).join(", e ")}${ev.winners.length > 1 ? " si spartiscono" : " vince"}: ${ev.prize}`); }
      const vb = ov.querySelector(".verdictbox");
      const showVerdict = () => {
        if (!ev.verdict) return;
        vb.innerHTML = `<div class="verdict"><h4>⚖️ Il Tribunale della Smorfia</h4>${ev.verdict.lines.map(l => `<p>${esc(l)}</p>`).join("")}</div>`;
      };
      let wait = mega ? 9000 : 6500;
      if (ev.verdict && ev.verdict.mode === "wheel") { wait += 6000; wheel(vb, ev.winners, ev.verdict.chosen).then(() => { sounds.win(1); confetti(80, .45); setTimeout(() => { vb.innerHTML = ""; showVerdict(); }, 900); }); }
      else showVerdict();
      if (ev.verdict) wait += 3000;
      ov._ev = ev;
      const close = () => { ov.remove(); clearTimeout(tm); done(); };
      ov.querySelector("button").onclick = close;
      const tm = setTimeout(close, opts.stay ? wait + 4000 : wait);
    }));
    return overlayQueue;
  }
  function updateReactCounts(reacts) {
    const ov = document.querySelector(".overlay"); if (!ov || !ov._ev) return;
    const since = ov._ev.at, counts = {};
    reacts.filter(r => r.t >= since).forEach(r => counts[r.e] = (counts[r.e] || 0) + 1);
    ov.querySelector(".rcount").innerHTML = Object.entries(counts).map(([e, n]) => `<span>${e} ${n}</span>`).join("");
  }

  function toast(msg, ms = 2600) {
    const t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), ms);
  }

  function modal(html) {
    const m = document.createElement("div"); m.className = "modal";
    m.innerHTML = `<div class="sheet">${html}<div class="center" style="margin-top:16px"><button class="btn close">Chiudi</button></div></div>`;
    m.addEventListener("click", e => { if (e.target === m || e.target.classList.contains("close")) m.remove(); });
    document.body.appendChild(m); return m;
  }

  const C = D.CREDITS;
  const creditsHTML = () => `Tombola Napoletana v${C.version} · Un'idea di <b>${C.author}</b> · <a href="${C.url}" target="_blank" rel="noopener">${C.site}</a><br>© ${C.year} ${C.author}`;
  function infoModal() {
    modal(`<h2 class="title-font">ℹ️ La Tombola Napoletana</h2>
      <p><b>L'idea.</b> Questa tombola online è un'idea di <b>${C.author}</b> (<a href="${C.url}" target="_blank" rel="noopener">${C.site}</a>), per giocare tutti insieme alla festa di Natale dell'ufficio, ognuno dal suo telefono.</p>
      <p><b>Un po' di storia.</b> La tombola nasce a Napoli nel 1734, da una disputa tra re Carlo di Borbone, che voleva rendere legale il gioco del Lotto, e il frate domenicano Gregorio Maria Rocco, secondo cui il gioco distraeva i fedeli dalla preghiera. Alla fine si arrivò a un compromesso: niente Lotto nei giorni di Natale. Così i napoletani si portarono i 90 numeri in casa, dentro un panariello di vimini, e nacque la tombola.</p>
      <p><b>La smorfia.</b> A ogni numero da 1 a 90 corrisponde una figura: è il "libro dei sogni" napoletano, che secondo la tradizione prende il nome da Morfeo. Per questo, quando esce un numero, non si legge solo la cifra ma anche il suo significato: 33, gli anni di Cristo; 47, il morto; 90, la paura.</p>
      <p><b>Come si vince.</b></p>
      <ul>
        <li><b>Ambo, terno, quaterna, cinquina:</b> 2, 3, 4 o 5 numeri usciti sulla <i>stessa riga</i> della cartella.</li>
        <li><b>Tombola:</b> tutti i 15 numeri della cartella.</li>
        <li><b>Tombolino:</b> dopo la tombola si continua a estrarre, e il prossimo che completa la cartella fa tombolino. Poi la partita finisce.</li>
        <li>Ogni premio si assegna una volta sola, a chi ci arriva per primo. Se ci arrivano in più persone con lo stesso numero, decide <b>il Tribunale della Smorfia</b>: i premi in euro si dividono, gli altri li assegna la ruota, e chi non lo vince riceve un "risarcimento" simpatico.</li>
      </ul>
      <p><b>Le reazioni.</b> Con le emoji in basso puoi festeggiare, arrabbiarti o disperarti in diretta: le vedono tutti.</p>
      <p class="credits">${creditsHTML()}</p>`);
  }

  window.T = { D, $, esc, smorfia, fig, setRoom, getRoom, roomQS, pernacchia, lateOverlay, numsHTML, setRecs, recURL, playURL, prepareRec, handleSays, recordPTT, releaseMic, LEVEL, api, avatarHTML, snow, confetti, fireworks, sounds, speak, callNumber, prepareNumber, announce, itVoices, bestVoice, setVoice, panariello, audio, floater, showWin, updateReactCounts, toast, modal, infoModal, creditsHTML, wheel };
})();
