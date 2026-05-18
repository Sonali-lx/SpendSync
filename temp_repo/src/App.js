import React, { useEffect, useState } from "react";
import "./App.css";

import Header from "./components/Header";
import TodayList from "./components/TodayList";
import Summary from "./components/Summary";
import Calendar from "./components/Calendar";

const STORAGE_KEY = "monet_entries_v1";
const TARGET = 100;

const formatDateDMY = (dateStr) => {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
};

const loadEntries = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch (e) {
    return [];
  }
};
const saveEntries = (entries) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
const todayStr = (d = new Date()) => d.toISOString().slice(0, 10);
const formatCurrency = (n) => (n >= 0 ? "+ " : "- ") + Math.abs(n);

export default function App() {
  const [entries, setEntries] = useState(loadEntries);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    type: "expense",
    item: "",
    amount: "",
    date: todayStr(),
    note: "",
    insertMode: "end",
    pos: 1,
  });
  const [startingBalance, setStartingBalance] = useState(
    Number(localStorage.getItem("monet_start_balance") || 0),
  );
  const [dayModal, setDayModal] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [theme, setTheme] = useState(
    localStorage.getItem("monet_theme") || "dark",
  );
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("dark", theme === "dark");
    localStorage.setItem("monet_theme", theme);
  }, [theme]);

  useEffect(() => saveEntries(entries), [entries]);
  useEffect(
    () => localStorage.setItem("monet_start_balance", String(startingBalance)),
    [startingBalance],
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key && e.key.toLowerCase() === "t")
        setTheme((t) => (t === "dark" ? "light" : "dark"));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const addEntry = (ev) => {
    ev && ev.preventDefault();
    if (!form.item || !form.amount) return alert("Provide item and amount");
    const newEntry = {
      id: Date.now().toString(36),
      ...form,
      amount: Number(form.amount),
    };
    setEntries((prev) => {
      const copy = [...prev];
      if (form.insertMode === "start") return [newEntry, ...copy];
      if (form.insertMode === "end") return [...copy, newEntry];
      const pos = Math.max(1, Math.min(form.pos || 1, copy.length + 1));
      copy.splice(pos - 1, 0, newEntry);
      return copy;
    });
    setForm({ ...form, item: "", amount: "", date: todayStr(), note: "" });
  };

  const deleteEntry = (id) =>
    setEntries((prev) => prev.filter((p) => p.id !== id));
  const entriesForDate = (dateStr) => entries.filter((e) => e.date === dateStr);

  const income = entries
    .filter((e) => e.type === "income")
    .reduce((s, e) => s + Number(e.amount), 0);
  const expense = entries
    .filter((e) => e.type === "expense")
    .reduce((s, e) => s + Number(e.amount), 0);
  const balance = startingBalance + income - expense;

  const historyGrouped = entries.reduce((acc, e) => {
    const key = e.date.slice(0, 7);
    acc[key] = acc[key] || {
      title: new Date(e.date).toLocaleString(undefined, {
        month: "long",
        year: "numeric",
      }),
      items: [],
      income: 0,
      expense: 0,
    };
    acc[key].items.push(e);
    if (e.type === "income") acc[key].income += Number(e.amount);
    if (e.type === "expense") acc[key].expense += Number(e.amount);
    acc[key].net = acc[key].income - acc[key].expense;
    return acc;
  }, {});

  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = [];
  for (let i = 0; i < first.getDay(); i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) {
    days.push({
      d,
      dateStr: new Date(year, month, d).toISOString().slice(0, 10),
    });
  }

  const calendarDays = days;
  const todayKey = todayStr();

  return (
    <div className="app">
      <Header
        search={search}
        setSearch={setSearch}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        theme={theme}
        setTheme={setTheme}
      />

      <div
        className="card"
        style={{
          padding: 10,
          display: "flex",
          gap: 8,
          alignItems: "center",
          maxWidth: 900,
          margin: "8px auto",
        }}
      >
        <form
          className="inline-form"
          onSubmit={addEntry}
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            width: "100%",
          }}
        >
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            style={{ width: 60, padding: 6 }}
          >
            <option value="expense">e</option>
            <option value="income">i</option>
          </select>
          <input
            type="text"
            placeholder="Item"
            value={form.item}
            onChange={(e) => setForm({ ...form, item: e.target.value })}
            style={{ flex: 3, padding: 6 }}
          />
          <input
            placeholder="Amt."
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            style={{ width: 100, padding: 6 }}
          />
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            style={{ width: 120, padding: 6 }}
          />
          <input
            type="text"
            placeholder="Note (optional)"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            style={{ flex: 1, padding: 6 }}
          />
          <button className="btn primary" type="submit">
            Add
          </button>
        </form>
      </div>

      <div
        style={{
          maxWidth: 900,
          margin: "0 auto 12px",
          display: "flex",
          gap: 12,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ color: "var(--muted)" }}>
          Total items: <strong>{entries.length}</strong>
        </div>
        <div style={{ color: "var(--muted)" }}>
          Starting balance:
          <input
            type="number"
            value={startingBalance}
            onChange={(e) => setStartingBalance(Number(e.target.value))}
            style={{ width: 120, marginLeft: 6 }}
          />
        </div>
        <div style={{ color: "var(--muted)" }}>
          Overall balance: <strong>{formatCurrency(balance)}</strong>
        </div>
      </div>

      {showHistory ? (
        <div className="layout">
          <aside className="history card">
            <h3>History</h3>
            {Object.keys(historyGrouped).length === 0 && (
              <div className="small">No history yet</div>
            )}
            {Object.keys(historyGrouped)
              .sort((a, b) => b.localeCompare(a))
              .map((k) => {
                const month = historyGrouped[k];
                return (
                  <div key={k} className="month-card">
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: 6,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>{month.title}</div>
                      <div style={{ fontSize: 13, color: "var(--muted)" }}>
                        Income: <strong>{formatCurrency(month.income)}</strong>
                        <span style={{ margin: "0 8px" }} />
                        Expense:{" "}
                        <strong>{formatCurrency(-month.expense)}</strong>
                        <span style={{ margin: "0 8px" }} />
                        Net: <strong>{formatCurrency(month.net)}</strong>
                      </div>
                    </div>

                    <table
                      className="history-table"
                      style={{ width: "100%", borderCollapse: "collapse" }}
                    >
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Item</th>
                          <th>Amount</th>
                          <th>Note</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {month.items.map((e) => (
                          <tr key={e.id} className={e.type}>
                            <td>{formatDateDMY(e.date)}</td>
                            <td
                              style={{
                                color: e.type === "income" ? "green" : "red",
                                fontWeight: 600,
                              }}
                            >
                              {e.type === "income" ? "Income" : "Expense"}
                            </td>
                            <td>{e.item}</td>
                            <td>{Math.round(e.amount)}</td>
                            <td>{e.note || ""}</td>
                            <td>
                              <button
                                className="btn small"
                                onClick={() => deleteEntry(e.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
          </aside>
          <div style={{ minWidth: 0 }}>
            <main>
              <TodayList
                entriesForDate={entriesForDate}
                todayStr={todayStr}
                search={search}
                deleteEntry={deleteEntry}
                formatCurrency={formatCurrency}
              />
              <Summary
                income={income}
                expense={expense}
                balance={balance}
                formatCurrency={formatCurrency}
              />
              <Calendar
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                calendarDays={calendarDays}
                entriesForDate={entriesForDate}
                todayKey={todayKey}
                TARGET={TARGET}
                setDayModal={setDayModal}
                formatCurrency={formatCurrency}
                monthlySummary={historyGrouped}
              />
            </main>
          </div>
        </div>
      ) : (
        <main>
          <TodayList
            entriesForDate={entriesForDate}
            todayStr={todayStr}
            search={search}
            deleteEntry={deleteEntry}
            formatCurrency={formatCurrency}
          />
          <Summary
            income={income}
            expense={expense}
            balance={balance}
            formatCurrency={formatCurrency}
          />
          <Calendar
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            calendarDays={calendarDays}
            entriesForDate={entriesForDate}
            todayKey={todayKey}
            TARGET={TARGET}
            setDayModal={setDayModal}
            formatCurrency={formatCurrency}
          />
        </main>
      )}

      {dayModal && (
        <div className="modal">
          <div className="card modal-content">
            <h3>Entries for {formatDateDMY(dayModal)}</h3>
            {entriesForDate(dayModal).length === 0 ? (
              <div className="small">No entries</div>
            ) : (
              entriesForDate(dayModal).map((e) => (
                <div
                  key={e.id}
                  className={`entry ${e.type}`}
                  style={{ alignItems: "center" }}
                >
                  <div style={{ flex: 1 }}>
                    {e.item}
                    <div className="meta">{e.type}</div>
                  </div>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <div className="amt">
                      {formatCurrency(
                        e.type === "income" ? +e.amount : -e.amount,
                      )}
                    </div>
                    <button className="btn" onClick={() => deleteEntry(e.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
            <div style={{ marginTop: 8 }}>
              <button className="btn" onClick={() => setDayModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
