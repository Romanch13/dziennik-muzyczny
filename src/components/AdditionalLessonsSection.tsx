import React, { useState } from 'react';
import { AdditionalLesson } from '../types/journal';
import { Plus, Trash2, Check, X, CalendarCheck2, Pencil } from 'lucide-react';

interface AdditionalLessonsSectionProps {
  lessons: AdditionalLesson[];
  total: number;
  regularTotal: number;
  grandTotal: number;
  isAuthenticated: boolean;
  onUpdateLesson: (id: string, updates: Partial<AdditionalLesson>) => void;
  onDeleteLesson: (id: string) => void;
  onOpenAddLesson: () => void;
  searchFilter?: string;
}

export const AdditionalLessonsSection: React.FC<AdditionalLessonsSectionProps> = ({
  lessons,
  total,
  regularTotal,
  grandTotal,
  isAuthenticated,
  onUpdateLesson,
  onDeleteLesson,
  onOpenAddLesson,
  searchFilter = '',
}) => {
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [tempStudentName, setTempStudentName] = useState<string>('');

  const filtered = lessons.filter((l) => {
    if (!searchFilter.trim()) return true;
    return l.student.toLowerCase().includes(searchFilter.toLowerCase().trim());
  });

  return (
    <div className="bg-card-theme border rounded-3xl p-4 sm:p-6 space-y-5 shadow-sm print-card transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-inherit flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <CalendarCheck2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-main tracking-tight flex items-center gap-2">
              DODATKOWO
              <span className="text-xs font-normal text-muted">
                (dowolny dzień pn–sb + data)
              </span>
            </h3>
            <p className="text-xs text-muted">
              Konsultacje, odrabianie zajęć lub lekcje w inne dni tygodnia
            </p>
          </div>
        </div>

        {isAuthenticated && (
          <button
            onClick={onOpenAddLesson}
            className="text-xs font-semibold text-purple-800 dark:text-purple-200 hover:text-white bg-purple-100 hover:bg-purple-600 dark:bg-purple-500/20 dark:hover:bg-purple-600 border border-purple-300 dark:border-purple-500/30 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer no-print shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Dodaj lekcję dodatkową</span>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-inherit bg-subcard-theme">
        <table className="w-full text-left text-xs min-w-[620px]">
          <thead>
            <tr className="border-b border-inherit text-[11px] font-bold text-muted bg-subcard-theme whitespace-nowrap">
              <th className="py-2.5 px-3 w-8 text-center">#</th>
              <th className="py-2.5 px-3 w-32">Dzień (pn–sb)</th>
              <th className="py-2.5 px-3 w-28">Data</th>
              <th className="py-2.5 px-3 min-w-[140px]">Imię ucznia</th>
              <th className="py-2.5 px-3 w-24 text-center">Czas</th>
              <th className="py-2.5 px-3 w-24 text-right">Cena</th>
              <th className="py-2.5 px-3 w-28 text-center">Był/Nie był</th>
              <th className="py-2.5 px-3 w-24 text-right">Suma</th>
              {isAuthenticated && <th className="py-2.5 px-2 w-10 text-center no-print"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-inherit">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={isAuthenticated ? 9 : 8} className="py-8 text-center text-muted">
                  {searchFilter ? (
                    <span>Brak wyników w zajęciach dodatkowych dla: "{searchFilter}"</span>
                  ) : (
                    <span>Brak wpisów dodatkowych w tym miesiącu.</span>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => {
                const isAbsent = item.status === 'Nie był';

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isAbsent
                        ? 'bg-rose-50/70 hover:bg-rose-100/70 dark:bg-rose-500/10 dark:hover:bg-rose-500/15'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Index */}
                    <td className="py-2.5 px-3 text-center text-muted font-mono text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Day */}
                    <td className="py-2.5 px-3">
                      {isAuthenticated ? (
                        <select
                          value={item.day}
                          onChange={(e) => onUpdateLesson(item.id, { day: e.target.value })}
                          className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer shadow-xs"
                        >
                          <option value="Poniedziałek">Poniedziałek</option>
                          <option value="Wtorek">Wtorek</option>
                          <option value="Środa">Środa</option>
                          <option value="Czwartek">Czwartek</option>
                          <option value="Piątek">Piątek</option>
                          <option value="Sobota">Sobota</option>
                        </select>
                      ) : (
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{item.day}</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-2.5 px-3">
                      {isAuthenticated ? (
                        <input
                          type="text"
                          value={item.date}
                          placeholder="DD.MM.YYYY"
                          onChange={(e) => onUpdateLesson(item.id, { date: e.target.value })}
                          className="w-24 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-xs"
                        />
                      ) : (
                        <span className="text-muted font-mono text-xs">{item.date}</span>
                      )}
                    </td>

                    {/* Student */}
                    <td className="py-2.5 px-3">
                      {isAuthenticated && editingStudentId === item.id ? (
                        <div className="flex items-center gap-1.5 py-0.5">
                          <input
                            type="text"
                            autoFocus
                            value={tempStudentName}
                            onChange={(e) => setTempStudentName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = tempStudentName.trim();
                                if (val) onUpdateLesson(item.id, { student: val });
                                setEditingStudentId(null);
                              } else if (e.key === 'Escape') {
                                setEditingStudentId(null);
                              }
                            }}
                            className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-2.5 py-1 rounded-lg border-2 border-purple-500 shadow-sm text-xs font-semibold focus:outline-none"
                            placeholder="Imię ucznia"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const val = tempStudentName.trim();
                              if (val) onUpdateLesson(item.id, { student: val });
                              setEditingStudentId(null);
                            }}
                            className="p-1 rounded-md bg-purple-600 hover:bg-purple-500 text-white shadow-xs cursor-pointer"
                            title="Zapisz imię"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingStudentId(null)}
                            className="p-1 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 cursor-pointer"
                            title="Anuluj"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 group/student py-0.5">
                          <span className={`font-semibold text-xs ${isAbsent ? 'line-through text-rose-700 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
                            {item.student}
                          </span>
                          {isAuthenticated && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStudentId(item.id);
                                setTempStudentName(item.student);
                              }}
                              className="p-1 rounded-md text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer no-print shrink-0"
                              title="Edytuj imię ucznia (kliknij ołówek)"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Duration */}
                    <td className="py-2.5 px-3 text-center">
                      {isAuthenticated ? (
                        <input
                          type="text"
                          value={item.duration}
                          onChange={(e) => onUpdateLesson(item.id, { duration: e.target.value })}
                          className="w-20 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1 text-center text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-xs"
                        />
                      ) : (
                        <span className="text-slate-700 dark:text-slate-300 font-medium text-xs">{item.duration}</span>
                      )}
                    </td>

                    {/* Price */}
                    <td className="py-2.5 px-3 text-right">
                      {isAuthenticated ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            min="0"
                            step="5"
                            value={item.price}
                            onChange={(e) => {
                              const p = parseFloat(e.target.value) || 0;
                              onUpdateLesson(item.id, { price: p });
                            }}
                            className="w-16 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-right text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-xs"
                          />
                          <span className="text-xs text-muted font-medium">zł</span>
                        </div>
                      ) : (
                        <span className="text-slate-900 dark:text-slate-100 font-semibold text-xs">
                          {item.price} zł
                        </span>
                      )}
                    </td>

                    {/* Był / Nie był toggle */}
                    <td className="py-2.5 px-3 text-center">
                      {isAuthenticated ? (
                        <button
                          type="button"
                          onClick={() => {
                            const newStatus = isAbsent ? 'Był' : 'Nie był';
                            onUpdateLesson(item.id, { status: newStatus });
                          }}
                          className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                            !isAbsent
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'
                              : 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40'
                          }`}
                          title="Zmień obecność"
                        >
                          {!isAbsent ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 stroke-[3]" />
                              <span>Był</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400 stroke-[3]" />
                              <span>Nie był</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                            !isAbsent
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                              : 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30'
                          }`}
                        >
                          {!isAbsent ? <Check className="w-3 h-3 text-emerald-700" /> : <X className="w-3 h-3 text-rose-700" />}
                          {item.status || 'Był'}
                        </span>
                      )}
                    </td>

                    {/* Sum */}
                    <td className="py-2.5 px-3 text-right">
                      <span className={`font-bold font-mono text-xs ${item.sum > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        {item.sum} zł
                      </span>
                    </td>

                    {/* Actions */}
                    {isAuthenticated && (
                      <td className="py-2.5 px-2 text-center no-print">
                        <button
                          type="button"
                          onClick={() => onDeleteLesson(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Usuń wpis dodatkowy"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary rows replicating Excel layout */}
      <div className="pt-2 space-y-2.5">
        <div className="flex items-center justify-between text-xs py-2.5 px-4 rounded-xl bg-subcard-theme border border-inherit">
          <span className="font-bold text-slate-800 dark:text-slate-200">Podsumowanie Dodatkowo:</span>
          <span className="font-bold font-mono text-purple-700 dark:text-purple-300 text-sm">
            {total.toLocaleString('pl-PL')} zł
          </span>
        </div>

        <div className="flex items-center justify-between text-xs py-2.5 px-4 rounded-xl bg-amber-500/10 border border-amber-400/40 text-amber-950 dark:text-amber-200">
          <span className="font-bold uppercase tracking-wider text-xs">SUMA ZA MIESIĄC (pon + pt):</span>
          <span className="font-bold font-mono text-amber-700 dark:text-amber-300 text-sm">
            {regularTotal.toLocaleString('pl-PL')} zł
          </span>
        </div>

        <div className="flex items-center justify-between text-sm py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500/15 via-amber-500/15 to-orange-500/15 border border-orange-400/50 shadow-sm text-slate-900 dark:text-white">
          <span className="font-extrabold uppercase tracking-wider text-xs text-orange-950 dark:text-orange-200">
            SUMA CAŁKOWITA (miesiąc + Dodatkowo):
          </span>
          <span className="font-extrabold font-mono text-emerald-700 dark:text-emerald-400 text-lg">
            {grandTotal.toLocaleString('pl-PL')} zł
          </span>
        </div>
      </div>
    </div>
  );
};
