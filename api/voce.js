// Voce naturale del banco: sintesi vocale con AI Gateway di Vercel (ElevenLabs), con cache.
// GET /api/voce?n=33&s=1   → numero + smorfia (+ storiella se s=1)
// GET /api/voce?ev=12      → annuncio della vincita (evento della partita)
// GET /api/voce?k=start    → frasi fisse
const crypto = require("crypto");
const DATA = require("../assets/data.js");
const { getStore } = require("../lib/store");

const MODEL = process.env.TTS_MODEL || "elevenlabs/eleven-multilingual-v2";
const VOICE = process.env.TTS_VOICE || "JBFqnCBsd6RMkjVDRZzb"; // "George": voce calda da narratore
const FIXED = {
  start: "Signore e signori, si comincia! Buona fortuna a tutti quanti!",
  test: "Trentatré! Gli anni di Cristo. Benvenuti alla tombola napoletana!"
};
const clean = t => String(t).replace(/\p{Extended_Pictographic}/gu, "").replace(/(^|\s)['’]/g, "$1").replace(/['’]/g, " ").replace(/\s+/g, " ").trim();

function textFor(q, state) {
  if (q.n) {
    const n = Number(q.n); const r = DATA.SMORFIA[n - 1]; if (!r) return null;
    let t = `${DATA.numNap(n)}! ... ${n}. ${clean(r[1])}. ${clean(r[2])}.`;
    if (q.s === "1") t += " " + clean(DATA.RIME[n - 1]);
    return t;
  }
  if (q.k && FIXED[q.k]) return FIXED[q.k];
  if (q.ev && state) {
    const ev = (state.events || []).find(e => String(e.id) === String(q.ev) && e.type === "win");
    if (!ev) return null;
    const names = ev.winners.map(w => w.name);
    const who = names.length > 1 ? names.slice(0, -1).join(", ") + " e " + names[names.length - 1] : names[0];
    return clean(`${ev.label}! ${who} ${names.length > 1 ? "si spartiscono" : "vince"}: ${ev.prize}!`);
  }
  return null;
}

module.exports = async (req, res) => {
  try {
    const q = req.query || {};
    // la voce AI è facoltativa (serve AI Gateway attivo): senza TTS_ENABLED=1 si usa la voce gratuita del browser
    if (process.env.TTS_ENABLED !== "1") return res.status(404).json({ error: "voce AI non attiva" });
    const st = getStore();
    let state = null;
    if (q.ev) { const raw = await st.get("tmb:state"); state = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : null; }
    const text = textFor(q, state);
    if (!text) return res.status(400).json({ error: "testo non valido" });
    const key = "tmb:tts:" + crypto.createHash("sha1").update(MODEL + "|" + VOICE + "|" + text).digest("hex");
    let b64 = await st.get(key);
    if (!b64) {
      const token = process.env.AI_GATEWAY_API_KEY || req.headers["x-vercel-oidc-token"] || process.env.VERCEL_OIDC_TOKEN;
      if (!token) return res.status(503).json({ error: "voce non configurata" });
      const r = await fetch("https://ai-gateway.vercel.sh/v4/ai/speech-model", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token, "Content-Type": "application/json",
          "ai-gateway-protocol-version": "0.0.1", "ai-speech-model-specification-version": "4", "ai-model-id": MODEL
        },
        body: JSON.stringify({ text, voice: VOICE, outputFormat: "mp3", language: "it" })
      });
      if (!r.ok) return res.status(502).json({ error: "sintesi non riuscita", detail: (await r.text()).slice(0, 300) });
      const j = await r.json();
      b64 = j.audio && (typeof j.audio === "string" ? j.audio : j.audio.base64 || j.audio.data);
      if (!b64) return res.status(502).json({ error: "audio mancante", detail: JSON.stringify(j).slice(0, 300) });
      await st.set(key, b64);
    }
    const buf = Buffer.from(b64, "base64");
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Vercel-CDN-Cache-Control", "max-age=31536000, immutable");
    res.status(200).send(buf);
  } catch (e) {
    res.status(500).json({ error: "errore voce", detail: String(e.message || e) });
  }
};
