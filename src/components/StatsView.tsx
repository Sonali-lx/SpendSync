import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowDownRight, ArrowUpRight, Search, Wallet, PiggyBank, Gift } from 'lucide-react';

export type Category = 'normal' | 'saving' | 'offering';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category?: Category;
  name: string;
  amount: number;
  date: string;
}

const CategoryIcon = ({ type, category }: { type: string, category?: Category }) => {
  if (type === 'income') return <ArrowDownRight size={16} />;
  
  if (category === 'saving') return <PiggyBank size={16} />;
  if (category === 'offering') return <Gift size={16} />;
  return <Wallet size={16} />;
};

export default function StatsView({ 
  transactions,
  onEditTransaction 
}: { 
  transactions: Transaction[],
  onEditTransaction: (t: Transaction) => void
}) {
  const [search, setSearch] = useState('');

  const filtered = search.trim() 
    ? transactions.filter(t => 
        t.name.toLowerCase().includes(search.toLowerCase()) || 
        (t.category && t.category.toLowerCase().includes(search.toLowerCase()))
      )
    : transactions;

  // Group transactions by month
  const historyGrouped = filtered.reduce((acc, t) => {
    const monthKey = t.date.slice(0, 7); // YYYY-MM
    if (!acc[monthKey]) {
      acc[monthKey] = {
        title: new Date(t.date).toLocaleString(undefined, { month: 'long', year: 'numeric' }),
        items: [],
        income: 0,
        expense: 0
      };
    }
    acc[monthKey].items.push(t);
    if (t.type === 'income') acc[monthKey].income += t.amount;
    else acc[monthKey].expense += t.amount;
    
    return acc;
  }, {} as Record<string, any>);

  const sortedKeys = Object.keys(historyGrouped).sort((a, b) => b.localeCompare(a));

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium">Monthly History</h3>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Search entries (e.g. ice cream)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 outline-none focus:ring-1 focus:ring-blue-500 text-sm placeholder:text-slate-500 text-slate-200"
        />
      </div>
      
      {sortedKeys.length === 0 ? (
        <div className="text-center text-slate-500 py-12">
          {search ? 'No matches found.' : 'No history available yet.'}
        </div>
      ) : (
        <div className="space-y-8 pb-20">
          {sortedKeys.map(key => {
            const data = historyGrouped[key];
            const net = data.income - data.expense;
            
            return (
              <div key={key} className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-lg text-slate-100">{data.title}</h4>
                  <div className={`font-medium ${net >= 0 ? 'text-teal-400' : 'text-[#7091ff]'}`}>
                    {net >= 0 ? '+' : '-'}₹{Math.abs(net).toFixed(2)}
                  </div>
                </div>

                <div className="flex gap-4 mb-6">
                  <div className="flex-1 bg-white/5 rounded-2xl p-3 border border-white/5">
                    <p className="text-xs uppercase tracking-wider text-teal-500 font-semibold mb-1">Income</p>
                    <p className="text-sm font-medium">₹{data.income.toFixed(2)}</p>
                  </div>
                  <div className="flex-1 bg-white/5 rounded-2xl p-3 border border-white/5">
                    <p className="text-xs uppercase tracking-wider text-[#7091ff] font-semibold mb-1">Expense</p>
                    <p className="text-sm font-medium">₹{data.expense.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {data.items.slice(0, search.trim() ? data.items.length : 5).map((t: Transaction) => (
                    <div 
                      key={t.id} 
                      onClick={() => onEditTransaction(t)}
                      className="flex items-center justify-between text-sm p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${t.type === 'income' ? 'bg-teal-500/10 text-teal-400' : 'bg-[#7091ff]/10 text-[#7091ff]'}`}>
                          <CategoryIcon type={t.type} category={t.category} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{t.name}</p>
                          <div className="flex gap-2 items-center text-[10px] text-slate-500">
                             <span>{t.date}</span>
                             {t.category && t.type === 'expense' && (
                                <span className="bg-white/10 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">{t.category}</span>
                             )}
                          </div>
                        </div>
                      </div>
                      <div className={`font-medium ${t.type === 'income' ? 'text-teal-400' : 'text-slate-200'}`}>
                        {t.type === 'expense' ? '-' : '+'}₹{t.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                  {!search.trim() && data.items.length > 5 && (
                    <div className="text-center text-xs text-slate-500 pt-2">
                       + {data.items.length - 5} more transactions
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
