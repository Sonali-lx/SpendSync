import React, { useState } from 'react';
import { IndianRupee, ArrowDownRight, ArrowUpRight, X, Bell, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Reminder } from '../App';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  name: string;
  amount: number;
  date: string;
}

export default function CalendarView({ 
  transactions,
  reminders,
  setReminders,
  onEditTransaction
}: { 
  transactions: Transaction[],
  reminders: Reminder[],
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>,
  onEditTransaction: (t: Transaction) => void
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [newReminderText, setNewReminderText] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay(); 

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  }
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  }

  // Build calendar matrix
  const days = [];
  for (let i = 0; i < startingDay; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  // Calculate day totals
  const getDayTotal = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTxs = transactions.filter(t => t.date === dateStr);
    const dayRems = reminders.filter(r => r.date === dateStr);
    const inc = dayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const exp = dayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { dateStr, inc, exp, net: inc - exp, txs: dayTxs, rems: dayRems };
  };

  const selectedDayData = selectedDay ? getDayTotal(selectedDay) : null;

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderText || !selectedDayData) return;
    setReminders(prev => [...prev, {
      id: crypto.randomUUID(),
      date: selectedDayData.dateStr,
      text: newReminderText
    }]);
    setNewReminderText('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-6"
    >
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
        <button className="p-2 text-slate-400 hover:text-slate-200" onClick={prevMonth}>&larr;</button>
        <span className="font-semibold text-lg">{monthNames[month]} {year}</span>
        <button className="p-2 text-slate-400 hover:text-slate-200" onClick={nextMonth}>&rarr;</button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-center text-xs font-semibold text-slate-500 py-2">
            {day}
          </div>
        ))}
        {days.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="p-2" />;
          
          const { inc, exp, rems } = getDayTotal(day);
          const hasActivity = inc > 0 || exp > 0;
          const hasReminders = rems.length > 0;
          
          const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
          const isSelected = selectedDay === day;

          return (
            <button 
              key={`day-${day}`} 
              onClick={() => setSelectedDay(isSelected ? null : day)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all relative ${
                isSelected ? 'bg-blue-500/20 border-blue-500/50' :
                hasActivity || hasReminders ? 'bg-white/10 border-white/10 hover:bg-white/15' : 'bg-transparent border-transparent opacity-80 hover:bg-white/5'
              } ${isToday && !isSelected ? 'ring-1 ring-blue-500' : ''}`}
            >
              <span className={`text-sm ${isToday ? 'text-blue-400 font-bold' : isSelected ? 'text-blue-300 font-bold' : 'text-slate-300'}`}>{day}</span>
              {(hasActivity || hasReminders) && (
                <div className="flex gap-1 mt-1 flex-wrap justify-center max-w-[20px]">
                  {hasReminders && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                  {inc > 0 && <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>}
                  {exp > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#7091ff]"></span>}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedDay && selectedDayData && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-4">
                 <h4 className="font-semibold text-slate-200">
                    {monthNames[month]} {selectedDay}, {year}
                 </h4>
                 <button onClick={() => setSelectedDay(null)} className="text-slate-400 hover:text-slate-200">
                    <X size={18} />
                 </button>
              </div>

              <div className="space-y-4">
                {/* Reminders Section */}
                <div className="space-y-3">
                  <form onSubmit={handleAddReminder} className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Add a reminder (e.g. Pay Rent)..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:ring-1 focus:ring-amber-500"
                      value={newReminderText}
                      onChange={(e) => setNewReminderText(e.target.value)}
                    />
                    <button type="submit" className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 p-2 rounded-xl transition">
                      <Plus size={18} />
                    </button>
                  </form>

                  {selectedDayData.rems.map(r => (
                    <div key={r.id} className="flex justify-between items-center bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Bell size={16} className="text-amber-400" />
                        <span className="text-sm text-amber-100">{r.text}</span>
                      </div>
                      <button 
                        onClick={() => setReminders(prev => prev.filter(x => x.id !== r.id))}
                        className="text-amber-400/50 hover:text-amber-400 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Transactions Section */}
                {selectedDayData.txs.length > 0 && (
                  <div className="space-y-3 border-t border-white/10 pt-4">
                    <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Transactions</h5>
                    {selectedDayData.txs.map(t => (
                      <div 
                        key={t.id} 
                        onClick={() => onEditTransaction(t)}
                        className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-teal-500/10 text-teal-400' : 'bg-[#7091ff]/10 text-[#7091ff]'}`}>
                            {t.type === 'income' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                          </div>
                          <div>
                            <p className="font-medium text-slate-200 text-sm">{t.name}</p>
                            <p className="text-xs text-slate-500">{t.type === 'income' ? 'Income' : 'Expense'}</p>
                          </div>
                        </div>
                        <div className={`font-semibold text-sm ${t.type === 'income' ? 'text-teal-400' : 'text-slate-200'}`}>
                          {t.type === 'expense' ? '-' : '+'}₹{t.amount.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedDayData.txs.length === 0 && selectedDayData.rems.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-2">No activity on this day.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
