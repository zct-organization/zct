import React, { useContext, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "./contexts/AuthContext";
import ThemeToggle from "./components/ThemeToggle";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import ChatPage from "./components/Chat/ChatPage";

export default function App() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate("/chat", { replace: true });
    }
  }, [token, navigate]);

  return (
    <>
      <ThemeToggle />
      <Routes>
        <Route
          path="/"
          element={<Navigate to={token ? "/chat" : "/login"} replace />}
        />

        <Route
          path="/login"
          element={!token ? <Login /> : <Navigate to="/chat" replace />}
        />
        <Route
          path="/signup"
          element={!token ? <Signup /> : <Navigate to="/chat" replace />}
        />

        <Route
          path="/chat"
          element={token ? <ChatPage /> : <Navigate to="/login" replace />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
