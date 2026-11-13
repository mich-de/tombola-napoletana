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
  // ---- mani disegnate con dita curve che seguono la forma del panariello ----
  const SKIN = "#efc39c", SKIN_D = "#c98d63", SKIN_L = "#f9dcc0";
  function curveFinger(ctx, x0, y0, cx, cy, x1, y1, w) {
    ctx.save(); ctx.lineCap = "round";
    ctx.strokeStyle = SKIN_D; ctx.lineWidth = w + 2.5; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.stroke();
    ctx.strokeStyle = SKIN; ctx.lineWidth = w; ctx.stroke();
    ctx.strokeStyle = SKIN_L; ctx.lineWidth = w * .35; ctx.globalAlpha *= .6; ctx.beginPath(); ctx.moveTo(x0, y0 - w * .18); ctx.quadraticCurveTo(cx, cy - w * .18, x1, y1 - w * .18); ctx.stroke();
    ctx.restore();
    // unghia orientata come la punta del dito
    const a = Math.atan2(y1 - cy, x1 - cx);
    ctx.save(); ctx.translate(x1 - Math.cos(a) * w * .12, y1 - Math.sin(a) * w * .12); ctx.rotate(a);
    ctx.fillStyle = "rgba(255,236,228,.95)"; ctx.strokeStyle = "rgba(170,110,85,.5)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(-w * .1, 0, w * .32, w * .27, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function blob(ctx, x, y, rx, ry, rot) {
    const g = ctx.createRadialGradient(x - rx * .3, y - ry * .3, 2, x, y, Math.max(rx, ry));
    g.addColorStop(0, SKIN_L); g.addColorStop(.6, SKIN); g.addColorStop(1, SKIN_D);
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, 7); ctx.fill();
  }
  // solo il polso, che sfuma: niente braccia
  function sleeve(ctx, x1, y1, x2, y2, w) {
    const sx = x2 + (x1 - x2) * .28, sy = y2 + (y1 - y2) * .28;
    const g = ctx.createLinearGradient(x2, y2, sx, sy);
    g.addColorStop(0, SKIN); g.addColorStop(.55, "rgba(239,195,156,.6)"); g.addColorStop(1, "rgba(239,195,156,0)");
    ctx.save(); ctx.lineCap = "round"; ctx.strokeStyle = g; ctx.lineWidth = w * .62; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
  }
  // mano sinistra: regge il panariello dal fondo, le dita lo avvolgono davanti
  function bottomHand(ctx, bw, bh, S) {
    sleeve(ctx, -bw * 1.15, bh * .32, -bw * .55, -bh * .12, 64 * S);
    blob(ctx, -bw * .47, -bh * .2, 40 * S, 52 * S, .5);                                                   // dorso della mano
    const ys = [-.4, -.31, -.22, -.13];
    ys.forEach((y, i) => { const x0 = -bw * (.42 - i * .015), x1 = bw * (.06 + i * .03) - i * 4 * S; curveFinger(ctx, x0, bh * y, (x0 + x1) / 2, bh * (y + .055), x1, bh * (y + .015), (21 - i * 1.5) * S); });
    curveFinger(ctx, -bw * .4, -bh * .44, -bw * .38, -bh * .58, -bw * .28, -bh * .64, 22 * S);                // pollice lungo il fianco
  }
  // mano destra: a coppa sopra la bocca, le dita scendono sul davanti
  function topHand(ctx, bw, bh, S) {
    sleeve(ctx, bw * 1.05, -bh * 1.55, bw * .25, -bh * 1.07, 60 * S);
    blob(ctx, bw * .04, -bh * 1.0, bw * .26, bh * .085, .12);                                            // dorso a coppa sulla bocca
    [-.13, -.05, .04, .12].forEach((x, i) => {
      const x0 = bw * x, y0 = -bh * .96, x1 = bw * (x * 1.45 + .02), y1 = -bh * (.66 + Math.abs(i - 1.5) * .035);
      curveFinger(ctx, x0, y0, x0 + (x1 - x0) * .2 + bw * .03, (y0 + y1) / 2, x1, y1, (20 - Math.abs(i - 1.5) * 1.5) * S);
    });
    curveFinger(ctx, -bw * .2, -bh * .98, -bw * .3, -bh * .9, -bw * .29, -bh * .76, 21 * S);                 // pollice
  }
  // mano aperta, palmo in su, dita leggermente piegate (riceve il numero)
  function openHand(ctx, x, y, S, open) {
    sleeve(ctx, x - 220 * S, y + 170 * S, x - 80 * S, y + 36 * S, 66 * S);
    blob(ctx, x - 22 * S, y + 6 * S, 74 * S, 34 * S, -.08);                                             // palmo
    ctx.strokeStyle = "rgba(160,95,65,.35)"; ctx.lineWidth = 2 * S;
    ctx.beginPath(); ctx.moveTo(x - 70 * S, y + 6 * S); ctx.quadraticCurveTo(x - 30 * S, y - 12 * S, x + 20 * S, y + 2 * S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 60 * S, y + 18 * S); ctx.quadraticCurveTo(x - 20 * S, y + 6 * S, x + 26 * S, y + 14 * S); ctx.stroke();
    const up = (1 - open) * 30;
    curveFinger(ctx, x - 62 * S, y - 6 * S, x - 66 * S, y - (40 + up) * S, x - 40 * S, y - (58 + up) * S, 23 * S);  // pollice alzato
  }
  function openHandFront(ctx, x, y, S) {
    [0, 1, 2, 3].forEach(i => {
      const y0 = y + (10 - i * 8) * S, len = (92 - Math.abs(i - 1.3) * 12) * S;
      curveFinger(ctx, x + 34 * S, y0, x + 34 * S + len * .6, y0 + 6 * S, x + 34 * S + len, y0 - 16 * S - i * 2 * S, (22 - i * 1.2) * S);
    });
  }
  // ---- mani emoji (disegnate da Apple/Google/Microsoft: molto più belle di quelle fatte a mano) ----
  function emojiOK(ch) {
    try {
      const c = document.createElement("canvas"); c.width = c.height = 40; const x = c.getContext("2d");
      x.font = "32px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif"; x.textBaseline = "top"; x.fillText(ch, 2, 2);
      const d = x.getImageData(0, 0, 40, 40).data; let col = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 100 && (Math.abs(d[i] - d[i + 1]) > 25 || Math.abs(d[i + 1] - d[i + 2]) > 25)) col++;
      return col > 40;
    } catch { return false; }
  }
  let HANDS = null;
  function hands() {
    if (HANDS) return HANDS;
    const up = emojiOK("🫴"), down = emojiOK("🫳");
    HANDS = { up: up ? "🫴" : "🤲", upRot: 0, down: down ? "🫳" : "🤚", downRot: down ? 0 : Math.PI };
    return HANDS;
  }
  function emojiHand(ctx, ch, x, y, size, rot = 0, flip = false) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); if (flip) ctx.scale(-1, 1);
    ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = size * .12; ctx.shadowOffsetY = size * .05;
    ctx.font = `${size}px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(ch, 0, 0);
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

      // tempi della scena (secondi): una mano tappa e scuote, poi si apre sotto e riceve il numero
      const T0 = { in: .45, shake: 2.15, move: 2.6, tilt: 3.0, drop: 3.05, back: 3.45, present: 3.9, rise: 4.5, flip: 5.0, end: big ? 7.1 : 6.6 };
      const TA = -2.0, LIFT = 200 * S;
      // suoni programmati
      osc(0, 90, .4, { vol: .25, to: 50 }); whoosh(0, .4); tock(.42, .4);
      tarantella(.5, 12);
      for (let i = 0; i < 34; i++) wood(.5 + Math.random() * 1.6, .1 + Math.random() * .2);
      heart(2.25); heart(2.75);
      for (let i = 0; i < 6; i++) wood(2.95 + i * .03, .14);
      const dust = [];
      const chosen = { x: 0, y: 0, vx: 0, vy: 0, rot: 0, r: 26 * S, state: "hidden" };
      let shakeCam = 0, flash = 0, revealed = false, t0 = performance.now(), last = t0;

      function rimPos(angle, lift) {
        const px = bx, py = tableY - lift, ry = -bh * .92;
        return { x: px - ry * Math.sin(angle), y: py + ry * Math.cos(angle) };
      }
      const rimT = rimPos(TA, LIFT);
      const palm0 = { x: rimT.x - 6 * S, y: rimT.y + 95 * S };        // dove si apre la mano sotto la bocca
      const palmC = { x: W / 2, y: big ? H * .5 : H * .47 };           // dove la mano mostra il numero
      let palm = null;

      function frame(now) {
        const dt = Math.min(.05, (now - last) / 1000); last = now;
        const t = (now - t0) / 1000;
        // stato del cesto
        let ang = 0, lift = 0, by = 0, handsOn = 1;
        if (t < T0.in) { const p = clamp(t / T0.in); by = -(1 - back(p)) * H * .6; }
        else if (t < T0.shake) {
          const p = (t - T0.in) / (T0.shake - T0.in), amp = .1 + .2 * p;
          ang = Math.sin(t * 23) * amp; lift = Math.abs(Math.sin(t * 23)) * 34 * S * (.4 + p);
        } else if (t < T0.move) { ang = Math.sin(t * 50) * .02; }
        else if (t < T0.tilt) { const p = easeInOut(clamp((t - T0.move) / (T0.tilt - T0.move))); ang = TA * p; lift = LIFT * p; }
        else if (t < T0.back) { ang = TA + Math.sin(t * 60) * .015; lift = LIFT; }
        else { const p = easeInOut(clamp((t - T0.back) / .45)); ang = TA * (1 - p); lift = LIFT * (1 - p); handsOn = 1 - p; }

        // la mano di sopra: tappa la bocca, poi si sposta sotto e si apre
        let palmVis = 0;
        if (t >= T0.shake) {
          const p = easeInOut(clamp((t - T0.shake) / (T0.move - T0.shake)));
          const from = { x: bx + 10 * S, y: tableY - bh * 1.05 };
          palm = { x: from.x + (palm0.x - from.x) * p, y: from.y + (palm0.y - from.y) * p - Math.sin(p * Math.PI) * 60 * S };
          palmVis = 1;
          if (t >= T0.present) {
            const q = easeInOut(clamp((t - T0.present) / (T0.rise - T0.present)));
            palm = { x: palm0.x + (palmC.x - palm0.x) * q, y: palm0.y + (palmC.y - palm0.y) * q };
          }
          if (t >= T0.rise) palmVis = 1 - clamp((t - T0.rise - .15) / .35);
        }

        // il numero scivola fuori dalla bocca e cade nel palmo
        if (t >= T0.drop && chosen.state === "hidden") {
          const rp = rimPos(ang, lift); Object.assign(chosen, { x: rp.x, y: rp.y, vx: -25 * S, vy: 60 * S, state: "fall" }); whoosh(0, .3);
        }
        const rest = () => palm.y - 30 * S;
        if (chosen.state === "fall") {
          chosen.vy += 1600 * S * dt; chosen.x += chosen.vx * dt; chosen.y += chosen.vy * dt; chosen.rot -= 6 * dt;
          if (chosen.y >= rest()) {
            chosen.y = rest(); const v = chosen.vy;
            skin(0, .45); wood(0, .25, 1400); shakeCam = 6 * S;
            for (let k = 0; k < 8; k++) dust.push({ x: chosen.x, y: chosen.y + 10 * S, vx: (Math.random() - .5) * 200 * S, vy: -Math.random() * 140 * S, life: 1 });
            if (v > 300 * S) chosen.vy = -v * .3; else chosen.state = "palm";
          }
        }
        if (chosen.state === "palm" || (chosen.state === "fall" && t > T0.drop + .9)) { chosen.state = "palm"; chosen.x += (palm.x - chosen.x) * .3; chosen.y = rest(); chosen.rot *= .9; }

        let tokSx = -1, tokSy = chosen.state === "palm" ? .55 : 1, tokR = chosen.r, tokX = chosen.x, tokY = chosen.y, glow = 0;
        if (t >= T0.rise) {
          if (chosen.state !== "up") { chosen.state = "up"; whoosh(0, .5); chosen.sx0 = chosen.x; chosen.sy0 = chosen.y; }
          const p = easeInOut(clamp((t - T0.rise) / (T0.flip - T0.rise + .25)));
          const big2 = (big ? 105 : 70) * S / .62 * (big ? .62 : 1);
          tokR = chosen.r + (big2 - chosen.r) * p; tokX = chosen.sx0 + (W / 2 - chosen.sx0) * p; tokY = chosen.sy0 + ((big ? H * .4 : H * .36) - chosen.sy0) * p;
          tokSy = .55 + .45 * p;
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
        sp.addColorStop(0, "rgba(60,10,12,.62)"); sp.addColorStop(.5, "rgba(25,3,6,.86)"); sp.addColorStop(1, "rgba(8,0,2,.95)");
        ctx.fillStyle = sp; ctx.fillRect(-20, -20, W + 40, H + 40);
        // raggi dietro la rivelazione
        if (glow > 0) {
          ctx.save(); ctx.translate(tokX, tokY); ctx.rotate(t * .6); ctx.globalAlpha *= glow;
          for (let i = 0; i < 18; i++) { ctx.rotate(Math.PI * 2 / 18); const g = ctx.createLinearGradient(0, 0, 0, -tokR * 4.2); g.addColorStop(0, "rgba(255,216,107,.65)"); g.addColorStop(1, "rgba(255,216,107,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-tokR * .18, 0); ctx.lineTo(0, -tokR * 4.2); ctx.lineTo(tokR * .18, 0); ctx.fill(); }
          ctx.restore();
          const ring = clamp((t - T0.flip) / .7);
          if (ring > 0 && ring < 1) { ctx.save(); ctx.globalAlpha *= 1 - ring; ctx.strokeStyle = "#fff3c4"; ctx.lineWidth = 8 * S * (1 - ring); ctx.beginPath(); ctx.arc(tokX, tokY, tokR * (1 + ring * 3), 0, 7); ctx.stroke(); ctx.restore(); }
        }
        // cesto tenuto da una mano sotto (palmo in su) e tappato da una mano sopra (palmo in giù)
        if (basketImg.complete) {
          const H = hands();
          ctx.save(); ctx.translate(bx, tableY - lift + by); ctx.rotate(ang);
          if (handsOn > 0) { ctx.save(); ctx.globalAlpha *= handsOn; emojiHand(ctx, H.up, -bw * .02, bh * .02, bw * 1.05, H.upRot); ctx.restore(); }
          ctx.drawImage(basketImg, -bw / 2, -bh, bw, bh);
          if (t < T0.shake) emojiHand(ctx, H.down, bw * .04, -bh * 1.0, bw * .82, H.downRot);
          ctx.restore();
        }
        // la mano aperta che riceve il numero
        if (palm && palmVis > 0 && t >= T0.shake) {
          const H = hands(), sz = 190 * S * (big ? 1.1 : 1);
          ctx.save(); ctx.globalAlpha *= palmVis; emojiHand(ctx, H.up, palm.x - sz * .05, palm.y + sz * .12, sz, H.upRot); ctx.restore();
        }
        // polvere
        for (const p of dust) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * S * dt; p.life -= dt * 1.6; if (p.life > 0) { ctx.fillStyle = `rgba(255,240,210,${p.life * .5})`; ctx.beginPath(); ctx.arc(p.x, p.y, 4 * S * p.life, 0, 7); ctx.fill(); } }
        // il numero scelto
        if (chosen.state !== "hidden") token(ctx, tokX, tokY, tokR, { rot: chosen.rot, sx: tokSx, sy: tokSy, n, glow });
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
