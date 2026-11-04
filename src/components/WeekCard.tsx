import React, { useState } from 'react';
import { Week, Lesson, CopiedDayTemplate, DaySchedule } from '../types/journal';
import { DayTable } from './DayTable';
import { AddDayModal } from './AddDayModal';
import { CalendarRange, Plus, CalendarPlus } from 'lucide-react';
import { DAY_OF_WEEK_OPTIONS, calculateDateForWeekAndDay } from '../utils/monthGenerator';

interface WeekCardProps {
  week: Week;
  monthName?: string;
  isAuthenticated: boolean;
  onUpdateLesson: (dayIdentifier: string, lessonId: string, updates: Partial<Lesson>) => void;
  onDeleteLesson: (dayIdentifier: string, lessonId: string) => void;
  onOpenAddLesson: (dayIdentifier: string, dayDate: string, dayOfWeek: string) => void;
  searchFilter?: string;
  copiedTemplate?: CopiedDayTemplate | null;
  onCopyTemplate?: (dayIdentifier: string) => void;
  onPasteTemplate?: (dayIdentifier: string, mode: 'replace' | 'append') => void;
  onAddDay?: (weekId: string, dayOfWeek: string, date: string) => void;
  onDeleteDay?: (weekId: string, dayIdentifier: string) => void;
  isPrivateWorkspace?: boolean;
}

interface ActiveDayEntry {
  identifier: string;
  schedule: DaySchedule;
  canDelete: boolean;
}

