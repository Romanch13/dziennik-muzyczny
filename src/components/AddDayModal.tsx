import React, { useState, useEffect } from 'react';
import { X, CalendarPlus, Check, Calendar } from 'lucide-react';
import { DAY_OF_WEEK_OPTIONS } from '../utils/monthGenerator';

interface AddDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDay: (dayOfWeek: string, date: string) => void;
  weekTitle: string;
  monthName: string;
  defaultDate?: string;
  defaultDayOfWeek?: string;
  onCalculateDate?: (dayIndex: number) => string;
}

export const AddDayModal: React.FC<AddDayModalProps> = ({
  isOpen,
  onClose,
  onAddDay,
  weekTitle,
  monthName,
  defaultDate = '',
  defaultDayOfWeek = 'Poniedziałek',
  onCalculateDate,
}) => {
  const [selectedDay, setSelectedDay] = useState<string>(defaultDayOfWeek);
  const [date, setDate] = useState<string>(defaultDate);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const initialDay = defaultDayOfWeek || 'Poniedziałek';
      setSelectedDay(initialDay);
      if (defaultDate) {
        setDate(defaultDate);
      } else if (onCalculateDate) {
        const found = DAY_OF_WEEK_OPTIONS.find((o) => o.name === initialDay);
        setDate(onCalculateDate(found ? found.index : 1));
      }
      setError(null);
    }
  }, [isOpen, defaultDate, defaultDayOfWeek, onCalculateDate]);

  if (!isOpen) return null;

  const handleSelectDayOption = (dayName: string, index: number) => {
    setSelectedDay(dayName);
    if (onCalculateDate) {
      const calculated = onCalculateDate(index);
      setDate(calculated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDate = date.trim();
    if (!cleanDate) {
      setError('Wprowadź datę w formacie dd.mm.rrrr');
      return;
    }
    // Simple dd.mm.yyyy regex validation
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(cleanDate)) {
      setError('Data musi mieć format dd.mm.rrrr (np. 05.10.2026)');
      return;
    }
    onAddDay(selectedDay, cleanDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-card-theme border rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-inherit flex items-center justify-between bg-subcard-theme">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-main">Dodaj dzień do grafiku</h3>
              <p className="text-xs text-muted">
                {weekTitle} • {monthName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted hover:text-main hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Day selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
              Wybierz dzień tygodnia (od poniedziałku do soboty)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DAY_OF_WEEK_OPTIONS.map((opt) => {
                const isSelected = selectedDay === opt.name;
                return (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => handleSelectDayOption(opt.name, opt.index)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/30 ring-2 ring-purple-400/40'
                        : 'bg-subcard-theme text-main border-inherit hover:border-purple-400 hover:bg-purple-500/5'
                    }`}
                  >
                    <span>{opt.name}</span>
                    <span
                      className={`text-[10px] font-mono ${
                        isSelected ? 'text-purple-200' : 'text-muted'
                      }`}
                    >
                      {opt.short}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
              Data lekcji (dd.mm.rrrr)
            </label>
            <div className="relative">
              <input
                type="text"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setError(null);
                }}
                placeholder="np. 05.10.2026"
                className="w-full bg-subcard-theme border border-inherit rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-main focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all font-mono"
              />
              <Calendar className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-muted">
              Data została obliczona automatycznie dla wybranego dnia w tym tygodniu. Możesz ją w razie potrzeby dostosować.
            </p>
          </div>

          {error && (
            <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-300 dark:border-rose-500/30">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-inherit">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-inherit text-xs font-medium text-main hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Dodaj dzień</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
