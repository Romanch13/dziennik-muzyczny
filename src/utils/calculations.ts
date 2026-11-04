import { MonthData, DaySchedule, Lesson, AdditionalLesson } from '../types/journal';

export function getPriceForDuration(duration: string): number {
  const clean = duration.toLowerCase().trim();
  if (clean.includes('30')) return 40;
  if (clean.includes('45')) return 60;
  if (clean.includes('60')) return 70;
  return 60;
}

export function calculateLessonSum(price: number, status: string, excused?: string): number {
  if (status === 'Był') {
    return price;
  }
  if (status === 'Nie był') {
    return excused === 'Liczę' ? price : 0;
  }
  return 0;
}

export function recalculateDay(day: DaySchedule | null): DaySchedule | null {
  if (!day) return null;
  const updatedLessons = day.lessons.map(l => ({
    ...l,
    sum: calculateLessonSum(l.price, l.status, l.excused)
  }));
  const total = updatedLessons.reduce((acc, curr) => acc + curr.sum, 0);
  return {
    ...day,
    lessons: updatedLessons,
    total
  };
}

export function recalculateMonth(month: MonthData): MonthData {
  const updatedWeeks = month.weeks.map(w => {
    const monday = recalculateDay(w.monday);
    const friday = recalculateDay(w.friday);
    const singleDay = recalculateDay(w.singleDay);
    return {
      ...w,
      monday,
      friday,
      singleDay
    };
  });

  const updatedAdditional = (month.additional || []).map(a => {
    const sum = a.status === 'Był' ? a.price : 0;
    return {
      ...a,
      sum
    };
  });

  const additionalTotal = updatedAdditional.reduce((acc, curr) => acc + curr.sum, 0);

  const regularTotal = updatedWeeks.reduce((acc, w) => {
    const mon = w.monday?.total || 0;
    const fri = w.friday?.total || 0;
    const sgl = w.singleDay?.total || 0;
    return acc + mon + fri + sgl;
  }, 0);

  const grandTotal = regularTotal + additionalTotal;

  return {
    ...month,
    weeks: updatedWeeks,
    additional: updatedAdditional,
    additionalTotal,
    regularTotal,
    grandTotal
  };
}

export { exportMonthToExcel } from './excelExport';

