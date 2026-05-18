import React from 'react';

export default function Summary({ income, expense, balance, formatCurrency }) {
  return (
    <section className="card summary-row">
      <div className="tile"><strong>Income</strong><div>{formatCurrency(income)}</div></div>
      <div className="tile"><strong>Expense</strong><div>{formatCurrency(-expense)}</div></div>
      <div className="tile"><strong>Balance</strong><div>{formatCurrency(balance)}</div></div>
    </section>
  );
}
