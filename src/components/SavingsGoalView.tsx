import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Plus, TrendingUp, Repeat, Trash2, Edit3 } from 'lucide-react';
import { AutoDeductRule, Category, TransactionType, Goal } from '../App';
import EditGoalModal from './EditGoalModal';
import EditAutoRuleModal from './EditAutoRuleModal';

export default function SavingsGoalView({ 
  goals, 
  setGoals,
  autoRules,
  setAutoRules
}: { 
  goals: Goal[],
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>,
  autoRules: AutoDeductRule[],
  setAutoRules: React.Dispatch<React.SetStateAction<AutoDeductRule[]>>
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [addSavingsGoalId, setAddSavingsGoalId] = useState<string | null>(null);
  const [savingsAmount, setSavingsAmount] = useState('');

  // Auto Rules State
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [ruleType, setRuleType] = useState<TransactionType>('expense');
  const [ruleCategory, setRuleCategory] = useState<Category>('normal');
  const [ruleName, setRuleName] = useState('');
  const [ruleAmount, setRuleAmount] = useState('');
  const [ruleFrequency, setRuleFrequency] = useState<'daily' | 'monthly'>('daily');
  const [ruleTime, setRuleTime] = useState('09:00');
  const [ruleDayOfMonth, setRuleDayOfMonth] = useState('1');
  const [ruleGoalId, setRuleGoalId] = useState('');

  // Edit States
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingRule, setEditingRule] = useState<AutoDeductRule | null>(null);

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName || !targetAmount) return;

    const newGoal: Goal = {
      id: crypto.randomUUID(),
      name: goalName,
      targetAmount: parseFloat(targetAmount),
      savedAmount: 0
    };

    setGoals(prev => [newGoal, ...prev]);
    setIsAdding(false);
    setGoalName('');
    setTargetAmount('');
  };

  const handleAddSavings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addSavingsGoalId || !savingsAmount) return;

    const amount = parseFloat(savingsAmount);
    setGoals(prev => prev.map(g => 
      g.id === addSavingsGoalId ? { ...g, savedAmount: g.savedAmount + amount } : g
    ));

    setAddSavingsGoalId(null);
    setSavingsAmount('');
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName || !ruleAmount || !ruleTime) return;

    const newRule: AutoDeductRule = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      lastTriggered: Date.now(),
      type: ruleType,
      category: ruleType === 'expense' ? ruleCategory : 'normal',
      name: ruleName,
      amount: parseFloat(ruleAmount),
      frequency: ruleFrequency,
      time: ruleTime,
      dayOfMonth: ruleFrequency === 'monthly' ? parseInt(ruleDayOfMonth) : undefined,
      linkedGoalId: ruleCategory === 'saving' && ruleGoalId ? ruleGoalId : undefined
    };

    setAutoRules(prev => [newRule, ...prev]);
    setIsAddingRule(false);
    setRuleName('');
    setRuleAmount('');
    setRuleCategory('normal');
    setRuleGoalId('');
  };

  const deleteRule = (id: string) => {
    setAutoRules(prev => prev.filter(r => r.id !== id));
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    setAutoRules(prev => prev.map(r => r.linkedGoalId === id ? { ...r, linkedGoalId: undefined } : r));
  };

  const totalSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium">Savings & Goals</h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-5 mb-8 backdrop-blur-md shadow-lg">
        <h2 className="text-sm text-slate-400 mb-2">Total Savings Progress</h2>
        <div className="flex justify-between items-end mb-4">
          <div className="text-3xl font-light text-teal-400">
            ₹{totalSaved.toFixed(2)}
          </div>
          <div className="text-sm text-slate-400">
            of ₹{totalTarget.toFixed(2)}
          </div>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2 mb-2 overflow-hidden">
          <div 
            className="bg-teal-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0}%` }}
          />
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-5 mb-6 backdrop-blur-md shadow-lg flex flex-col gap-4 overflow-hidden"
            onSubmit={handleCreateGoal}
          >
            <h4 className="font-medium text-slate-200">New Goal</h4>
            <input 
              type="text" 
              required
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              placeholder="Goal Name (e.g. New Laptop)"
              className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-blue-500 text-sm placeholder:text-slate-500 text-slate-200 w-full"
            />
            
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-slate-500 text-sm">₹</span>
              <input 
                type="number" 
                step="0.01"
                required
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="Target Amount"
                className="w-full bg-white/5 border border-white/5 rounded-xl pl-7 pr-3 py-3 outline-none focus:ring-1 focus:ring-blue-500 text-sm placeholder:text-slate-500 text-slate-200"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-teal-500 hover:bg-teal-400 text-white font-medium py-3 rounded-xl flex items-center justify-center transition active:scale-[0.98]"
            >
              Create Goal
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-4 pb-20">
        {goals.map(g => {
          const progress = g.targetAmount > 0 ? Math.min((g.savedAmount / g.targetAmount) * 100, 100) : 0;
          return (
            <div key={g.id} className="bg-white/5 border border-white/5 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                    <Target size={18} />
                  </div>
                  <h4 className="font-medium text-slate-200">{g.name}</h4>
                </div>
                <div className="flex items-center">
                  <button 
                    onClick={() => setAddSavingsGoalId(addSavingsGoalId === g.id ? null : g.id)}
                    className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition text-slate-300 mr-2"
                  >
                    Add Savings
                  </button>
                  <button
                    onClick={() => setEditingGoal(g)}
                    className="p-1.5 text-slate-500 hover:text-blue-400 transition"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => deleteGoal(g.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex justify-between text-sm mb-2">
                <span className="text-teal-400 font-medium">₹{g.savedAmount.toFixed(2)}</span>
                <span className="text-slate-500">₹{g.targetAmount.toFixed(2)}</span>
              </div>
              
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-blue-400 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <AnimatePresence>
                {addSavingsGoalId === g.id && (
                  <motion.form 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    onSubmit={handleAddSavings}
                    className="flex gap-2"
                  >
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2.5 text-slate-500 text-sm">₹</span>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        value={savingsAmount}
                        onChange={(e) => setSavingsAmount(e.target.value)}
                        placeholder="Amount"
                        className="w-full bg-white/5 border border-white/5 rounded-xl pl-7 pr-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 text-sm placeholder:text-slate-500 text-slate-200"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="bg-teal-500 hover:bg-teal-400 text-white rounded-xl px-4 flex items-center justify-center transition active:scale-95"
                    >
                      <TrendingUp size={18} />
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          );
        })}
        {goals.length === 0 && !isAdding && (
          <div className="text-center text-slate-500 py-8">
            Create a goal to start tracking savings!
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-6 mt-8">
        <h3 className="text-xl font-medium">Auto-Deduct Rules</h3>
        <button 
          onClick={() => setIsAddingRule(!isAddingRule)}
          className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition"
        >
          <Plus size={20} />
        </button>
      </div>

      <AnimatePresence>
        {isAddingRule && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-5 mb-6 backdrop-blur-md shadow-lg flex flex-col gap-4 overflow-hidden"
            onSubmit={handleCreateRule}
          >
            <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
              <button type="button" onClick={() => setRuleType('expense')} className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition ${ruleType === 'expense' ? 'bg-[#7091ff] text-white' : 'text-slate-400'}`}>Outgoing</button>
              <button type="button" onClick={() => setRuleType('income')} className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition ${ruleType === 'income' ? 'bg-teal-500/20 text-teal-400' : 'text-slate-400'}`}>Incoming</button>
            </div>

            {ruleType === 'expense' && (
              <div className="flex gap-2">
                <button type="button" onClick={() => setRuleCategory('normal')} className={`flex-1 py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border transition ${ruleCategory === 'normal' ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-slate-400 bg-white/5'}`}>Normal</button>
                <button type="button" onClick={() => setRuleCategory('saving')} className={`flex-1 py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border transition ${ruleCategory === 'saving' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'border-transparent text-slate-400 bg-white/5'}`}>Saving</button>
                <button type="button" onClick={() => setRuleCategory('offering')} className={`flex-1 py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border transition ${ruleCategory === 'offering' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'border-transparent text-slate-400 bg-white/5'}`}>Offering</button>
              </div>
            )}

            {ruleType === 'expense' && ruleCategory === 'saving' && goals.length > 0 && (
              <select 
                value={ruleGoalId}
                onChange={(e) => setRuleGoalId(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-blue-500 text-sm text-slate-200"
              >
                <option value="">Select Goal (optional)</option>
                {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            )}

            <input 
              type="text" required value={ruleName} onChange={(e) => setRuleName(e.target.value)}
              placeholder="Name (e.g. Rent, Salary, Netflix)"
              className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-blue-500 text-sm placeholder:text-slate-500 text-slate-200 w-full"
            />
            
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-slate-500 text-sm">₹</span>
              <input 
                type="number" step="0.01" required value={ruleAmount} onChange={(e) => setRuleAmount(e.target.value)}
                placeholder="Amount"
                className="w-full bg-white/5 border border-white/5 rounded-xl pl-7 pr-3 py-3 outline-none focus:ring-1 focus:ring-blue-500 text-sm placeholder:text-slate-500 text-slate-200"
              />
            </div>

            <div className="flex gap-2">
              <select value={ruleFrequency} onChange={(e) => setRuleFrequency(e.target.value as 'daily' | 'monthly')} className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-blue-500 text-sm text-slate-200">
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
              </select>
              {ruleFrequency === 'monthly' && (
                <input 
                  type="number" min="1" max="31" value={ruleDayOfMonth} onChange={(e) => setRuleDayOfMonth(e.target.value)} placeholder="Day 1-31"
                  className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-blue-500 text-sm text-slate-200"
                />
              )}
              <input 
                type="time" required value={ruleTime} onChange={(e) => setRuleTime(e.target.value)}
                className="flex-[1.5] bg-white/5 border border-white/5 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-blue-500 text-sm text-slate-200"
              />
            </div>

            <button type="submit" className="w-full bg-blue-500 hover:bg-blue-400 text-white font-medium py-3 rounded-xl flex items-center justify-center transition active:scale-[0.98]">
              Save Rule
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-3 pb-20">
        {autoRules.map(r => (
          <div key={r.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                <Repeat size={18} />
              </div>
              <div>
                <p className="font-medium text-slate-200">{r.name}</p>
                <p className="text-xs text-slate-500">
                  {r.frequency === 'daily' ? `Daily at ${r.time}` : `Monthly on day ${r.dayOfMonth} at ${r.time}`} 
                  {r.category ? ` • ${r.category}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`font-semibold text-sm ${r.type === 'income' ? 'text-teal-400' : 'text-slate-200'}`}>
                {r.type === 'expense' ? '-' : '+'}₹{r.amount.toFixed(2)}
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => setEditingRule(r)}
                  className="p-1.5 text-slate-500 hover:text-blue-400 transition"
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={() => deleteRule(r.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {autoRules.length === 0 && !isAddingRule && (
          <div className="text-center text-slate-500 py-8">
            No auto-deduct rules set up.
          </div>
        )}
      </div>

      {editingGoal && (
        <EditGoalModal 
          goal={editingGoal}
          onSave={(g) => {
            setGoals(prev => prev.map(x => x.id === g.id ? g : x));
            setEditingGoal(null);
          }}
          onClose={() => setEditingGoal(null)}
          onDelete={(id) => {
            deleteGoal(id);
            setEditingGoal(null);
          }}
        />
      )}

      {editingRule && (
        <EditAutoRuleModal 
          rule={editingRule}
          goals={goals}
          onSave={(r) => {
            setAutoRules(prev => prev.map(x => x.id === r.id ? r : x));
            setEditingRule(null);
          }}
          onClose={() => setEditingRule(null)}
          onDelete={(id) => {
            deleteRule(id);
            setEditingRule(null);
          }}
        />
      )}
    </motion.div>
  );
}
