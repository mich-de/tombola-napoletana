// Funzione Vercel: un solo endpoint /api/t?a=azione
const { handle } = require("../lib/core");
module.exports = async (req, res) => {
  try {
    let body = req.body || {};
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    const r = await handle({ method: req.method, query: req.query || {}, body });
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    if (r.cache) res.setHeader("Vercel-CDN-Cache-Control", (req.query && (req.query.a === "rec" || req.query.a === "say")) ? "max-age=31536000" : "max-age=1, stale-while-revalidate=1");
    res.status(r.status || 200).send(JSON.stringify(r.json));
  } catch (e) {
    res.status(500).json({ error: "Errore del server", detail: String(e.message || e) });
  }
};
