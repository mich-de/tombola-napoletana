/* Tombola Napoletana – schermata del giocatore
   Un'idea di Michele De Angelis · mdeangelis.me */
(function () {
  const { D, $, esc, smorfia, LEVEL, api, avatarHTML } = T;
  const LS = "tmb_me";
  let me = null, st = null, seenSeq = null, lastDrawnLen = -1, roster = [], selAv = null, cat = "smorfia";
  let voice = false, polling = false, lastReact = 0;
  const seenReacts = new Set(); const loadTime = Date.now();

  T.snow();
  $("#credits").innerHTML = T.creditsHTML();

  // ---------- splash ----------
  $("#enter").onclick = async () => {
    T.audio(); T.sounds.draw();
    $("#splash").style.transition = "opacity .5s, transform .5s";
    $("#splash").style.opacity = 0; $("#splash").style.transform = "scale(1.1)";
    setTimeout(() => $("#splash").remove(), 500);
    const saved = JSON.parse(localStorage.getItem(LS) || "null");
    if (saved && saved.id) {
      try { me = { ...saved, ...(await api("me", null, `&id=${encodeURIComponent(saved.id)}&tk=${encodeURIComponent(saved.tk)}`)) }; return startGame(); }
      catch (e) { if (e.data && e.data.error === "setup") return setupError(e); localStorage.removeItem(LS); }
    }
    openJoin();
  };

  function setupError(e) { document.querySelector(".wrap").innerHTML = `<div class="card-box"><h3>Quasi pronti!</h3><p>${esc(e.message)}</p></div>`; }

  // ---------- iscrizione ----------
  const CATS = [["smorfia", "🔢 Smorfia (90)"], ["presepe", "🌟 Presepe e folklore"], ["moderni", "🤳 Pastori moderni"], ["natale", "🎅 Natale"]];
  $("#tabs").innerHTML = CATS.map(([k, l]) => `<button class="tab" data-k="${k}">${l}</button>`).join("");
  $("#tabs").onclick = e => { const b = e.target.closest(".tab"); if (!b) return; cat = b.dataset.k; $("#search").value = ""; renderGrid(); };
  $("#search").oninput = renderGrid;

  async function loadRoster() { try { roster = (await api("roster")).players; } catch (e) { if (e.data && e.data.error === "setup") setupError(e); } }
  let rosterTimer;
  async function openJoin() {
    $("#game").classList.add("hidden"); $("#reactbar").classList.add("hidden");
    $("#join").classList.remove("hidden");
    if (me) { $("#name").value = me.name; selAv = me.av; cat = D.AVATAR_BY_ID[me.av]?.cat || "smorfia"; }
    await loadRoster(); renderGrid();
    clearInterval(rosterTimer); rosterTimer = setInterval(async () => { if ($("#join").classList.contains("hidden")) return clearInterval(rosterTimer); await loadRoster(); renderGrid(); }, 5000);
    if (!me) setTimeout(() => $("#name").focus(), 300);
  }
  function renderGrid() {
    const q = $("#search").value.trim().toLowerCase();
    const taken = new Set(roster.filter(p => !me || p.id !== me.id).map(p => p.av));
    document.querySelectorAll(".tab").forEach(t => t.classList.toggle("on", !q && t.dataset.k === cat));
    const list = D.AVATARS.filter(a => q ? (String(a.num || "") === q || (a.name + " " + a.sub).toLowerCase().includes(q)) : a.cat === cat);
    $("#avgrid").innerHTML = list.map(a => `<button class="avopt ${taken.has(a.id) ? "taken" : ""} ${selAv === a.id ? "sel" : ""}" data-id="${a.id}">
      ${avatarHTML(a.id)}<span>${esc(a.name)}</span><small>${esc(a.sub)}</small></button>`).join("") || `<p class="muted">Nessun personaggio trovato</p>`;
  }
  $("#avgrid").onclick = e => { const b = e.target.closest(".avopt"); if (!b) return; selAv = b.dataset.id; T.sounds.pop(); renderGrid(); };
  $("#joinBtn").onclick = async () => {
    const name = $("#name").value.trim();
    $("#joinErr").textContent = "";
    if (!name) return $("#joinErr").textContent = "✋ Scrivi il tuo nome";
    if (!selAv) return $("#joinErr").textContent = "✋ Scegli un personaggio";
    $("#joinBtn").disabled = true;
    try {
      const r = await api("join", { name, av: selAv, id: me?.id, tk: me?.tk });
      me = r; localStorage.setItem(LS, JSON.stringify({ id: r.id, tk: r.tk }));
      T.confetti(80, .5); T.sounds.win(0);
      startGame();
    } catch (e) {
      $("#joinErr").textContent = "😬 " + e.message;
      if (e.status === 409) { await loadRoster(); renderGrid(); }
    } finally { $("#joinBtn").disabled = false; }
  };

  // ---------- gioco ----------
  function startGame() {
    $("#join").classList.add("hidden"); $("#game").classList.remove("hidden"); $("#reactbar").classList.remove("hidden");
    renderMe(); renderCard();
    if (!polling) { polling = true; poll(); }
  }
  function renderMe() {
    const a = D.AVATAR_BY_ID[me.av];
    $("#meAv").innerHTML = avatarHTML(me.av);
    $("#meName").textContent = me.name;
    $("#meSub").textContent = a ? (a.num ? `${a.num} · ${a.name}` : a.name) : "";
  }
  $("#changeBtn").onclick = openJoin;
  $("#infoBtn").onclick = T.infoModal;
  $("#voiceBtn").onclick = () => { voice = !voice; $("#voiceBtn").textContent = voice ? "🔊" : "🔇"; T.toast(voice ? "Voce attiva: leggerò i numeri" : "Voce spenta"); if (voice) T.speak("Voce attiva"); };

  $("#reactbar").innerHTML = D.REACTIONS.map(e => `<button data-e="${e}">${e}</button>`).join("");
  $("#reactbar").onclick = async ev => {
    const b = ev.target.closest("button"); if (!b || !me) return;
    if (Date.now() - lastReact < 1200) return; lastReact = Date.now();
    T.floater(b.dataset.e, me.name);
    try { await api("react", { id: me.id, tk: me.tk, e: b.dataset.e }); } catch {}
  };

  async function poll() {
    try {
      const s = await api("state");
      onState(s);
    } catch (e) { if (e.data && e.data.error === "setup") return setupError(e); }
    setTimeout(poll, document.hidden ? 5000 : 2000);
  }

  async function onState(s) {
    const prev = st; st = s;
    if (me && s.game !== me.cardGame) {
      try { me = { ...me, ...(await api("me", null, `&id=${encodeURIComponent(me.id)}&tk=${encodeURIComponent(me.tk)}`)) }; lastDrawnLen = -1; }
      catch (e) { if (e.status === 404 || e.status === 403) { localStorage.removeItem(LS); me = null; return openJoin(); } }
    }
    // eventi (vincite, inizio, fine)
    if (seenSeq === null) seenSeq = s.seq || 0;
    for (const ev of (s.events || []).filter(e => e.id > seenSeq)) {
      if (ev.type === "win") T.showWin(ev, { me: me?.id, speak: voice });
      if (ev.type === "start") { T.toast("🎲 Si comincia! Buona fortuna"); T.confetti(60); }
      if (ev.type === "newgame") T.toast("🔄 Nuova partita: ecco la tua nuova cartella!");
      if (ev.type === "over") T.toast("🏁 Partita finita! Grazie a tutti");
    }
    seenSeq = Math.max(seenSeq, s.seq || 0);
    // reazioni degli altri
    let shown = 0;
    for (const r of [...(s.reacts || [])].reverse()) {
      if (seenReacts.has(r.i)) continue; seenReacts.add(r.i);
      if (r.t < loadTime - 3000 || (me && r.p === me.id) || shown > 8) continue;
      shown++; setTimeout(() => T.floater(r.e, r.n), shown * 180);
    }
    T.updateReactCounts(s.reacts || []);
    render(prev);
  }

  function render(prev) {
    const s = st;
    const ph = { lobby: ["In attesa", ""], playing: ["In gioco", "live"], tombolino: ["Tombolino!", "tl"], over: ["Finita", "over"] }[s.phase] || ["", ""];
    $("#phase").textContent = `P.${s.game} · ${ph[0]}`; $("#phase").className = "pill " + ph[1];
    const w = $("#waitMsg");
    if (s.phase === "lobby") { w.innerHTML = `⏳ La partita ${s.game} sta per iniziare<span class="dots"></span> · ${s.count} giocatori iscritti`; w.classList.remove("hidden"); }
    else if (s.phase === "over") { w.innerHTML = `🏁 Partita finita! Aspetta che il banco ne avvii un'altra<span class="dots"></span>`; w.classList.remove("hidden"); }
    else w.classList.add("hidden");

    // ultimo estratto
    const d = s.drawn || [];
    if (d.length !== lastDrawnLen) {
      const isNew = lastDrawnLen >= 0 && d.length > lastDrawnLen;
      lastDrawnLen = d.length;
      const n = d[d.length - 1];
      const ball = $("#bigball");
      if (n) {
        const sm = smorfia(n);
        ball.textContent = n; ball.classList.remove("anim"); void ball.offsetWidth; ball.classList.add("anim");
        $("#meaning").innerHTML = `<b>${sm.e} ${esc(sm.nap)}</b><i>${esc(sm.it)} · ${d.length}° estratto · ne mancano ${90 - d.length}</i>`;
        $("#story").textContent = sm.story; $("#story").classList.remove("hidden");
        if (isNew) {
          T.sounds.draw();
          if (voice) T.speak(`${n}. ${sm.nap}`);
          if (me && me.card.flat().includes(n)) { T.confetti(25, .55); if (navigator.vibrate) navigator.vibrate(80); }
        }
      } else {
        ball.textContent = "–";
        $("#meaning").innerHTML = `<b>In attesa…</b><i>Il banco sta per iniziare</i>`;
        $("#story").classList.add("hidden");
      }
      $("#prev").innerHTML = d.slice(-8, -1).reverse().map(x => `<span title="${esc(smorfia(x).nap)}">${x}</span>`).join("");
      renderCard();
    }
    renderPrizes();
  }

  function renderCard() {
    if (!me || !me.card) return;
    const set = new Set(st?.drawn || []);
    $("#cartella").innerHTML = `<span class="tag">LA TUA CARTELLA</span><table>${me.card.map(r => `<tr>${r.map(n => n ? `<td class="${set.has(n) ? "hit" : ""}">${n}</td>` : `<td class="e"></td>`).join("")}</tr>`).join("")}</table>`;
    const rows = me.card.map(r => r.filter(n => n && set.has(n)).length);
    const tot = rows.reduce((a, b) => a + b, 0), best = Math.max(...rows);
    const pz = st?.prizes || {};
    let hint = "";
    if (st && (st.phase === "playing" || st.phase === "tombolino")) {
      const next = D.LEVELS.find(l => !pz[l.key]);
      if (next) {
        const miss = next.need <= 5 ? next.need - best : 15 - tot;
        if (miss === 1) hint = `🔥 Ti manca UN numero per ${next.label.toLowerCase()}!`;
        else if (miss > 1 && miss <= 3) hint = `👀 Ti mancano ${miss} numeri per ${next.label.toLowerCase()}`;
        else if (miss <= 0) hint = `😅 Ci sei arrivato anche tu, ma qualcuno è stato più veloce`;
      }
    }
    $("#hint").innerHTML = `${hint}<div class="rowinfo"><span>Righe: ${rows.join(" · ")}</span><span>Segnati ${tot}/15</span></div>`;
  }

  function renderPrizes() {
    const pz = st.prizes || {};
    const next = D.LEVELS.find(l => !pz[l.key]);
    $("#prizes").innerHTML = D.LEVELS.map(l => {
      const p = pz[l.key];
      if (!p) return `<div class="prz ${next && next.key === l.key && st.phase !== "lobby" ? "next" : ""}"><span class="lv">${l.label}</span><span class="who muted">${next && next.key === l.key ? "in palio adesso…" : "in palio"}</span></div>`;
      const mine = me && p.winners.some(w => w.id === me.id);
      return `<div class="prz done"><span class="lv">${l.label}</span><span class="avs">${p.winners.slice(0, 4).map(w => avatarHTML(w.av, "sm")).join("")}</span>
        <span class="who"><b>${esc(p.winners.map(w => w.name).join(", "))}</b>${mine ? " 🥳" : ""}<br><span class="muted">${esc(p.prize)}</span></span></div>`;
    }).join("");
  }
})();
