import React, { useState } from 'react';
import { MonthData } from '../types/journal';
import { Users, X, DollarSign, CheckCircle2, XCircle, Copy, Check, MessageSquare } from 'lucide-react';

interface StudentStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  month?: MonthData | null;
}

interface StudentSummary {
  name: string;
  totalLessons: number;
  attended: number;
  absent: number;
  excusedCount: number;
  totalSum: number;
}

export const StudentStatsModal: React.FC<StudentStatsModalProps> = ({
  isOpen,
  onClose,
  month,
}) => {
  const [copiedName, setCopiedName] = useState<string | null>(null);

  if (!isOpen || !month) return null;

  // Aggregate student stats for this month
  const statsMap = new Map<string, StudentSummary>();

  const processLesson = (name: string, status: string, sum: number, excused?: string) => {
    if (!name || name === 'Imię ucznia') return;
    const cleanName = name.trim();
    if (!statsMap.has(cleanName)) {
      statsMap.set(cleanName, {
        name: cleanName,
        totalLessons: 0,
        attended: 0,
        absent: 0,
        excusedCount: 0,
        totalSum: 0,
      });
    }
    const item = statsMap.get(cleanName)!;
    item.totalLessons++;
    if (status === 'Był') {
      item.attended++;
    } else if (status === 'Nie był') {
      item.absent++;
      if (excused === 'Liczę') {
        item.excusedCount++;
      }
    }
    item.totalSum += sum;
  };

  // From regular weeks
  for (const w of month.weeks) {
    const days = [w.monday, w.friday, w.singleDay];
    for (const d of days) {
      if (!d) continue;
      for (const l of d.lessons) {
        processLesson(l.student, l.status, l.sum, l.excused);
      }
    }
  }

  // From additional lessons
  for (const a of month.additional || []) {
    processLesson(a.student, a.status, a.sum);
  }

  const summaries = Array.from(statsMap.values()).sort((a, b) => b.totalSum - a.totalSum);

  const totalBilled = summaries.reduce((acc, s) => acc + s.totalSum, 0);
  const totalAttended = summaries.reduce((acc, s) => acc + s.attended, 0);
  const totalLessonsAll = summaries.reduce((acc, s) => acc + s.totalLessons, 0);

  const handleCopyMessage = (s: StudentSummary) => {
    const msg = `Dzień dobry! Podsumowanie zajęć muzycznych w Warsztacie Muzycznym na Jagodnie za miesiąc ${month.name}:\nUczeń: ${s.name}\nLiczba odbytych lekcji: ${s.attended}/${s.totalLessons}\nKwota do rozliczenia: ${s.totalSum} zł.\nDziękujemy!`;
    navigator.clipboard.writeText(msg);
    setCopiedName(s.name);
    setTimeout(() => setCopiedName(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Rozliczenia uczniów — {month.name}</h3>
              <p className="text-xs text-slate-400">Podsumowanie frekwencji i należności</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global stats pills */}
        <div className="grid grid-cols-3 gap-3 my-4 shrink-0">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">Razem do rozliczenia</span>
            <span className="text-lg font-bold font-mono text-emerald-400">
              {totalBilled.toLocaleString('pl-PL')} zł
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">Liczba uczniów</span>
            <span className="text-lg font-bold text-indigo-400">
              {summaries.length}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">Odbyte lekcje</span>
            <span className="text-lg font-bold text-slate-200">
              {totalAttended} / {totalLessonsAll}
            </span>
          </div>
        </div>

        {/* Students Table */}
        <div className="overflow-y-auto flex-1 rounded-2xl border border-slate-800 bg-slate-950/40">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-900 border-b border-slate-800">
              <tr className="text-[11px] font-semibold text-slate-400">
                <th className="py-2.5 px-3">Uczeń</th>
                <th className="py-2.5 px-3 text-center">Lekcje</th>
                <th className="py-2.5 px-3 text-center">Obecny</th>
                <th className="py-2.5 px-3 text-center">Nieobecny</th>
                <th className="py-2.5 px-3 text-center">Doliczone</th>
                <th className="py-2.5 px-3 text-right">Do zapłaty</th>
                <th className="py-2.5 px-3 text-center">Wiadomość</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {summaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Brak danych uczniów w tym miesiącu.
                  </td>
                </tr>
              ) : (
                summaries.map((s) => (
                  <tr key={s.name} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-100">
                      {s.name}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-300">
                      {s.totalLessons}
                    </td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-medium">
                      {s.attended}
                    </td>
                    <td className="py-2.5 px-3 text-center text-rose-400">
                      {s.absent}
                    </td>
                    <td className="py-2.5 px-3 text-center text-purple-400">
                      {s.excusedCount > 0 ? s.excusedCount : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono text-emerald-400">
                      {s.totalSum} zł
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleCopyMessage(s)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Skopiuj treść wiadomości rozliczeniowej dla rodzica"
                      >
                        {copiedName === s.name ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">Skopiowano</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>Kopiuj SMS</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-400">
            Przycisk "Kopiuj SMS" generuje gotową wiadomość z podsumowaniem dla rodzica.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
