import React from 'react';

export default function TodayList({ entriesForDate, todayStr, search, deleteEntry, formatCurrency }) {
  const todays = entriesForDate(todayStr()).filter(e=> e.item.toLowerCase().includes(search.toLowerCase()));
  return (
    <section className="card">
      <h2>Today's entries</h2>
      <div className="list">
        {todays.length === 0 ? (
          <div className="small">No expense or income for today 😊</div>
        ) : todays.map((e) => (
          <div key={e.id} className={`entry ${e.type}`}>
            <div>
              <div>{e.item}</div>
              <div className="meta">{e.date}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="amt">{formatCurrency(e.type === 'income' ? +e.amount : -e.amount)}</div>
              <button className="btn" onClick={() => deleteEntry(e.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
