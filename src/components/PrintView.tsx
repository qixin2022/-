import React from 'react';
import {
  DayRecord,
  AttendanceSettings,
  MonthlyTotals
} from '../types';
import { Printer, X } from 'lucide-react';

interface PrintViewProps {
  isOpen: boolean;
  onClose: () => void;
  records: DayRecord[];
  settings: AttendanceSettings;
  totals: MonthlyTotals;
}

export const PrintView: React.FC<PrintViewProps> = ({
  isOpen,
  onClose,
  records,
  settings,
  totals,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex flex-col items-center p-4 sm:p-6 print:p-0 print:bg-white print:static">
      
      {/* Floating Action Controls (Hidden during physical print) */}
      <div className="w-full max-w-5xl mb-4 flex items-center justify-between bg-slate-800 text-white px-5 py-3 rounded-xl shadow-lg print:hidden">
        <div className="flex items-center gap-2">
          <Printer className="w-5 h-5 text-blue-400" />
          <span className="font-bold text-sm">A4標準印刷プレビュー</span>
          <span className="text-xs text-slate-400">
            （ブラウザの「印刷」または「PDFに保存」機能でそのまま印刷可能です）
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-trigger-print"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white rounded-lg shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>今すぐ印刷 (A4縦・1ページ)</span>
          </button>
          <button
            id="btn-close-print-preview"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* A4 Paper Sheet Container */}
      <div className="print-page-container bg-white text-slate-900 w-full max-w-5xl p-6 sm:p-8 shadow-2xl rounded-sm print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none text-xs border border-slate-300 print:border-none">
        
        {/* Document Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-2 mb-2">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {settings.employmentType === 'part_time' ? '出勤簿兼賃金管理表（アルバイト・パート）' : '勤 務 管 理 表'}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                {settings.employmentType === 'part_time' ? 'アルバイト・パート' : '正社員（一般労働時間制）'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              （労働基準法第108条準拠 出勤簿・時間外労働実績集計表）
            </p>
            <div className="flex items-baseline gap-4 mt-1 text-xs">
              <span className="font-bold text-sm text-slate-800">
                {settings.year} 年 {settings.month} 月
              </span>
              <span className="text-slate-600 font-medium">
                所定労働: {settings.standardDailyMinutes / 60}時間/日
              </span>
              {settings.employmentType === 'part_time' && (
                <span className="text-blue-700 font-medium">
                  時給: ¥{settings.hourlyWage?.toLocaleString() || '1,200'} / 交通費: ¥{settings.dailyTransportation?.toLocaleString() || '0'}/日
                </span>
              )}
            </div>
          </div>

          {/* Employee & Approval Stamps */}
          <div className="flex items-center gap-4">
            {/* Employee Meta Box */}
            <div className="text-right text-[11px] leading-tight space-y-0.5">
              <div>
                <span className="text-slate-500 mr-1.5">会社名:</span>
                <span className="font-bold text-slate-800">{settings.companyName || '株式会社 ○○○○'}</span>
              </div>
              <div>
                <span className="text-slate-500 mr-1.5">所　属:</span>
                <span className="font-bold text-slate-800">{settings.department || '未設定'}</span>
              </div>
              <div>
                <span className="text-slate-500 mr-1.5">社員番号:</span>
                <span className="font-mono font-bold text-slate-800">{settings.employeeId || '---'}</span>
              </div>
              <div>
                <span className="text-slate-500 mr-1.5">氏　名:</span>
                <span className="font-bold text-slate-900 text-xs">{settings.employeeName || '未設定'}</span>
              </div>
            </div>

            {/* Hanko Stamp Block */}
            <table className="border-collapse border border-slate-700 text-center text-[9px] w-40">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-700 font-bold divide-x divide-slate-700">
                  <th className="py-0.5 w-1/3">{settings.seals.slot1.title || '部長'}</th>
                  <th className="py-0.5 w-1/3">{settings.seals.slot2.title || '課長'}</th>
                  <th className="py-0.5 w-1/3">{settings.seals.slot3.title || '担当'}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="h-10 divide-x divide-slate-700">
                  <td className="align-middle text-rose-600 font-bold text-[10px]">
                    {settings.seals.slot1.name || ''}
                  </td>
                  <td className="align-middle text-rose-600 font-bold text-[10px]">
                    {settings.seals.slot2.name || ''}
                  </td>
                  <td className="align-middle text-rose-600 font-bold text-[10px]">
                    {settings.seals.slot3.name || ''}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly KPI Summary Strip */}
        <div className="mb-2">
          <table className="w-full border-collapse border border-slate-400 text-center text-[10px]">
            <thead>
              <tr className="bg-slate-100 divide-x divide-slate-300 font-bold text-slate-700">
                <th className="py-1 px-1">所定日数</th>
                <th className="py-1 px-1">出勤日数</th>
                <th className="py-1 px-1">休日日数</th>
                <th className="py-1 px-1">有休日数</th>
                <th className="py-1 px-1">欠勤日数</th>
                <th className="py-1 px-1">休日労働</th>
                <th className="py-1 px-1">総実働時間</th>
                <th className="py-1 px-1">時間外残業</th>
                <th className="py-1 px-1">深夜残業</th>
                <th className="py-1 px-1">所定内労働計</th>
              </tr>
            </thead>
            <tbody>
              <tr className="divide-x divide-slate-300 font-bold text-slate-800 bg-white">
                <td className="py-1">{totals.scheduledWorkDays} 日</td>
                <td className="py-1">{totals.actualWorkDays} 日</td>
                <td className="py-1 text-indigo-700">{totals.totalHolidayDays} 日</td>
                <td className="py-1">{totals.paidLeaveDays} 日</td>
                <td className={`py-1 ${totals.absenceDays > 0 ? 'text-red-600 font-black bg-red-50' : ''}`}>{totals.absenceDays} 日</td>
                <td className="py-1">{totals.holidayWorkDays} 日</td>
                <td className="py-1 text-blue-700">{totals.totalActualHoursStr}</td>
                <td className="py-1 text-amber-700">{totals.totalOvertimeHoursStr}</td>
                <td className="py-1 text-purple-700">{totals.totalMidnightHoursStr}</td>
                <td className="py-1">{Math.max(0, Math.floor((totals.totalActualMinutes - totals.totalOvertimeMinutes) / 60))}h{(totals.totalActualMinutes - totals.totalOvertimeMinutes) % 60}m</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Main Printable Table */}
        <table className="w-full border-collapse border border-slate-700 text-center text-[9.5px] leading-tight">
          <thead>
            <tr className="bg-slate-800 text-white font-bold divide-x divide-slate-600">
              <th className="py-0.5 px-1 w-7">日</th>
              <th className="py-0.5 px-1 w-7">曜</th>
              <th className="py-0.5 px-1 w-12">区分</th>
              <th className="py-0.5 px-1 w-12">出勤</th>
              <th className="py-0.5 px-1 w-12">退勤</th>
              <th className="py-0.5 px-1 w-10">休憩</th>
              <th className="py-0.5 px-1 w-14">実働時間</th>
              <th className="py-0.5 px-1 w-14">時間外</th>
              <th className="py-0.5 px-1 w-12">深夜</th>
              <th className="py-0.5 px-1.5 text-left">備考 / 祝日名 / 業務内容</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {records.map((r) => {
              const isSunOrHol = r.dayOfWeek === 0 || r.isHoliday;
              const isSat = r.dayOfWeek === 6;
              const isAbsence = r.status === '欠勤';
              const isWork = r.status === '出勤';

              // Color rules:
              // 1. Work -> uncolored (pure white)
              // 2. Absence -> highlighted red
              // 3. All rest days (Sunday, Holiday, Saturday, 有休, 振休, 特休, 病休, 休日) -> uniform green
              let rowStyle = 'bg-white';
              if (isAbsence) {
                rowStyle = 'bg-red-50 font-bold text-red-900';
              } else if (isWork) {
                rowStyle = 'bg-white';
              } else {
                rowStyle = 'bg-emerald-50 text-emerald-950';
              }

              return (
                <tr
                  key={r.day}
                  className={`divide-x divide-slate-300 ${rowStyle}`}
                >
                  <td className="py-0.5 px-0.5 font-bold">{r.day}</td>
                  <td
                    className={`py-0.5 px-0.5 font-bold ${
                      isAbsence
                        ? 'text-red-700'
                        : isWork
                        ? 'text-slate-700'
                        : 'text-emerald-800'
                    }`}
                  >
                    {r.dayOfWeekLabel}
                  </td>
                  <td className={`py-0.5 px-0.5 ${isAbsence ? 'font-black text-red-700' : 'font-semibold'}`}>
                    {r.status}
                  </td>
                  <td className="py-0.5 px-0.5 font-mono">{r.startTime || '—'}</td>
                  <td className="py-0.5 px-0.5 font-mono">{r.endTime || '—'}</td>
                  <td className="py-0.5 px-0.5 font-mono">{r.breakTime !== '00:00' ? r.breakTime : '—'}</td>
                  <td className="py-0.5 px-0.5 font-mono font-bold text-blue-900">
                    {r.actualWorkMinutes > 0 ? r.actualWorkFormatted : '—'}
                  </td>
                  <td className="py-0.5 px-0.5 font-mono font-bold text-amber-900">
                    {r.overtimeMinutes > 0 ? r.overtimeFormatted : '00:00'}
                  </td>
                  <td className="py-0.5 px-0.5 font-mono">{r.midnightMinutes > 0 ? r.midnightFormatted : '00:00'}</td>
                  <td className="py-0.5 px-1.5 text-left text-[9px] truncate max-w-[200px]">
                    {isAbsence && <span className="font-bold text-red-700 mr-1">[欠勤]</span>}
                    {r.status === '病休' && <span className="font-semibold text-emerald-800 mr-1">[病気休暇]</span>}
                    {r.isHoliday && r.holidayName && `[祝: ${r.holidayName}] `}
                    {r.remarks}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-700 divide-x divide-slate-400">
              <td colSpan={3} className="py-1 text-center">合　計</td>
              <td className="py-1">—</td>
              <td className="py-1">—</td>
              <td className="py-1 font-mono">{totals.totalBreakHoursStr}</td>
              <td className="py-1 font-mono text-blue-900">{totals.totalActualHoursStr}</td>
              <td className="py-1 font-mono text-amber-900">{totals.totalOvertimeHoursStr}</td>
              <td className="py-1 font-mono">{totals.totalMidnightHoursStr}</td>
              {/* Remarks in total row: empty as requested */}
              <td className="py-1 bg-slate-50"></td>
            </tr>
          </tfoot>
        </table>

        {/* Footer Notes & Sign off */}
        <div className="mt-2 pt-1.5 border-t border-slate-300 flex items-start justify-between text-[9px] text-slate-500">
          <div>
            <p>※ 本勤務管理表は労働基準法第108条に基づく賃金台帳・出勤簿としての記録要件を満たしています。</p>
            <p>※ 出勤は無色（白）、欠勤は赤色強調、すべての休息日（土日祝・有休・振休・特休・病休）は緑色で統一されています（A4縦1ページ対応）。</p>
          </div>
          <div className="text-right">
            <span>本人確認署名: ___________________________ 印</span>
          </div>
        </div>

      </div>

    </div>
  );
};
