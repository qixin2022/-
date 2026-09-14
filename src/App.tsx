/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DayRecord,
  AttendanceSettings,
  AttendanceStatus,
  MonthlyTotals
} from './types';
import { getHolidayName } from './utils/holidays';
import {
  recalculateDayRecord,
  calculateMonthlyTotals,
  timeStringToMinutes,
  minutesToTimeString
} from './utils/timeCalculations';
import { exportAttendanceToExcel } from './utils/excelExporter';

import { HeaderBar } from './components/HeaderBar';
import { MonthlySummary } from './components/MonthlySummary';
import { AttendanceTable } from './components/AttendanceTable';
import { SettingsModal } from './components/SettingsModal';
import { FormulaModal } from './components/FormulaModal';
import { PrintView } from './components/PrintView';

// Helper to generate day records for a given year & month
function generateMonthRecords(settings: AttendanceSettings): DayRecord[] {
  const { year, month } = settings;
  const daysInMonth = new Date(year, month, 0).getDate();
  const records: DayRecord[] = [];

  const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const dayOfWeek = date.getDay();
    const dayOfWeekLabel = dayLabels[dayOfWeek];
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const holidayName = getHolidayName(year, month, d);
    const isHoliday = !!holidayName;
    const isMaintenanceDay =
      settings.maintenanceConfig.enabled &&
      settings.maintenanceConfig.selectedDays.includes(d);

    let status: AttendanceStatus = '出勤';
    let startTime = '';
    let endTime = '';
    let breakTime = '01:00';
    let maintenanceDeduction = '00:00';
    let remarks = '';

    if (isHoliday) {
      status = '休日';
      remarks = `祝日: ${holidayName}`;
    } else if (isWeekend) {
      status = '休日';
    } else {
      // Regular weekday - prefill realistic sample for demonstration
      status = '出勤';
      startTime = settings.defaultStartTime;
      // Add slight variety to demonstrate overtime on certain days
      if (d === 5 || d === 12 || d === 18) {
        endTime = '19:30'; // 1.5h overtime
        remarks = '通常業務・残業';
      } else if (d === 22) {
        endTime = '20:00'; // 2.0h overtime
        remarks = '月末締め作業';
      } else {
        endTime = settings.defaultEndTime;
      }
    }

    const mm = String(month).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const dateStr = `${year}-${mm}-${dd}`;

    const rawRecord: DayRecord = {
      day: d,
      dateStr,
      dayOfWeek,
      dayOfWeekLabel,
      isWeekend,
      isHoliday,
      holidayName: holidayName || undefined,
      isMaintenanceDay,
      status,
      startTime,
      endTime,
      breakTime,
      maintenanceDeduction,
      actualWorkMinutes: 0,
      actualWorkFormatted: '00:00',
      overtimeMinutes: 0,
      overtimeFormatted: '00:00',
      midnightMinutes: 0,
      midnightFormatted: '00:00',
      remarks,
    };

    records.push(recalculateDayRecord(rawRecord, settings));
  }

  return records;
}

