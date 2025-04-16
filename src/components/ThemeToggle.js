import React, { useContext } from "react";
import { ThemeContext } from "../contexts/ThemeContext";

export default function ThemeToggle() {
  const { darkMode, toggleTheme } = useContext(ThemeContext);

  return (
    <div className="toggle-container">
      <span className="icon">☀️</span>
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={darkMode}
          onChange={toggleTheme}
          aria-label="Toggle dark mode"
        />
        <span className="toggle-slider"></span>
      </label>
      <span className="icon">🌙</span>
    </div>
  );
}
