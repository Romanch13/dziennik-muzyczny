import React, { useState } from 'react';
import { Plus, X, Clock, DollarSign, User } from 'lucide-react';
import { Lesson } from '../types/journal';

interface AddLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayDate: string;
  dayOfWeek: string;
  onAdd: (lesson: Omit<Lesson, 'id'>) => void;
  existingStudents: string[];
}

export const AddLessonModal: React.FC<AddLessonModalProps> = ({
  isOpen,
  onClose,
  dayDate,
  dayOfWeek,
  onAdd,
  existingStudents,
}) => {
  const [student, setStudent] = useState('');
  const [duration, setDuration] = useState('45 min');
  const [price, setPrice] = useState(60);
  const [status, setStatus] = useState<'Był' | 'Nie był'>('Był');

  if (!isOpen) return null;

  const handleDurationSelect = (dur: string, p: number) => {
    setDuration(dur);
    setPrice(p);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student.trim()) return;

    const sum = status === 'Był' ? price : 0;
    onAdd({
      date: dayDate,
      student: student.trim(),
      duration,
      price,
      status,
      excused: '',
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
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Dodaj nową lekcję</h3>
              <p className="text-xs text-slate-400">{dayOfWeek}, {dayDate}</p>
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
          {/* Student name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              Imię ucznia:
            </label>
            <input
              type="text"
              autoFocus
              required
              placeholder="np. Kuba, Pola, Staś..."
              value={student}
              onChange={(e) => setStudent(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />

            {/* Quick suggestions */}
            {existingStudents.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1 max-h-20 overflow-y-auto pt-1">
                <span className="text-[10px] text-slate-400 self-center mr-1">Podpowiedzi:</span>
                {existingStudents.slice(0, 8).map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setStudent(name)}
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-0.5 rounded-md border border-slate-700 transition-colors cursor-pointer"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Duration Preset Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Czas trwania i stawka:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDurationSelect('30 min', 40)}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  duration === '30 min'
                    ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-semibold">30 min</div>
                <div className="text-[11px] text-amber-300 font-bold">40 zł</div>
              </button>

              <button
                type="button"
                onClick={() => handleDurationSelect('45 min', 60)}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  duration === '45 min'
                    ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-semibold">45 min</div>
                <div className="text-[11px] text-indigo-300 font-bold">60 zł</div>
              </button>

              <button
                type="button"
                onClick={() => handleDurationSelect('60 min', 70)}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  duration === '60 min'
                    ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-semibold">60 min</div>
                <div className="text-[11px] text-emerald-300 font-bold">70 zł</div>
              </button>
            </div>
          </div>

          {/* Custom price input if needed */}
          <div className="grid grid-cols-2 gap-3">
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
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  zł
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Obecność wstępna:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Był' | 'Nie był')}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="Był">Był (Obecny)</option>
                <option value="Nie był">Nie był (Nieobecny)</option>
              </select>
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
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
            >
              Dodaj do dziennika
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
