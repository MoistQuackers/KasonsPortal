const { signSession } = require("./utils");

const PORTAL_USERNAME = "portal";
const PORTAL_PASSWORD = "password123";
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
        message: "Invalid JSON body"
      })
    };
  }

  const username = String(body.username || "").trim();
  const password = String(body.password || "");

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
      "Set-Cookie": `portal_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800`
    },
    body: JSON.stringify({ ok: true })
  };
};
