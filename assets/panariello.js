/* Tombola Napoletana – l'estrazione dal panariello (scena animata su canvas)
   Un'idea di Michele De Angelis · mdeangelis.me
   Le mani scuotono il panariello a ritmo di tamburello, i numeri di legno saltano fuori e ricadono,
   il cesto si inclina, ne esce uno al rallentatore, rimbalza sulla tovaglia, rotola, gira come una
   moneta finché si posa, poi si alza, si volta e si rivela con la sua figura della smorfia. */
(function () {
  const D = window.TOMBOLA_DATA;
  const smorfia = n => { const r = D.SMORFIA[n - 1]; return { n, nap: r[1], it: r[2], e: r[3] }; };
  const EXCL = ["Uè!", "Jamme!", "Mamma mì!", "Che ciorta!", "Oh, eccolo!", "Mannaggia!", "Bravo!", "Uh, Gesù!", "Chi l'ha?"];

  // ---------------- suoni ----------------
  const A = () => T.audio();
  let nb;
  const noise = a => { if (!nb) { nb = a.createBuffer(1, a.sampleRate * .5, a.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } return nb; };
  function burst(when, { f = 1600, q = 7, vol = .25, dur = .035, type = "bandpass" } = {}) {
    const a = A(); if (!a) return; const t = a.currentTime + when;
    const s = a.createBufferSource(); s.buffer = noise(a);
    const fl = a.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const g = a.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0004, t + dur);
    s.connect(fl); fl.connect(g); g.connect(a.destination); s.start(t, Math.random() * .3, dur + .02);
  }
  function osc(when, f, dur, { type = "sine", vol = .1, to = null } = {}) {
    const a = A(); if (!a) return; const t = a.currentTime + when;
    const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(.0004, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + .03);
  }
  const wood = (w, v = .3, f) => { const ff = f || 900 + Math.random() * 1800; burst(w, { f: ff, vol: v }); osc(w, ff * .5, .05, { vol: v * .45, to: ff * .38 }); };
  const tock = (w, v = .55) => { burst(w, { f: 650, q: 4, vol: v, dur: .06 }); osc(w, 210, .12, { vol: v * .6, to: 120 }); wood(w + .003, v * .5, 1900); };
  // tamburello: sonagli metallici a ritmo di tarantella (6/8)
  const jingle = (w, v = .14) => { burst(w, { f: 7200, q: 3, vol: v, dur: .12 }); burst(w + .012, { f: 9300, q: 4, vol: v * .7, dur: .09 }); osc(w, 5400 + Math.random() * 400, .08, { vol: v * .15 }); };
  const skin = (w, v = .3) => { osc(w, 140, .16, { vol: v, to: 70 }); burst(w, { f: 300, q: 1, vol: v * .5, dur: .05, type: "lowpass" }); };
  function tarantella(when, beats) {
    for (let i = 0; i < beats; i++) { const t = when + i * .135; jingle(t, i % 3 === 0 ? .16 : .09); if (i % 3 === 0) skin(t, i % 6 === 0 ? .35 : .2); }
  }
  const heart = w => { osc(w, 62, .22, { vol: .5, to: 40 }); osc(w + .2, 58, .2, { vol: .35, to: 40 }); };
  function whoosh(when, dur = .45) {
    const a = A(); if (!a) return; const t = a.currentTime + when;
    const s = a.createBufferSource(); s.buffer = noise(a);
    const fl = a.createBiquadFilter(); fl.type = "bandpass"; fl.Q.value = 1.4; fl.frequency.setValueAtTime(400, t); fl.frequency.exponentialRampToValueAtTime(3500, t + dur);
    const g = a.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.18, t + dur * .6); g.gain.linearRampToValueAtTime(0, t + dur);
    s.connect(fl); fl.connect(g); g.connect(a.destination); s.start(t); s.stop(t + dur + .02);
  }
  // mandolino: note pizzicate con tremolo
  function mandolin(when, f, dur = .5, v = .07) { for (let k = 0; k < dur / .055; k++) { osc(when + k * .055, f, .07, { type: "sawtooth", vol: v * (1 - k * .05) }); osc(when + k * .055, f * 2, .05, { type: "triangle", vol: v * .3 }); } }
  function fanfare(when) {
    [[0, 392], [.12, 494], [.24, 587], [.4, 784]].forEach(([d, f]) => mandolin(when + d, f, d === .4 ? .7 : .14));
    [1318.5, 1975.5, 2637].forEach((f, i) => osc(when + .4 + i * .05, f, 1.4, { vol: .05 / (i + 1) }));
  }

  // ---------------- grafica ----------------
  let basketImg = null;
  function basketImage() {
    if (basketImg) return basketImg;
    const W = 240, H = 280, strands = [];
    for (let i = 0; i < 26; i++) { const y = 26 + i * 9.4; strands.push(`<path d="M0 ${y} Q120 ${y + 9} 240 ${y}" stroke="rgba(255,240,200,.55)" stroke-width="3.2" fill="none"/><path d="M0 ${y + 3} Q120 ${y + 12} 240 ${y + 3}" stroke="rgba(90,55,15,.35)" stroke-width="1.6" fill="none"/>`); }
    for (let i = 0; i < 16; i++) { const x0 = 120 + (i - 7.5) * 6.2, x1 = 120 + (i - 7.5) * 16; strands.push(`<path d="M${x0} 18 L${x1} 280" stroke="rgba(110,70,25,.22)" stroke-width="2"/>`); }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>
      <clipPath id="c"><path d="M80 22 Q120 12 160 22 L226 246 Q120 276 14 246 Z"/></clipPath>
      <linearGradient id="w" x1="0" x2="1"><stop offset="0" stop-color="#a8823f"/><stop offset=".45" stop-color="#f5e2b5"/><stop offset=".6" stop-color="#e9cf98"/><stop offset="1" stop-color="#94702f"/></linearGradient>
      <linearGradient id="p" x1="0" x2="1"><stop offset="0" stop-color="#9c1446"/><stop offset=".45" stop-color="#f0538f"/><stop offset="1" stop-color="#8a0f3a"/></linearGradient></defs>
      <g clip-path="url(#c)"><rect width="${W}" height="${H}" fill="url(#w)"/><rect y="186" width="${W}" height="100" fill="url(#p)"/>${strands.join("")}
      <rect y="183" width="${W}" height="6" fill="rgba(255,255,255,.35)"/></g>
      <ellipse cx="120" cy="22" rx="42" ry="9" fill="#8a6430" stroke="#5e4018" stroke-width="3"/><ellipse cx="120" cy="21" rx="35" ry="5.5" fill="#2a1a08"/></svg>`;
    basketImg = new Image(); basketImg.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    return basketImg;
  }
  basketImage();
  let clothPat = null;
  function cloth(ctx) {
    if (clothPat) return clothPat;
    const c = document.createElement("canvas"); c.width = c.height = 48; const x = c.getContext("2d");
    x.fillStyle = "#b3141c"; x.fillRect(0, 0, 48, 48); x.fillStyle = "rgba(255,255,255,.22)"; x.fillRect(0, 0, 24, 48); x.fillRect(0, 0, 48, 24);
    x.fillStyle = "rgba(255,255,255,.18)"; x.fillRect(0, 0, 24, 24);
    clothPat = ctx.createPattern(c, "repeat"); return clothPat;
  }
  function token(ctx, x, y, r, { rot = 0, sx = 1, sy = 1, n = null, glow = 0 } = {}) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(Math.max(.02, Math.abs(sx)), sy);
    if (glow) { ctx.shadowColor = `rgba(255,216,107,${glow})`; ctx.shadowBlur = 50 * glow; }
    const g = ctx.createRadialGradient(-r * .3, -r * .35, r * .1, 0, 0, r);
    g.addColorStop(0, "#fff7e6"); g.addColorStop(.55, "#e7c48d"); g.addColorStop(1, "#ad7f42");
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fillStyle = g; ctx.fill();
    ctx.shadowBlur = 0; ctx.lineWidth = r * .1; ctx.strokeStyle = "#8f5f28"; ctx.stroke();
    if (n != null && sx > 0) {
      ctx.beginPath(); ctx.arc(0, 0, r * .74, 0, 7); ctx.lineWidth = r * .07; ctx.strokeStyle = "#b71c1c"; ctx.stroke();
      ctx.fillStyle = "#b71c1c"; ctx.font = `900 ${r * .9}px Georgia,serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(n, 0, r * .06);
    } else {
      ctx.strokeStyle = "rgba(120,80,30,.35)"; ctx.lineWidth = r * .04;
      for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.arc(r * .08, r * .05, r * k * .17, 0, 7); ctx.stroke(); }
    }
    ctx.restore();
  }
  function hand(ctx, x, y, side, S) {
    ctx.save(); ctx.translate(x, y); ctx.scale(side, 1);
    ctx.fillStyle = "#6d0d14"; ctx.beginPath(); ctx.roundRect(-260 * S, -30 * S, 230 * S, 60 * S, 26 * S); ctx.fill();   // manica
    ctx.fillStyle = "#fff"; ctx.fillRect(-46 * S, -32 * S, 16 * S, 64 * S);                                              // polsino
    ctx.fillStyle = "#f2c49b"; ctx.beginPath(); ctx.ellipse(-8 * S, 0, 30 * S, 34 * S, 0, 0, 7); ctx.fill();             // mano
    ctx.fillStyle = "#e3ad80"; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(16 * S, (-22 + i * 14) * S, 13 * S, 7 * S, 0, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  const easeOut = t => 1 - Math.pow(1 - t, 3), easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const back = t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  // ---------------- la scena ----------------
  let busy = Promise.resolve();
  function panariello(n, opts = {}) {
    const big = !!opts.big;
    const run = () => new Promise(reveal => {
      const sm = smorfia(n);
      const cv = document.createElement("canvas");
      cv.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;z-index:66;pointer-events:none";
      document.body.appendChild(cv);
      const ctx = cv.getContext("2d");
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      let W, H; const size = () => { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }; size();
      const S = big ? Math.min(W / 1300, H / 820) * 1.15 : Math.min(W / 430, H / 900) * .62;
      const tableY = H * (big ? .7 : .66);
      const bx = W / 2 + 120 * S;
      const bw = 240 * S, bh = 280 * S;
      const excl = EXCL[Math.floor(Math.random() * EXCL.length)];

      // tempi della scena (secondi)
      const T0 = { in: .45, shake: 2.15, tilt: 2.75, pop: 2.95, settle: 4.6, rise: 5.05, flip: 5.55, end: big ? 7.6 : 7 };
      // suoni programmati
      osc(0, 90, .4, { vol: .25, to: 50 }); whoosh(0, .4); tock(.42, .4);
      tarantella(.5, 12);
      for (let i = 0; i < 26; i++) wood(.5 + Math.random() * 1.6, .1 + Math.random() * .2);
      heart(2.2);
      for (let i = 0; i < 8; i++) wood(2.45 + i * .04, .15);
      whoosh(2.95, .5);
      let impacts = 0;

      const fountain = [], dust = [];
      let lastEmit = 0;
      const chosen = { x: 0, y: 0, vx: 0, vy: 0, rot: 0, r: 26 * S, state: "hidden", bounces: 0 };
      let shakeCam = 0, flash = 0, revealed = false, t0 = performance.now(), last = t0;

      function rimPos(angle, lift) {
        const px = bx, py = tableY - lift, rx = 0, ry = -bh * .92;
        return { x: px + rx * Math.cos(angle) - ry * Math.sin(angle), y: py + rx * Math.sin(angle) + ry * Math.cos(angle) };
      }

      function frame(now) {
        const dt = Math.min(.05, (now - last) / 1000); last = now;
        const t = (now - t0) / 1000;
        // stato del cesto
        let ang = 0, lift = 0, by = 0, handsOn = 1;
        if (t < T0.in) { const p = clamp(t / T0.in); by = -(1 - back(p)) * H * .6; }
        else if (t < T0.shake) {
          const p = (t - T0.in) / (T0.shake - T0.in), amp = .12 + .22 * p;
          ang = Math.sin(t * 23) * amp; lift = Math.abs(Math.sin(t * 23)) * 30 * S * (.4 + p);
        } else if (t < T0.tilt) { const p = easeInOut(clamp((t - T0.shake) / (T0.tilt - T0.shake))); ang = -1.9 * p + Math.sin(t * 40) * .02 * (1 - p); lift = 40 * S * p; }
        else if (t < T0.settle) { ang = -1.9; lift = 40 * S; }
        else { const p = easeInOut(clamp((t - T0.settle) / .5)); ang = -1.9 * (1 - p); lift = 40 * S * (1 - p); handsOn = 1 - p; }

        // numeri che saltano dal bordo durante le scosse
        if (t > T0.in + .05 && t < T0.shake && t - lastEmit > .12) {
          lastEmit = t; const rp = rimPos(ang, lift);
          for (let k = 0; k < 3 + Math.floor(Math.random() * 3); k++)
            fountain.push({ x: rp.x + (Math.random() - .5) * 50 * S, y: rp.y, vx: (Math.random() - .5) * 220 * S + Math.sin(ang) * 260 * S, vy: -(380 + Math.random() * 380) * S, rot: Math.random() * 6, vr: (Math.random() - .5) * 18, n: 1 + Math.floor(Math.random() * 90), y0: rp.y });
        }
        for (const f of fountain) { f.vy += 1500 * S * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt; if (f.vy > 0 && f.y > f.y0 + 12 * S) { f.dead = 1; if (Math.random() < .35) wood(0, .08); } }
        for (let i = fountain.length - 1; i >= 0; i--) if (fountain[i].dead) fountain.splice(i, 1);

        // il numero scelto
        const slow = t > T0.pop && t < T0.pop + .45 ? .35 : 1; // rallentatore all'uscita
        if (t >= T0.pop && chosen.state === "hidden") {
          const rp = rimPos(ang, lift); Object.assign(chosen, { x: rp.x, y: rp.y, vx: -330 * S, vy: -620 * S, state: "fly" });
        }
        if (chosen.state === "fly") {
          chosen.vy += 1700 * S * dt * slow; chosen.x += chosen.vx * dt * slow; chosen.y += chosen.vy * dt * slow; chosen.rot -= 9 * dt * slow;
          if (chosen.y + chosen.r >= tableY) {
            chosen.y = tableY - chosen.r; chosen.bounces++;
            const v = Math.abs(chosen.vy);
            tock(0, Math.min(.7, v / (900 * S))); impacts++;
            if (impacts === 1) shakeCam = 14 * S;
            for (let k = 0; k < 12; k++) dust.push({ x: chosen.x, y: tableY, vx: (Math.random() - .5) * 260 * S, vy: -Math.random() * 160 * S, life: 1 });
            chosen.vy = -v * .42; chosen.vx *= .82;
            if (Math.abs(chosen.vy) < 160 * S) { chosen.state = "roll"; chosen.rollT = t; chosen.rollX = chosen.x; }
          }
        }
        let wob = 0;
        if (chosen.state === "roll") {
          const p = easeOut(clamp((t - chosen.rollT) / .75)), tx = W / 2;
          const nx = chosen.rollX + (tx - chosen.rollX) * p; chosen.rot += (nx - chosen.x) / chosen.r; chosen.x = nx; chosen.y = tableY - chosen.r;
          if (p >= 1) { chosen.state = "spin"; chosen.spinT = t; for (let i = 0; i < 14; i++) wood(i * (.09 - i * .005), .16 * (1 - i / 16), 2200); }
        }
        if (chosen.state === "spin") {
          const p = clamp((t - chosen.spinT) / (T0.rise - chosen.spinT));
          wob = (1 - p); chosen.y = tableY - chosen.r * (1 - .55 * p);
        }
        let tokSx = -1, tokSy = 1, tokR = chosen.r, tokX = chosen.x, tokY = chosen.y, glow = 0;
        if (chosen.state === "spin") { tokSy = 1 - .62 * clamp((t - chosen.spinT) / (T0.rise - chosen.spinT)); tokSx = -(1 - .12 * Math.abs(Math.sin(t * 30 * wob))); }
        if (t >= T0.rise) {
          if (chosen.state !== "up") { chosen.state = "up"; whoosh(0, .5); }
          const p = easeInOut(clamp((t - T0.rise) / (T0.flip - T0.rise + .25)));
          const big2 = (big ? 105 : 70) * S / .62 * (big ? .62 : 1);
          tokR = chosen.r + (big2 - chosen.r) * p; tokX = W / 2; tokY = (tableY - chosen.r * .45) + ((big ? H * .42 : H * .38) - (tableY - chosen.r * .45)) * p;
          tokSy = .38 + .62 * p;
          const fp = clamp((t - (T0.flip - .2)) / .4); tokSx = Math.cos(Math.PI * (1 - fp)); chosen.rot *= .9; glow = fp;
          if (fp >= .5 && !revealed) {
            revealed = true; flash = 1; fanfare(0); T.confetti(big ? 110 : 50, .35);
            setTimeout(() => reveal(), 250);
          }
        }

        // ---------- disegno ----------
        ctx.save();
        ctx.clearRect(0, 0, W, H);
        const fadeIn = clamp(t / .35), fadeOut = clamp((T0.end - t) / .5);
        ctx.globalAlpha = Math.min(fadeIn, fadeOut);
        if (shakeCam > .2) { ctx.translate((Math.random() - .5) * shakeCam, (Math.random() - .5) * shakeCam); shakeCam *= .86; }
        // buio + occhio di bue
        const sp = ctx.createRadialGradient(W / 2, tableY - 120 * S, 40 * S, W / 2, tableY - 120 * S, Math.max(W, H) * .7);
        sp.addColorStop(0, "rgba(60,10,12,.25)"); sp.addColorStop(.45, "rgba(25,3,6,.78)"); sp.addColorStop(1, "rgba(8,0,2,.93)");
        ctx.fillStyle = sp; ctx.fillRect(-20, -20, W + 40, H + 40);
        // tovaglia
        ctx.save(); ctx.beginPath(); ctx.moveTo(W / 2 - W * .48, H + 10); ctx.lineTo(W / 2 - W * .34, tableY - 18 * S); ctx.lineTo(W / 2 + W * .34, tableY - 18 * S); ctx.lineTo(W / 2 + W * .48, H + 10); ctx.closePath();
        ctx.fillStyle = cloth(ctx); ctx.fill(); ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fill();
        const tl = ctx.createRadialGradient(W / 2, tableY, 10, W / 2, tableY, W * .4); tl.addColorStop(0, "rgba(255,230,170,.35)"); tl.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = tl; ctx.fill();
        ctx.strokeStyle = "#e9b949"; ctx.lineWidth = 4 * S; ctx.beginPath(); ctx.moveTo(W / 2 - W * .34, tableY - 18 * S); ctx.lineTo(W / 2 + W * .34, tableY - 18 * S); ctx.stroke(); ctx.restore();
        // raggi dietro la rivelazione
        if (glow > 0) {
          ctx.save(); ctx.translate(tokX, tokY); ctx.rotate(t * .6); ctx.globalAlpha *= glow;
          for (let i = 0; i < 18; i++) { ctx.rotate(Math.PI * 2 / 18); const g = ctx.createLinearGradient(0, 0, 0, -tokR * 4.2); g.addColorStop(0, "rgba(255,216,107,.65)"); g.addColorStop(1, "rgba(255,216,107,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-tokR * .18, 0); ctx.lineTo(0, -tokR * 4.2); ctx.lineTo(tokR * .18, 0); ctx.fill(); }
          ctx.restore();
          const ring = clamp((t - T0.flip) / .7);
          if (ring > 0 && ring < 1) { ctx.save(); ctx.globalAlpha *= 1 - ring; ctx.strokeStyle = "#fff3c4"; ctx.lineWidth = 8 * S * (1 - ring); ctx.beginPath(); ctx.arc(tokX, tokY, tokR * (1 + ring * 3), 0, 7); ctx.stroke(); ctx.restore(); }
        }
        // ombra del cesto
        ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(bx, tableY - 6 * S, bw * .5, 14 * S, 0, 0, 7); ctx.fill();
        // numeri che volano
        for (const f of fountain) token(ctx, f.x, f.y, 16 * S, { rot: f.rot, sx: Math.cos(f.rot * 1.7) > 0 ? 1 : -1, sy: .55 + .45 * Math.abs(Math.cos(f.rot)), n: f.n });
        // cesto + mani
        if (basketImg.complete) {
          ctx.save(); ctx.translate(bx, tableY - lift + by); ctx.rotate(ang);
          ctx.drawImage(basketImg, -bw / 2, -bh, bw, bh);
          if (handsOn > 0) { ctx.globalAlpha *= handsOn; ctx.save(); ctx.rotate(.35); hand(ctx, bw * .36, -bh * .2, -1, S * 1.25); ctx.restore(); }
          ctx.restore();
        }
        // polvere
        for (const p of dust) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * S * dt; p.life -= dt * 1.6; if (p.life > 0) { ctx.fillStyle = `rgba(255,240,210,${p.life * .5})`; ctx.beginPath(); ctx.arc(p.x, p.y, 4 * S * p.life, 0, 7); ctx.fill(); } }
        // il numero scelto
        if (chosen.state !== "hidden") {
          if (t < T0.rise) { ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(chosen.x, tableY - 4 * S, chosen.r * .9, 6 * S, 0, 0, 7); ctx.fill(); }
          token(ctx, tokX, tokY, tokR, { rot: chosen.rot, sx: tokSx, sy: tokSy, n, glow });
        }
        // la figura della smorfia e il cartellino
        if (revealed) {
          const p = clamp((t - T0.flip - .1) / .45), pe = back(p);
          ctx.save(); ctx.translate(tokX + tokR * .95, tokY - tokR * .9); ctx.scale(pe, pe);
          if (sm.e === "🇮🇹") { const fw = tokR * .9, fh = tokR * .6; ["#009246", "#ffffff", "#ce2b37"].forEach((c, k) => { ctx.fillStyle = c; ctx.fillRect(-fw / 2 + k * fw / 3, -fh / 2, fw / 3 + 1, fh); }); ctx.strokeStyle = "#333"; ctx.lineWidth = 2; ctx.strokeRect(-fw / 2, -fh / 2, fw, fh); }
          else { ctx.font = `${tokR * .95}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(sm.e, 0, 0); }
          ctx.restore();
          // esclamazione
          const pe2 = back(clamp((t - T0.flip - .3) / .4));
          ctx.save(); ctx.translate(tokX - tokR * 1.25, tokY - tokR * .95); ctx.rotate(-.18); ctx.scale(pe2, pe2);
          ctx.font = `900 ${tokR * .32}px "Nunito",sans-serif`; const tw = ctx.measureText(excl).width;
          ctx.fillStyle = "#ffd86b"; ctx.strokeStyle = "#7a1418"; ctx.lineWidth = 3 * S;
          ctx.beginPath(); for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, rr = (i % 2 ? .75 : 1); ctx.lineTo(Math.cos(a) * (tw * .75) * rr, Math.sin(a) * tokR * .5 * rr); } ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = "#7a1418"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(excl, 0, 2 * S); ctx.restore();
          // cartellino
          const pl = easeOut(clamp((t - T0.flip - .2) / .4));
          ctx.save(); ctx.globalAlpha *= pl; ctx.translate(tokX, tokY + tokR * 1.45 + (1 - pl) * 30 * S);
          ctx.font = `400 ${Math.max(18, tokR * .36)}px "Abril Fatface",Georgia,serif`; const w1 = ctx.measureText(sm.nap).width;
          ctx.font = `800 ${Math.max(12, tokR * .17)}px Nunito,sans-serif`; const w2 = ctx.measureText(sm.it).width;
          const bwid = Math.max(w1, w2) + 44 * S, bhgt = tokR * .85;
          ctx.fillStyle = "#fffaf0"; ctx.strokeStyle = "#e9b949"; ctx.lineWidth = 4 * S; ctx.beginPath(); ctx.roundRect(-bwid / 2, -bhgt / 2, bwid, bhgt, 16 * S); ctx.fill(); ctx.stroke();
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillStyle = "#9e1b1b"; ctx.font = `400 ${Math.max(18, tokR * .36)}px "Abril Fatface",Georgia,serif`; ctx.fillText(sm.nap, 0, -bhgt * .14);
          ctx.fillStyle = "#8a7660"; ctx.font = `800 ${Math.max(12, tokR * .17)}px Nunito,sans-serif`; ctx.fillText(sm.it, 0, bhgt * .26);
          ctx.restore();
        }
        // lampo
        if (flash > 0) { ctx.fillStyle = `rgba(255,248,225,${flash * .75})`; ctx.fillRect(-20, -20, W + 40, H + 40); flash *= .86; if (flash < .02) flash = 0; }
        ctx.restore();

        if (t < T0.end) requestAnimationFrame(frame);
        else { cv.remove(); if (!revealed) reveal(); }
      }
      requestAnimationFrame(frame);
    });
    const p = busy.then(run); busy = p.catch(() => {}); return p;
  }
  T.panariello = panariello;
})();
