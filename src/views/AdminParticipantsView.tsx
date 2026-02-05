import { useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore, selectIsAdmin } from '../store';
import { Plus, Upload, Trash2, ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx';

const PAYMENT_PLAN_MONTH_COUNT = 10;
const MONTHLY_AMOUNT = 350;
const formatAmount = (amount: number) => `${amount} kr`;

function parseBirthDate(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString().split('T')[0];
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed?.y && parsed.m && parsed.d) {
      const month = String(parsed.m).padStart(2, '0');
      const day = String(parsed.d).padStart(2, '0');
      return `${parsed.y}-${month}-${day}`;
    }
    return undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parts = trimmed.split(/[.\-/]/).map((p) => p.trim());
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const [year, month, day] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      const [day, month, year] = parts;
      if (year.length === 4) return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  return undefined;
}

function calculateAge(birthDate?: string, fallbackAge?: number): number | undefined {
  try {
    if (!birthDate) return fallbackAge;
    const [year, month, day] = birthDate.split('-').map(Number);
    if (!year || !month || !day) return fallbackAge;
    const today = new Date();
    let age = today.getFullYear() - year;
    const hasHadBirthday =
      today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
    if (!hasHadBirthday) age -= 1;
    return age;
  } catch {
    return fallbackAge;
  }
}

function formatNameFromImport(rawName: string): string {
  const trimmed = rawName.trim();
  if (!trimmed || !trimmed.includes(',')) return trimmed;
  const [surname, firstNames] = trimmed.split(',').map((p) => p.trim());
  if (!surname) return firstNames ?? '';
  if (!firstNames) return surname;
  return `${firstNames} ${surname}`;
}

function normalizeHeader(header: string) {
  return header.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}
function getColumnIndex(headers: string[], options: string[]) {
  const normalized = headers.map(normalizeHeader);
  for (const option of options) {
    const idx = normalized.indexOf(normalizeHeader(option));
    if (idx !== -1) return idx;
  }
  return -1;
}
function getIndexOrFallback(headers: string[], options: string[], fallback: number) {
  const idx = getColumnIndex(headers, options);
  return idx === -1 ? fallback : idx;
}

function parseDelimitedText(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  for (const line of lines) {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = line[i + 1];
      if (char === '"' && next === '"') { current += '"'; i += 1; continue; }
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === delimiter && !inQuotes) { row.push(current); current = ''; continue; }
      current += char;
    }
    row.push(current);
    rows.push(row);
  }
  return rows;
}

