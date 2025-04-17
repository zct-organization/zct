import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("jwt") || "");
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null")
  );
  const [loading, setLoading] = useState(false);

  const login = ({ token: t, user: u }) => {
    setToken(t);
    setUser(u);
    localStorage.setItem("jwt", t);
    localStorage.setItem("user", JSON.stringify(u));
  };

  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("jwt");
    localStorage.removeItem("user");
  };

  useEffect(() => {
    if (!token) logout();
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, loading, setLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
