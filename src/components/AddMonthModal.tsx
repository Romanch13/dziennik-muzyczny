import React, { useState } from 'react';
import { CalendarPlus, X, AlertCircle } from 'lucide-react';
import { POLISH_MONTHS } from '../utils/monthGenerator';
import { MonthData } from '../types/journal';

interface AddMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMonth: (monthName: string, year: number, prefill: boolean) => void;
  existingMonths: MonthData[];
}

export const AddMonthModal: React.FC<AddMonthModalProps> = ({
  isOpen,
  onClose,
  onAddMonth,
  existingMonths,
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState('Listopad');
  const [selectedYear, setSelectedYear] = useState(2027);
  const [prefill, setPrefill] = useState(true);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const candidateName = `${selectedMonth} ${selectedYear}`;
    const alreadyExists = existingMonths.some(
      (m) => m.name.toLowerCase() === candidateName.toLowerCase()
    );

    if (alreadyExists) {
      setError(`Miesiąc ${candidateName} już istnieje w dzienniku.`);
      return;
    }

    onAddMonth(selectedMonth, selectedYear, prefill);
    onClose();
  };

  const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2, currentYear + 3];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Dodaj nowy miesiąc</h3>
              <p className="text-xs text-slate-400">Wygeneruj grafik na kolejny okres</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Miesiąc:
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setError('');
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {POLISH_MONTHS.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Rok:
              </label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(parseInt(e.target.value, 10));
                  setError('');
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="prefill-checkbox"
              checked={prefill}
              onChange={(e) => setPrefill(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="prefill-checkbox" className="text-xs text-slate-300 cursor-pointer select-none">
              <span className="font-semibold block text-slate-200">
                Wstaw listę stałych uczniów
              </span>
              Wypełnij poniedziałki i piątki uczniami ze stałego grafiku (Kuba, Pola, Hugo, Ola itd.)
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              Utwórz miesiąc
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
