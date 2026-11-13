// Server locale senza dipendenze: node tools/local-server.js  →  http://localhost:3000
// Utile per provare la tombola o per farla girare su un PC dell'ufficio.
const ROOT = require("path").join(__dirname, "..");
const http = require("http"), fs = require("fs"), path = require("path");
const { handle } = require("../lib/core");
const PORT = process.env.PORT || 3000;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json" };
http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname === "/api/t") {
    let raw = ""; for await (const c of req) raw += c;
    let body = {}; try { body = raw ? JSON.parse(raw) : {}; } catch {}
    try {
      const r = await handle({ method: req.method, query: Object.fromEntries(u.searchParams), body });
      if (r.binary) { res.writeHead(200, { "Content-Type": r.type, "Cache-Control": "max-age=86400" }); return res.end(r.binary); }
      res.writeHead(r.status || 200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      res.end(JSON.stringify(r.json));
    } catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: String(e) })); }
    return;
  }
  let p = u.pathname === "/" ? "/index.html" : u.pathname === "/banco" ? "/banco.html" : u.pathname;
  const f = path.join(ROOT, path.normalize(p).replace(/^(\.\.[\/\\])+/, ""));
  if (!f.startsWith(ROOT) || /[\/\\](lib|api|node_modules)[\/\\]/.test(f) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("Non trovato"); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log("Tombola su http://localhost:" + PORT + "  (banco: /banco)"));
