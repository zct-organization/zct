import React, { createContext, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);

  const login = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, loading, setLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
