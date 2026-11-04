import React, { useState } from 'react';
import { Plus, X, CalendarCheck2, Clock, DollarSign } from 'lucide-react';
import { AdditionalLesson } from '../types/journal';

interface AddExtraLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (lesson: Omit<AdditionalLesson, 'id'>) => void;
  existingStudents: string[];
}

export const AddExtraLessonModal: React.FC<AddExtraLessonModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  existingStudents,
}) => {
  const [day, setDay] = useState('Czwartek');
  const [date, setDate] = useState('');
  const [student, setStudent] = useState('');
  const [duration, setDuration] = useState('60 min');
  const [price, setPrice] = useState(70);
  const [status, setStatus] = useState<'Był' | 'Nie był'>('Był');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student.trim()) return;

    const sum = status === 'Był' ? price : 0;
    onAdd({
      day,
      date: date.trim() || '—',
      student: student.trim(),
      duration,
      price,
      status,
      sum
    });

    setStudent('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/20">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Dodaj lekcję w sekcji DODATKOWO</h3>
              <p className="text-xs text-slate-400">Dowolny dzień od poniedziałku do soboty</p>
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
                Dzień tygodnia:
              </label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="Poniedziałek">Poniedziałek</option>
                <option value="Wtorek">Wtorek</option>
                <option value="Środa">Środa</option>
                <option value="Czwartek">Czwartek</option>
                <option value="Piątek">Piątek</option>
                <option value="Sobota">Sobota</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Data (DD.MM.YYYY):
              </label>
              <input
                type="text"
                placeholder="np. 15.10.2026"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Imię ucznia:
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="np. Dawid, Miłosz, Hugo..."
              value={student}
              onChange={(e) => setStudent(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            {existingStudents.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1 max-h-16 overflow-y-auto pt-1">
                {existingStudents.slice(0, 6).map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setStudent(name)}
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700 cursor-pointer"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Czas trwania:
              </label>
              <select
                value={duration}
                onChange={(e) => {
                  const val = e.target.value;
                  setDuration(val);
                  if (val === '30 min') setPrice(40);
                  if (val === '45 min') setPrice(60);
                  if (val === '60 min') setPrice(70);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="30 min">30 min (40 zł)</option>
                <option value="45 min">45 min (60 zł)</option>
                <option value="60 min">60 min (70 zł)</option>
                <option value="Inny">Inny</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Stawka (zł):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  zł
                </span>
              </div>
            </div>
          </div>

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
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-all shadow-md shadow-purple-600/30 cursor-pointer"
            >
              Dodaj pozycję
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
