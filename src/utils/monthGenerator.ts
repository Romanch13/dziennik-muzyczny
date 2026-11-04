import { MonthData, Week, Lesson, TemplateStudent } from '../types/journal';

export const POLISH_MONTHS = [
  { name: 'Styczeń', num: 1 },
  { name: 'Luty', num: 2 },
  { name: 'Marzec', num: 3 },
  { name: 'Kwiecień', num: 4 },
  { name: 'Maj', num: 5 },
  { name: 'Czerwiec', num: 6 },
  { name: 'Lipiec', num: 7 },
  { name: 'Sierpień', num: 8 },
  { name: 'Wrzesień', num: 9 },
  { name: 'Październik', num: 10 },
  { name: 'Listopad', num: 11 },
  { name: 'Grudzień', num: 12 },
];

function getISOWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

function formatDatePL(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export function generateNewMonth(
  monthName: string,
  year: number,
  defaultTemplates?: { monday: TemplateStudent[]; friday: TemplateStudent[] },
  prefillStudents = false
): MonthData {
  const monthEntry = POLISH_MONTHS.find((m) => m.name.toLowerCase() === monthName.toLowerCase()) || POLISH_MONTHS[0];
  const monthIdx = monthEntry.num - 1; // 0-based for Date

  // Slug id, e.g. "listopad-2027"
  const slugName = monthEntry.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l');
  const monthId = `${slugName}-${year}`;

  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  // Group by ISO week
  const weekMap = new Map<number, { mondayDate?: Date; fridayDate?: Date }>();

  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, monthIdx, d);
    const dayOfWeek = curDate.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat

    if (dayOfWeek === 1 || dayOfWeek === 5) {
      const weekNum = getISOWeek(curDate);
      if (!weekMap.has(weekNum)) {
        weekMap.set(weekNum, {});
      }
      const entry = weekMap.get(weekNum)!;
      if (dayOfWeek === 1) entry.mondayDate = curDate;
      if (dayOfWeek === 5) entry.fridayDate = curDate;
    }
  }

  const sortedWeeks = Array.from(weekMap.entries()).sort((a, b) => {
    // Check if week wraps around year boundary
    if (monthIdx === 0 && a[0] > 50) return -1;
    if (monthIdx === 0 && b[0] > 50) return 1;
    return a[0] - b[0];
  });

  const weeks: Week[] = [];

  for (const [weekNum, dates] of sortedWeeks) {
    const weekId = `${monthId}-week-${weekNum}`;
    const weekTitle = `Tydzień ${weekNum}`;

    let monday = null;
    let friday = null;
    let singleDay = null;

    if (dates.mondayDate && dates.fridayDate) {
      const monStr = formatDatePL(dates.mondayDate);
      const friStr = formatDatePL(dates.fridayDate);

      const monLessons: Lesson[] = prefillStudents && defaultTemplates?.monday
        ? defaultTemplates.monday.map((t, i) => ({
            id: `les-${monthId}-${weekNum}-mon-${i}`,
            date: monStr,
            student: t.student,
            duration: t.duration,
            price: t.price,
            status: 'Był',
            excused: '',
            sum: t.price,
          }))
        : [];

      const friLessons: Lesson[] = prefillStudents && defaultTemplates?.friday
        ? defaultTemplates.friday.map((t, i) => ({
            id: `les-${monthId}-${weekNum}-fri-${i}`,
            date: friStr,
            student: t.student,
            duration: t.duration,
            price: t.price,
            status: 'Był',
            excused: '',
            sum: t.price,
          }))
        : [];

      monday = {
        title: `Poniedziałek, ${monStr}`,
        date: monStr,
        dayOfWeek: 'Poniedziałek',
        lessons: monLessons,
        total: monLessons.reduce((acc, l) => acc + l.sum, 0),
      };

      friday = {
        title: `Piątek, ${friStr}`,
        date: friStr,
        dayOfWeek: 'Piątek',
        lessons: friLessons,
        total: friLessons.reduce((acc, l) => acc + l.sum, 0),
      };
    } else if (dates.mondayDate) {
      const monStr = formatDatePL(dates.mondayDate);
      const monLessons: Lesson[] = prefillStudents && defaultTemplates?.monday
        ? defaultTemplates.monday.map((t, i) => ({
            id: `les-${monthId}-${weekNum}-mon-${i}`,
            date: monStr,
            student: t.student,
            duration: t.duration,
            price: t.price,
            status: 'Był',
            excused: '',
            sum: t.price,
          }))
        : [];

      monday = {
        title: `Poniedziałek, ${monStr}`,
        date: monStr,
        dayOfWeek: 'Poniedziałek',
        lessons: monLessons,
        total: monLessons.reduce((acc, l) => acc + l.sum, 0),
      };
    } else if (dates.fridayDate) {
      const friStr = formatDatePL(dates.fridayDate);
      const friLessons: Lesson[] = prefillStudents && defaultTemplates?.friday
        ? defaultTemplates.friday.map((t, i) => ({
            id: `les-${monthId}-${weekNum}-fri-${i}`,
            date: friStr,
            student: t.student,
            duration: t.duration,
            price: t.price,
            status: 'Był',
            excused: '',
            sum: t.price,
          }))
        : [];

      friday = {
        title: `Piątek, ${friStr}`,
        date: friStr,
        dayOfWeek: 'Piątek',
        lessons: friLessons,
        total: friLessons.reduce((acc, l) => acc + l.sum, 0),
      };
    }

    weeks.push({
      id: weekId,
      weekTitle,
      monday,
      friday,
      singleDay,
    });
  }

  const regularTotal = weeks.reduce((acc, w) => {
    const m = w.monday?.total || 0;
    const f = w.friday?.total || 0;
    const s = w.singleDay?.total || 0;
    return acc + m + f + s;
  }, 0);

  return {
    id: monthId,
    name: `${monthEntry.name} ${year}`,
    weeks,
    additional: [],
    additionalTotal: 0,
    regularTotal,
    grandTotal: regularTotal,
  };
}

