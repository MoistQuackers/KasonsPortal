const crypto = require("crypto");

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((acc, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

function signSession(username, secret) {
  const sig = crypto.createHmac("sha256", secret).update(username).digest("hex");
  return Buffer.from(`${username}.${sig}`).toString("base64url");
}

function verifySession(token, secret) {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [username, sig] = decoded.split(".");
    if (!username || !sig) return null;

    const expected = crypto.createHmac("sha256", secret).update(username).digest("hex");
    if (sig !== expected) return null;

    return { username };
  } catch {
    return null;
  }
}

function unauthorized() {
  return {
    statusCode: 401,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: false, message: "Unauthorized" })
  };
}

module.exports = {
  parseCookies,
  signSession,
  verifySession,
  unauthorized
};
