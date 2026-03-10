const { signSession } = require("./utils");

// SET YOUR LOGIN HERE
const PORTAL_USERNAME = "kason@highlandsteel.homes";
const PORTAL_PASSWORD = "Memphis";
const SESSION_SECRET = "super-secret-random-string";

exports.handler = async (event) => {

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed"
    };
  }

  try {

    const { username, password } = JSON.parse(event.body);

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
        "Set-Cookie": `portal_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/`
      },
      body: JSON.stringify({ ok: true })
    };

  } catch (error) {

    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        message: "Bad request",
        error: error.message
      })
    };

  }
};
