exports.handler = async () => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": "portal_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
    },
    body: JSON.stringify({ ok: true })
  };
};