export default function App() {
  // Initial settings state
  const [settings, setSettings] = useState<AttendanceSettings>(() => {
    return {
      year: 2026,
      month: 9,
      employmentType: 'regular',
      hourlyWage: 1250,
      dailyTransportation: 600,
      companyName: '株式会社 テクノロジーマニュファクチャリング',
      department: '製造統轄部 設備管理課',
      employeeId: 'EMP-2048',
      employeeName: '山田 太郎',
      standardDailyMinutes: 480, // 8.0 hours
      defaultStartTime: '09:00',
      defaultEndTime: '18:00',
      lunchBreakMode: 'auto_statutory',
      defaultBreakTime: '01:00',
      maintenanceConfig: {
        enabled: true,
        name: '月次ライン設備定期保守・点検',
        mode: 'hour_deduction',
        selectedDays: [11, 25], // 11th and 25th as maintenance days
        defaultDeductionTime: '01:00',
        autoApplyToMonth: true,
      },
      seals: {
        slot1: { title: '部長', name: '佐藤' },
        slot2: { title: '課長', name: '高橋' },
        slot3: { title: '担当', name: '山田' },
      },
    };
  });

  // Daily records state
  const [records, setRecords] = useState<DayRecord[]>(() => generateMonthRecords(settings));

  // Modal visibility states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFormulaOpen, setIsFormulaOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // When year or month in settings changes, regenerate or update records
  const handleUpdateSettings = useCallback((newPartial: Partial<AttendanceSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...newPartial };
      // If year or month changed, regenerate records
      if (newPartial.year !== undefined || newPartial.month !== undefined) {
        setTimeout(() => {
          setRecords(generateMonthRecords(next));
        }, 0);
      }
      return next;
    });
  }, []);

  // Update a single day record
  const handleUpdateRecord = useCallback((day: number, updates: Partial<DayRecord>) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.day === day) {
          const updated = { ...r, ...updates };
          return recalculateDayRecord(updated, settings);
        }
        return r;
      })
    );
  }, [settings]);

  // Quick fill default time (09:00 - 18:00)
  const handleQuickFillDay = useCallback((day: number) => {
    handleUpdateRecord(day, {
      status: '出勤',
      startTime: settings.defaultStartTime,
      endTime: settings.defaultEndTime,
      breakTime: settings.defaultBreakTime,
    });
  }, [handleUpdateRecord, settings]);

  // Clear a day
  const handleClearDay = useCallback((day: number) => {
    handleUpdateRecord(day, {
      status: '休日',
      startTime: '',
      endTime: '',
      breakTime: '00:00',
      maintenanceDeduction: '00:00',
      remarks: '',
    });
  }, [handleUpdateRecord]);

  // Copy previous day's record
  const handleCopyPrevDay = useCallback((day: number) => {
    const prevRecord = records.find((r) => r.day === day - 1);
    if (!prevRecord) return;
    handleUpdateRecord(day, {
      status: prevRecord.status,
      startTime: prevRecord.startTime,
      endTime: prevRecord.endTime,
      breakTime: prevRecord.breakTime,
      maintenanceDeduction: prevRecord.maintenanceDeduction,
      remarks: prevRecord.remarks,
    });
  }, [records, handleUpdateRecord]);

  // Toggle maintenance day status on a specific day
  const handleToggleMaintenanceDay = useCallback((day: number) => {
    const record = records.find((r) => r.day === day);
    if (!record) return;
    const nextIsMaint = !record.isMaintenanceDay;

    // Update settings selectedDays array as well
    const curDays = [...settings.maintenanceConfig.selectedDays];
    const idx = curDays.indexOf(day);
    if (nextIsMaint && idx < 0) curDays.push(day);
    if (!nextIsMaint && idx >= 0) curDays.splice(idx, 1);
    setSettings((s) => ({
      ...s,
      maintenanceConfig: { ...s.maintenanceConfig, selectedDays: curDays.sort((a, b) => a - b) },
    }));

    handleUpdateRecord(day, {
      isMaintenanceDay: nextIsMaint,
      maintenanceDeduction: nextIsMaint ? (settings.maintenanceConfig.defaultDeductionTime || '01:00') : '00:00',
      remarks: nextIsMaint
        ? `定修 (${settings.maintenanceConfig.name || '定期保守'})`
        : record.remarks.replace(/\[?定修.*?\]?/g, '').trim(),
    });
  }, [records, settings, handleUpdateRecord]);

  // Batch fill standard hours for all normal weekdays (Monday-Friday, excluding holidays and maintenance off days)
  const handleBatchFillWeekdays = useCallback(() => {
    setRecords((prev) =>
      prev.map((r) => {
        if (!r.isWeekend && !r.isHoliday && r.status !== '定修休') {
          const updated: DayRecord = {
            ...r,
            status: '出勤',
            startTime: settings.defaultStartTime,
            endTime: settings.defaultEndTime,
            breakTime: settings.defaultBreakTime,
          };
          return recalculateDayRecord(updated, settings);
        }
        return r;
      })
    );
  }, [settings]);

  // Reset entire month
  const handleResetMonth = useCallback(() => {
    setRecords(generateMonthRecords(settings));
  }, [settings]);

  // Apply batch maintenance config from settings modal
  const handleApplyMaintenanceToRecords = useCallback(
    (selectedDays: number[], isDayOff: boolean, deductionTime: string) => {
      setRecords((prev) =>
        prev.map((r) => {
          const isTarget = selectedDays.includes(r.day);
          if (isTarget) {
            const updated: DayRecord = {
              ...r,
              isMaintenanceDay: true,
              status: isDayOff ? '定修休' : r.status === '出勤' ? '出勤' : '出勤',
              startTime: isDayOff ? '' : (r.startTime || settings.defaultStartTime),
              endTime: isDayOff ? '' : (r.endTime || settings.defaultEndTime),
              maintenanceDeduction: isDayOff ? '00:00' : deductionTime,
              remarks: `定修 (${settings.maintenanceConfig.name || '定期保守'})`,
            };
            return recalculateDayRecord(updated, settings);
          } else if (r.isMaintenanceDay) {
            // Remove maintenance if it was unselected
            const updated: DayRecord = {
              ...r,
              isMaintenanceDay: false,
              maintenanceDeduction: '00:00',
              remarks: r.remarks.replace(/定修.*$/g, '').trim(),
            };
            return recalculateDayRecord(updated, settings);
          }
          return r;
        })
      );
    },
    [settings]
  );

  // Compute monthly totals
  const totals: MonthlyTotals = useMemo(() => {
    return calculateMonthlyTotals(records, settings);
  }, [records, settings]);

  // Export to Excel with real formulas
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await exportAttendanceToExcel(records, settings, totals);
    } catch (err) {
      console.error('Failed to export Excel:', err);
      alert('Excel出力中にエラーが発生しました。');
    } finally {
      setIsExporting(false);
    }
  };

  const daysInCurrentMonth = new Date(settings.year, settings.month, 0).getDate();

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Top Navigation & Controls */}
      <HeaderBar
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenFormulas={() => setIsFormulaOpen(true)}
        onOpenPrintPreview={() => setIsPrintPreviewOpen(true)}
        onBatchFillWeekdays={handleBatchFillWeekdays}
        onResetMonth={handleResetMonth}
        onExportExcel={handleExportExcel}
        isExporting={isExporting}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5">
        
        {/* Monthly Totals Summary Bar */}
        <MonthlySummary totals={totals} settings={settings} />

        {/* Attendance Spreadsheet Table */}
        <AttendanceTable
          records={records}
          settings={settings}
          onUpdateRecord={handleUpdateRecord}
          onQuickFillDay={handleQuickFillDay}
          onClearDay={handleClearDay}
          onCopyPrevDay={handleCopyPrevDay}
        />

        {/* Explanatory Info Card at bottom */}
        <div className="mt-5 p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 print:hidden shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <p>
              <strong>標準Excel数式連携中:</strong> 出勤簿を出力した際、実働時間・残業時間・曜日・月次合計は全てExcel関数（<code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">=MAX(...)</code>、<code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">=SUM(...)</code>）で書き込まれます。<strong>セルC2の月を変更すると自動で全日・休日が再計算されます。</strong>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsFormulaOpen(true)}
              className="text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2 transition"
            >
              数式仕様を確認
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-slate-700 hover:text-slate-900 font-semibold underline underline-offset-2 transition"
            >
              会社・勤務設定
            </button>
          </div>
        </div>

      </main>

      {/* Settings Modal (Company, Maintenance, Lunch formulas, Hanko seals) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        daysInMonth={daysInCurrentMonth}
        onSave={(newSettings) => setSettings(newSettings)}
        onApplyMaintenanceToRecords={handleApplyMaintenanceToRecords}
      />

      {/* Formula Reference Modal */}
      <FormulaModal
        isOpen={isFormulaOpen}
        onClose={() => setIsFormulaOpen(false)}
      />

      {/* Print Preview & Browser Print Modal */}
      <PrintView
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        records={records}
        settings={settings}
        totals={totals}
      />

    </div>
  );
}
