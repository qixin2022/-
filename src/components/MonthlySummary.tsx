import React from 'react';
import {
  Clock,
  Briefcase,
  AlertCircle,
  Moon,
  Palmtree,
  CalendarCheck
} from 'lucide-react';
import { MonthlyTotals, AttendanceSettings } from '../types';

interface MonthlySummaryProps {
  totals: MonthlyTotals;
  settings: AttendanceSettings;
}

export const MonthlySummary: React.FC<MonthlySummaryProps> = ({ totals, settings }) => {
  // Expected target hours = scheduledWorkDays * (standardDailyMinutes / 60)
  const scheduledHours = (totals.scheduledWorkDays * settings.standardDailyMinutes) / 60;
  const actualHours = totals.totalActualMinutes / 60;
  const overtimeHours = totals.totalOvertimeMinutes / 60;
  const progressPercent = scheduledHours > 0 ? Math.min(100, Math.round((actualHours / scheduledHours) * 100)) : 0;

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-4 mb-5 print:hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">
            {settings.year}年{settings.month}月 勤務集計サマリー
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
            全{totals.totalCalendarDays}日間 / 所定{totals.scheduledWorkDays}日
          </span>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span>進捗率: <strong className="text-blue-600">{progressPercent}%</strong></span>
          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Actual Work Days */}
        <div className="bg-slate-50/70 border border-slate-200/60 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">実出勤 / 所定</span>
            <Briefcase className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-800">{totals.actualWorkDays}</span>
            <span className="text-xs text-slate-500">/ {totals.scheduledWorkDays} 日</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            休出: {totals.holidayWorkDays}日
          </p>
        </div>

        {/* Total Actual Hours */}
        <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-3">
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-xs font-medium">総実働時間</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-blue-950">{totals.totalActualHoursStr}</span>
            <span className="text-xs text-blue-600">H</span>
          </div>
          <p className="text-[11px] text-blue-600/80 mt-0.5">
            所定基準: {scheduledHours}h
          </p>
        </div>

        {/* Overtime Hours */}
        <div className="bg-amber-50/60 border border-amber-200/70 rounded-lg p-3">
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-xs font-medium">時間外残業計</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-amber-900">{totals.totalOvertimeHoursStr}</span>
            <span className="text-xs text-amber-700">H</span>
          </div>
          <p className="text-[11px] text-amber-700/80 mt-0.5">
            法定8h超過分の累計
          </p>
        </div>

        {/* Midnight Hours */}
        <div className="bg-purple-50/60 border border-purple-100 rounded-lg p-3">
          <div className="flex items-center justify-between text-purple-700 mb-1">
            <span className="text-xs font-medium">深夜労働計</span>
            <Moon className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-purple-950">{totals.totalMidnightHoursStr}</span>
            <span className="text-xs text-purple-600">H</span>
          </div>
          <p className="text-[11px] text-purple-600/80 mt-0.5">
            22:00〜05:00労働
          </p>
        </div>

        {/* Total Holidays (Rest Days) - Requested by User */}
        <div className="bg-indigo-50/60 border border-indigo-200/70 rounded-lg p-3">
          <div className="flex items-center justify-between text-indigo-800 mb-1">
            <span className="text-xs font-medium">休日日数（集計）</span>
            <Palmtree className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-indigo-950">{totals.totalHolidayDays}</span>
            <span className="text-xs text-indigo-700">日</span>
          </div>
          <p className="text-[11px] text-indigo-700/80 mt-0.5">
            土日祝・公休の合計日数
          </p>
        </div>

        {/* Paid Leave & Absence - Absence specially highlighted if > 0 */}
        <div className={`border rounded-lg p-3 ${totals.absenceDays > 0 ? 'bg-red-50/80 border-red-200' : 'bg-emerald-50/60 border-emerald-100'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-medium ${totals.absenceDays > 0 ? 'text-red-800' : 'text-emerald-800'}`}>有休・欠勤</span>
            <AlertCircle className={`w-4 h-4 ${totals.absenceDays > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="flex items-baseline gap-0.5">
              <span className="text-xs text-slate-500">有休</span>
              <span className="text-xl font-bold text-slate-900">{totals.paidLeaveDays}</span>
              <span className="text-xs text-slate-500">日</span>
            </div>
            <span className="text-slate-300">/</span>
            <div className="flex items-baseline gap-0.5">
              <span className={`text-xs ${totals.absenceDays > 0 ? 'text-red-700 font-bold' : 'text-slate-500'}`}>欠勤</span>
              <span className={`text-xl font-bold ${totals.absenceDays > 0 ? 'text-red-600' : 'text-slate-900'}`}>{totals.absenceDays}</span>
              <span className={`text-xs ${totals.absenceDays > 0 ? 'text-red-700' : 'text-slate-500'}`}>日</span>
            </div>
          </div>
          <p className={`text-[11px] mt-0.5 ${totals.absenceDays > 0 ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
            {totals.absenceDays > 0 ? '※ 欠勤記録あり（特別表示中）' : '欠勤なし'}
          </p>
        </div>

      </div>
    </div>
  );
};
