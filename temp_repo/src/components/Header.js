import React from "react";

export default function Header({
  search,
  setSearch,
  showHistory,
  setShowHistory,
  theme,
  setTheme,
}) {
  return (
    <header className="header">
      <h1>Money Tracker</h1>
      <div className="header-controls">
        <input
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "6px",
            borderRadius: 6,
            border: "1px solid #ddd",
            marginRight: 8,
          }}
        />
        <button className="btn" onClick={() => setShowHistory((s) => !s)}>
          {showHistory ? "Hide History" : "Show History"}
        </button>
        <button
          className="btn"
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        >
          {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </div>
    </header>
  );
}
