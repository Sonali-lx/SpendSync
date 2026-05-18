import React from 'react';

export default function Calendar({ selectedMonth, setSelectedMonth, calendarDays, entriesForDate, todayKey, TARGET, setDayModal, formatCurrency, monthlySummary = {} }) {
  const monthKey = selectedMonth.toISOString().slice(0,7);
  const monthInfo = monthlySummary[monthKey] || { income:0, expense:0, net:0 };

  return (
    <section className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Calendar</h2>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{selectedMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
          <div style={{ fontSize: 12 }}>{/* show monthly expense */}
            <span style={{ color: 'var(--muted)', marginRight: 8 }}>Expense:</span>
            <strong>{formatCurrency(monthInfo.expense ? -monthInfo.expense : 0)}</strong>
          </div>
        </div>
        <div>
          <button className="btn" onClick={() => setSelectedMonth(m => new Date(m.getFullYear(), m.getMonth()-1, 1))}>&lt;</button>
          <button className="btn" onClick={() => setSelectedMonth(new Date())} style={{ margin: '0 6px' }}>Today</button>
          <button className="btn" onClick={() => setSelectedMonth(m => new Date(m.getFullYear(), m.getMonth()+1, 1))}>&gt;</button>
        </div>
      </div>
      <div className="calendar">
        {calendarDays.map((c, i) => {
          if (c === null) return <div key={i} className="day empty" />;
          const items = entriesForDate(c.dateStr);
          const totExpense = items.filter(it => it.type === 'expense').reduce((s, it) => s + Number(it.amount), 0);
          const cls = `day ${items.length ? 'has-entry' : ''} ${totExpense > TARGET ? 'exceed' : ''} ${c.dateStr === todayKey ? 'today' : ''}`;
          return (
            <div key={i} className={cls} onClick={() => setDayModal(c.dateStr)}>
              <div><strong>{c.d}</strong></div>
              <div className="small">{items.length} </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
