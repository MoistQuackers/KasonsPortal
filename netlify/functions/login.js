const { signSession } = require("./utils");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { PORTAL_USERNAME, PORTAL_PASSWORD, SESSION_SECRET } = process.env;

  if (!PORTAL_USERNAME || !PORTAL_PASSWORD || !SESSION_SECRET) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "Missing environment variables" })
    };
  }

  try {
    const { username, password } = JSON.parse(event.body || "{}");

    if (username !== PORTAL_USERNAME || password !== PORTAL_PASSWORD) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: false, message: "Invalid credentials" })
      };
    }

    const token = signSession(username, SESSION_SECRET);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `portal_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`
      },
      body: JSON.stringify({ ok: true })
    };
  } catch {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "Bad request" })
    };
  }
};
