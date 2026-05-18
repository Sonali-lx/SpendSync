import React, { useState, useEffect } from 'react';
import { Home, Calendar as CalendarIcon, BarChart3, Plus, ArrowUpRight, ArrowDownRight, Target, Wallet, PiggyBank, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CalendarView from './components/CalendarView';
import StatsView from './components/StatsView';
import SavingsGoalView from './components/SavingsGoalView';
import EditTransactionModal from './components/EditTransactionModal';

export type TransactionType = 'income' | 'expense';
export type Category = 'normal' | 'saving' | 'offering';

export interface Transaction {
  id: string;
  type: TransactionType;
  category?: Category;
  name: string;
  amount: number;
  date: string; // YYYY-MM-DD
  linkedGoalId?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
}

export interface AutoDeductRule {
  id: string;
  createdAt: number;
  lastTriggered: number;
  type: TransactionType;
  category: Category;
  name: string;
  amount: number;
  frequency: 'daily' | 'monthly';
  time: string; // "HH:MM"
  dayOfMonth?: number;
  linkedGoalId?: string;
}

function getNextTrigger(rule: AutoDeductRule, afterDate: Date): Date {
  const [hours, minutes] = rule.time.split(':').map(Number);
  let d = new Date(afterDate);
  
  if (rule.frequency === 'daily') {
    d.setHours(hours, minutes, 0, 0);
    if (d <= afterDate) {
      d.setDate(d.getDate() + 1);
    }
    return d;
  } else {
    // monthly
    d.setDate(rule.dayOfMonth || 1);
    d.setHours(hours, minutes, 0, 0);
    if (d <= afterDate) {
      d.setMonth(d.getMonth() + 1);
      let targetMonth = d.getMonth();
      d.setDate(rule.dayOfMonth || 1);
      if (d.getMonth() !== targetMonth) {
          d.setDate(0); 
      }
    }
    return d;
  }
}

export interface Reminder {
  id: string;
  date: string; // YYYY-MM-DD
  text: string;
}

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('spendsync_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [autoRules, setAutoRules] = useState<AutoDeductRule[]>(() => {
    const saved = localStorage.getItem('spendsync_autorules');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'stats' | 'savings'>('home');
  
  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('spendsync_goals');
    return saved ? JSON.parse(saved) : [];
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('spendsync_reminders');
    return saved ? JSON.parse(saved) : [];
  });

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Form State
  const [entryType, setEntryType] = useState<TransactionType>('expense');
  const [entryCategory, setEntryCategory] = useState<Category>('normal');
  const [entryGoalId, setEntryGoalId] = useState<string>('');
  const [entryName, setEntryName] = useState('');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('spendsync_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('spendsync_autorules', JSON.stringify(autoRules));
  }, [autoRules]);

  useEffect(() => {
    localStorage.setItem('spendsync_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('spendsync_reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Catch-up processor for auto deductions
  useEffect(() => {
    if (autoRules.length === 0) return;
    
    // Check periodically if any rule needs to fire
    const checkRules = () => {
      const now = new Date();
      let hasChanges = false;
      let nextTxs = [...transactions];
      let nextRules = [...autoRules];
      let nextGoals = [...goals];

      for (let i = 0; i < nextRules.length; i++) {
        let rule = nextRules[i];
        let cursor = new Date(Math.max(rule.lastTriggered, rule.createdAt));
        let nextTrigger = getNextTrigger(rule, cursor);
        
        let safety = 0;
        let ruleTriggered = false;

        while (nextTrigger <= now && safety < 1000) {
          safety++;
          ruleTriggered = true;
          
          nextTxs.push({
            id: crypto.randomUUID(),
            type: rule.type,
            category: rule.category,
            name: rule.name,
            amount: rule.amount,
            date: nextTrigger.toISOString().split('T')[0]
          });
          
          if (rule.category === 'saving' && rule.linkedGoalId) {
            const gIdx = nextGoals.findIndex(g => g.id === rule.linkedGoalId);
            if (gIdx >= 0) {
              // Create a new goal object to preserve immutability
              nextGoals[gIdx] = { ...nextGoals[gIdx], savedAmount: nextGoals[gIdx].savedAmount + rule.amount };
            }
          }

          rule = { ...rule, lastTriggered: nextTrigger.getTime() };
          nextRules[i] = rule;
          
          cursor = nextTrigger;
          nextTrigger = getNextTrigger(rule, cursor);
        }
        
        if (ruleTriggered) hasChanges = true;
      }

      if (hasChanges) {
        setTransactions(nextTxs);
        setAutoRules(nextRules);
        setGoals(nextGoals);
      }
    };

    checkRules();
    const intervalId = setInterval(checkRules, 60000); // Check every minute
    return () => clearInterval(intervalId);
  }, [autoRules, transactions, goals]);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryName || !entryAmount) return;

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      type: entryType,
      category: entryType === 'expense' ? entryCategory : undefined,
      name: entryName,
      amount: parseFloat(entryAmount),
      date: entryDate,
      linkedGoalId: entryType === 'expense' && entryCategory === 'saving' && entryGoalId ? entryGoalId : undefined
    };

    setTransactions(prev => [newTransaction, ...prev]);
    
    // Update goal if applicable
    if (newTransaction.linkedGoalId) {
      setGoals(prev => prev.map(g => 
        g.id === newTransaction.linkedGoalId ? { ...g, savedAmount: g.savedAmount + newTransaction.amount } : g
      ));
    }
    
    // Reset and close
    setEntryName('');
    setEntryAmount('');
    setEntryCategory('normal');
    setEntryGoalId('');
  };

  const handleSaveEditTransaction = (updated: Transaction) => {
    if (!editingTransaction) return;
    
    // Reverse previous goal if applicable
    let nextGoals = [...goals];
    if (editingTransaction.linkedGoalId) {
      const gIdx = nextGoals.findIndex(g => g.id === editingTransaction.linkedGoalId);
      if (gIdx >= 0) {
        nextGoals[gIdx] = { ...nextGoals[gIdx], savedAmount: nextGoals[gIdx].savedAmount - editingTransaction.amount };
      }
    }
    
    // Apply new goal if applicable
    if (updated.linkedGoalId) {
      const gIdx = nextGoals.findIndex(g => g.id === updated.linkedGoalId);
      if (gIdx >= 0) {
        nextGoals[gIdx] = { ...nextGoals[gIdx], savedAmount: nextGoals[gIdx].savedAmount + updated.amount };
      }
    }
    
    setGoals(nextGoals);
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    const t = transactions.find(x => x.id === id);
    if (!t) return;
    
    if (t.linkedGoalId) {
       setGoals(prev => prev.map(g => 
         g.id === t.linkedGoalId ? { ...g, savedAmount: g.savedAmount - t.amount } : g
       ));
    }
    setTransactions(prev => prev.filter(x => x.id !== id));
    setEditingTransaction(null);
  };

  // Helper calculation
  const todayDate = new Date().toISOString().split('T')[0];
  const todaysTransactions = transactions.filter(t => t.date === todayDate);
  const totalExpenseToday = todaysTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalIncomeToday = todaysTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
  const openingBalance = transactions.filter(t => t.date < todayDate).reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
  const closingBalance = openingBalance + totalIncomeToday - totalExpenseToday;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <>
            {/* Quick Add Form */}
            <form onSubmit={handleAddTransaction} className="bg-white/5 border border-white/10 rounded-3xl p-5 mb-6 backdrop-blur-md shadow-lg flex flex-col gap-4">
               <h2 className="text-sm text-slate-400 mb-2">Quick Add</h2>
              <div className="space-y-3">
                 <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setEntryType('expense')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition ${entryType === 'expense' ? 'bg-[#7091ff] text-white' : 'text-slate-400'}`}
                  >
                    Outgoing
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryType('income')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition ${entryType === 'income' ? 'bg-teal-500/20 text-teal-400' : 'text-slate-400'}`}
                  >
                    Incoming
                  </button>
                </div>

                {entryType === 'expense' && (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEntryCategory('normal')} className={`flex-1 py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border transition ${entryCategory === 'normal' ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-slate-400 bg-white/5'}`}>
                      <Wallet size={14} /> Normal
                    </button>
                    <button type="button" onClick={() => setEntryCategory('saving')} className={`flex-1 py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border transition ${entryCategory === 'saving' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'border-transparent text-slate-400 bg-white/5'}`}>
                      <PiggyBank size={14} /> Saving
                    </button>
                    <button type="button" onClick={() => setEntryCategory('offering')} className={`flex-1 py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border transition ${entryCategory === 'offering' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'border-transparent text-slate-400 bg-white/5'}`}>
                      <Gift size={14} /> Offering
                    </button>
                  </div>
                )}
                
                {entryType === 'expense' && entryCategory === 'saving' && goals.length > 0 && (
                  <select 
                    value={entryGoalId}
                    onChange={(e) => setEntryGoalId(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 outline-none focus:ring-1 focus:ring-blue-500 text-sm text-slate-200"
                  >
                    <option value="">No specific goal</option>
                    {goals.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                )}

                <div className="flex gap-2 items-center">
                  <input 
                    type="text" 
                    required
                    value={entryName}
                    onChange={(e) => setEntryName(e.target.value)}
                    placeholder="e.g. Uber"
                    className="flex-1 min-w-0 bg-white/5 border border-white/5 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-blue-500 text-sm placeholder:text-slate-500 text-slate-200"
                  />
                  <div className="relative w-28 shrink-0">
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
                  <div className="relative bg-white/5 border border-white/5 rounded-xl flex items-center justify-center w-[46px] h-[46px] shrink-0 hover:bg-white/10 transition">
                    <CalendarIcon size={20} className="text-slate-400" />
                    <input 
                      type="date" 
                      required
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-400 text-white rounded-xl w-[46px] h-[46px] shrink-0 flex items-center justify-center transition-transform active:scale-95 shadow-md shadow-blue-500/20"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </form>

            {/* Today's Summary Card */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 mb-8 backdrop-blur-md shadow-lg">
              <h2 className="text-sm text-slate-400 mb-4">Total Balance</h2>
              <div className="flex justify-between items-end mb-6">
                <div className={`text-3xl font-light ${totalBalance < 0 ? 'text-rose-400' : ''}`}>
                  ₹{totalBalance.toFixed(2)}
                </div>
              </div>
              
              <div className="flex gap-4 mb-4">
                <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 text-teal-400 mb-2">
                    <ArrowDownRight size={16} />
                    <span className="text-[10px] uppercase tracking-wider font-semibold">Today's Income</span>
                  </div>
                  <div className="text-lg">₹{totalIncomeToday.toFixed(2)}</div>
                </div>
                <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 text-[#7091ff] mb-2">
                    <ArrowUpRight size={16} />
                    <span className="text-[10px] uppercase tracking-wider font-semibold">Today's Expense</span>
                  </div>
                  <div className="text-lg">₹{totalExpenseToday.toFixed(2)}</div>
                </div>
              </div>

              <div className="flex justify-between text-xs text-slate-500 border-t border-white/10 pt-4">
                <div>Opening: ₹{openingBalance.toFixed(2)}</div>
                <div>Closing: ₹{closingBalance.toFixed(2)}</div>
              </div>
            </div>

            {/* Transactions List */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center justify-between">
                <span>Today's Entries</span>
              </h3>
              
              <div className="space-y-3">
                {todaysTransactions.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-12 flex flex-col items-center justify-center text-center bg-white/5 rounded-3xl border border-white/5"
                  >
                    <div className="text-4xl mb-3">😊</div>
                    <p className="text-slate-400 text-sm">No expenses or income for today yet!</p>
                  </motion.div>
                ) : (
                  <AnimatePresence>
                    {todaysTransactions.map(t => (
                      <motion.div 
                        key={t.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => setEditingTransaction(t)}
                        className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${t.type === 'income' ? 'bg-teal-500/10 text-teal-400' : 'bg-[#7091ff]/10 text-[#7091ff]'}`}>
                            {t.type === 'income' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                          </div>
                          <div>
                            <p className="font-medium text-slate-200">{t.name}</p>
                            <p className="text-xs text-slate-500">{t.type === 'income' ? 'Income' : 'Expense'}</p>
                          </div>
                        </div>
                        <div className={`font-semibold ${t.type === 'income' ? 'text-teal-400' : 'text-slate-200'}`}>
                          {t.type === 'expense' ? '-' : '+'}₹{t.amount.toFixed(2)}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </>
        );
      case 'calendar':
        return <CalendarView transactions={transactions} reminders={reminders} setReminders={setReminders} onEditTransaction={setEditingTransaction} />;
      case 'stats':
        return <StatsView transactions={transactions} onEditTransaction={setEditingTransaction} />;
      case 'savings':
        return <SavingsGoalView goals={goals} setGoals={setGoals} autoRules={autoRules} setAutoRules={setAutoRules} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#07090F] text-slate-200 font-sans flex justify-center overflow-hidden">
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          goals={goals}
          onSave={handleSaveEditTransaction}
          onClose={() => setEditingTransaction(null)}
          onDelete={handleDeleteTransaction}
        />
      )}
      {/* Copilot-style Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[50%] bg-indigo-700/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-teal-600/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Mobile constraints wrapper */}
      <div className="w-full max-w-md relative flex flex-col h-screen border-x border-white/5 bg-[#0A0D14]/50 backdrop-blur-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <header className="px-6 py-8 pb-4">
          <h1 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-teal-300 bg-clip-text text-transparent">
            SpendSync
          </h1>
          <p className="text-slate-400 text-sm mt-1">Easily track your flow.</p>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto px-6 pb-24 no-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 w-full bg-[#0A0D14]/80 backdrop-blur-xl border-t border-white/10 px-6 py-4 flex justify-between items-center z-10 pb-8">
          <button className={`p-3 rounded-full transition flex items-center justify-center ${activeTab === 'home' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => setActiveTab('home')}>
            <Home size={24} />
          </button>
          <button className={`p-3 rounded-full transition flex items-center justify-center ${activeTab === 'calendar' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => setActiveTab('calendar')}>
            <CalendarIcon size={24} />
          </button>
          <button className={`p-3 rounded-full transition flex items-center justify-center ${activeTab === 'stats' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => setActiveTab('stats')}>
            <BarChart3 size={24} />
          </button>
          <button className={`p-3 rounded-full transition flex items-center justify-center ${activeTab === 'savings' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => setActiveTab('savings')}>
            <Target size={24} />
          </button>
        </nav>
        
      </div>
    </div>
  );
}

