import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Wallet, PiggyBank, Gift, Trash2 } from 'lucide-react';
import { Transaction, Category, TransactionType, Goal } from '../App';

interface Props {
  transaction: Transaction;
  goals: Goal[];
  onSave: (t: Transaction) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export default function EditTransactionModal({ transaction, goals, onSave, onClose, onDelete }: Props) {
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [category, setCategory] = useState<Category>(transaction.category || 'normal');
  const [name, setName] = useState(transaction.name);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [date, setDate] = useState(transaction.date);
  const [linkedGoalId, setLinkedGoalId] = useState(transaction.linkedGoalId || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !date) return;
    
    onSave({
      ...transaction,
      type,
      category: type === 'expense' ? category : undefined,
      name,
      amount: parseFloat(amount),
      date,
      linkedGoalId: type === 'expense' && category === 'saving' ? linkedGoalId : undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#1a1c23] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h3 className="text-lg font-medium text-slate-200">Edit Transaction</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
          <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
            <button type="button" onClick={() => setType('expense')} className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition ${type === 'expense' ? 'bg-[#7091ff] text-white' : 'text-slate-400'}`}>Outgoing</button>
            <button type="button" onClick={() => setType('income')} className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition ${type === 'income' ? 'bg-teal-500/20 text-teal-400' : 'text-slate-400'}`}>Incoming</button>
          </div>

          {type === 'expense' && (
            <div className="flex gap-2">
              <button type="button" onClick={() => setCategory('normal')} className={`flex-1 py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border transition ${category === 'normal' ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-slate-400 bg-white/5'}`}><Wallet size={14} /> Normal</button>
              <button type="button" onClick={() => setCategory('saving')} className={`flex-1 py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border transition ${category === 'saving' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'border-transparent text-slate-400 bg-white/5'}`}><PiggyBank size={14} /> Saving</button>
              <button type="button" onClick={() => setCategory('offering')} className={`flex-1 py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border transition ${category === 'offering' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'border-transparent text-slate-400 bg-white/5'}`}><Gift size={14} /> Offering</button>
            </div>
          )}

          {type === 'expense' && category === 'saving' && goals.length > 0 && (
            <select value={linkedGoalId} onChange={(e) => setLinkedGoalId(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-blue-500 text-sm text-slate-200">
              <option value="">No specific goal</option>
              {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          )}

          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Entry Name" className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-blue-500 text-sm placeholder:text-slate-500 text-slate-200 w-full" />
          
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-3.5 text-slate-500 text-sm">₹</span>
              <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-white/5 border border-white/5 rounded-xl pl-7 pr-3 py-3 outline-none focus:ring-1 focus:ring-blue-500 text-sm placeholder:text-slate-500 text-slate-200" />
            </div>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-blue-500 text-sm text-slate-200" />
          </div>

          <div className="flex gap-2 mt-2">
            <button type="button" onClick={() => onDelete(transaction.id)} className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 p-3 rounded-xl transition flex items-center justify-center">
              <Trash2 size={20} />
            </button>
            <button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-medium py-3 rounded-xl flex items-center justify-center shadow-lg transition active:scale-[0.98]">
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
