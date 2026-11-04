import React, { useState } from 'react';
import { DaySchedule, Lesson, CopiedDayTemplate } from '../types/journal';
import { 
  Check, 
  X, 
  Plus, 
  Trash2, 
  Clock,
  Pencil,
  Copy,
  ClipboardPaste
} from 'lucide-react';

interface DayTableProps {
  day: DaySchedule;
  dayType: 'monday' | 'friday' | 'single';
  isAuthenticated: boolean;
  onUpdateLesson: (lessonId: string, updates: Partial<Lesson>) => void;
  onDeleteLesson: (lessonId: string) => void;
  onOpenAddLesson: () => void;
  searchFilter?: string;
  copiedTemplate?: CopiedDayTemplate | null;
  onCopyAsTemplate?: () => void;
  onPasteTemplate?: (mode: 'replace' | 'append') => void;
}

export const DayTable: React.FC<DayTableProps> = ({
  day,
  dayType,
  isAuthenticated,
  onUpdateLesson,
  onDeleteLesson,
  onOpenAddLesson,
  searchFilter = '',
  copiedTemplate = null,
  onCopyAsTemplate,
  onPasteTemplate,
}) => {
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [tempStudentName, setTempStudentName] = useState<string>('');
  const [showPasteMenu, setShowPasteMenu] = useState(false);

  const isMonday = dayType === 'monday';
  const badgeColor = isMonday 
    ? 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300 border-sky-300 dark:border-sky-500/30' 
    : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/30';

  const filteredLessons = day.lessons.filter((l) => {
    if (!searchFilter.trim()) return true;
    return l.student.toLowerCase().includes(searchFilter.toLowerCase().trim());
  });

  return (
    <div className="rounded-2xl border bg-card-theme shadow-sm flex flex-col justify-between overflow-hidden transition-colors">
      {/* Table Header */}
      <div className="p-3.5 border-b border-inherit flex items-center justify-between flex-wrap gap-2 bg-subcard-theme">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
            {day.dayOfWeek}
          </span>
          <h4 className="text-sm font-bold text-main">
            {day.date || day.title}
          </h4>
          <span className="text-xs text-muted font-medium">
            ({day.lessons.length} {day.lessons.length === 1 ? 'lekcja' : 'lekcji'})
          </span>
        </div>

        {isAuthenticated && (
          <div className="flex items-center gap-1.5 no-print relative">
            {/* Template Copy Button */}
            {onCopyAsTemplate && (
              <button
                type="button"
                onClick={onCopyAsTemplate}
                className="text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-700 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                title="Kopiuj listę uczniów z tego dnia jako szablon"
              >
                <Copy className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>Kopiuj dzień</span>
              </button>
            )}

            {/* Template Paste Button */}
            {copiedTemplate && onPasteTemplate && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPasteMenu(!showPasteMenu)}
                  className="text-[11px] font-semibold text-indigo-800 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-300 dark:border-indigo-600 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                  title={`Wklej szablon (${copiedTemplate.lessons.length} uczniów z ${copiedTemplate.sourceDayOfWeek})`}
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Wklej szablon ({copiedTemplate.lessons.length})</span>
                </button>

                {showPasteMenu && (
                  <div className="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xl p-2.5 z-40 space-y-2 text-xs">
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 pb-1.5 border-b border-slate-100 dark:border-slate-700">
                      Szablon: <strong>{copiedTemplate.sourceDayOfWeek}</strong> ({copiedTemplate.lessons.length} uczniów)
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onPasteTemplate('replace');
                        setShowPasteMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>Zastąp wszystkie lekcje</span>
                      <span className="text-[10px] opacity-80">Nadpisz</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onPasteTemplate('append');
                        setShowPasteMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 font-medium transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>Dopisz do istniejących</span>
                      <span className="text-[10px] opacity-80">+ Dodaj</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPasteMenu(false)}
                      className="w-full text-center text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 pt-1 cursor-pointer"
                    >
                      Zamknij
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Add Lesson Button */}
            <button
              type="button"
              onClick={onOpenAddLesson}
              className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-200 hover:text-white bg-emerald-100 hover:bg-emerald-600 dark:bg-emerald-500/20 dark:hover:bg-emerald-600 border border-emerald-300 dark:border-emerald-500/30 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
              title="Dodaj nową lekcję do tego dnia"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Dodaj lekcję</span>
            </button>
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[560px]">
          <thead>
            <tr className="border-b border-inherit text-[11px] font-bold text-muted bg-subcard-theme select-none whitespace-nowrap">
              <th className="py-2.5 px-2 w-7 text-center">#</th>
              <th className="py-2.5 px-2 min-w-[105px]">Imię ucznia</th>
              <th className="py-2.5 px-2 w-[92px] min-w-[92px] text-center">Czas</th>
              <th className="py-2.5 px-2 w-[72px] min-w-[72px] text-right">Cena</th>
              <th className="py-2.5 px-2 w-[82px] min-w-[82px] text-center">Obecność</th>
              <th className="py-2.5 px-2 w-[94px] min-w-[94px] text-center">Nie było, ale liczę</th>
              <th className="py-2.5 px-2 w-[66px] min-w-[66px] text-right">Suma</th>
              {isAuthenticated && <th className="py-2.5 px-1.5 w-8 text-center no-print"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-inherit">
            {filteredLessons.length === 0 ? (
              <tr>
                <td colSpan={isAuthenticated ? 8 : 7} className="py-8 text-center text-muted">
                  {searchFilter ? (
                    <span>Brak wyników dla szukanego ucznia: "{searchFilter}"</span>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span>Brak zaplanowanych lekcji w tym dniu.</span>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filteredLessons.map((lesson, idx) => {
                const isAbsent = lesson.status === 'Nie był';

                return (
                  <tr
                    key={lesson.id}
                    className={`transition-colors ${
                      isAbsent
                        ? 'bg-rose-50/70 hover:bg-rose-100/70 dark:bg-rose-500/10 dark:hover:bg-rose-500/15'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Index */}
                    <td className="py-2 px-2 text-center text-muted font-mono text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Student Name */}
                    <td className="py-2 px-2">
                      {isAuthenticated && editingLessonId === lesson.id ? (
                        <div className="flex items-center gap-1.5 py-0.5">
                          <input
                            type="text"
                            autoFocus
                            value={tempStudentName}
                            onChange={(e) => setTempStudentName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = tempStudentName.trim();
                                if (val) onUpdateLesson(lesson.id, { student: val });
                                setEditingLessonId(null);
                              } else if (e.key === 'Escape') {
                                setEditingLessonId(null);
                              }
                            }}
                            className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-2.5 py-1 rounded-lg border-2 border-indigo-500 shadow-sm text-xs font-semibold focus:outline-none"
                            placeholder="Imię ucznia"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const val = tempStudentName.trim();
                              if (val) onUpdateLesson(lesson.id, { student: val });
                              setEditingLessonId(null);
                            }}
                            className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer shrink-0"
                            title="Zapisz imię"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingLessonId(null)}
                            className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 cursor-pointer shrink-0"
                            title="Anuluj"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-1.5 py-0.5">
                          <span
                            className={`font-semibold tracking-tight text-xs ${
                              isAbsent
                                ? 'line-through text-rose-700 dark:text-rose-400'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {lesson.student}
                          </span>
                          {isAuthenticated && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLessonId(lesson.id);
                                setTempStudentName(lesson.student);
                              }}
                              className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer no-print shrink-0"
                              title="Edytuj imię ucznia (kliknij ołówek)"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Duration Select */}
                    <td className="py-2 px-2 text-center">
                      {isAuthenticated ? (
                        <div className="inline-block w-full min-w-[86px]">
                          <select
                            value={lesson.duration}
                            onChange={(e) => {
                              const newDur = e.target.value;
                              let newPrice = lesson.price;
                              if (newDur.includes('30')) newPrice = 40;
                              else if (newDur.includes('45')) newPrice = 60;
                              else if (newDur.includes('60')) newPrice = 70;
                              onUpdateLesson(lesson.id, { duration: newDur, price: newPrice });
                            }}
                            className="w-full min-w-[86px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg pl-2 pr-5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-xs whitespace-nowrap"
                          >
                            <option value="30 min">30 min</option>
                            <option value="45 min">45 min</option>
                            <option value="60 min">60 min</option>
                            {!['30 min', '45 min', '60 min'].includes(lesson.duration) && (
                              <option value={lesson.duration}>{lesson.duration}</option>
                            )}
                            <option value="Inny">Inny</option>
                          </select>
                        </div>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md whitespace-nowrap">
                          <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{lesson.duration}</span>
                        </span>
                      )}
                    </td>

                    {/* Price Input */}
                    <td className="py-2 px-2 text-right">
                      {isAuthenticated ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            min="0"
                            step="5"
                            value={lesson.price}
                            onChange={(e) => {
                              const p = parseFloat(e.target.value) || 0;
                              onUpdateLesson(lesson.id, { price: p });
                            }}
                            className="w-14 min-w-[50px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-1.5 py-1 text-right text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                          />
                          <span className="text-[11px] text-muted font-medium shrink-0">zł</span>
                        </div>
                      ) : (
                        <span className="text-slate-900 dark:text-slate-100 font-semibold whitespace-nowrap">
                          {lesson.price} zł
                        </span>
                      )}
                    </td>

                    {/* Był / Nie był toggle */}
                    <td className="py-2 px-2 text-center">
                      {isAuthenticated ? (
                        <button
                          type="button"
                          onClick={() => {
                            const newStatus = isAbsent ? 'Był' : 'Nie był';
                            const updates: Partial<Lesson> = { status: newStatus };
                            if (newStatus === 'Był') {
                              updates.excused = '';
                            }
                            onUpdateLesson(lesson.id, updates);
                          }}
                          className={`w-full min-w-[76px] py-1 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs whitespace-nowrap ${
                            !isAbsent
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'
                              : 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40'
                          }`}
                          title="Kliknij, aby zmienić obecność"
                        >
                          {!isAbsent ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 stroke-[3] shrink-0" />
                              <span>Był</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400 stroke-[3] shrink-0" />
                              <span>Nie był</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span
                          className={`inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${
                            !isAbsent
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                              : 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30'
                          }`}
                        >
                          {!isAbsent ? <Check className="w-3 h-3 text-emerald-700 shrink-0" /> : <X className="w-3 h-3 text-rose-700 shrink-0" />}
                          <span>{lesson.status || 'Był'}</span>
                        </span>
                      )}
                    </td>

                    {/* Nie było, ale liczę */}
                    <td className="py-2 px-2 text-center">
                      {isAbsent ? (
                        isAuthenticated ? (
                          <button
                            type="button"
                            onClick={() => {
                              const newExcused = lesson.excused === 'Liczę' ? 'Nie liczę' : 'Liczę';
                              onUpdateLesson(lesson.id, { excused: newExcused });
                            }}
                            className={`min-w-[76px] px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs whitespace-nowrap ${
                              lesson.excused === 'Liczę'
                                ? 'bg-purple-100 text-purple-900 border border-purple-400 hover:bg-purple-200 dark:bg-purple-600/30 dark:text-purple-200 dark:border-purple-500/50'
                                : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                            }`}
                            title="Zaznacz, aby doliczyć opłatę mimo nieobecności"
                          >
                            {lesson.excused === 'Liczę' ? 'Liczę' : 'Nie liczę'}
                          </button>
                        ) : (
                          lesson.excused === 'Liczę' ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30 whitespace-nowrap">
                              Liczę
                            </span>
                          ) : (
                            <span className="text-muted text-xs">—</span>
                          )
                        )
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </td>

                    {/* Calculated Sum */}
                    <td className="py-2 px-2 text-right whitespace-nowrap">
                      <span
                        className={`font-bold font-mono text-xs ${
                          lesson.sum > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {lesson.sum} zł
                      </span>
                    </td>

                    {/* Actions */}
                    {isAuthenticated && (
                      <td className="py-2 px-1 text-center no-print">
                        <button
                          type="button"
                          onClick={() => onDeleteLesson(lesson.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Usuń pozycję"
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

      {/* Day Summary Footer */}
      <div className="p-3.5 border-t border-inherit bg-subcard-theme flex items-center justify-between text-xs">
        <span className="font-bold text-slate-800 dark:text-slate-200">
          Podsumowanie {day.date || day.title}:
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-muted font-medium">Suma dnia:</span>
          <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-600/40 px-2.5 py-0.5 rounded-lg">
            {day.total.toLocaleString('pl-PL')} zł
          </span>
        </div>
      </div>
    </div>
  );
};
