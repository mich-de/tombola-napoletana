/* Tombola Napoletana – l'estrazione dal panariello
   Un'idea di Michele De Angelis · mdeangelis.me
   1) se ci sono le clip video del panariello (D.PANA_CLIPS) parte il filmato delle mani;
   2) il gettone di legno cade, si gira e mostra il numero;
   3) si apre la stampa con la figura della smorfia, il nome e il numero in napoletano.
   Un tocco salta la scena. Senza video resta solo il gettone. */
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

  // ---------------- scena ----------------
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  let busy = Promise.resolve();
  // fotoromanzo del panariello (mani vere): x,y = centro del gettone nell'ultima foto, r = sua larghezza, in frazione del lato
  const SEQ = D.PANA_SEQ || null; let seqOK = false;
  if (SEQ) { let n = 0; SEQ.frames.forEach(f => { const im = new Image(); im.onload = () => { if (++n === SEQ.frames.length) seqOK = true; }; im.src = f.src; }); }

  // filmato delle mani: una clip a caso tra quelle disponibili; se non parte entro 1,2 s si salta
  function playClip(box, skip) {
    const clips = D.PANA_CLIPS || []; if (!clips.length) return Promise.resolve(false);
    return new Promise(done => {
      const v = document.createElement("video");
      v.className = "px-video"; v.muted = !D.PANA_CLIP_AUDIO; v.playsInline = true; v.setAttribute("playsinline", ""); v.preload = "auto";
      v.src = clips[Math.floor(Math.random() * clips.length)];
      let ended = false; const end = ok => { if (ended) return; ended = true; clearTimeout(guard); v.classList.add("out"); setTimeout(() => v.remove(), 350); done(ok); };
      let guard = setTimeout(() => end(false), 1200);
      v.onplaying = () => { clearTimeout(guard); guard = setTimeout(() => end(true), 6000); };
      v.onended = () => end(true); v.onerror = () => end(false);
      skip.then(() => end(true));
      box.appendChild(v);
      const p = v.play(); if (p && p.catch) p.catch(() => { v.muted = true; v.play().catch(() => end(false)); });
    });
  }

  function panariello(n, opts = {}) {
    const big = !!opts.big;
    const run = () => new Promise(reveal => {
      const sm = smorfia(n), fu = D.figURL && D.figURL(n);
      if (fu) { const pre = new Image(); pre.src = fu; }
      const ov = document.createElement("div"); ov.className = "px" + (big ? " big" : "");
      ov.innerHTML = `<div class="px-stage">
        <div class="px-token"><div class="px-coin"><span class="px-back"></span><span class="px-front">${n}</span></div></div>
        <div class="px-card"><div class="px-fig">${fu ? `<img src="${fu}" alt="">` : `<span>${T.fig(sm.e)}</span>`}</div>
          <div class="px-txt"><small>Numero ${n}</small><b>${esc(sm.nap)}</b><i>${esc(sm.it)}</i><em>« ${esc(D.numNap(n))} »</em></div></div>
      </div><div class="px-skip">tocca per saltare</div>`;
      document.body.appendChild(ov);
      let skipped = false, revealed = false, skipNow; const skip = new Promise(r => { skipNow = r; });
      ov.addEventListener("click", () => { skipped = true; skipNow(); });
      const show = () => { if (!revealed) { revealed = true; reveal(); } };
      const step = ms => skipped ? Promise.resolve() : Promise.race([wait(ms), skip]);
      (async () => {
        const hadClip = await playClip(ov, skip);
        const still = !hadClip && !skipped && SEQ && seqOK;
        if (still) {
          // fotoromanzo del panariello: la mano tappa, scuote, inclina, il numero cade nel palmo e viene verso chi guarda
          const ph = document.createElement("div"); ph.className = "px-seq";
          ph.innerHTML = `<div class="px-film">${SEQ.frames.map((f, i) => `<img src="${f.src}" alt="" class="${i ? "" : "on"}">`).join("")}</div>`;
          ov.appendChild(ph);
          const imgs = ph.querySelectorAll("img"), film = ph.firstChild;
          tock(.05, .35);
          for (let i = 0; i < SEQ.frames.length && !skipped; i++) {
            const f = SEQ.frames[i];
            imgs.forEach((im, k) => im.classList.toggle("on", k === i));
            film.classList.toggle("shake", !!f.shake);
            if (f.shake) { tarantella(0, Math.round(f.ms / 135)); for (let k = 0; k < 24; k++) wood(Math.random() * f.ms / 1000, .1 + Math.random() * .2); }
            if (f.drop) { for (let k = 0; k < 5; k++) wood(k * .04, .16); tock(.3, .45); }
            await step(f.ms);
          }
          film.classList.remove("shake");
          const tk = ov.querySelector(".px-token");
          ov.classList.add("rise");   // il gettone va al suo posto (senza trasformazioni) prima di misurare
          const a = film.getBoundingClientRect(), b = tk.getBoundingClientRect();
          const dx = a.left + a.width * SEQ.x - (b.left + b.width / 2), dy = a.top + a.height * SEQ.y - (b.top + b.height / 2), k = a.width * SEQ.r / b.width;
          ph.classList.add("out");
          if (!skipped) {
            whoosh(0, .5); tock(.62, .55);
            tk.animate([{ transform: `translate(${dx}px,${dy}px) scale(${k})`, opacity: 1 }, { transform: `translate(${dx * .45}px,${dy * .45 - b.height * .18}px) scale(${(1 + k) / 2}) rotate(-14deg)`, offset: .5 }, { transform: "scale(1.08) rotate(5deg)", offset: .82 }, { transform: "none", opacity: 1 }], { duration: 800, easing: "cubic-bezier(.3,.7,.3,1)" });
          }
          await step(880); setTimeout(() => ph.remove(), 600);
        } else {
          // senza foto né video: il gettone cade e balla
          ov.classList.add("drop");
          if (!skipped) { whoosh(0, .35); tock(.38, .5); if (!hadClip) { tarantella(.45, 6); for (let i = 0; i < 10; i++) wood(.45 + Math.random() * .7, .1 + Math.random() * .18); } }
          await step(hadClip ? 650 : 1250);
        }
        // si gira: ecco il numero
        ov.classList.add("flip");
        if (!skipped) { tock(.12, .6); fanfare(.2); }
        await step(520);
        show();
        // si apre la stampa con la figura
        ov.classList.add("open");
        await step(big ? 2300 : 1900);
        ov.classList.add("bye"); await wait(skipped ? 120 : 320);
        ov.remove(); show();
      })();
    });
    const p = busy.then(run); busy = p.catch(() => {}); return p;
  }
  T.panariello = panariello;
})();