export const WeekCard: React.FC<WeekCardProps> = ({
  week,
  monthName = '',
  isAuthenticated,
  onUpdateLesson,
  onDeleteLesson,
  onOpenAddLesson,
  searchFilter = '',
  copiedTemplate = null,
  onCopyTemplate,
  onPasteTemplate,
  onAddDay,
  onDeleteDay,
  isPrivateWorkspace = false,
}) => {
  const [isAddDayModalOpen, setIsAddDayModalOpen] = useState(false);

  // Collect all days present in this week
  const activeDays: ActiveDayEntry[] = [];

  if (week.monday) {
    activeDays.push({
      identifier: 'monday',
      schedule: week.monday,
      canDelete: Boolean(isPrivateWorkspace),
    });
  }
  if (week.friday) {
    activeDays.push({
      identifier: 'friday',
      schedule: week.friday,
      canDelete: Boolean(isPrivateWorkspace),
    });
  }
  if (week.singleDay) {
    activeDays.push({
      identifier: 'singleDay',
      schedule: week.singleDay,
      canDelete: Boolean(isPrivateWorkspace),
    });
  }
  if (week.days && week.days.length > 0) {
    week.days.forEach((d, idx) => {
      activeDays.push({
        identifier: d.id || `custom-day-${idx}`,
        schedule: d,
        canDelete: true,
      });
    });
  }

  // Compute total for this week across all active days
  const weekTotal = activeDays.reduce((acc, item) => acc + (item.schedule.total || 0), 0);

  const handleQuickAddDay = (dayName: string, dayIndex: number) => {
    if (!onAddDay) return;
    const computedDate = calculateDateForWeekAndDay(week, monthName, dayIndex);
    onAddDay(week.id, dayName, computedDate);
  };

  return (
    <div className="bg-card-theme border rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm print-card transition-colors">
      {/* Week Header */}
      <div className="flex items-center justify-between pb-3 border-b border-inherit flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <CalendarRange className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-main tracking-tight">
            {week.weekTitle}
          </h3>
          {isPrivateWorkspace && (
            <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/50 px-2 py-0.5 rounded-full border border-purple-300 dark:border-purple-800">
              {activeDays.length} {activeDays.length === 1 ? 'dzień' : activeDays.length < 5 ? 'dni' : 'dni'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Add Day Button for Private Workspace */}
          {isAuthenticated && onAddDay && (
            <button
              type="button"
              onClick={() => setIsAddDayModalOpen(true)}
              className="text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 dark:bg-purple-600 dark:hover:bg-purple-500 px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 no-print"
              title="Dodaj dzień do tego tygodnia (od poniedziałku do soboty)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Dodaj dzień</span>
            </button>
          )}

          {/* Week Total Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-medium">Suma tygodnia:</span>
            <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 px-3 py-1 rounded-xl">
              {weekTotal.toLocaleString('pl-PL')} zł
            </span>
          </div>
        </div>
      </div>

      {/* Week Content */}
      {activeDays.length === 0 ? (
        /* Empty state: No days in this week yet */
        <div className="border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-center bg-subcard-theme space-y-3.5 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto border border-purple-500/20">
            <CalendarPlus className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-main">
              Brak dni w tym tygodniu
            </h4>
            <p className="text-xs text-muted mt-1 max-w-md mx-auto">
              Wybierz dzień tygodnia (od poniedziałku do soboty), aby dodać go do swojego grafiku prywatnego:
            </p>
          </div>

          {isAuthenticated ? (
            <div className="pt-2 space-y-3">
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
                {DAY_OF_WEEK_OPTIONS.map((opt) => (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => handleQuickAddDay(opt.name, opt.index)}
                    className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-card-theme text-main hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-500/10 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 text-purple-500" />
                    <span>{opt.name}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setIsAddDayModalOpen(true)}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium cursor-pointer"
              >
                Wybierz własną datę lub szczegóły...
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-muted italic">
              Zaloguj się jako nauczyciel, aby dodać dni do grafiku.
            </p>
          )}
        </div>
      ) : activeDays.length === 1 ? (
        /* Single day layout */
        <div className="max-w-3xl mx-auto">
          {activeDays.map((item) => (
            <DayTable
              key={item.identifier}
              day={item.schedule}
              dayType={item.schedule.dayOfWeek}
              isAuthenticated={isAuthenticated}
              onUpdateLesson={(id, updates) => onUpdateLesson(item.identifier, id, updates)}
              onDeleteLesson={(id) => onDeleteLesson(item.identifier, id)}
              onOpenAddLesson={() =>
                onOpenAddLesson(item.identifier, item.schedule.date, item.schedule.dayOfWeek)
              }
              searchFilter={searchFilter}
              copiedTemplate={copiedTemplate}
              onCopyAsTemplate={
                onCopyTemplate ? () => onCopyTemplate(item.identifier) : undefined
              }
              onPasteTemplate={
                onPasteTemplate
                  ? (mode) => onPasteTemplate(item.identifier, mode)
                  : undefined
              }
              onDeleteDay={
                item.canDelete && onDeleteDay
                  ? () => onDeleteDay(week.id, item.identifier)
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        /* Multiple days: 2-column responsive grid */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {activeDays.map((item) => (
            <DayTable
              key={item.identifier}
              day={item.schedule}
              dayType={item.schedule.dayOfWeek}
              isAuthenticated={isAuthenticated}
              onUpdateLesson={(id, updates) => onUpdateLesson(item.identifier, id, updates)}
              onDeleteLesson={(id) => onDeleteLesson(item.identifier, id)}
              onOpenAddLesson={() =>
                onOpenAddLesson(item.identifier, item.schedule.date, item.schedule.dayOfWeek)
              }
              searchFilter={searchFilter}
              copiedTemplate={copiedTemplate}
              onCopyAsTemplate={
                onCopyTemplate ? () => onCopyTemplate(item.identifier) : undefined
              }
              onPasteTemplate={
                onPasteTemplate
                  ? (mode) => onPasteTemplate(item.identifier, mode)
                  : undefined
              }
              onDeleteDay={
                item.canDelete && onDeleteDay
                  ? () => onDeleteDay(week.id, item.identifier)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Add Day Modal */}
      {isAddDayModalOpen && onAddDay && (
        <AddDayModal
          isOpen={isAddDayModalOpen}
          onClose={() => setIsAddDayModalOpen(false)}
          onAddDay={(dayOfWeek, date) => onAddDay(week.id, dayOfWeek, date)}
          weekTitle={week.weekTitle}
          monthName={monthName}
          onCalculateDate={(dayIndex) =>
            calculateDateForWeekAndDay(week, monthName, dayIndex)
          }
        />
      )}
    </div>
  );
};
