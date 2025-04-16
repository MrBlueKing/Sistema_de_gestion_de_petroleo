export const storeSession = ({ token, user }) => {
    const expiration = Date.now() + 24 * 60 * 60 * 1000; // 24h
    const sessionData = {
      token,
      user,
      expiration,
      role: user.rol || "desconocido",
    };
    localStorage.setItem("authToken", JSON.stringify(sessionData));
  };
  