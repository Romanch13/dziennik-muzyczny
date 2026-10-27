export interface Lesson {
  id: string;
  date: string;
  student: string;
  duration: string;
  price: number;
  status: 'Był' | 'Nie był' | string;
  excused?: 'Liczę' | 'Nie liczę' | string;
  sum: number;
  note?: string;
}

export interface DaySchedule {
  title: string;
  date: string;
  dayOfWeek: string;
  lessons: Lesson[];
  total: number;
}

export interface Week {
  id: string;
  weekTitle: string;
  monday: DaySchedule | null;
  friday: DaySchedule | null;
  singleDay: DaySchedule | null;
}

export interface AdditionalLesson {
  id: string;
  day: string;
  date: string;
  student: string;
  duration: string;
  price: number;
  status: 'Był' | 'Nie był' | string;
  sum: number;
  note?: string;
}

export interface MonthData {
  id: string;
  name: string;
  weeks: Week[];
  additional: AdditionalLesson[];
  additionalTotal: number;
  regularTotal: number;
  grandTotal: number;
}

export interface PricingTier {
  duration: string;
  price: number;
}

export interface TemplateStudent {
  student: string;
  duration: string;
  price: number;
}

export interface SchoolInfo {
  name: string;
  location: string;
  description: string;
  pricing: PricingTier[];
  rules: string[];
}

export interface WorkshopDatabase {
  schoolInfo: SchoolInfo;
  defaultTemplates: {
    monday: TemplateStudent[];
    friday: TemplateStudent[];
  };
  settings: {
    defaultPasswordHint?: string;
    lastModified: string;
  };
  months: MonthData[];
}

export interface CopiedDayTemplate {
  sourceDayOfWeek: string;
  sourceDate?: string;
  lessons: Array<{
    student: string;
    duration: string;
    price: number;
  }>;
}
