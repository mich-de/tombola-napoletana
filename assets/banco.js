/* Tombola Napoletana – cartellone del banco
   Un'idea di Michele De Angelis · mdeangelis.me */
(function () {
  const { D, $, esc, smorfia, api, avatarHTML } = T;
  let animating = false, profileAsked = false;
  const PINKEY = T.getRoom() === "main" ? "tmb_pin" : "tmb_pin_" + T.getRoom();
  let pin = sessionStorage.getItem(PINKEY) || "";
  let st = null, seenSeq = null, lastLen = -1, auto = false, busy = false, lastDrawLocal = 0, voice = false, story = localStorage.getItem("tmb_story") || "storiella", roster = [];
  const seenReacts = new Set(); const loadTime = Date.now();
  let overlayUntil = 0;

  T.snow();
  document.querySelectorAll(".credits").forEach(c => c.innerHTML = T.creditsHTML());
  const host = (op, extra = {}) => api("host", { pin, op, ...extra });

  // ---------- PIN ----------
  async function tryPin(p) {
    pin = p;
    try { await host("check"); sessionStorage.setItem(PINKEY, p); boot(); return true; }
    catch (e) { $("#pinErr").textContent = e.data && (e.data.error === "setup" || e.data.error === "notable") ? e.message : "PIN errato"; return false; }
  }
  $("#pinBtn").onclick = () => { T.audio(); tryPin($("#pin").value.trim()); };
  $("#pin").onkeydown = e => { if (e.key === "Enter") $("#pinBtn").click(); };
  if (pin) tryPin(pin);

  function boot() {
    $("#pinBox").classList.add("hidden"); $("#banco").classList.remove("hidden");
    const url = location.origin + "/" + T.roomQS();
    if (T.getRoom() !== "main") $("#closeBtn").classList.remove("hidden");
    $("#url").textContent = url.replace(/^https?:\/\//, "");
    $("#qr").src = "https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=" + encodeURIComponent(url);
    $("#qr").onerror = () => $("#qr").remove();
    // il cartellone della smorfia: due pagine da 5 colonne × 9 righe (1-5 / 6-10 …)
    let html = "";
    for (const half of [0, 1]) {
      html += `<div class="page">`;
      for (let r = 0; r < 9; r++) for (let c = 0; c < 5; c++) {
        const n = r * 10 + half * 5 + c + 1, sm = smorfia(n);
        const fu = D.figURL(n);
        html += `<div class="cell ${fu ? "img" : ""}" data-n="${n}" title="${n} · ${esc(sm.nap)} (${esc(sm.it)})"${fu ? ` style="background-image:url(${fu})"` : ""}><span class="nn">${n}</span><span class="ee">${fu ? "" : T.fig(sm.e)}</span><span class="lb"><i>${esc(sm.nap)}</i><b>${esc(sm.it)}</b></span><span class="fg"></span></div>`;
      }
      html += [0, 1, 2].map(k => `<span class="ctag" style="top:calc(${k} * (100% / 3) + ${k * 2}px)">CARTELLA ${k * 2 + half + 1}</span>`).join("");
      html += `</div>`;
    }
    $("#tab90").innerHTML = html;
    // su schermi piccoli i nomi non entrano nella casella: toccandola si vedono
    $("#tab90").onclick = e => { const c = e.target.closest(".cell"); if (!c) return; const sm = smorfia(+c.dataset.n); T.toast(`${c.dataset.n} · ${sm.nap} — ${sm.it}`, 3000); };
    prewarm();
    host("getconfig").then(r => { $("#interval").value = r.config.interval; $("#intervalV").textContent = r.config.interval + " s"; }).catch(() => {});
    poll(); setInterval(loadRoster, 5000); loadRoster(); setInterval(autoTick, 500);
  }

  // ---------- stato ----------
  async function refresh() { try { onState(await api("state", null, "&h=1&_=" + Date.now())); } catch {} }
  async function poll() { await refresh(); setTimeout(poll, 1200); }
  async function loadRoster() { try { roster = (await api("roster", null, "&h=1&_=" + Date.now())).players; renderBoard(); $("#crowd").innerHTML = T.crowdHTML(roster); $("#crowdN").textContent = `(${roster.length})`; } catch {} }

  function onState(s) {
    st = s; T.setRecs(s.recs); T.handleSays(s.says, "banco");
    if (seenSeq === null) seenSeq = s.seq || 0;
    for (const ev of (s.events || []).filter(e => e.id > seenSeq)) {
      if (ev.type === "win") {
        const extra = ev.verdict ? (ev.verdict.mode === "wheel" ? 13000 : 7000) : 0;
        overlayUntil = Date.now() + 6200 + (ev.cards ? 6500 * Math.min(3, ev.winners.length) : 0) + (["tombola", "tombolino"].includes(ev.level) ? 13000 : 9000) + extra;
        setTimeout(() => T.showWin(ev, { speak: voice, stay: true }), 6200);
        loadRoster();
      }
      if (ev.type === "over") { auto = false; renderAuto(); T.toast("🏁 Partita finita!"); }
      if (ev.type === "call") { T.toast(ev.join ? `🤝 Anche ${ev.name} chiama ${ev.label.toUpperCase()}!` : `📣 ${ev.name} chiama ${ev.label.toUpperCase()}!`, 3000); T.sounds.pop(); if (voice) T.speak(`${ev.name} chiama ${ev.label}!`); }
      if (ev.type === "late") { T.lateOverlay(ev, { banco: true, send: d => host("say", d) }); overlayUntil = Math.max(overlayUntil, Date.now() + 20000); }
      if (ev.type === "scherzo") { overlayUntil = Math.max(overlayUntil, Date.now() + 19000); setTimeout(() => T.showScherzo(ev, { speak: voice, stay: true }), 6600); }
      if (ev.type === "prank") { const P = D.PRANKS[ev.kind]; T.toast(`${P.e} ${ev.from} ha fatto 'o scherzo a ${ev.to}: ${P.name}`, 3500); T.floater(P.e, ev.to); }
      if (ev.type === "falsecall") { T.toast(`😂 ${ev.name} ha chiamato ${ev.label.toUpperCase()}… a vuoto!`, 3500); T.floater("🙈", ev.name); if (voice) T.speak(`${ev.name} ha chiamato ${ev.label} a vuoto! Nun è overo!`); }
    }
    seenSeq = Math.max(seenSeq, s.seq || 0);
    let shown = 0;
    for (const r of [...(s.reacts || [])].reverse()) {
      if (seenReacts.has(r.i)) continue; seenReacts.add(r.i);
      if (r.t < loadTime - 3000 || shown > 10) continue;
      shown++; setTimeout(() => T.floater(r.e, r.n), shown * 150);
    }
    T.updateReactCounts(s.reacts || []);
    render();
  }

  function render() {
    const s = st, d = s.drawn || [];
    paintMe();
    if (!profileAsked && s.banco && s.banco.name === "Il Banco") { profileAsked = true; setTimeout(openProfile, 600); }
    if (s.table) $("#tableTitle").textContent = s.table.code === "main" ? "🌋 Cartellone" : "🎲 " + s.table.name;
    const ph = { lobby: ["Iscrizioni aperte", ""], playing: ["In gioco", "live"], tombolino: ["Caccia al tombolino", "tl"], over: ["Partita finita", "over"] }[s.phase];
    $("#phase").textContent = ph[0]; $("#phase").className = "pill " + ph[1];
    $("#sGame").textContent = s.game; $("#sCount").textContent = s.count; $("#sDrawn").textContent = d.length + "/90";
    $("#startBtn").classList.toggle("hidden", s.phase !== "lobby");
    $("#bancoBtn").textContent = "🧺 Il banco gioca: " + (s.bancoPlays ? "sì" : "no");
    $("#scherziBtn").textContent = "😜 Scherzi: " + (s.scherzi ? "sì" : "no");
    const dt = D.detto(s.game, d.length); $("#detto").innerHTML = `<b>«${esc(dt[0])}»</b><small>${esc(dt[1])}</small>`;
    $("#lateBtn").textContent = "⏰ Ritardatari: " + (s.lateJoin ? "entrano (con messaggio del banco)" : "aspettano la prossima");
    $("#talkBtn").textContent = "🎤 I giocatori possono parlare: " + (s.playersTalk ? "sì" : "no");
    const live = s.phase === "playing" || s.phase === "tombolino";
    $("#modeSel").value = s.mode; $("#tieSel").value = s.tie; $("#modeSel").disabled = $("#tieSel").disabled = live;
    $("#tieSel").parentElement.querySelectorAll("span")[1].style.opacity = $("#tieSel").style.opacity = s.mode === "chiamata" ? 1 : .4;
    const showCall = s.mode === "chiamata" && live && s.bancoPlays;
    $("#bancoCallRow").classList.toggle("hidden", !(s.mode === "chiamata" && live));
    $("#bancoCall").classList.toggle("hidden", !showCall);
    const lk = s.pending ? s.pending.level : s.next; $("#bancoCall").dataset.level = lk || ""; $("#bancoCall").textContent = `📣 Il banco chiama ${(T.LEVEL[lk] || { label: "" }).label.toUpperCase()}!`;
    $("#pendBanco").textContent = s.pending ? `⏳ ${s.pending.label} chiamato da ${s.pending.names.join(", ")} · ${Math.max(0, Math.ceil((s.pending.until - s.now) / 1000))}s` : "";
    const playing = s.phase === "playing" || s.phase === "tombolino";
    $("#drawBtn").disabled = !playing || busy; $("#autoBtn").disabled = !playing;

    if (d.length !== lastLen) {
      const isNew = lastLen >= 0 && d.length > lastLen; lastLen = d.length;
      const n = d[d.length - 1];
      if (n && isNew) {
        animating = true;
        T.prepareRec(n);
        T.panariello(n, { big: true }).then(() => { showNumber(n, d); animating = false; { T.playRec(n); } });
      } else showNumber(n, d);
    }
    const pz = s.prizes || {}; const next = D.LEVELS.find(l => !pz[l.key]);
    $("#prizes").innerHTML = D.LEVELS.map(l => {
      const p = pz[l.key];
      if (!p) return `<div class="prz ${next && next.key === l.key && playing ? "next" : ""}"><span class="lv">${l.label}</span><span class="who muted">${next && next.key === l.key && playing ? "in palio adesso…" : "in palio"}</span></div>`;
      return `<div class="prz done"><span class="lv">${l.label}</span><span class="avs">${p.winners.slice(0, 4).map(w => avatarHTML(w.av, "sm", w)).join("")}</span>
        <span class="who"><b>${esc(p.winners.map(w => w.name).join(", "))}</b><br><span class="muted">${esc(p.prize)} · al ${p.draw}° numero</span>${p.winners.slice(0, 3).map(w => T.numsHTML(w.nums, p.n)).join("")}</span></div>`;
    }).join("");
  }

  function showNumber(n, d) {
    document.querySelectorAll("#tab90 .cell").forEach(el => { const k = +el.dataset.n; el.className = "cell" + (D.figURL(k) ? " img" : "") + (d.includes(k) ? (k === n ? " last" : " on") : ""); });
    if (n) {
      const sm = smorfia(n);
      $("#bb").textContent = n; $("#bb").classList.remove("anim"); void $("#bb").offsetWidth; $("#bb").classList.add("anim");
      $("#fig").innerHTML = D.figURL(n) ? `<img src="${D.figURL(n)}" alt="" style="width:150px;height:150px;object-fit:cover;border-radius:18px;border:4px solid var(--gold);box-shadow:0 8px 20px rgba(0,0,0,.35)">` : T.fig(sm.e); $("#nap").textContent = sm.nap; $("#it").textContent = sm.it;
      $("#napnum").textContent = "« " + D.numNap(n) + " »";
      $("#story").innerHTML = `<b style="display:block;margin-bottom:4px">${esc(sm.story)}</b><span class="rima" style="margin:0">${esc(D.RIME[n - 1])}</span>`;
    } else {
      $("#napnum").textContent = "";
      $("#bb").textContent = "–"; $("#fig").textContent = "🧺"; $("#nap").textContent = st && st.phase === "lobby" ? "Si comincia tra poco" : "Pronti?"; $("#it").textContent = "";
      $("#story").textContent = "Ognuno apra il link sul telefono, scriva il nome e scelga il suo personaggio della smorfia.";
    }
  }
  // prepara in anticipo le voci dei 90 numeri (una volta sola: poi restano in cache)
  async function prewarm() {
    const qs = []; for (let n = 1; n <= 90; n++) qs.push(`n=${n}&s=1`, `n=${n}&s=0`);
    const worker = async () => { while (qs.length) { const q = qs.shift(); try { const r = await fetch("/api/voce?" + q); if (!r.ok) return; await r.arrayBuffer(); } catch { return; } } };
    await Promise.all([worker(), worker()]);
  }
  function fillVoices() {
    const vs = T.itVoices(), best = T.bestVoice();
    const natural = best && /natural|neural|online|premium|enhanced|siri/i.test(best.name);
    $("#voiceTip").innerHTML = natural ? "✅ Voce naturale attiva: " + esc(best.name)
      : "💡 Per una voce naturale <b>gratis</b> apri questa pagina con <b>Microsoft Edge</b>: ha le voci neurali italiane Isabella, Elsa, Diego e Giuseppe.";
    $("#voiceSel").innerHTML = vs.length ? vs.map(v => `<option ${best && v.name === best.name ? "selected" : ""}>${esc(v.name)}</option>`).join("") : `<option>Nessuna voce italiana nel browser</option>`;
  }

  function renderBoard() {
    const w = roster.filter(p => p.wins.length).sort((a, b) => b.wins.length - a.wins.length).slice(0, 15);
    $("#board").innerHTML = w.length ? w.map((p, i) => `<div class="r">${i < 3 ? ["🥇", "🥈", "🥉"][i] : `<span style="width:22px;text-align:center">${i + 1}</span>`}${avatarHTML(p.av, "sm", p)}<b>${esc(p.name)}</b><span>${p.wins.map(x => T.LEVEL[x.k]?.label[0] || "").join("")} · ${p.wins.length}</span></div>`).join("") : `<span class="muted">Ancora nessun vincitore</span>`;
  }

  // ---------- comandi ----------
  async function draw() {
    if (busy || !st) return; busy = true; $("#drawBtn").disabled = true;
    try { await host("draw", { expect: (st.drawn || []).length }); lastDrawLocal = Date.now(); await refresh(); }
    catch (e) { T.toast("⚠️ " + e.message); }
    finally { busy = false; render(); }
  }
  function autoTick() {
    if (!auto || !st || busy) return;
    if (!(st.phase === "playing" || st.phase === "tombolino")) return;
    if (animating || (st && st.pending) || speechSynthesis.speaking || Date.now() < overlayUntil || document.querySelector(".overlay")) return;
    const iv = (+$("#interval").value || 12) * 1000;
    if (Date.now() - lastDrawLocal >= iv) draw();
  }
  function renderAuto() { $("#autoBtn").textContent = auto ? "⏸ Pausa" : "⏯ Automatico"; $("#autoBtn").classList.toggle("auto-on", auto); }
  $("#drawBtn").onclick = draw;
  $("#autoBtn").onclick = () => { auto = !auto; if (auto) lastDrawLocal = 0; renderAuto(); };
  $("#startBtn").onclick = async () => { await host("start"); T.confetti(120); T.announce("k=start", "Si comincia! Buona fortuna a tutti quanti!"); await refresh(); };
  $("#bancoBtn").onclick = async () => { await host("config", { config: { bancoPlays: !st.bancoPlays } }); await refresh(); };
  $("#modeSel").onchange = async () => { await host("config", { config: { mode: $("#modeSel").value } }); T.toast($("#modeSel").value === "chiamata" ? "📣 Vincite da chiamare: ognuno deve accorgersene da solo!" : "🤖 Vincite automatiche"); await refresh(); };
  $("#tieSel").onchange = async () => { await host("config", { config: { tie: $("#tieSel").value } }); await refresh(); };
  $("#bancoCall").onclick = async () => { const level = $("#bancoCall").dataset.level; if (!level) return; const r = await host("call", { level }); T.toast((r.result === "won" ? "🏆 " : r.result === "false" ? "🙈 " : "⏳ ") + r.message, 3500); await refresh(); };
  $("#interval").oninput = () => { $("#intervalV").textContent = $("#interval").value + " s"; };
  $("#interval").onchange = () => host("config", { config: { interval: +$("#interval").value } }).catch(() => {});
  $("#newBtn").onclick = async () => {
    if (st && (st.phase === "playing" || st.phase === "tombolino") && !confirm("La partita è ancora in corso. Vuoi davvero iniziarne una nuova?")) return;
    auto = false; renderAuto(); await host("newgame"); lastLen = -1; T.toast("🔄 Nuova partita: cartelle nuove per tutti"); await refresh();
  };
  $("#closeBtn").onclick = async () => {
    if (!confirm("Chiudere questo tavolo? I giocatori torneranno al tavolo principale e il posto si libera per un altro tavolo.")) return;
    await host("closeroom"); location.href = "/";
  };
  $("#resetBtn").onclick = async () => {
    if (!confirm("Azzerare TUTTA la serata? Spariscono giocatori, cartelle e classifica.")) return;
    if (prompt('Per confermare scrivi AZZERA') !== "AZZERA") return;
    await host("reset"); location.reload();
  };
  $("#infoBtn").onclick = T.infoModal;

  $("#prizesBtn").onclick = async () => {
    const { config } = await host("getconfig");
    const m = T.modal(`<h2 class="title-font">🎁 Premi</h2><p class="muted">Un premio per riga: a ogni vincita ne viene scelto uno a caso. Se scrivi una cifra in euro (es. "Buono da 20 €") e vincono in più persone, la cifra viene divisa.</p>
      ${D.LEVELS.map(l => `<label class="lb">${l.label}</label><textarea data-k="${l.key}">${esc((config.prizes[l.key] || []).join("\n"))}</textarea>`).join("")}
      <div class="center" style="margin-top:12px"><button class="btn green" id="savePz">💾 Salva premi</button></div>`);
    m.querySelector("#savePz").onclick = async () => {
      const prizes = {}; m.querySelectorAll("textarea").forEach(t => prizes[t.dataset.k] = t.value.split("\n").map(x => x.trim()).filter(Boolean));
      await host("config", { config: { prizes } }); T.toast("✅ Premi salvati"); m.remove();
    };
  };
  // ---- walkie-talkie: il banco parla nel microfono e la voce arriva a tutti ----
  const PTT_LABEL = "🎙️ Tieni premuto per parlare";
  const ptt = T.recordPTT($("#pttBtn"), {
    maxMs: 20000,
    send: d => host("say", d),
    onState: (k, msg) => {
      const b = $("#pttBtn"), st2 = $("#pttStat");
      if (k === "rec") { speechSynthesis.cancel(); b.classList.add("on"); b.textContent = "🔴 Sto registrando… lascia per inviare"; }
      if (k === "stop") { b.classList.remove("on"); b.textContent = PTT_LABEL; }
      if (k === "short") st2.textContent = "Troppo corto: tieni premuto mentre parli";
      if (k === "sending") st2.textContent = "📡 Invio a tutti…";
      if (k === "sent") st2.textContent = "✅ Inviato! I telefoni lo sentono tra pochi secondi.";
      if (k === "error") st2.textContent = "⚠️ " + msg;
      if (k === "nomic") st2.textContent = "⚠️ Consenti il microfono nel browser";
    }
  });
  document.addEventListener("keydown", e => { if (e.code === "Space" && !e.repeat && !/INPUT|TEXTAREA|SELECT|BUTTON/.test(document.activeElement.tagName) && !document.querySelector(".modal")) { e.preventDefault(); ptt.start(); } });
  document.addEventListener("keyup", e => { if (e.code === "Space") ptt.stop(); });
  $("#scherziBtn").onclick = async () => { await host("config", { config: { scherzi: !(st && st.scherzi) } }); await refresh(); T.toast(st.scherzi ? "😜 Scherzi permessi: occhio al Munaciello!" : "🚫 Scherzi vietati"); };
  $("#lateBtn").onclick = async () => { await host("config", { config: { lateJoin: !(st && st.lateJoin) } }); await refresh(); };
  $("#talkBtn").onclick = async () => { await host("config", { config: { playersTalk: !(st && st.playersTalk) } }); await refresh(); T.toast(st.playersTalk ? "🎤 Ora i giocatori possono parlare" : "🔇 Parola tolta ai giocatori"); };

  // ---- registrazione della voce del banco ----
  $("#recBtn").onclick = () => openRec(6);
  function openRec(sel) {
    let cur = sel, rec = null, chunks = [], blob = null, mime = "", timer = null, t0 = 0;
    const m = T.modal(`<h2 class="title-font">🎙️ La voce del banco</h2>
      <p class="muted">Scegli un numero, premi <b>Registra</b> e dillo come al tavolo: il numero in napoletano, la figura e, se vuoi, la filastrocca. Durante la partita si sentirà la tua voce; i numeri non registrati restano in silenzio.</p>
      <div class="recgrid">${Array.from({ length: 90 }, (_, i) => `<button data-n="${i + 1}">${i + 1}</button>`).join("")}<button data-n="late" style="grid-column:span 10">⏰ Messaggio per i ritardatari</button></div>
      <div class="recpanel"><div class="big" id="rNum"></div><div class="script" id="rScript"></div>
        <div class="recctl"><button class="btn red" id="rRec">⏺ Registra</button><button class="btn ghost" style="color:var(--ink);border-color:var(--line)" id="rPlay" disabled>▶ Ascolta</button>
        <button class="btn green" id="rSave" disabled>💾 Salva</button><button class="btn ghost" style="color:var(--ink);border-color:var(--line)" id="rSaved">🔊 Salvata</button><button class="btn ghost" style="color:var(--red2);border-color:var(--line)" id="rDel">🗑️</button><button class="btn" id="rDemo">🎬 Prova con l'estrazione</button></div>
        <div class="recstat" id="rStat"></div></div>`);
    const $m = q => m.querySelector(q);
    const paint = () => {
      const recs = (st && st.recs) || {};
      m.querySelectorAll(".recgrid button").forEach(b => { const n = b.dataset.n === "late" ? "late" : +b.dataset.n; b.classList.toggle("has", !!recs[n]); b.classList.toggle("sel", n === cur); });
      if (cur === "late") {
        $m("#rNum").innerHTML = `⏰ <span style="font-size:30px">Ritardatari</span>`;
        $m("#rScript").innerHTML = `Registra quello che vuoi dire a chi arriva tardi: si sentirà su tutti i telefoni ogni volta che entra un ritardatario.<br><i>Es.: «E tu a chest'ora arrive? Ambo e terno t'e sì perso, assiettate e statte zitto!»</i>`;
      } else {
        const sm = smorfia(cur);
        $m("#rNum").innerHTML = `${cur} <span style="font-size:34px">${T.fig(sm.e)}</span>`;
        $m("#rScript").innerHTML = `Di': <b>« ${esc(D.numNap(cur))} »</b> … <b>${esc(sm.nap)}</b> <span class="muted">(${esc(sm.it)})</span><br><i>${esc(D.RIME[cur - 1])}</i>`;
      }
      $m("#rDemo").style.display = cur === "late" ? "none" : "";
      $m("#rSaved").style.display = $m("#rDel").style.display = recs[cur] ? "" : "none";
      $m("#rPlay").disabled = $m("#rSave").disabled = !blob;
    };
    m.querySelector(".recgrid").onclick = e => { const b = e.target.closest("button"); if (!b || rec) return; cur = b.dataset.n === "late" ? "late" : +b.dataset.n; blob = null; $m("#rStat").textContent = ""; paint(); };
    $m("#rRec").onclick = async () => {
      if (rec) { rec.stop(); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || "";
        rec = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 48000 } : undefined);
        chunks = []; rec.ondataavailable = e => e.data.size && chunks.push(e.data);
        rec.onstop = () => {
          stream.getTracks().forEach(t => t.stop()); clearInterval(timer);
          blob = new Blob(chunks, { type: rec.mimeType || mime || "audio/webm" }); rec = null;
          $m("#rRec").textContent = "⏺ Registra di nuovo"; $m("#rStat").textContent = "✅ Registrato! Ascoltalo e poi premi Salva."; paint();
        };
        const onHide = () => { if (document.hidden && rec) { rec.onstop = () => { stream.getTracks().forEach(t => t.stop()); clearInterval(timer); rec = null; $m("#rRec").textContent = "⏺ Registra"; $m("#rStat").textContent = "⏸ Registrazione annullata: hai cambiato scheda"; }; rec.stop(); } };
        document.addEventListener("visibilitychange", onHide, { once: true });
        new MutationObserver((_, o) => { if (!document.body.contains(m)) { if (rec) { try { rec.stop(); } catch {} } stream.getTracks().forEach(t => t.stop()); o.disconnect(); } }).observe(document.body, { childList: true });
        rec.start(); t0 = Date.now(); $m("#rRec").textContent = "⏹ Stop";
        timer = setInterval(() => { const s2 = Math.floor((Date.now() - t0) / 1000); $m("#rStat").innerHTML = `<span class="recdot"></span>Sto registrando… ${s2}s`; if (s2 >= 20) rec && rec.stop(); }, 250);
      } catch (e) { $m("#rStat").textContent = "⚠️ Non riesco ad accedere al microfono: consenti il permesso nel browser."; }
    };
    $m("#rPlay").onclick = () => blob && T.playURL(URL.createObjectURL(blob));
    $m("#rSaved").onclick = async () => { const u = await T.recURL(cur); if (u) T.playURL(u); };
    $m("#rSave").onclick = async () => {
      if (!blob) return; $m("#rStat").textContent = "Salvataggio…";
      const b64 = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(",")[1]); fr.readAsDataURL(blob); });
      try { const r = await host("rec", { n: cur, mime: blob.type, b64 }); st.recs = r.recs; T.setRecs(r.recs); blob = null; $m("#rStat").textContent = cur === "late" ? "💾 Salvato! I ritardatari sono avvisati 😈" : `💾 Salvato! Il ${cur} ora ha la tua voce.`; paint(); }
      catch (e) { $m("#rStat").textContent = "⚠️ " + e.message; }
    };
    $m("#rDemo").onclick = () => { m.remove(); T.prepareRec(cur); T.panariello(cur, { big: true }).then(() => T.playRec(cur)); };
    $m("#rDel").onclick = async () => { const r = await host("recdel", { n: cur }); st.recs = r.recs; T.setRecs(r.recs); $m("#rStat").textContent = "🗑️ Registrazione cancellata"; paint(); };
    paint();
  }

  // ---- il profilo del banco: anche lui è un giocatore (nome, personaggio, foto) ----
  function paintMe() {
    const b = st && st.banco; if (!b) return;
    $("#bancoMe").innerHTML = `${avatarHTML(b.av, "", b)}<span>${esc(b.name === "Il Banco" ? "Il tuo profilo" : b.name)}</span>`;
  }
  $("#bancoMe").onclick = () => openProfile();
  function openProfile() {
    const b = (st && st.banco) || {};
    let sel = b.av && b.av !== "banco" ? b.av : null, cat = sel ? (D.AVATAR_BY_ID[sel].cat) : "smorfia", b64 = undefined;
    const m = T.modal(`<h2 class="title-font">🧺 Il banco è un giocatore!</h2>
      <p class="muted" style="margin-top:0">Scegli nome, personaggio e, se vuoi, la tua foto: comparirai così nella tavolata e quando il cartellone vince.</p>
      <input class="txt" id="pfName" maxlength="24" placeholder="Il tuo nome" value="${esc(b.name && b.name !== "Il Banco" ? b.name : "")}">
      <div class="photobox" style="margin-top:12px"><div class="prev" id="pfPrev">${b.ph ? `<img src="/api/t?a=photo&id=${encodeURIComponent(b.pid)}&v=${b.ph}">` : "📷"}</div>
        <div class="btns"><button class="btn" id="pfCam">📸 Webcam</button><label class="btn ghost" style="color:var(--ink);border-color:var(--line);cursor:pointer">🖼️ Scegli foto<input type="file" accept="image/*" id="pfFile" hidden></label><button class="btn ghost" style="color:var(--red2);border-color:var(--line)" id="pfDel">✖ Togli</button></div></div>
      <div class="tabs" style="margin-top:12px">${[["smorfia", "🔢 Smorfia"], ["presepe", "🌟 Presepe"], ["moderni", "🤳 Moderni"], ["natale", "🎅 Natale"]].map(([k, l]) => `<button class="tab" data-k="${k}">${l}</button>`).join("")}</div>
      <div class="pgrid" id="pfGrid"></div>
      <div class="err" id="pfErr"></div>
      <div class="center"><button class="btn green big" id="pfSave">💾 Salva il mio profilo</button></div>`);
    const $m = q => m.querySelector(q);
    const taken = new Set(roster.filter(p => !p.banco).map(p => p.av));
    const grid = () => {
      m.querySelectorAll(".tab").forEach(t => t.classList.toggle("on", t.dataset.k === cat));
      $m("#pfGrid").innerHTML = D.AVATARS.filter(a => a.cat === cat).map(a => `<button data-id="${a.id}" class="${a.id === sel ? "sel" : ""} ${taken.has(a.id) ? "taken" : ""}">${avatarHTML(a.id)}<span>${esc(a.name)}</span></button>`).join("");
    };
    m.querySelector(".tabs").onclick = e => { const t = e.target.closest(".tab"); if (t) { cat = t.dataset.k; grid(); } };
    $m("#pfGrid").onclick = e => { const t = e.target.closest("button"); if (t) { sel = t.dataset.id; grid(); } };
    const setP = d => { b64 = d ? d.split(",")[1] : ""; $m("#pfPrev").innerHTML = d ? `<img src="${d}">` : "📷"; };
    const sq = (src, w, h, mirror) => { const c = document.createElement("canvas"); c.width = c.height = 192; const x = c.getContext("2d"), side = Math.min(w, h); if (mirror) { x.translate(192, 0); x.scale(-1, 1); } x.drawImage(src, (w - side) / 2, (h - side) / 2, side, side, 0, 0, 192, 192); return c.toDataURL("image/jpeg", .78); };
    $m("#pfFile").onchange = e => { const f = e.target.files[0]; if (!f) return; const img = new Image(); img.onload = () => setP(sq(img, img.naturalWidth, img.naturalHeight)); img.src = URL.createObjectURL(f); };
    $m("#pfDel").onclick = () => setP(null);
    $m("#pfCam").onclick = async () => {
      let stream; try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false }); } catch { return T.toast("⚠️ Webcam non disponibile: consenti il permesso"); }
      const c = T.modal(`<h2 class="title-font center">📸 Sorridi!</h2><div class="cam"><video autoplay playsinline muted></video><div class="cd"></div><div class="fl"></div></div><div class="center"><button class="btn big" id="cs">📸 Scatta</button></div>`);
      const v = c.querySelector("video"); v.srcObject = stream;
      const stop = () => stream.getTracks().forEach(t => t.stop());
      new MutationObserver((_, o) => { if (!document.body.contains(c)) { stop(); o.disconnect(); } }).observe(document.body, { childList: true });
      document.addEventListener("visibilitychange", () => { if (document.hidden) c.remove(); }, { once: true });
      c.querySelector("#cs").onclick = async () => { const cd = c.querySelector(".cd"); for (const k of ["3", "2", "1"]) { cd.textContent = k; T.sounds.pop(); await new Promise(r => setTimeout(r, 700)); } cd.textContent = ""; c.querySelector(".fl").classList.add("on"); setP(sq(v, v.videoWidth, v.videoHeight, true)); setTimeout(() => c.remove(), 450); };
    };
    $m("#pfSave").onclick = async () => {
      $m("#pfErr").textContent = "";
      try { await host("profile", { name: $m("#pfName").value.trim(), av: sel || "", b64 }); T.toast("✅ Profilo del banco salvato"); m.remove(); await refresh(); await loadRoster(); }
      catch (e) { $m("#pfErr").textContent = "😬 " + e.message; }
    };
    grid();
  }

  $("#playersBtn").onclick = async () => {
    await loadRoster();
    const m = T.modal(`<h2 class="title-font">👥 Giocatori (${roster.length})</h2><div class="plist">${roster.sort((a, b) => a.name.localeCompare(b.name)).map(p => `<div class="r">${avatarHTML(p.av, "sm", p)}<span>${esc(p.name)}</span><button data-id="${p.id}" title="Rimuovi">🗑️</button></div>`).join("") || '<p class="muted">Ancora nessuno</p>'}</div>`);
    m.querySelector(".plist").onclick = async e => {
      const b = e.target.closest("button[data-id]"); if (!b) return;
      if (!confirm("Rimuovere questo giocatore?")) return;
      await host("kick", { id: b.dataset.id }); b.parentElement.remove(); loadRoster();
    };
  };
})();
