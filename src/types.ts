export type AttendanceStatus =
  | '出勤'
  | '有休'
  | '欠勤'
  | '振休'
  | '特休'
  | '病休'
  | '休日';

export interface DayRecord {
  day: number; // 1..31
  dateStr: string; // YYYY-MM-DD
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  dayOfWeekLabel: string; // '日', '月', '火', '水', '木', '金', '土'
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isMaintenanceDay?: boolean; // 互換性用
  status: AttendanceStatus;
  startTime: string; // 'HH:mm'
  endTime: string; // 'HH:mm'
  breakTime: string; // 'HH:mm'
  maintenanceDeduction?: string; // 'HH:mm'
  actualWorkMinutes: number;
  actualWorkFormatted: string; // 'HH:mm'
  overtimeMinutes: number;
  overtimeFormatted: string; // 'HH:mm'
  midnightMinutes: number;
  midnightFormatted: string; // 'HH:mm'
  remarks: string;
}

export interface AttendanceSettings {
  year: number;
  month: number;
  employmentType: 'regular' | 'part_time'; // 'regular' = 正社員, 'part_time' = アルバイト・パート
  hourlyWage: number; // 時給 (アルバイト用、例: 1200)
  dailyTransportation: number; // 日額交通費 (アルバイト用、例: 500)
  companyName: string;
  department: string;
  employeeId: string;
  employeeName: string;
  standardDailyMinutes: number; // e.g., 480 (8 hours)
  defaultStartTime: string; // '09:00'
  defaultEndTime: string; // '18:00'
  lunchBreakMode: 'auto_statutory' | 'fixed_window' | 'manual';
  defaultBreakTime: string; // '01:00'
  
  // 定修設定 (不要時は無効化)
  maintenanceConfig?: {
    enabled: boolean;
    name: string;
    mode: 'days_off' | 'hour_deduction' | 'both';
    selectedDays: number[];
    defaultDeductionTime: string;
    autoApplyToMonth: boolean;
  };

  // 印鑑欄設定 (Approval Hanko Stamp slots)
  seals: {
    slot1: { title: string; name: string };
    slot2: { title: string; name: string };
    slot3: { title: string; name: string };
  };
}

export interface MonthlyTotals {
  totalCalendarDays: number;
  scheduledWorkDays: number;
  actualWorkDays: number;
  totalHolidayDays: number; // 休日合計日数 (土日祝・所定休日・振休)
  paidLeaveDays: number;
  absenceDays: number;
  holidayWorkDays: number;
  maintenanceDays?: number;
  totalActualMinutes: number;
  totalActualHoursStr: string;
  totalOvertimeMinutes: number;
  totalOvertimeHoursStr: string;
  totalMidnightMinutes: number;
  totalMidnightHoursStr: string;
  totalBreakMinutes: number;
  totalBreakHoursStr: string;
  totalMaintenanceDeductionMinutes?: number;
}
