// Archivio dati: Upstash Redis via REST (su Vercel) oppure memoria (server locale).
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

function redisStore() {
  async function cmd(args) {
    const r = await fetch(URL_, {
      method: "POST",
      headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify(args)
    });
    const j = await r.json();
    if (j.error) throw new Error("Redis: " + j.error);
    return j.result;
  }
  async function pipe(list) {
    if (!list.length) return [];
    const r = await fetch(URL_.replace(/\/$/, "") + "/pipeline", {
      method: "POST",
      headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify(list)
    });
    const j = await r.json();
    return j.map(x => { if (x.error) throw new Error("Redis: " + x.error); return x.result; });
  }
  const pairs = arr => { const o = {}; for (let i = 0; arr && i < arr.length; i += 2) o[arr[i]] = arr[i + 1]; return o; };
  return {
    kind: "redis",
    get: k => cmd(["GET", k]),
    set: (k, v) => cmd(["SET", k, v]),
    lock: async (k, ms) => (await cmd(["SET", k, "1", "NX", "PX", String(ms)])) === "OK",
    unlock: k => cmd(["DEL", k]),
    hget: (k, f) => cmd(["HGET", k, f]),
    hgetall: async k => pairs(await cmd(["HGETALL", k])),
    hset: (k, f, v) => cmd(["HSET", k, f, v]),
    hmset: (k, obj) => { const a = ["HSET", k]; for (const [f, v] of Object.entries(obj)) a.push(f, v); return a.length > 2 ? cmd(a) : 0; },
    hsetnx: async (k, f, v) => (await cmd(["HSETNX", k, f, v])) === 1,
    hdel: (k, f) => cmd(["HDEL", k, f]),
    hlen: k => cmd(["HLEN", k]),
    pushTrim: (k, v, max) => pipe([["LPUSH", k, v], ["LTRIM", k, "0", String(max - 1)]]),
    lrange: (k, a, b) => cmd(["LRANGE", k, String(a), String(b)]),
    del: (...ks) => cmd(["DEL", ...ks])
  };
}

function memoryStore() {
  const kv = new Map(), h = new Map(), l = new Map(), locks = new Map();
  const H = k => { if (!h.has(k)) h.set(k, new Map()); return h.get(k); };
  return {
    kind: "memory",
    get: async k => kv.has(k) ? kv.get(k) : null,
    set: async (k, v) => { kv.set(k, v); return "OK"; },
    lock: async (k, ms) => { const t = locks.get(k); if (t && t > Date.now()) return false; locks.set(k, Date.now() + ms); return true; },
    unlock: async k => { locks.delete(k); },
    hget: async (k, f) => H(k).has(f) ? H(k).get(f) : null,
    hgetall: async k => Object.fromEntries(H(k)),
    hset: async (k, f, v) => { H(k).set(f, v); return 1; },
    hmset: async (k, obj) => { for (const [f, v] of Object.entries(obj)) H(k).set(f, v); },
    hsetnx: async (k, f, v) => { if (H(k).has(f)) return false; H(k).set(f, v); return true; },
    hdel: async (k, f) => { H(k).delete(f); },
    hlen: async k => H(k).size,
    pushTrim: async (k, v, max) => { const a = l.get(k) || []; a.unshift(v); l.set(k, a.slice(0, max)); },
    lrange: async (k, a, b) => (l.get(k) || []).slice(a, b + 1),
    del: async (...ks) => ks.forEach(k => { kv.delete(k); h.delete(k); l.delete(k); })
  };
}

let store;
function getStore() {
  if (!store) store = (URL_ && TOKEN) ? redisStore() : memoryStore();
  return store;
}
module.exports = { getStore, hasRedis: () => !!(URL_ && TOKEN) };
