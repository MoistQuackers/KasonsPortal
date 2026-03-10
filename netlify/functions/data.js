const { parseCookies, verifySession, unauthorized } = require("./utils");

exports.handler = async (event) => {
  const GOOGLE_APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwjl4my3umNLqvnZgYMsJD5CpbzRBn6-CLKP0LUmgy-4ekR4vXShXtnwpCuejLNSyEnWw/exec";

  const SESSION_SECRET = "super-secret-random-string-123";

  const cookies = parseCookies(event.headers.cookie || "");
  const session = verifySession(cookies.portal_session || "", SESSION_SECRET);

  if (!session) return unauthorized();

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL);
    const data = await response.json();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        message: "Failed to fetch sheet data",
        error: error.message
      })
    };
  }
};
