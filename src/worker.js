const enc = new TextEncoder();

const toHex = (buf) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const fromHex = (h) => new Uint8Array(h.match(/.{2}/g).map((x) => parseInt(x, 16)));
const randomHex = (n) => toHex(crypto.getRandomValues(new Uint8Array(n)));

async function sha256(text) {
  return toHex(await crypto.subtle.digest("SHA-256", enc.encode(text)));
}

async function hashPassword(password, saltHex) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: fromHex(saltHex), iterations: 100000 },
    key,
    256
  );
  return toHex(bits);
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function getCookie(request, name) {
  const m = (request.headers.get("Cookie") || "").match(new RegExp("(?:^|; )" + name + "=([^;]+)"));
  return m ? m[1] : null;
}

async function createSession(env, userId) {
  const token = randomHex(32);
  const tokenHash = await sha256(token);
  await env.DB.prepare(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', '+7 days'))"
  ).bind(tokenHash, userId).run();
  return `ep_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`;
}

async function getUser(request, env) {
  const token = getCookie(request, "ep_session");
  if (!token) return null;
  const tokenHash = await sha256(token);
  return await env.DB.prepare(
    "SELECT u.id, u.username, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > datetime('now')"
  ).bind(tokenHash).first();
}

async function readBody(request) {
  try { return await request.json(); } catch { return {}; }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (!path.startsWith("/api/")) return env.ASSETS.fetch(request);

    // Is there at least one user yet?
    if (path === "/api/status" && request.method === "GET") {
      const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM users").first();
      return json({ hasUsers: row.n > 0 });
    }

    // Create the first (owner) account. Only works while there are no users.
    if (path === "/api/setup" && request.method === "POST") {
      const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM users").first();
      if (row.n > 0) return json({ error: "Setup already done" }, 403);

      const { username, password } = await readBody(request);
      if (!username || username.trim().length < 3) return json({ error: "Username must be at least 3 characters" }, 400);
      if (!password || password.length < 8) return json({ error: "Password must be at least 8 characters" }, 400);

      const salt = randomHex(16);
      const hash = await hashPassword(password, salt);
      const res = await env.DB.prepare(
        "INSERT INTO users (username, password_hash, salt, role) VALUES (?, ?, ?, 'owner')"
      ).bind(username.trim().toLowerCase(), hash, salt).run();

      const cookie = await createSession(env, res.meta.last_row_id);
      return json({ ok: true }, 200, { "Set-Cookie": cookie });
    }

    if (path === "/api/login" && request.method === "POST") {
      const { username, password } = await readBody(request);
      if (!username || !password) return json({ error: "Enter username and password" }, 400);

      const user = await env.DB.prepare("SELECT * FROM users WHERE username = ?")
        .bind(username.trim().toLowerCase()).first();

      // Same error for "no such user" and "wrong password"
      const salt = user ? user.salt : randomHex(16);
      const hash = await hashPassword(password, salt);
      if (!user || !safeEqual(hash, user.password_hash)) {
        return json({ error: "Wrong username or password" }, 401);
      }

      const cookie = await createSession(env, user.id);
      return json({ ok: true, role: user.role }, 200, { "Set-Cookie": cookie });
    }

    if (path === "/api/logout" && request.method === "POST") {
      const token = getCookie(request, "ep_session");
      if (token) {
        await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
      }
      return json({ ok: true }, 200, {
        "Set-Cookie": "ep_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
      });
    }

    if (path === "/api/me" && request.method === "GET") {
      const user = await getUser(request, env);
      if (!user) return json({ error: "Not logged in" }, 401);
      return json({ username: user.username, role: user.role });
    }

    return json({ error: "Not found" }, 404);
  },
};
