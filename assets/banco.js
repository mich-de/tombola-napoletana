/* Tombola Napoletana – cartellone del banco
   Un'idea di Michele De Angelis · mdeangelis.me */
(function () {
  const { D, $, esc, smorfia, api, avatarHTML } = T;
  let animating = false;
  let pin = sessionStorage.getItem("tmb_pin") || "";
  let st = null, seenSeq = null, lastLen = -1, auto = false, busy = false, lastDrawLocal = 0, voice = true, story = true, roster = [];
  const seenReacts = new Set(); const loadTime = Date.now();
  let overlayUntil = 0;

  T.snow();
  document.querySelectorAll(".credits").forEach(c => c.innerHTML = T.creditsHTML());
  const host = (op, extra = {}) => api("host", { pin, op, ...extra });

  // ---------- PIN ----------
  async function tryPin(p) {
    pin = p;
    try { await host("check"); sessionStorage.setItem("tmb_pin", p); boot(); return true; }
    catch (e) { $("#pinErr").textContent = e.data && e.data.error === "setup" ? e.message : "PIN errato"; return false; }
  }
  $("#pinBtn").onclick = () => { T.audio(); tryPin($("#pin").value.trim()); };
  $("#pin").onkeydown = e => { if (e.key === "Enter") $("#pinBtn").click(); };
  if (pin) tryPin(pin);

  function boot() {
    $("#pinBox").classList.add("hidden"); $("#banco").classList.remove("hidden");
    const url = location.origin + "/";
    $("#url").textContent = url.replace(/^https?:\/\//, "");
    $("#qr").src = "https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=" + encodeURIComponent(url);
    $("#qr").onerror = () => $("#qr").remove();
    // 6 cartelle: 2 colonne × 3 file, ognuna 3 righe × 5 numeri (come il cartellone vero)
    let html = "";
    for (let b = 0; b < 6; b++) {
      const br = Math.floor(b / 2), bc = b % 2;
      html += `<div class="blk">`;
      for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
        const n = (br * 3 + r) * 10 + bc * 5 + c + 1, sm = smorfia(n);
        html += `<div class="cell" data-n="${n}" title="${n} · ${esc(sm.nap)} (${esc(sm.it)})"><span class="nn">${n}</span><span class="ee">${sm.e}</span><span class="tt">${esc(sm.nap)}</span></div>`;
      }
      html += `</div>`;
    }
    $("#tab90").innerHTML = html;
    fillVoices(); document.addEventListener("voices", fillVoices);
    prewarm();
    host("getconfig").then(r => { $("#interval").value = r.config.interval; $("#intervalV").textContent = r.config.interval + " s"; }).catch(() => {});
    poll(); setInterval(loadRoster, 6000); loadRoster(); setInterval(autoTick, 500);
  }

  // ---------- stato ----------
  async function refresh() { try { onState(await api("state", null, "&h=1&t=" + Date.now())); } catch {} }
  async function poll() { await refresh(); setTimeout(poll, 1200); }
  async function loadRoster() { try { roster = (await api("roster", null, "&h=1&t=" + Date.now())).players; renderBoard(); } catch {} }

  function onState(s) {
    st = s;
    if (seenSeq === null) seenSeq = s.seq || 0;
    for (const ev of (s.events || []).filter(e => e.id > seenSeq)) {
      if (ev.type === "win") {
        const extra = ev.verdict ? (ev.verdict.mode === "wheel" ? 13000 : 7000) : 0;
        overlayUntil = Date.now() + (["tombola", "tombolino"].includes(ev.level) ? 13000 : 9000) + extra;
        setTimeout(() => T.showWin(ev, { speak: voice, stay: true }), 2000);
        loadRoster();
      }
      if (ev.type === "over") { auto = false; renderAuto(); T.toast("🏁 Partita finita!"); }
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
    const ph = { lobby: ["Iscrizioni aperte", ""], playing: ["In gioco", "live"], tombolino: ["Caccia al tombolino", "tl"], over: ["Partita finita", "over"] }[s.phase];
    $("#phase").textContent = ph[0]; $("#phase").className = "pill " + ph[1];
    $("#sGame").textContent = s.game; $("#sCount").textContent = s.count; $("#sDrawn").textContent = d.length + "/90";
    $("#startBtn").classList.toggle("hidden", s.phase !== "lobby");
    $("#bancoBtn").textContent = "🧺 Il banco gioca: " + (s.bancoPlays ? "sì" : "no");
    const playing = s.phase === "playing" || s.phase === "tombolino";
    $("#drawBtn").disabled = !playing || busy; $("#autoBtn").disabled = !playing;

    if (d.length !== lastLen) {
      const isNew = lastLen >= 0 && d.length > lastLen; lastLen = d.length;
      const n = d[d.length - 1];
      if (n && isNew) {
        animating = true;
        if (voice) T.prepareNumber(n, story);
        T.panariello(n, { big: true }).then(() => { showNumber(n, d); animating = false; if (voice) { speechSynthesis.cancel(); T.callNumber(n, story); } });
      } else showNumber(n, d);
    }
    const pz = s.prizes || {}; const next = D.LEVELS.find(l => !pz[l.key]);
    $("#prizes").innerHTML = D.LEVELS.map(l => {
      const p = pz[l.key];
      if (!p) return `<div class="prz ${next && next.key === l.key && playing ? "next" : ""}"><span class="lv">${l.label}</span><span class="who muted">${next && next.key === l.key && playing ? "in palio adesso…" : "in palio"}</span></div>`;
      return `<div class="prz done"><span class="lv">${l.label}</span><span class="avs">${p.winners.slice(0, 4).map(w => avatarHTML(w.av, "sm")).join("")}</span>
        <span class="who"><b>${esc(p.winners.map(w => w.name).join(", "))}</b><br><span class="muted">${esc(p.prize)} · al ${p.draw}° numero</span></span></div>`;
    }).join("");
  }

  function showNumber(n, d) {
    document.querySelectorAll("#tab90 .cell").forEach(el => { const k = +el.dataset.n; el.className = "cell" + (d.includes(k) ? (k === n ? " last" : " on") : ""); });
    if (n) {
      const sm = smorfia(n);
      $("#bb").textContent = n; $("#bb").classList.remove("anim"); void $("#bb").offsetWidth; $("#bb").classList.add("anim");
      $("#fig").textContent = sm.e; $("#nap").textContent = sm.nap; $("#it").textContent = sm.it;
      $("#story").textContent = sm.story;
    } else {
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
    $("#voiceSel").innerHTML = vs.length ? vs.map(v => `<option ${best && v.name === best.name ? "selected" : ""}>${esc(v.name)}</option>`).join("") : `<option>Nessuna voce italiana nel browser</option>`;
  }

  function renderBoard() {
    const w = roster.filter(p => p.wins.length).sort((a, b) => b.wins.length - a.wins.length).slice(0, 15);
    $("#board").innerHTML = w.length ? w.map((p, i) => `<div class="r">${i < 3 ? ["🥇", "🥈", "🥉"][i] : `<span style="width:22px;text-align:center">${i + 1}</span>`}${avatarHTML(p.av, "sm")}<b>${esc(p.name)}</b><span>${p.wins.map(x => T.LEVEL[x.k]?.label[0] || "").join("")} · ${p.wins.length}</span></div>`).join("") : `<span class="muted">Ancora nessun vincitore</span>`;
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
    if (animating || speechSynthesis.speaking || Date.now() < overlayUntil || document.querySelector(".overlay")) return;
    const iv = (+$("#interval").value || 12) * 1000;
    if (Date.now() - lastDrawLocal >= iv) draw();
  }
  function renderAuto() { $("#autoBtn").textContent = auto ? "⏸ Pausa" : "⏯ Automatico"; $("#autoBtn").classList.toggle("auto-on", auto); }
  $("#drawBtn").onclick = draw;
  $("#autoBtn").onclick = () => { auto = !auto; if (auto) lastDrawLocal = 0; renderAuto(); };
  $("#startBtn").onclick = async () => { await host("start"); T.confetti(120); T.announce("k=start", "Si comincia! Buona fortuna a tutti quanti!"); await refresh(); };
  $("#voiceBtn").onclick = () => { voice = !voice; $("#voiceBtn").textContent = "🔊 Voce: " + (voice ? "sì" : "no"); if (!voice) speechSynthesis.cancel(); };
  $("#storyBtn").onclick = () => { story = !story; $("#storyBtn").textContent = "📜 Storiella: " + (story ? "sì" : "no"); };
  $("#bancoBtn").onclick = async () => { await host("config", { config: { bancoPlays: !st.bancoPlays } }); await refresh(); };
  $("#voiceSel").onchange = () => T.setVoice($("#voiceSel").value);
  $("#voiceTest").onclick = () => { speechSynthesis.cancel(); T.announce("k=test", "Trentatré! Gli anni di Cristo."); };
  $("#interval").oninput = () => { $("#intervalV").textContent = $("#interval").value + " s"; };
  $("#interval").onchange = () => host("config", { config: { interval: +$("#interval").value } }).catch(() => {});
  $("#newBtn").onclick = async () => {
    if (st && (st.phase === "playing" || st.phase === "tombolino") && !confirm("La partita è ancora in corso. Vuoi davvero iniziarne una nuova?")) return;
    auto = false; renderAuto(); await host("newgame"); lastLen = -1; T.toast("🔄 Nuova partita: cartelle nuove per tutti"); await refresh();
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
  $("#playersBtn").onclick = async () => {
    await loadRoster();
    const m = T.modal(`<h2 class="title-font">👥 Giocatori (${roster.length})</h2><div class="plist">${roster.sort((a, b) => a.name.localeCompare(b.name)).map(p => `<div class="r">${avatarHTML(p.av, "sm")}<span>${esc(p.name)}</span><button data-id="${p.id}" title="Rimuovi">🗑️</button></div>`).join("") || '<p class="muted">Ancora nessuno</p>'}</div>`);
    m.querySelector(".plist").onclick = async e => {
      const b = e.target.closest("button[data-id]"); if (!b) return;
      if (!confirm("Rimuovere questo giocatore?")) return;
      await host("kick", { id: b.dataset.id }); b.parentElement.remove(); loadRoster();
    };
  };
})();