export const DAY_OF_WEEK_OPTIONS = [
  { name: 'Poniedziałek', index: 1, short: 'Pn' },
  { name: 'Wtorek', index: 2, short: 'Wt' },
  { name: 'Środa', index: 3, short: 'Śr' },
  { name: 'Czwartek', index: 4, short: 'Cz' },
  { name: 'Piątek', index: 5, short: 'Pt' },
  { name: 'Sobota', index: 6, short: 'So' },
] as const;

export function parsePlDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.trim().split('.');
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
      return new Date(y, m, d);
    }
  }
  return null;
}

export function getISODateForWeekDay(year: number, weekNumber: number, dayIndex: number): string {
  // ISO week 1 always contains Jan 4th
  const jan4 = new Date(year, 0, 4);
  const dayNr = (jan4.getDay() + 6) % 7; // Mon = 0, Sun = 6
  // Monday of ISO week 1
  const monWeek1 = new Date(year, 0, 4 - dayNr);
  // Calculate target date
  const target = new Date(monWeek1.getTime() + ((weekNumber - 1) * 7 + (dayIndex - 1)) * 86400000);
  return formatDatePL(target);
}

export function calculateDateForWeekAndDay(
  week: Week,
  monthName: string,
  targetDayIndex: number // 1 = Mon, ..., 6 = Sat
): string {
  // 1. Check if any day already exists in the week to anchor the date accurately
  const existingDays = [
    week.monday,
    week.friday,
    week.singleDay,
    ...(week.days || []),
  ].filter(Boolean) as Array<{ date?: string; dayOfWeek?: string }>;

  for (const ed of existingDays) {
    if (ed.date) {
      const parsed = parsePlDate(ed.date);
      if (parsed) {
        const foundOpt = DAY_OF_WEEK_OPTIONS.find(
          (opt) => opt.name.toLowerCase() === (ed.dayOfWeek || '').toLowerCase()
        );
        const edIdx = foundOpt ? foundOpt.index : (parsed.getDay() === 0 ? 7 : parsed.getDay());
        const diffDays = targetDayIndex - edIdx;
        const targetDate = new Date(parsed.getTime() + diffDays * 86400000);
        return formatDatePL(targetDate);
      }
    }
  }

  // 2. Otherwise calculate from ISO week number and year
  const weekNumMatch = week.weekTitle.match(/\d+/);
  const weekNum = weekNumMatch ? parseInt(weekNumMatch[0], 10) : 1;
  const yearMatch = monthName.match(/\d{4}/);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear();

  return getISODateForWeekDay(year, weekNum, targetDayIndex);
}

/**
 * Creates a clean copy of months for private workspace.
 * In private workspace, Mondays and Fridays are NOT added by default.
 * The teacher can manually add any day from Monday to Saturday as desired.
 */
export function createEmptyPrivateMonths(sourceMonths: MonthData[]): MonthData[] {
  return sourceMonths.map((m) => ({
    id: m.id,
    name: m.name,
    weeks: m.weeks.map((w) => ({
      id: w.id,
      weekTitle: w.weekTitle,
      monday: null,
      friday: null,
      singleDay: null,
      days: [],
    })),
    additional: [],
    additionalTotal: 0,
    regularTotal: 0,
    grandTotal: 0,
  }));
}

/**
 * Strips out default empty Mondays/Fridays from existing cached privateMonths
 * so that existing sessions conform to the manual day addition requirement.
 */
export function sanitizePrivateMonths(privateMonths: MonthData[]): MonthData[] {
  return (privateMonths || []).map((m) => ({
    ...m,
    weeks: (m.weeks || []).map((w) => {
      // Keep monday only if it has actual lessons
      const monday =
        w.monday && Array.isArray(w.monday.lessons) && w.monday.lessons.length > 0
          ? w.monday
          : null;
      // Keep friday only if it has actual lessons
      const friday =
        w.friday && Array.isArray(w.friday.lessons) && w.friday.lessons.length > 0
          ? w.friday
          : null;
      // Keep singleDay only if it has actual lessons
      const singleDay =
        w.singleDay && Array.isArray(w.singleDay.lessons) && w.singleDay.lessons.length > 0
          ? w.singleDay
          : null;

      return {
        ...w,
        monday,
        friday,
        singleDay,
        days: w.days || [],
      };
    }),
  }));
}
