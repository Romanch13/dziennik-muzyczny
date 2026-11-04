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
  id?: string;
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
  days?: DaySchedule[];
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

export type WorkspaceType = 'jagodno' | 'private';

export interface WorkshopDatabase {
  activeWorkspace?: WorkspaceType;
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
  privateMonths?: MonthData[];
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
