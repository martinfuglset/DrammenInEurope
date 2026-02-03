import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import type { BudgetCategory } from '../types';
import { Lock, LogOut, ArrowLeft, Plus, Trash2, Download } from 'lucide-react';
import clsx from 'clsx';

const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  meals: 'Måltider',
  activities: 'Aktiviteter',
  transportation: 'Transport',
  staying_places: 'Overnatting',
  other: 'Annet',
};

const CATEGORY_ORDER: BudgetCategory[] = ['meals', 'activities', 'transportation', 'staying_places', 'other'];

function formatKr(n: number | null): string {
  if (n === null || n === undefined) return '–';
  return `${Math.round(n).toLocaleString('nb-NO')} kr`;
}

export function AdminBudgetsView() {
  const {
    isAdmin,
    loginAdmin,
    budgetItems,
    addBudgetItem,
    updateBudgetItem,
    removeBudgetItem,
    exportAdminData,
  } = useStore();

  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addCategory, setAddCategory] = useState<BudgetCategory>('other');
  const [addName, setAddName] = useState('');
  const [addBudgeted, setAddBudgeted] = useState('');
  const [addActual, setAddActual] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginAdmin(password)) setError(true);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const budgeted = Number(addBudgeted.replace(/\s/g, '')) || 0;
    const actual = addActual.trim() === '' ? null : Number(addActual.replace(/\s/g, '')) || 0;
    addBudgetItem(addCategory, addName.trim() || 'Utgift', budgeted, actual);
    setAddName('');
    setAddBudgeted('');
    setAddActual('');
    setShowAddForm(false);
  };

  const byCategory = (category: BudgetCategory) =>
    budgetItems.filter((b) => b.category === category);

  const totals = budgetItems.reduce(
    (acc, b) => {
      acc.budgeted += b.budgeted;
      acc.actual += b.actual ?? 0;
      return acc;
    },
    { budgeted: 0, actual: 0 }
  );
  const totalDifference = totals.actual - totals.budgeted;

  const categoryTotals = CATEGORY_ORDER.reduce(
    (acc, cat) => {
      const items = byCategory(cat);
      const budgeted = items.reduce((s, b) => s + b.budgeted, 0);
      const actual = items.reduce((s, b) => s + (b.actual ?? 0), 0);
      acc[cat] = { budgeted, actual, difference: actual - budgeted };
      return acc;
    },
    {} as Record<BudgetCategory, { budgeted: number; actual: number; difference: number }>
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white border-2 border-royal p-8 shadow-xl">
          <div className="flex justify-center mb-6 text-royal">
            <Lock size={48} strokeWidth={1.5} />
          </div>
          <h1 className="font-display font-bold text-2xl text-center text-royal uppercase mb-2">
            Budsjett (Admin)
          </h1>
          <p className="font-mono text-xs text-center text-royal/60 mb-8 uppercase tracking-widest">
            Kun for reiseledere
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passord..."
                className="w-full bg-paper border-b-2 border-royal/20 focus:border-royal outline-none py-2 px-1 font-mono text-royal text-center"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-red-500 text-xs text-center font-mono uppercase">Feil passord</p>
            )}
            <button
              type="submit"
              className="w-full bg-royal text-white font-mono uppercase text-xs font-bold py-3 hover:bg-royal-dark transition-colors"
            >
              Logg inn
            </button>
          </form>
          <Link
            to="/admin"
            className="mt-6 block text-center text-royal/60 hover:text-royal font-mono text-xs uppercase"
          >
            ← Tilbake til admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper selection:bg-royal selection:text-white pb-32">
      <div className="bg-royal text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-4">
          <Link
            to="/admin"
            className="text-white/80 hover:text-white flex items-center gap-2 font-mono text-xs uppercase"
          >
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <div className="bg-white text-royal font-bold font-mono px-2 py-1 text-xs rounded-sm">
            ADMIN
          </div>
          <h1 className="font-display font-bold text-xl uppercase tracking-tight hidden md:block">
            Budsjettoversikt
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => exportAdminData('budgets')}
            className="flex items-center gap-2 text-white/80 hover:text-white font-mono text-xs uppercase"
          >
            <Download size={16} /> Eksporter CSV
          </button>
          <button
            onClick={() => window.location.reload()}
            className="text-white/60 hover:text-white flex items-center gap-2 font-mono text-xs uppercase"
          >
            <LogOut size={16} /> Logg ut
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 md:py-12 space-y-10">
        {/* Quick add expense */}
        <div className="bg-white rounded-sm border border-royal/20 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="w-full flex items-center justify-center gap-3 py-5 text-royal font-mono uppercase text-sm font-bold hover:bg-royal/5 transition-colors tracking-wider"
          >
            <Plus size={18} strokeWidth={2} />
            {showAddForm ? 'Lukk' : 'Legg til utgift / budsjettpost'}
          </button>
          {showAddForm && (
            <form onSubmit={handleAddExpense} className="px-6 md:px-8 py-6 md:py-8 bg-paper/30 border-t border-royal/10">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-end">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono uppercase text-royal/50 mb-2 tracking-widest">Kategori</label>
                  <select
                    value={addCategory}
                    onChange={(e) => setAddCategory(e.target.value as BudgetCategory)}
                    className="w-full bg-white border border-royal/20 py-3 px-3 font-mono text-sm text-royal rounded-sm focus:border-royal outline-none"
                  >
                    {CATEGORY_ORDER.map((cat) => (
                      <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-mono uppercase text-royal/50 mb-2 tracking-widest">Post / beskrivelse</label>
                  <input
                    type="text"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="F.eks. Middag dag 1"
                    className="w-full bg-white border-b border-royal/20 py-3 px-2 font-mono text-sm text-royal focus:border-royal outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono uppercase text-royal/50 mb-2 tracking-widest">Budsjettert (kr)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={addBudgeted}
                    onChange={(e) => setAddBudgeted(e.target.value)}
                    placeholder="0"
                    className="w-full bg-white border-b border-royal/20 py-3 px-2 font-mono text-sm text-royal text-right focus:border-royal outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono uppercase text-royal/50 mb-2 tracking-widest">Faktisk (kr)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={addActual}
                    onChange={(e) => setAddActual(e.target.value)}
                    placeholder="Faktisk beløp"
                    className="w-full bg-white border-b border-royal/20 py-3 px-2 font-mono text-sm text-royal text-right focus:border-royal outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full bg-royal text-white py-3 px-4 font-mono uppercase text-xs font-bold hover:bg-royal-dark transition-colors tracking-wider"
                  >
                    Legg til
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Budget overview */}
        <div className="bg-white rounded-sm border border-royal/20 shadow-sm overflow-hidden">
          <div className="px-6 md:px-10 py-6 border-b border-royal/15 bg-royal/[0.04]">
            <h2 className="font-display font-bold text-lg text-royal uppercase tracking-tight">
              Budsjettoversikt
            </h2>
            <p className="font-mono text-[10px] text-royal/50 uppercase mt-2 tracking-widest">Budsjettert vs. faktisk og differanse</p>
          </div>

          <div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="font-mono text-[10px] uppercase text-royal/60 bg-royal/[0.06] border-b border-royal/15 tracking-widest">
                  <th className="text-left py-4 pl-8 pr-4 w-36">Kategori</th>
                  <th className="text-left py-4 px-4">Post</th>
                  <th className="text-right py-4 px-5 min-w-[11rem] w-44 whitespace-nowrap">Budsjettert</th>
                  <th className="text-right py-4 px-5 min-w-[11rem] w-44 whitespace-nowrap">Faktisk</th>
                  <th className="text-right py-4 px-5 min-w-[11rem] w-44 whitespace-nowrap">Differanse</th>
                  <th className="w-14 py-4 pr-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-royal/10">
                {CATEGORY_ORDER.map((category) => {
                  const items = byCategory(category);
                  const ct = categoryTotals[category];
                  return (
                    <React.Fragment key={category}>
                      {items.map((item) => {
                        const diff = (item.actual ?? 0) - item.budgeted;
                        const isEditing = editingId === item.id;
                        return (
                          <tr key={item.id} className="hover:bg-royal/[0.03] group transition-colors">
                            <td className="py-4 pl-8 pr-4 font-mono text-[10px] uppercase text-royal/55 align-middle">
                              {CATEGORY_LABELS[category]}
                            </td>
                            <td className="py-4 px-4 align-middle">
                              {isEditing ? (
                                <input
                                  className="w-full min-w-[140px] bg-paper/50 border-b border-royal/20 focus:border-royal font-medium text-royal py-1.5 px-1 rounded-none"
                                  defaultValue={item.name}
                                  onBlur={(e) => updateBudgetItem(item.id, { name: e.target.value })}
                                  onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                                  autoFocus
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setEditingId(item.id)}
                                  className="text-left font-medium text-royal hover:underline"
                                >
                                  {item.name || '–'}
                                </button>
                              )}
                            </td>
                            <td className="py-4 px-5 text-right font-mono tabular-nums text-royal/90 align-middle whitespace-nowrap min-w-[11rem]">
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="1"
                                  min="0"
                                  className="w-full min-w-[7rem] bg-paper/50 border-b border-royal/20 text-right font-mono py-1.5 px-1"
                                  defaultValue={item.budgeted}
                                  onBlur={(e) => updateBudgetItem(item.id, { budgeted: Number(e.target.value) || 0 })}
                                />
                              ) : (
                                formatKr(item.budgeted)
                              )}
                            </td>
                            <td className="py-4 px-5 text-right font-mono tabular-nums text-royal/90 align-middle whitespace-nowrap min-w-[11rem]">
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="1"
                                  min="0"
                                  className="w-full min-w-[7rem] bg-paper/50 border-b border-royal/20 text-right font-mono py-1.5 px-1"
                                  defaultValue={item.actual ?? ''}
                                  placeholder="–"
                                  onBlur={(e) => {
                                    const v = e.target.value.trim();
                                    updateBudgetItem(item.id, { actual: v === '' ? null : Number(v) || 0 });
                                  }}
                                />
                              ) : (
                                formatKr(item.actual)
                              )}
                            </td>
                            <td className={clsx('py-4 px-5 text-right font-mono tabular-nums font-medium align-middle whitespace-nowrap min-w-[11rem]', diff > 0 ? 'text-red-600' : diff < 0 ? 'text-green-600' : 'text-royal/45')}>
                              {diff !== 0 ? (diff > 0 ? '+' : '') + formatKr(diff) : '–'}
                            </td>
                            <td className="py-4 pr-6 text-right align-middle">
                              {isEditing ? (
                                <button type="button" onClick={() => setEditingId(null)} className="text-royal/50 hover:text-royal font-mono text-[10px] uppercase tracking-wider">
                                  Ferdig
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => confirm('Slette denne posten?') && removeBudgetItem(item.id)}
                                  className="text-royal/25 hover:text-red-500 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                                  title="Slett"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {items.length > 0 && (
                        <tr key={`subtotal-${category}`} className="bg-royal/[0.06] font-mono text-xs font-bold border-t border-royal/15">
                          <td className="py-4 pl-8 pr-4 uppercase text-royal/60 tracking-wider">{CATEGORY_LABELS[category]} — sum</td>
                          <td className="py-4 px-4"></td>
                          <td className="py-4 px-5 text-right tabular-nums text-royal whitespace-nowrap min-w-[11rem]">{formatKr(ct.budgeted)}</td>
                          <td className="py-4 px-5 text-right tabular-nums text-royal whitespace-nowrap min-w-[11rem]">{formatKr(ct.actual)}</td>
                          <td className={clsx('py-4 px-5 text-right tabular-nums whitespace-nowrap min-w-[11rem]', ct.difference > 0 ? 'text-red-600' : ct.difference < 0 ? 'text-green-600' : 'text-royal/55')}>
                            {ct.difference !== 0 ? (ct.difference > 0 ? '+' : '') + formatKr(ct.difference) : '–'}
                          </td>
                          <td className="py-4 pr-6"></td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-royal/30 bg-royal/10 font-display font-bold text-royal uppercase text-sm">
                  <td className="py-5 pl-8 pr-4">Total</td>
                  <td className="py-5 px-4"></td>
                  <td className="py-5 px-5 text-right tabular-nums whitespace-nowrap min-w-[11rem]">{formatKr(totals.budgeted)}</td>
                  <td className="py-5 px-5 text-right tabular-nums whitespace-nowrap min-w-[11rem]">{formatKr(totals.actual)}</td>
                  <td className={clsx('py-5 px-5 text-right tabular-nums whitespace-nowrap min-w-[11rem]', totalDifference > 0 ? 'text-red-600' : totalDifference < 0 ? 'text-green-600' : '')}>
                    {totalDifference !== 0 ? (totalDifference > 0 ? '+' : '') + formatKr(totalDifference) : '–'}
                  </td>
                  <td className="py-5 pr-6"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {budgetItems.length === 0 && (
            <div className="py-16 px-8 text-center text-royal/40 font-mono text-sm uppercase tracking-wider">
              Ingen poster ennå. Klikk «Legg til utgift / budsjettpost» for å legge til.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
