import { DayRecord, AttendanceSettings, MonthlyTotals } from '../types';

/**
 * Converts 'HH:mm' string to total minutes from midnight (0:00).
 * Returns -1 if invalid or empty.
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return -1;
  const parts = timeStr.trim().split(':');
  if (parts.length !== 2) return -1;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return -1;
  return hours * 60 + minutes;
}

/**
 * Converts minutes to 'HH:mm' string.
 */
export function minutesToTimeString(totalMinutes: number): string {
  if (totalMinutes <= 0 || isNaN(totalMinutes)) return '00:00';
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Converts minutes to decimal hours rounded to 2 decimal places (e.g. 480 -> 8.00).
 */
export function minutesToDecimalHours(totalMinutes: number): number {
  if (totalMinutes <= 0 || isNaN(totalMinutes)) return 0;
  return Math.round((totalMinutes / 60) * 100) / 100;
}

/**
 * Calculate recommended break time according to settings and elapsed work time
 */
export function calculateBreakMinutes(
  startMinutes: number,
  endMinutes: number,
  mode: AttendanceSettings['lunchBreakMode'],
  defaultBreakTime: string
): number {
  if (startMinutes < 0 || endMinutes < 0 || endMinutes <= startMinutes) {
    return 0;
  }

  const elapsedMinutes = endMinutes - startMinutes;

  if (mode === 'auto_statutory') {
    // Japanese Labor Standards Act statutory break:
    // Working > 8 hours -> at least 60 min
    // Working > 6 hours -> at least 45 min
    if (elapsedMinutes > 8 * 60) {
      return 60;
    } else if (elapsedMinutes > 6 * 60) {
      return 45;
    } else {
      return 0;
    }
  }

  if (mode === 'fixed_window') {
    // Overlap with 12:00 to 13:00 (720 to 780 minutes)
    const lunchStart = 12 * 60;
    const lunchEnd = 13 * 60;
    const overlapStart = Math.max(startMinutes, lunchStart);
    const overlapEnd = Math.min(endMinutes, lunchEnd);
    if (overlapEnd > overlapStart) {
      return overlapEnd - overlapStart; // up to 60 minutes
    }
    return 0;
  }

  // Manual / fallback: use defaultBreakTime
  const def = timeStringToMinutes(defaultBreakTime);
  return def >= 0 ? def : 60;
}

/**
 * Calculate midnight hours (22:00 to 05:00 next day, or 1320 to 1740 in shifted scale)
 */
export function calculateMidnightMinutes(startMinutes: number, endMinutes: number): number {
  if (startMinutes < 0 || endMinutes < 0 || endMinutes <= startMinutes) {
    return 0;
  }

  let midnight = 0;
  // Case 1: End time extends past 22:00 (1320 min) on same day
  const midnightStart = 22 * 60; // 1320
  if (endMinutes > midnightStart) {
    const s = Math.max(startMinutes, midnightStart);
    midnight += endMinutes - s;
  }
  // Case 2: Start time was before 05:00 (300 min)
  const morningEnd = 5 * 60; // 300
  if (startMinutes < morningEnd) {
    const e = Math.min(endMinutes, morningEnd);
    midnight += e - startMinutes;
  }

  return midnight;
}

/**
 * Recomputes all calculated fields for a given DayRecord
 */
export function recalculateDayRecord(
  record: DayRecord,
  settings: AttendanceSettings
): DayRecord {
  // If status is not working status (e.g. 有休, 欠勤, 休日, 定修休), work hours are 0 unless user explicitly set times
  const isWorkingStatus = record.status === '出勤';

  if (!isWorkingStatus && (!record.startTime || !record.endTime)) {
    return {
      ...record,
      actualWorkMinutes: 0,
      actualWorkFormatted: '00:00',
      overtimeMinutes: 0,
      overtimeFormatted: '00:00',
      midnightMinutes: 0,
      midnightFormatted: '00:00',
    };
  }

  const startMin = timeStringToMinutes(record.startTime);
  const endMin = timeStringToMinutes(record.endTime);

  if (startMin < 0 || endMin < 0 || endMin <= startMin) {
    return {
      ...record,
      actualWorkMinutes: 0,
      actualWorkFormatted: '00:00',
      overtimeMinutes: 0,
      overtimeFormatted: '00:00',
      midnightMinutes: 0,
      midnightFormatted: '00:00',
    };
  }

  const grossElapsed = endMin - startMin;

  // Break minutes
  let breakMin = timeStringToMinutes(record.breakTime);
  if (breakMin < 0) {
    breakMin = calculateBreakMinutes(startMin, endMin, settings.lunchBreakMode, settings.defaultBreakTime);
  }

  // Maintenance deduction minutes
  let maintDeductionMin = timeStringToMinutes(record.maintenanceDeduction);
  if (maintDeductionMin < 0) {
    maintDeductionMin = 0;
  }

  // Actual work = Gross - Break - Maintenance deduction
  const actualWorkMin = Math.max(0, grossElapsed - breakMin - maintDeductionMin);

  // Overtime = max(0, actualWork - standardDailyMinutes)
  const overtimeMin = Math.max(0, actualWorkMin - settings.standardDailyMinutes);

  // Midnight minutes
  const midnightMin = calculateMidnightMinutes(startMin, endMin);

  return {
    ...record,
    breakTime: minutesToTimeString(breakMin),
    maintenanceDeduction: minutesToTimeString(maintDeductionMin),
    actualWorkMinutes: actualWorkMin,
    actualWorkFormatted: minutesToTimeString(actualWorkMin),
    overtimeMinutes: overtimeMin,
    overtimeFormatted: minutesToTimeString(overtimeMin),
    midnightMinutes: midnightMin,
    midnightFormatted: minutesToTimeString(midnightMin),
  };
}

/**
 * Calculates month-level aggregate totals
 */
export function calculateMonthlyTotals(
  records: DayRecord[],
  settings: AttendanceSettings
): MonthlyTotals {
  let scheduledWorkDays = 0;
  let actualWorkDays = 0;
  let totalHolidayDays = 0;
  let paidLeaveDays = 0;
  let absenceDays = 0;
  let holidayWorkDays = 0;
  let maintenanceDays = 0;

  let totalActualMinutes = 0;
  let totalOvertimeMinutes = 0;
  let totalMidnightMinutes = 0;
  let totalBreakMinutes = 0;
  let totalMaintenanceDeductionMinutes = 0;

  for (const r of records) {
    // Scheduled work days: weekdays that are not holidays
    if (!r.isWeekend && !r.isHoliday) {
      scheduledWorkDays++;
    }

    if (r.status === '出勤' && r.actualWorkMinutes > 0) {
      actualWorkDays++;
      if (r.isWeekend || r.isHoliday) {
        holidayWorkDays++;
      }
    } else if (r.status === '有休') {
      paidLeaveDays++;
    } else if (r.status === '欠勤') {
      absenceDays++;
    } else if (r.status === '休日' || r.status === '振休' || ((r.isWeekend || r.isHoliday) && r.status !== '出勤')) {
      totalHolidayDays++;
    }

    if (r.isMaintenanceDay) {
      maintenanceDays++;
    }

    totalActualMinutes += r.actualWorkMinutes;
    totalOvertimeMinutes += r.overtimeMinutes;
    totalMidnightMinutes += r.midnightMinutes;

    const bMin = timeStringToMinutes(r.breakTime);
    if (bMin > 0) totalBreakMinutes += bMin;

    if (r.maintenanceDeduction) {
      const mMin = timeStringToMinutes(r.maintenanceDeduction);
      if (mMin > 0) totalMaintenanceDeductionMinutes += mMin;
    }
  }

  return {
    totalCalendarDays: records.length,
    scheduledWorkDays,
    actualWorkDays,
    totalHolidayDays,
    paidLeaveDays,
    absenceDays,
    holidayWorkDays,
    maintenanceDays,
    totalActualMinutes,
    totalActualHoursStr: minutesToTimeString(totalActualMinutes),
    totalOvertimeMinutes,
    totalOvertimeHoursStr: minutesToTimeString(totalOvertimeMinutes),
    totalMidnightMinutes,
    totalMidnightHoursStr: minutesToTimeString(totalMidnightMinutes),
    totalBreakMinutes,
    totalBreakHoursStr: minutesToTimeString(totalBreakMinutes),
    totalMaintenanceDeductionMinutes,
  };
}
