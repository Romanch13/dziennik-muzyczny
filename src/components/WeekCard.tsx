import React from 'react';
import { Week, Lesson, CopiedDayTemplate } from '../types/journal';
import { DayTable } from './DayTable';
import { CalendarRange } from 'lucide-react';

interface WeekCardProps {
  week: Week;
  isAuthenticated: boolean;
  onUpdateLesson: (dayKey: 'monday' | 'friday' | 'singleDay', lessonId: string, updates: Partial<Lesson>) => void;
  onDeleteLesson: (dayKey: 'monday' | 'friday' | 'singleDay', lessonId: string) => void;
  onOpenAddLesson: (dayKey: 'monday' | 'friday' | 'singleDay', dayDate: string, dayOfWeek: string) => void;
  searchFilter?: string;
  copiedTemplate?: CopiedDayTemplate | null;
  onCopyTemplate?: (dayKey: 'monday' | 'friday' | 'singleDay') => void;
  onPasteTemplate?: (dayKey: 'monday' | 'friday' | 'singleDay', mode: 'replace' | 'append') => void;
}

export const WeekCard: React.FC<WeekCardProps> = ({
  week,
  isAuthenticated,
  onUpdateLesson,
  onDeleteLesson,
  onOpenAddLesson,
  searchFilter = '',
  copiedTemplate = null,
  onCopyTemplate,
  onPasteTemplate,
}) => {
  const hasMonday = Boolean(week.monday);
  const hasFriday = Boolean(week.friday);
  const hasSingle = Boolean(week.singleDay);

  // Compute total for this week
  const weekTotal =
    (week.monday?.total || 0) +
    (week.friday?.total || 0) +
    (week.singleDay?.total || 0);

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
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted font-medium">Suma tygodnia:</span>
          <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 px-3 py-1 rounded-xl">
            {weekTotal.toLocaleString('pl-PL')} zł
          </span>
        </div>
      </div>

      {/* Tables layout: side by side if both monday and friday exist */}
      {hasMonday && hasFriday ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <DayTable
            day={week.monday!}
            dayType="monday"
            isAuthenticated={isAuthenticated}
            onUpdateLesson={(id, updates) => onUpdateLesson('monday', id, updates)}
            onDeleteLesson={(id) => onDeleteLesson('monday', id)}
            onOpenAddLesson={() => onOpenAddLesson('monday', week.monday!.date, 'Poniedziałek')}
            searchFilter={searchFilter}
            copiedTemplate={copiedTemplate}
            onCopyAsTemplate={onCopyTemplate ? () => onCopyTemplate('monday') : undefined}
            onPasteTemplate={onPasteTemplate ? (mode) => onPasteTemplate('monday', mode) : undefined}
          />
          <DayTable
            day={week.friday!}
            dayType="friday"
            isAuthenticated={isAuthenticated}
            onUpdateLesson={(id, updates) => onUpdateLesson('friday', id, updates)}
            onDeleteLesson={(id) => onDeleteLesson('friday', id)}
            onOpenAddLesson={() => onOpenAddLesson('friday', week.friday!.date, 'Piątek')}
            searchFilter={searchFilter}
            copiedTemplate={copiedTemplate}
            onCopyAsTemplate={onCopyTemplate ? () => onCopyTemplate('friday') : undefined}
            onPasteTemplate={onPasteTemplate ? (mode) => onPasteTemplate('friday', mode) : undefined}
          />
        </div>
      ) : (
        /* Lone day in the week */
        <div className="max-w-3xl mx-auto">
          {hasMonday && (
            <DayTable
              day={week.monday!}
              dayType="monday"
              isAuthenticated={isAuthenticated}
              onUpdateLesson={(id, updates) => onUpdateLesson('monday', id, updates)}
              onDeleteLesson={(id) => onDeleteLesson('monday', id)}
              onOpenAddLesson={() => onOpenAddLesson('monday', week.monday!.date, 'Poniedziałek')}
              searchFilter={searchFilter}
              copiedTemplate={copiedTemplate}
              onCopyAsTemplate={onCopyTemplate ? () => onCopyTemplate('monday') : undefined}
              onPasteTemplate={onPasteTemplate ? (mode) => onPasteTemplate('monday', mode) : undefined}
            />
          )}
          {hasFriday && (
            <DayTable
              day={week.friday!}
              dayType="friday"
              isAuthenticated={isAuthenticated}
              onUpdateLesson={(id, updates) => onUpdateLesson('friday', id, updates)}
              onDeleteLesson={(id) => onDeleteLesson('friday', id)}
              onOpenAddLesson={() => onOpenAddLesson('friday', week.friday!.date, 'Piątek')}
              searchFilter={searchFilter}
              copiedTemplate={copiedTemplate}
              onCopyAsTemplate={onCopyTemplate ? () => onCopyTemplate('friday') : undefined}
              onPasteTemplate={onPasteTemplate ? (mode) => onPasteTemplate('friday', mode) : undefined}
            />
          )}
          {hasSingle && (
            <DayTable
              day={week.singleDay!}
              dayType="single"
              isAuthenticated={isAuthenticated}
              onUpdateLesson={(id, updates) => onUpdateLesson('singleDay', id, updates)}
              onDeleteLesson={(id) => onDeleteLesson('singleDay', id)}
              onOpenAddLesson={() => onOpenAddLesson('singleDay', week.singleDay!.date, week.singleDay!.dayOfWeek)}
              searchFilter={searchFilter}
              copiedTemplate={copiedTemplate}
              onCopyAsTemplate={onCopyTemplate ? () => onCopyTemplate('singleDay') : undefined}
              onPasteTemplate={onPasteTemplate ? (mode) => onPasteTemplate('singleDay', mode) : undefined}
            />
          )}
        </div>
      )}
    </div>
  );
};
