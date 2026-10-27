import React, { useRef, useState } from 'react';
import { MonthData } from '../types/journal';
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle2, 
  DollarSign, 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle,
  Trash2
} from 'lucide-react';

interface MonthNavigationProps {
  months: MonthData[];
  selectedMonthId: string;
  onSelectMonth: (id: string) => void;
  activeMonth?: MonthData | null;
  onOpenAddMonth: () => void;
  isAuthenticated: boolean;
  onDeleteMonth?: (id: string, name: string) => void;
}

export const MonthNavigation: React.FC<MonthNavigationProps> = ({
  months,
  selectedMonthId,
  onSelectMonth,
  activeMonth,
  onOpenAddMonth,
  isAuthenticated,
  onDeleteMonth,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  // Mouse wheel scroll handler (translates vertical wheel to horizontal scroll)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollRef.current) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY * 1.2;
    }
  };

  // Drag to scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftState(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftState - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleScrollBy = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Compute monthly stats
  let totalLessons = 0;
  let attendedLessons = 0;
  let excusedLessons = 0;
  const uniqueStudents = new Set<string>();

  if (activeMonth) {
    for (const week of activeMonth.weeks || []) {
      const days = [week.monday, week.friday, week.singleDay].filter(Boolean);
      for (const d of days) {
        if (!d) continue;
        for (const l of d.lessons || []) {
          if (!l.student) continue;
          totalLessons++;
          uniqueStudents.add(l.student);
          if (l.status === 'Był') attendedLessons++;
          if (l.status === 'Nie był' && l.excused === 'Liczę') excusedLessons++;
        }
      }
    }

    for (const add of activeMonth.additional || []) {
      if (!add.student) continue;
      totalLessons++;
      uniqueStudents.add(add.student);
      if (add.status === 'Był') attendedLessons++;
    }
  }

  const attendanceRate = totalLessons > 0 ? Math.round((attendedLessons / totalLessons) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Scrollable Month Navigation Bar with Mouse Wheel & Arrow Controls */}
      <div className="relative group no-print">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={() => handleScrollBy(-220)}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white flex items-center justify-center shadow-md transition-all hover:scale-105 cursor-pointer backdrop-blur-md"
          title="Przewiń w lewo"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Months Container with iOS / Windows 11 Fluent mica segmented styling */}
        <div
          ref={scrollRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className={`flex items-center gap-1.5 overflow-x-auto p-1.5 bg-slate-200/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl scroll-smooth select-none cursor-grab active:cursor-grabbing scrollbar-none shadow-xs ${
            isDragging ? 'cursor-grabbing' : ''
          }`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {months.length === 0 ? (
            <div className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 italic">
              Brak miesięcy w dzienniku. Dodaj pierwszy miesiąc za pomocą przycisku obok.
            </div>
          ) : (
            months.map((m) => {
              const isSelected = m.id === selectedMonthId;
              return (
                <div
                  key={m.id}
                  className="relative shrink-0 flex items-center group/pill"
                >
                  <button
                    type="button"
                    onClick={() => onSelectMonth(m.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-white text-slate-900 dark:bg-indigo-600 dark:text-white shadow-sm font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                    } ${isAuthenticated && onDeleteMonth ? 'pr-7' : ''}`}
                  >
                    <Calendar className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600 dark:text-white' : 'text-slate-400'}`} />
                    <span>{m.name}</span>
                    {m.grandTotal > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          isSelected 
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100' 
                            : 'bg-emerald-50 text-emerald-700 dark:bg-slate-900 dark:text-emerald-400 border border-emerald-200/60 dark:border-transparent'
                        }`}
                      >
                        {m.grandTotal.toLocaleString('pl-PL')} zł
                      </span>
                    )}
                  </button>

                  {/* Delete button (available for all months when authenticated) */}
                  {isAuthenticated && onDeleteMonth && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onDeleteMonth(m.id, m.name);
                      }}
                      className={`absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60'
                          : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60'
                      }`}
                      title={`Usuń miesiąc "${m.name}"`}
                      aria-label={`Usuń miesiąc ${m.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}

          {/* Add New Month Button */}
          <button
            onClick={onOpenAddMonth}
            className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer active:scale-95"
            title="Dodaj nowy miesiąc do dziennika"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Dodaj miesiąc</span>
          </button>
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={() => handleScrollBy(220)}
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white flex items-center justify-center shadow-md transition-all hover:scale-105 cursor-pointer backdrop-blur-md"
          title="Przewiń w prawo"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards Ribbon (iOS & Windows 11 Fluent style) */}
      {activeMonth && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Grand Total */}
          <div className="bg-gradient-to-br from-indigo-50/90 to-white dark:from-indigo-950/40 dark:to-slate-900/80 border border-indigo-200/80 dark:border-indigo-500/30 rounded-2xl p-4 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-300 text-xs mb-1.5">
              <span className="font-bold">Suma całkowita</span>
              <DollarSign className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {activeMonth.grandTotal.toLocaleString('pl-PL')} <span className="text-xs font-normal text-indigo-600 dark:text-indigo-300">zł</span>
            </div>
            <p className="text-[10px] text-indigo-900/70 dark:text-slate-400 mt-1 font-medium">Miesiąc + Dodatkowo</p>
          </div>

          {/* Regular Lessons Total */}
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between text-sky-800 dark:text-sky-300 text-xs mb-1.5">
              <span className="font-bold">Poniedziałki + Piątki</span>
              <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {activeMonth.regularTotal.toLocaleString('pl-PL')} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">zł</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Stały grafik</p>
          </div>

          {/* Additional Lessons Total */}
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-xs mb-1.5">
              <span className="font-bold">Zajęcia Dodatkowo</span>
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {activeMonth.additionalTotal.toLocaleString('pl-PL')} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">zł</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {activeMonth.additional?.length || 0} wpisów dodatkowych
            </p>
          </div>

          {/* Attendance Rate */}
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between text-teal-800 dark:text-teal-300 text-xs mb-1.5">
              <span className="font-bold">Frekwencja</span>
              <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {attendanceRate}%
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {attendedLessons} obecnych / {totalLessons} zaplanowanych
            </p>
          </div>

          {/* Total Lessons Count */}
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 text-xs mb-1.5">
              <span className="font-bold">Liczba lekcji</span>
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {totalLessons}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">W tym {excusedLessons} doliczone</p>
          </div>

          {/* Unique Students */}
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between text-purple-800 dark:text-purple-300 text-xs mb-1.5">
              <span className="font-bold">Uczniowie</span>
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {uniqueStudents.size}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Aktywnych w miesiącu</p>
          </div>
        </div>
      )}
    </div>
  );
};
