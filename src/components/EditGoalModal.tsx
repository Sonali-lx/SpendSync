import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Trash2 } from 'lucide-react';
import { Goal } from '../App';

interface Props {
  goal: Goal;
  onSave: (g: Goal) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export default function EditGoalModal({ goal, onSave, onClose, onDelete }: Props) {
  const [name, setName] = useState(goal.name);
  const [targetAmount, setTargetAmount] = useState(goal.targetAmount.toString());

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) return;
    
    onSave({
      ...goal,
      name,
      targetAmount: parseFloat(targetAmount)
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
          <h3 className="text-lg font-medium text-slate-200">Edit Goal</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Goal Name" className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-teal-500 text-sm placeholder:text-slate-500 text-slate-200 w-full" />
          
          <div className="relative">
            <span className="absolute left-3 top-3.5 text-slate-500 text-sm">₹</span>
            <input type="number" step="0.01" required value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="Target Amount" className="w-full bg-white/5 border border-white/5 rounded-xl pl-7 pr-3 py-3 outline-none focus:ring-1 focus:ring-teal-500 text-sm placeholder:text-slate-500 text-slate-200" />
          </div>

          <div className="flex gap-2 mt-2">
            <button type="button" onClick={() => onDelete(goal.id)} className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 p-3 rounded-xl transition flex items-center justify-center">
              <Trash2 size={20} />
            </button>
            <button type="submit" className="flex-1 bg-teal-500 hover:bg-teal-400 text-white font-medium py-3 rounded-xl flex items-center justify-center shadow-lg transition active:scale-[0.98]">
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
