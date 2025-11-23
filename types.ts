export interface RawSubstitutionData {
  date: string | number;
  period: string | number;
  teacher: string;
  classGroup: string;
}

export interface TeacherSummary {
  name: string;
  count: number;
  monthlyCounts: { [month: string]: number };
}

export type SortKey = keyof Omit<TeacherSummary, 'monthlyCounts'>;
export type SortDirection = 'ascending' | 'descending';

export interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export interface TeacherSchedule {
  name: string;
  freePeriods: {
    [day: string]: number[];
  };
}

export interface StandbyAssignment {
  id: string;
  teacherName: string;
  day: string;
  period: number;
}

export interface TeacherExclusion {
  teacherName: string;
  day: string;
  period: number;
}
