/* Tombola Napoletana – funzioni comuni (giocatore e banco)
   Un'idea di Michele De Angelis · mdeangelis.me */
(function () {
  const D = window.TOMBOLA_DATA;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const smorfia = n => { const r = D.SMORFIA[n - 1]; return r && { n: r[0], nap: r[1], it: r[2], e: r[3], story: r[4] }; };
  const LEVEL = Object.fromEntries(D.LEVELS.map((l, i) => [l.key, { ...l, i }]));

  async function api(a, body, extra = "") {
    const opt = body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ a, ...body }) } : {};
    const r = await fetch("/api/t?a=" + a + extra, opt);
    let j = {}; try { j = await r.json(); } catch {}
    if (!r.ok) { const e = new Error(j.message || j.error || ("Errore " + r.status)); e.status = r.status; e.data = j; throw e; }
    return j;
  }

  function avatarHTML(id, size = "") {
    const a = D.AVATAR_BY_ID[id] || { e: "❓", color: "#777", name: "?" };
    return `<div class="av ${size}" style="--c:${a.color}" title="${esc(a.name)}">${a.e}${a.num ? `<span class="num">${a.num}</span>` : ""}</div>`;
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

  // ---- voce ----
  function speak(text, opts = {}) {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "it-IT"; u.rate = opts.rate || 1; u.pitch = opts.pitch || 1;
    const v = speechSynthesis.getVoices().find(v => /it[-_]IT/i.test(v.lang));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  }

  // ---- reazioni volanti ----
  function floater(emoji, name) {
    let box = $("#floaters"); if (!box) { box = document.createElement("div"); box.id = "floaters"; document.body.appendChild(box); }
    const el = document.createElement("div");
    el.className = "floater";
    el.style.left = (8 + Math.random() * 80) + "%";
    el.style.setProperty("--dx", ((Math.random() - .5) * 120) + "px");
    el.innerHTML = `<span class="e">${emoji}</span>${name ? `<span class="n">${esc(name)}</span>` : ""}`;
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
          const a = D.AVATAR_BY_ID[winners[i].av]; x.fillText((winners[i].name || "").slice(0, 12) + " " + (a ? a.e : ""), 236, 10);
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

  // ---- overlay vincita ----
  let overlayQueue = Promise.resolve();
  function showWin(ev, opts = {}) {
    overlayQueue = overlayQueue.then(() => new Promise(done => {
      const lv = LEVEL[ev.level] || { i: 0, label: ev.label };
      const mega = lv.i >= 4;
      const ov = document.createElement("div"); ov.className = "overlay";
      const amIn = opts.me && ev.winners.some(w => w.id === opts.me);
      ov.innerHTML = `<div class="winbox">
        <div style="font-size:${mega ? 46 : 30}px">${mega ? "🎆🎄🎆" : "✨🎉✨"}</div>
        <h1 class="lvl title-font ${mega ? "mega" : ""}">${esc(lv.label)}!</h1>
        <div class="muted">con il numero <b>${ev.n}</b> · ${esc(smorfia(ev.n)?.nap || "")}</div>
        <div class="wn">${ev.winners.map(w => `<div>${avatarHTML(w.av, "lg")}<span>${esc(w.name)}</span></div>`).join("")}</div>
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
      if (opts.speak) speak(`${lv.label}! ${ev.winners.map(w => w.name).join(", ")}${ev.winners.length > 1 ? " si spartiscono" : " vince"}: ${ev.prize.replace(/\p{Extended_Pictographic}/gu, "")}`);
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

  window.T = { D, $, esc, smorfia, LEVEL, api, avatarHTML, snow, confetti, fireworks, sounds, speak, audio, floater, showWin, updateReactCounts, toast, modal, infoModal, creditsHTML, wheel };
})();