export function AdminParticipantsView() {
  const isAdmin = useStore(selectIsAdmin);
  const {
    users,
    paymentMonths,
    addUser,
    removeUser,
    updateUser,
    importParticipants,
    removeAllUsers,
  } = useStore();

  const [newUserName, setNewUserName] = useState('');
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantSort, setParticipantSort] = useState<{
    key: 'name' | 'email' | 'phone' | 'birthDate' | 'age' | null;
    dir: 'asc' | 'desc';
  }>({ key: null, dir: 'asc' });
  const [showParticipants, setShowParticipants] = useState(true);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSort = (key: 'name' | 'email' | 'phone' | 'birthDate' | 'age') => {
    setParticipantSort((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return { key: null, dir: 'asc' };
    });
  };
  const sortIndicator = (key: 'name' | 'email' | 'phone' | 'birthDate' | 'age') => {
    if (participantSort.key !== key) return '↕';
    return participantSort.dir === 'asc' ? '↑' : '↓';
  };

  const filteredUsers = useMemo(() => {
    const norm = participantSearch.trim().toLowerCase();
    const base = users.filter((u) => {
      if (!norm) return true;
      const hay = [u.fullName, u.displayName, u.email, u.phone, u.birthDate, String(u.age ?? '')]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(norm);
    });
    if (!participantSort.key) return base;
    const getVal = (u: (typeof users)[number]) => {
      switch (participantSort.key) {
        case 'name': return u.fullName;
        case 'email': return u.email || '';
        case 'phone': return u.phone || '';
        case 'birthDate': return u.birthDate || '';
        case 'age': return calculateAge(u.birthDate, u.age);
        default: return '';
      }
    };
    const cmp = (a: unknown, b: unknown) => {
      if (a === '' || a == null) return 1;
      if (b === '' || b == null) return -1;
      if (typeof a === 'number' && typeof b === 'number') return (Number.isNaN(a - b) ? 0 : a - b);
      return String(a).localeCompare(String(b), 'nb', { sensitivity: 'base' });
    };
    return [...base].sort((a, b) => {
      const r = cmp(getVal(a), getVal(b));
      return participantSort.dir === 'asc' ? r : -r;
    });
  }, [users, participantSearch, participantSort]);

  const getPaidMonthsForUser = (userId: string) =>
    paymentMonths.filter((r) => r.userId === userId && r.paid).length;

  const shouldShowParticipants = showParticipants || participantSearch.trim().length > 0;

  const handleImportFile = async (file: File) => {
    setImportError(null);
    let rows: Array<Array<unknown>> = [];
    if (file.name.toLowerCase().endsWith('.csv')) {
      const text = await file.text();
      const first = text.split(/\r?\n/)[0] || '';
      const delim = first.includes(';') ? ';' : ',';
      rows = parseDelimitedText(text, delim) as unknown as Array<Array<unknown>>;
    } else {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as Array<Array<unknown>>;
    }
    if (!rows.length) { setImportError('Filen er tom.'); return; }
    const headers = rows[0].map((v, i) => (i === 0 ? String(v || '').replace(/^\uFEFF/, '') : String(v || '')).trim()) as string[];
    const nameIdx = getIndexOrFallback(headers, ['Navn', 'Name'], 0);
    const ageIdx = getIndexOrFallback(headers, ['Alder', 'Age'], 1);
    const birthIdx = getColumnIndex(headers, ['Fødselsdato', 'Foedselsdato', 'Birthdate', 'DateOfBirth', 'Dob']);
    const phoneIdx = getIndexOrFallback(headers, ['Mobiltelefon', 'Telefon', 'Phone', 'Mobile'], 3);
    const emailIdx = getIndexOrFallback(headers, ['Epostadresse', 'E-postadresse', 'Epost', 'Email', 'E-mail'], 4);
    const participants = rows.slice(1)
      .map((row) => {
        if (!row.some((v) => String(v || '').trim() !== '')) return null;
        const fullName = formatNameFromImport(String(row[nameIdx] || '').trim());
        if (!fullName) return null;
        const birthDate = birthIdx !== -1 ? parseBirthDate(row[birthIdx]) : undefined;
        const email = emailIdx !== -1 ? String(row[emailIdx] || '').trim() || undefined : undefined;
        const phone = phoneIdx !== -1 ? String(row[phoneIdx] || '').trim() || undefined : undefined;
        const ageVal = ageIdx !== -1 ? Number(String(row[ageIdx] || '').trim()) : undefined;
        const age = Number.isFinite(ageVal) ? ageVal : undefined;
        return { fullName, displayName: fullName, email, phone, birthDate: birthDate || undefined, age };
      })
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
    if (participants.length === 0) { setImportError('Fant ingen deltakere å importere.'); return; }
    await importParticipants(participants);
  };

  if (!isAdmin) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:p-6 md:p-12 py-8 md:py-12">
      <div className="mb-6">
        <Link to="/admin" className="text-royal/60 hover:text-royal flex items-center gap-2 font-mono text-xs uppercase">
          <ArrowLeft size={16} /> Tilbake til dashboard
        </Link>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-end pb-2 flex-wrap gap-4">
          <h2 className="font-display font-bold text-2xl text-royal uppercase">Administrer Deltakere</h2>
          <div className="flex gap-2 items-center flex-wrap">
            <button
              type="button"
              onClick={() => setShowParticipants((p) => !p)}
              className="flex items-center gap-2 border border-royal/20 text-royal px-4 py-2 text-xs font-mono uppercase font-bold hover:border-royal/60"
            >
              {shouldShowParticipants ? 'Skjul deltakere' : 'Vis deltakere'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { handleImportFile(f); e.currentTarget.value = ''; }
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 border border-royal/20 text-royal px-4 py-2 text-xs font-mono uppercase font-bold hover:border-royal/60"
            >
              <Upload size={14} /> Importer
            </button>
            <button
              onClick={() => { if (users.length && confirm('Er du sikker på at du vil slette alle deltakere?')) removeAllUsers(); }}
              className="flex items-center gap-2 border border-red-300 text-red-500 px-4 py-2 text-xs font-mono uppercase font-bold hover:border-red-500"
            >
              Slett alle
            </button>
            <input
              className="w-48 border-b border-royal/20 bg-transparent text-sm py-1 focus:border-royal outline-none"
              placeholder="Navn på ny deltaker..."
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              onKeyDown={async (e) => { if (e.key === 'Enter' && newUserName.trim()) { const ok = await addUser(newUserName); if (ok) setNewUserName(''); } }}
            />
            <button
              disabled={!newUserName.trim()}
              onClick={async () => { const ok = await addUser(newUserName); if (ok) setNewUserName(''); }}
              className="flex items-center gap-2 bg-royal text-white px-4 py-2 text-xs font-mono uppercase font-bold hover:bg-royal-dark disabled:opacity-50"
            >
              <Plus size={14} /> Legg til
            </button>
          </div>
        </div>

        {importError && <div className="text-red-500 text-xs font-mono uppercase">{importError}</div>}
        <input
          className="w-full md:w-72 border-b border-royal/20 bg-transparent text-sm py-1 focus:border-royal outline-none"
          placeholder="Søk etter deltaker..."
          value={participantSearch}
          onChange={(e) => setParticipantSearch(e.target.value)}
        />

        {shouldShowParticipants ? (
          <div className="bg-white border border-royal/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white font-mono text-[10px] uppercase text-royal/60 sticky top-0 z-10">
                  <tr>
                    <th className="py-3 pl-6">
                      <button onClick={() => handleSort('name')} className="hover:text-royal cursor-pointer">Navn <span className="text-royal/40">{sortIndicator('name')}</span></button>
                    </th>
                    <th className="py-3">
                      <button onClick={() => handleSort('email')} className="hover:text-royal cursor-pointer">E-post <span className="text-royal/40">{sortIndicator('email')}</span></button>
                    </th>
                    <th className="py-3">
                      <button onClick={() => handleSort('phone')} className="hover:text-royal cursor-pointer">Telefon <span className="text-royal/40">{sortIndicator('phone')}</span></button>
                    </th>
                    <th className="py-3">
                      <button onClick={() => handleSort('birthDate')} className="hover:text-royal cursor-pointer">Fødselsdato <span className="text-royal/40">{sortIndicator('birthDate')}</span></button>
                    </th>
                    <th className="py-3">
                      <button onClick={() => handleSort('age')} className="hover:text-royal cursor-pointer">Alder <span className="text-royal/40">{sortIndicator('age')}</span></button>
                    </th>
                    <th className="py-3">Betalt</th>
                    <th className="py-3 text-right pr-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-royal/5">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-royal/5 group">
                      <td className="py-3 pl-6 font-medium text-royal participant-name">{user.fullName}</td>
                      <td className="py-3 text-royal/80">
                        {user.email ? (
                          <button
                            onClick={async () => {
                              try { await navigator.clipboard.writeText(user.email ?? ''); } catch {
                                const ta = document.createElement('textarea');
                                ta.value = user.email ?? '';
                                document.body.appendChild(ta);
                                ta.select();
                                document.execCommand('copy');
                                ta.remove();
                              }
                            }}
                            className="text-royal/60 hover:text-royal text-xs font-mono uppercase"
                            title={`Kopier: ${user.email}`}
                          >
                            Kopier e-post
                          </button>
                        ) : (
                          <span className="text-royal/30 text-xs italic">Ingen e-post</span>
                        )}
                      </td>
                      <td className="py-3">
                        <input
                          className="bg-transparent border-b border-transparent focus:border-royal outline-none w-full no-underline-input"
                          defaultValue={user.phone ?? ''}
                          onBlur={(e) => { if (e.target.value !== (user.phone ?? '')) updateUser(user.id, { phone: e.target.value }); }}
                          placeholder="Telefon"
                          type="tel"
                        />
                      </td>
                      <td className="py-3">
                        <input
                          className="bg-transparent border-b border-transparent focus:border-royal outline-none w-32 no-underline-input no-date-icon"
                          defaultValue={user.birthDate ?? ''}
                          onBlur={(e) => { if (e.target.value !== (user.birthDate ?? '')) updateUser(user.id, { birthDate: e.target.value || undefined }); }}
                          placeholder="YYYY-MM-DD"
                          type="date"
                        />
                      </td>
                      <td className="py-3 text-royal/80 font-mono text-xs">{calculateAge(user.birthDate, user.age) ?? ''}</td>
                      <td className="py-3 text-royal/80">
                        <div className="text-xs font-mono uppercase text-royal/50">
                          {getPaidMonthsForUser(user.id)} / {PAYMENT_PLAN_MONTH_COUNT} mnd
                        </div>
                        <div className="text-sm font-bold text-royal">{formatAmount(getPaidMonthsForUser(user.id) * MONTHLY_AMOUNT)}</div>
                        <div className="mt-2 h-1.5 w-28 bg-royal/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-royal via-royal-dark to-royal transition-all"
                            style={{ width: `${Math.min(100, Math.round((getPaidMonthsForUser(user.id) / PAYMENT_PLAN_MONTH_COUNT) * 100))}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 text-right pr-6">
                        <button
                          onClick={() => { if (confirm(`Er du sikker på at du vil slette ${user.fullName}?`)) removeUser(user.id); }}
                          className="text-royal/20 hover:text-red-500 p-1"
                          title="Slett deltaker"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-royal/40 italic">Ingen deltakere funnet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white/60 border border-royal/10 shadow-sm p-6 text-royal/50 text-xs font-mono uppercase">
            Deltakere er skjult. Søk etter navn eller klikk "Vis deltakere".
          </div>
        )}
      </div>
    </div>
  );
}
