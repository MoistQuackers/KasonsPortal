const { signSession } = require("./utils");

const PORTAL_USERNAME = "Kason";
const PORTAL_PASSWORD = "Memphis";
const SESSION_SECRET = "super-secret-random-string-123";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "Method Not Allowed" })
    };
  }

  let body = {};

  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (error) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        message: "Request body is not valid JSON",
        rawBody: event.body || null
      })
    };
  }

  const username = (body.username || "").trim();
  const password = body.password || "";

  if (!username || !password) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        message: "Username or password missing",
        receivedBody: body
      })
    };
  }

  if (username !== PORTAL_USERNAME || password !== PORTAL_PASSWORD) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        message: "Invalid credentials"
      })
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
};
