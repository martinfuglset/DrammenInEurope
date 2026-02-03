import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import type { BudgetCategory, BudgetItem } from '../types';
import { Lock, LogOut, ArrowLeft, Plus, Trash2, Download, Edit2, ChevronDown, ChevronUp, Calendar, Bell, FileText, Paperclip, X, ExternalLink } from 'lucide-react';
import clsx from 'clsx';

const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  meals: 'Måltider',
  activities: 'Aktiviteter',
  transportation: 'Transport',
  staying_places: 'Overnatting',
  equipment: 'Utstyr/innkjøp',
  administration: 'Administrasjon (gebyrer, forsikring)',
  buffer: 'Buffer/uforutsett',
  other: 'Annet',
};

const CATEGORY_ORDER: BudgetCategory[] = [
  'meals',
  'activities',
  'transportation',
  'staying_places',
  'equipment',
  'administration',
  'buffer',
  'other',
];

function formatKr(n: number | null): string {
  if (n === null || n === undefined) return '–';
  return `${Math.round(n).toLocaleString('nb-NO')} kr`;
}

export function AdminBudgetsView() {
  const {
    isAdmin,
    loginAdmin,
    budgetItems,
    users,
    addBudgetItem,
    updateBudgetItem,
    removeBudgetItem,
    exportAdminData,
    uploadBudgetAttachment,
  } = useStore();

  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addCategory, setAddCategory] = useState<BudgetCategory>('other');
  const [addName, setAddName] = useState('');
  const [addBudgeted, setAddBudgeted] = useState('');
  const [addActual, setAddActual] = useState('');
  const [addDueDate, setAddDueDate] = useState('');
  const [addDeposit, setAddDeposit] = useState('');
  const [addAlertDays, setAddAlertDays] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<BudgetCategory, boolean>>(
    () => CATEGORY_ORDER.reduce((acc, cat) => ({ ...acc, [cat]: false }), {} as Record<BudgetCategory, boolean>)
  );

  const toggleCategoryPosts = (category: BudgetCategory) => {
    setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const selectedItem = selectedItemId ? budgetItems.find((b) => b.id === selectedItemId) : null;
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginAdmin(password)) setError(true);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const budgeted = Number(addBudgeted.replace(/\s/g, '')) || 0;
    const actual = addActual.trim() === '' ? null : Number(addActual.replace(/\s/g, '')) || 0;
    const deposit = addDeposit.trim() ? Number(addDeposit.replace(/\s/g, '')) : undefined;
    const alertDays = addAlertDays.trim() ? Number(addAlertDays) : undefined;
    addBudgetItem(addCategory, addName.trim() || 'Utgift', budgeted, actual, addDueDate || undefined, deposit, alertDays);
    setAddName('');
    setAddBudgeted('');
    setAddActual('');
    setAddDueDate('');
    setAddDeposit('');
    setAddAlertDays('');
    setShowAddForm(false);
  };

  const removeAttachment = (item: BudgetItem, index: number) => {
    const attachments = [...(item.attachments || [])];
    attachments.splice(index, 1);
    updateBudgetItem(item.id, { attachments });
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

  const participantCount = users.length;
  const budgetPerPerson =
    participantCount > 0
      ? {
          budgeted: Math.round(totals.budgeted / participantCount),
          actual: Math.round(totals.actual / participantCount),
          difference: Math.round((totals.actual - totals.budgeted) / participantCount),
        }
      : null;

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
        {/* Budget overview: overall + per person */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-sm border border-royal/20 shadow-sm p-6">
            <h2 className="font-display font-bold text-sm text-royal/70 uppercase tracking-wider mb-4">
              Budsjett totalt
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="font-mono text-xs uppercase text-royal/60">Budsjettert</span>
                <span className="font-mono font-bold text-royal tabular-nums">{formatKr(totals.budgeted)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-mono text-xs uppercase text-royal/60">Faktisk</span>
                <span className="font-mono font-bold text-royal tabular-nums">{formatKr(totals.actual)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-royal/10">
                <span className="font-mono text-xs uppercase text-royal/60">Differanse</span>
                <span
                  className={clsx(
                    'font-mono font-bold tabular-nums',
                    totalDifference > 0 ? 'text-red-600' : totalDifference < 0 ? 'text-green-600' : 'text-royal/70'
                  )}
                >
                  {totalDifference !== 0 ? (totalDifference > 0 ? '+' : '') + formatKr(totalDifference) : '–'}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-sm border border-royal/20 shadow-sm p-6">
            <h2 className="font-display font-bold text-sm text-royal/70 uppercase tracking-wider mb-4">
              Budsjett per person
              {participantCount > 0 && (
                <span className="font-mono text-[10px] font-normal text-royal/50 ml-2">
                  ({participantCount} deltakere)
                </span>
              )}
            </h2>
            {budgetPerPerson ? (
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="font-mono text-xs uppercase text-royal/60">Budsjettert</span>
                  <span className="font-mono font-bold text-royal tabular-nums">{formatKr(budgetPerPerson.budgeted)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="font-mono text-xs uppercase text-royal/60">Faktisk</span>
                  <span className="font-mono font-bold text-royal tabular-nums">{formatKr(budgetPerPerson.actual)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-royal/10">
                  <span className="font-mono text-xs uppercase text-royal/60">Differanse</span>
                  <span
                    className={clsx(
                      'font-mono font-bold tabular-nums',
                      budgetPerPerson.difference > 0
                        ? 'text-red-600'
                        : budgetPerPerson.difference < 0
                          ? 'text-green-600'
                          : 'text-royal/70'
                    )}
                  >
                    {budgetPerPerson.difference !== 0
                      ? (budgetPerPerson.difference > 0 ? '+' : '') + formatKr(budgetPerPerson.difference)
                      : '–'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="font-mono text-xs text-royal/50 uppercase">
                Legg til deltakere i admin for å se budsjett per person.
              </p>
            )}
          </div>
        </div>

        {/* Kontroll og rapportering – dashbord */}
        <div className="bg-white rounded-sm border border-royal/20 shadow-sm overflow-hidden">
          <div className="px-6 md:px-10 py-6 border-b border-royal/15 bg-royal/[0.04]">
            <h2 className="font-display font-bold text-lg text-royal uppercase tracking-tight">
              Kontroll og rapportering
            </h2>
            <p className="font-mono text-[10px] text-royal/50 uppercase mt-2 tracking-widest">Forbruk i % av budsjett • Kostnadsdrivere • Pris per deltaker</p>
          </div>
          <div className="p-6 md:p-10 space-y-8">
            {/* Forbruk i % av budsjett */}
            <div>
              <h3 className="font-mono text-[10px] uppercase text-royal/60 tracking-widest mb-4">Forbruk i % av budsjett</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm text-royal/70 w-48">Total</span>
                  <div className="flex-1 h-6 bg-royal/10 rounded-full overflow-hidden">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all',
                        totals.budgeted > 0 && totals.actual / totals.budgeted > 1 ? 'bg-red-500' : 'bg-royal'
                      )}
                      style={{
                        width: totals.budgeted > 0 ? `${Math.min(100, (totals.actual / totals.budgeted) * 100)}%` : '0%',
                      }}
                    />
                  </div>
                  <span className="font-mono text-sm font-bold text-royal tabular-nums w-16 text-right">
                    {totals.budgeted > 0 ? `${Math.round((totals.actual / totals.budgeted) * 100)}%` : '–'}
                  </span>
                </div>
                {CATEGORY_ORDER.map((cat) => {
                  const ct = categoryTotals[cat];
                  const pct = ct.budgeted > 0 ? (ct.actual / ct.budgeted) * 100 : 0;
                  return (
                    <div key={cat} className="flex items-center gap-4">
                      <span className="font-mono text-[10px] text-royal/60 w-48 truncate">{CATEGORY_LABELS[cat]}</span>
                      <div className="flex-1 h-4 bg-royal/10 rounded-full overflow-hidden">
                        <div
                          className={clsx('h-full rounded-full transition-all', pct > 100 ? 'bg-red-400' : 'bg-royal/70')}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] font-bold text-royal tabular-nums w-14 text-right">
                        {ct.budgeted > 0 ? `${Math.round(pct)}%` : '–'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Største kostnadsdrivere */}
            <div>
              <h3 className="font-mono text-[10px] uppercase text-royal/60 tracking-widest mb-4">Største kostnadsdrivere</h3>
              <div className="bg-paper/30 rounded border border-royal/10 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="font-mono text-[10px] uppercase text-royal/50 border-b border-royal/10">
                      <th className="text-left py-2 pl-4">Post</th>
                      <th className="text-left py-2">Kategori</th>
                      <th className="text-right py-2 pr-4">Faktisk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...budgetItems]
                      .filter((b) => (b.actual ?? 0) > 0)
                      .sort((a, b) => (b.actual ?? 0) - (a.actual ?? 0))
                      .slice(0, 10)
                      .map((item) => (
                        <tr key={item.id} className="border-b border-royal/5 last:border-0">
                          <td className="py-2 pl-4 font-medium text-royal">{item.name}</td>
                          <td className="py-2 font-mono text-[10px] text-royal/60">{CATEGORY_LABELS[item.category]}</td>
                          <td className="py-2 pr-4 font-mono text-right tabular-nums text-royal">{formatKr(item.actual)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {budgetItems.filter((b) => (b.actual ?? 0) > 0).length === 0 && (
                  <div className="py-8 text-center font-mono text-xs text-royal/40">Ingen kostnader registrert ennå</div>
                )}
              </div>
            </div>
            {/* Varsel før forfallsdato */}
            <div>
              <h3 className="font-mono text-[10px] uppercase text-royal/60 tracking-widest mb-4 flex items-center gap-2">
                <Bell size={14} /> Varsel før forfallsdato
              </h3>
              <div className="bg-paper/30 rounded border border-royal/10 overflow-hidden">
                <ul className="divide-y divide-royal/5">
                  {budgetItems
                    .filter((b) => b.dueDate)
                    .map((item) => {
                      const due = new Date(item.dueDate!);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      due.setHours(0, 0, 0, 0);
                      const daysUntil = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      const alertDays = item.alertDaysBefore ?? 7;
                      const shouldAlert = daysUntil >= 0 && daysUntil <= alertDays;
                      return (
                        <li
                          key={item.id}
                          className={clsx(
                            'flex items-center justify-between gap-4 py-3 px-4',
                            shouldAlert && 'bg-amber-50/50 border-l-4 border-amber-400'
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedItemId(item.id)}
                            className="text-left font-medium text-royal hover:underline"
                          >
                            {item.name}
                          </button>
                          <span className="font-mono text-xs text-royal/70">
                            Forfallsdato: {new Date(item.dueDate!).toLocaleDateString('nb-NO')}
                            {daysUntil >= 0 && (
                              <span className={shouldAlert ? ' text-amber-700 font-bold' : ''}>
                                {' '}
                                ({daysUntil === 0 ? 'i dag' : daysUntil === 1 ? 'i morgen' : `om ${daysUntil} dager`})
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                </ul>
                {budgetItems.filter((b) => b.dueDate).length === 0 && (
                  <div className="py-6 text-center font-mono text-xs text-royal/40">Ingen forfallsdatoer satt</div>
                )}
              </div>
            </div>

            {/* Pris per deltaker – revisjonsvennlig oversikt */}
            <div>
              <h3 className="font-mono text-[10px] uppercase text-royal/60 tracking-widest mb-4">Pris per deltaker</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-paper/30 border border-royal/10 rounded p-4">
                  <div className="font-mono text-[10px] uppercase text-royal/50 mb-1">Budsjettert per person</div>
                  <div className="font-display font-bold text-xl text-royal">
                    {budgetPerPerson ? formatKr(budgetPerPerson.budgeted) : '–'}
                  </div>
                  {participantCount > 0 && (
                    <div className="font-mono text-[10px] text-royal/50 mt-1">{participantCount} deltakere</div>
                  )}
                </div>
                <div className="bg-paper/30 border border-royal/10 rounded p-4">
                  <div className="font-mono text-[10px] uppercase text-royal/50 mb-1">Faktisk per person</div>
                  <div className="font-display font-bold text-xl text-royal">
                    {budgetPerPerson ? formatKr(budgetPerPerson.actual) : '–'}
                  </div>
                </div>
                <div className="bg-paper/30 border border-royal/10 rounded p-4">
                  <div className="font-mono text-[10px] uppercase text-royal/50 mb-1">Differanse per person</div>
                  <div
                    className={clsx(
                      'font-display font-bold text-xl',
                      budgetPerPerson
                        ? budgetPerPerson.difference > 0
                          ? 'text-red-600'
                          : budgetPerPerson.difference < 0
                            ? 'text-green-600'
                            : 'text-royal'
                        : 'text-royal'
                    )}
                  >
                    {budgetPerPerson && budgetPerPerson.difference !== 0
                      ? (budgetPerPerson.difference > 0 ? '+' : '') + formatKr(budgetPerPerson.difference)
                      : budgetPerPerson ? '–' : '–'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legg til utgift – rett over budsjettet */}
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
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-mono uppercase text-royal/50 mb-2 tracking-widest">Forfallsdato</label>
                  <input
                    type="date"
                    value={addDueDate}
                    onChange={(e) => setAddDueDate(e.target.value)}
                    className="w-full bg-white border-b border-royal/20 py-3 px-2 font-mono text-sm text-royal focus:border-royal outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono uppercase text-royal/50 mb-2 tracking-widest">Depositum (kr)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={addDeposit}
                    onChange={(e) => setAddDeposit(e.target.value)}
                    placeholder="0"
                    className="w-full bg-white border-b border-royal/20 py-3 px-2 font-mono text-sm text-royal text-right focus:border-royal outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono uppercase text-royal/50 mb-2 tracking-widest">Varsel (dager før)</label>
                  <input
                    type="number"
                    min="0"
                    value={addAlertDays}
                    onChange={(e) => setAddAlertDays(e.target.value)}
                    placeholder="7"
                    className="w-full bg-white border-b border-royal/20 py-3 px-2 font-mono text-sm text-royal text-right focus:border-royal outline-none"
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Budget overview (poster per kategori) */}
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
                  const isExpanded = expandedCategories[category];
                  return (
                    <React.Fragment key={category}>
                      {/* Category overview row (always visible) */}
                      <tr className="bg-royal/[0.06] font-mono text-xs font-bold border-b border-royal/15">
                        <td className="py-4 pl-8 pr-4 uppercase text-royal/60 tracking-wider align-middle">
                          {CATEGORY_LABELS[category]}
                        </td>
                        <td className="py-4 px-4 align-middle">
                          <button
                            type="button"
                            onClick={() => toggleCategoryPosts(category)}
                            className="flex items-center gap-2 text-royal/70 hover:text-royal font-mono text-[10px] uppercase tracking-wider"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp size={14} /> Skjul poster
                              </>
                            ) : (
                              <>
                                <ChevronDown size={14} /> Vis poster {items.length > 0 && `(${items.length})`}
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-4 px-5 text-right tabular-nums text-royal whitespace-nowrap min-w-[11rem] align-middle">{formatKr(ct.budgeted)}</td>
                        <td className="py-4 px-5 text-right tabular-nums text-royal whitespace-nowrap min-w-[11rem] align-middle">{formatKr(ct.actual)}</td>
                        <td className={clsx('py-4 px-5 text-right tabular-nums whitespace-nowrap min-w-[11rem] align-middle', ct.difference > 0 ? 'text-red-600' : ct.difference < 0 ? 'text-green-600' : 'text-royal/55')}>
                          {ct.difference !== 0 ? (ct.difference > 0 ? '+' : '') + formatKr(ct.difference) : '–'}
                        </td>
                        <td className="py-4 pr-6"></td>
                      </tr>
                      {/* Individual posts (only when category expanded) */}
                      {isExpanded &&
                        items.map((item) => {
                          const diff = (item.actual ?? 0) - item.budgeted;
                          const isEditing = editingId === item.id;
                          return (
                            <tr key={item.id} className="hover:bg-royal/[0.03] group transition-colors">
                              <td className="py-3 pl-12 pr-4 font-mono text-[10px] uppercase text-royal/45 align-middle">
                                {CATEGORY_LABELS[category]}
                              </td>
                              <td className="py-3 px-4 align-middle">
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
                                    onClick={() => setSelectedItemId(item.id)}
                                    className="text-left font-medium text-royal hover:underline flex items-center gap-1"
                                  >
                                    {item.name || '–'}
                                    <FileText size={12} className="text-royal/50" />
                                  </button>
                                )}
                              </td>
                              <td className="py-3 px-5 text-right font-mono tabular-nums text-royal/90 align-middle whitespace-nowrap min-w-[11rem]">
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
                              <td className="py-3 px-5 text-right font-mono tabular-nums text-royal/90 align-middle whitespace-nowrap min-w-[11rem]">
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
                              <td className={clsx('py-3 px-5 text-right font-mono tabular-nums font-medium align-middle whitespace-nowrap min-w-[11rem]', diff > 0 ? 'text-red-600' : diff < 0 ? 'text-green-600' : 'text-royal/45')}>
                                {diff !== 0 ? (diff > 0 ? '+' : '') + formatKr(diff) : '–'}
                              </td>
                              <td className="py-3 pr-6 text-right align-middle flex items-center justify-end gap-1">
                                {isEditing ? (
                                  <button type="button" onClick={() => setEditingId(null)} className="text-royal/50 hover:text-royal font-mono text-[10px] uppercase tracking-wider">
                                    Ferdig
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setEditingId(item.id)}
                                      className="text-royal/40 hover:text-royal p-1.5 rounded"
                                      title="Rediger"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => confirm('Slette denne posten?') && removeBudgetItem(item.id)}
                                      className="text-royal/25 hover:text-red-500 p-1.5 rounded"
                                      title="Slett"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })}
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

        {/* Post detail modal (notater, forfallsdato, depositum, vedlegg) */}
        {selectedItem && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-royal/20"
            onClick={() => setSelectedItemId(null)}
          >
            <div
              className="bg-white rounded-lg border-2 border-royal shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-royal/15 px-6 py-4 flex justify-between items-start">
                <h3 className="font-display font-bold text-xl text-royal uppercase">{selectedItem.name}</h3>
                <button type="button" onClick={() => setSelectedItemId(null)} className="p-2 text-royal/60 hover:text-royal">
                  <X size={24} />
                </button>
              </div>
              <div className="px-6 py-6 space-y-6">
                <div className="font-mono text-[10px] uppercase text-royal/50 tracking-widest">
                  {CATEGORY_LABELS[selectedItem.category]}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-royal/50">Budsjettert</div>
                    <div className="font-mono font-bold text-royal">{formatKr(selectedItem.budgeted)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase text-royal/50">Faktisk</div>
                    <div className="font-mono font-bold text-royal">{formatKr(selectedItem.actual)}</div>
                  </div>
                </div>
                {/* Deadline-styring */}
                <div className="border-t border-royal/10 pt-4">
                  <h4 className="font-mono text-[10px] uppercase text-royal/60 tracking-widest mb-3">Deadline-styring</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-royal/50 mb-1">Forfallsdato</label>
                      <input
                        type="date"
                        className="w-full border-b border-royal/20 py-2 font-mono text-sm bg-transparent focus:border-royal outline-none"
                        value={selectedItem.dueDate ?? ''}
                        onChange={(e) => updateBudgetItem(selectedItem.id, { dueDate: e.target.value || undefined })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-royal/50 mb-1">Depositum (kr)</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full border-b border-royal/20 py-2 font-mono text-sm bg-transparent text-right focus:border-royal outline-none"
                        value={selectedItem.deposit ?? ''}
                        onChange={(e) => updateBudgetItem(selectedItem.id, { deposit: e.target.value === '' ? undefined : Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase text-royal/50 mb-1">Restbeløp</div>
                      <div className="font-mono font-bold text-royal">
                        {formatKr(Math.max(0, (selectedItem.budgeted ?? 0) - (selectedItem.deposit ?? 0)))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-[10px] font-mono uppercase text-royal/50 mb-1">Varsel (dager før forfallsdato)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full max-w-[8rem] border-b border-royal/20 py-2 font-mono text-sm bg-transparent focus:border-royal outline-none"
                      value={selectedItem.alertDaysBefore ?? ''}
                      onChange={(e) => updateBudgetItem(selectedItem.id, { alertDaysBefore: e.target.value === '' ? undefined : Number(e.target.value) })}
                    />
                  </div>
                </div>
                {/* Notater */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-royal/50 mb-2">Notater</label>
                  <textarea
                    className="w-full border border-royal/20 rounded p-3 font-mono text-sm text-royal focus:border-royal outline-none min-h-[100px]"
                    value={selectedItem.notes ?? ''}
                    onChange={(e) => updateBudgetItem(selectedItem.id, { notes: e.target.value })}
                    placeholder="Notater om denne posten..."
                  />
                </div>
                {/* Vedlegg */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-mono uppercase text-royal/50 tracking-widest">Vedlegg (avtaler, kvitteringer)</label>
                    <input
                      ref={attachmentInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          uploadBudgetAttachment(selectedItem.id, file);
                          e.target.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => attachmentInputRef.current?.click()}
                      className="flex items-center gap-2 text-royal font-mono text-xs uppercase hover:underline"
                    >
                      <Paperclip size={14} /> Legg ved fil
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {(selectedItem.attachments || []).map((att, idx) => (
                      <li key={idx} className="flex items-center justify-between gap-2 py-2 border-b border-royal/5">
                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-royal font-mono text-sm hover:underline truncate">
                          <ExternalLink size={14} /> {att.name}
                        </a>
                        <button
                          type="button"
                          onClick={() => removeAttachment(selectedItem, idx)}
                          className="text-royal/40 hover:text-red-500 p-1"
                          title="Fjern vedlegg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                    {(selectedItem.attachments?.length ?? 0) === 0 && (
                      <li className="text-royal/40 font-mono text-xs italic">Ingen vedlegg</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
