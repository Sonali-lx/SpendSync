import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Repeat, Plus, Trash2, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface RecurringTransaction {
  id: string;
  type: 'income' | 'expense';
  name: string;
  amount: number;
  dayOfMonth: string; // 1-31
}

export default function RecurringView({ 
  recurring, 
  setRecurring 
}: { 
  recurring: RecurringTransaction[],
  setRecurring: React.Dispatch<React.SetStateAction<RecurringTransaction[]>>
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [entryType, setEntryType] = useState<'income' | 'expense'>('expense');
  const [entryName, setEntryName] = useState('');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryDay, setEntryDay] = useState('1');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryName || !entryAmount || !entryDay) return;

    const newRec: RecurringTransaction = {
      id: crypto.randomUUID(),
      type: entryType,
      name: entryName,
      amount: parseFloat(entryAmount),
      dayOfMonth: entryDay
    };

    setRecurring(prev => [newRec, ...prev]);
    setIsAdding(false);
    setEntryName('');
    setEntryAmount('');
    setEntryDay('1');
  };

  const removeRec = (id: string) => {
    setRecurring(prev => prev.filter(r => r.id !== id));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium">Monthly Auto-Entries</h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition"
        >
          <Plus size={20} />
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-5 mb-6 backdrop-blur-md shadow-lg flex flex-col gap-4 overflow-hidden"
            onSubmit={handleAdd}
          >
            <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
              <button
                type="button"
                onClick={() => setEntryType('expense')}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition ${entryType === 'expense' ? 'bg-[#7091ff] text-white' : 'text-slate-400'}`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setEntryType('income')}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition ${entryType === 'income' ? 'bg-teal-500/20 text-teal-400' : 'text-slate-400'}`}
              >
                Income
              </button>
            </div>

            <input 
              type="text" 
              required
              value={entryName}
              onChange={(e) => setEntryName(e.target.value)}
              placeholder="Name (e.g. Rent, Salary)"
              className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-blue-500 text-sm placeholder:text-slate-500 text-slate-200 w-full"
            />
            
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-3.5 text-slate-500 text-sm">₹</span>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-white/5 rounded-xl pl-7 pr-3 py-3 outline-none focus:ring-1 focus:ring-blue-500 text-sm placeholder:text-slate-500 text-slate-200"
                />
              </div>
              <div className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">Day:</span>
                <input 
                  type="number"
                  min="1" max="31"
                  required
                  value={entryDay}
                  onChange={(e) => setEntryDay(e.target.value)}
                  className="bg-transparent border-none outline-none text-right w-12 text-sm text-slate-200"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-400 text-white font-medium py-3 py-3 mt-2 rounded-xl flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
            >
              Save Auto-Entry
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-3 pb-20">
        {recurring.length === 0 && !isAdding ? (
          <div className="text-center text-slate-500 py-12">
            No recurring entries set up yet.
          </div>
        ) : (
          recurring.map(r => (
            <div key={r.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${r.type === 'income' ? 'bg-teal-500/10 text-teal-400' : 'bg-[#7091ff]/10 text-[#7091ff]'}`}>
                  {r.type === 'income' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div>
                  <p className="font-medium text-slate-200">{r.name}</p>
                  <p className="text-xs text-slate-500">Repeats every month on day {r.dayOfMonth}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`font-semibold ${r.type === 'income' ? 'text-teal-400' : 'text-slate-200'}`}>
                  {r.type === 'expense' ? '-' : '+'}₹{r.amount.toFixed(2)}
                </div>
                <button 
                  onClick={() => removeRec(r.id)}
                  className="text-slate-500 hover:text-rose-400 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </motion.div>
  );
}
