import React from 'react';
import {
  DayRecord,
  AttendanceStatus,
  AttendanceSettings
} from '../types';
import {
  Clock,
  Sparkles,
  RotateCcw,
  Copy,
  AlertTriangle
} from 'lucide-react';

interface AttendanceTableProps {
  records: DayRecord[];
  settings: AttendanceSettings;
  onUpdateRecord: (day: number, updates: Partial<DayRecord>) => void;
  onQuickFillDay: (day: number) => void;
  onClearDay: (day: number) => void;
  onCopyPrevDay: (day: number) => void;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records,
  settings,
  onUpdateRecord,
  onQuickFillDay,
  onClearDay,
  onCopyPrevDay,
}) => {
  const statusOptions: AttendanceStatus[] = [
    '出勤',
    '有休',
    '欠勤',
    '振休',
    '特休',
    '病休',
    '休日',
  ];

  // Calculate table-level totals for footer
  const totalBreakMinutes = records.reduce((acc, r) => {
    if (r.breakTime && r.breakTime.includes(':')) {
      const [h, m] = r.breakTime.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) return acc + (h * 60 + m);
    }
    return acc;
  }, 0);
  const totalActualMinutes = records.reduce((acc, r) => acc + (r.actualWorkMinutes || 0), 0);
  const totalOvertimeMinutes = records.reduce((acc, r) => acc + (r.overtimeMinutes || 0), 0);
  const totalMidnightMinutes = records.reduce((acc, r) => acc + (r.midnightMinutes || 0), 0);

  const formatHrsMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}:${String(m).padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden print:hidden">
      {/* Table Action Bar */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-700">日別勤怠データ入力</span>
          <span className="text-slate-400">|</span>
          <span className="hidden sm:inline text-slate-500">
            出退勤・休憩を入力すると、実働時間・残業・深夜時間が即座にExcel数式連携で自動計算されます
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-white border border-slate-300 inline-block" />
            <span className="text-[11px] text-slate-700 font-medium">出勤（無色）</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300 inline-block" />
            <span className="text-[11px] text-emerald-800 font-semibold">休日・有休・特休・振休・病休（緑色統一）</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-100 border border-red-300 inline-block" />
            <span className="text-[11px] text-red-700 font-bold">欠勤（特別強調）</span>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-white font-semibold text-[11px] uppercase tracking-wider divide-x divide-slate-800">
              <th className="py-2.5 px-2 text-center w-12">日付</th>
              <th className="py-2.5 px-2 text-center w-10">曜日</th>
              <th className="py-2.5 px-2 text-center w-20">区分</th>
              <th className="py-2.5 px-2 text-center w-24">出勤</th>
              <th className="py-2.5 px-2 text-center w-24">退勤</th>
              <th className="py-2.5 px-2 text-center w-20">
                <div className="flex items-center justify-center gap-1">
                  <span>休憩</span>
                  <span title="休憩時間 (HH:mm)">⚡</span>
                </div>
              </th>
              <th className="py-2.5 px-2 text-center w-20 bg-blue-950/80 text-blue-200">
                実働時間
              </th>
              <th className="py-2.5 px-2 text-center w-20 bg-amber-950/80 text-amber-200">
                残業時間
              </th>
              <th className="py-2.5 px-2 text-center w-18">深夜労働</th>
              <th className="py-2.5 px-3 text-left min-w-[160px]">備考 / 祝日名 / 業務内容</th>
              <th className="py-2.5 px-2 text-center w-18">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {records.map((r, idx) => {
              const isAbsence = r.status === '欠勤';
              const isWork = r.status === '出勤';

              // User Requirement:
              // 1. "区分是出勤的话 要求表格没有颜色" -> If status is "出勤", transparent / white
              // 2. "所有的休息日 颜色 要绿色 有休 振休 特休 休日 都要一样的颜色 设定 在加一个病休" -> All rest days uniform green
              // 3. "如果是欠勤的话 特别标准出来" -> Specially marked in warning red
              let rowClass = 'bg-white hover:bg-slate-50/60 transition-colors';
              if (isAbsence) {
                // 欠勤: 特別に目立つ警告レッド
                rowClass = 'bg-red-50/80 hover:bg-red-100/70 border-l-4 border-l-red-500 font-medium';
              } else if (isWork) {
                // 出勤: 完全無色（白）
                rowClass = 'bg-white hover:bg-slate-50/60';
              } else {
                // すべての休息日（有休、振休、特休、病休、休日、土日祝）: 統一のグリーン！
                rowClass = 'bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-950';
              }

              return (
                <tr key={r.day} className={`divide-x divide-slate-100/80 ${rowClass}`}>
                  {/* Day number */}
                  <td className="py-2 px-2 text-center font-bold text-slate-800">
                    {r.day}
                  </td>

                  {/* Day of week */}
                  <td className="py-2 px-2 text-center font-medium">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold ${
                        isAbsence
                          ? 'text-red-700 bg-red-100/80'
                          : isWork
                          ? 'text-slate-600'
                          : 'text-emerald-800 bg-emerald-100/80'
                      }`}
                    >
                      {r.dayOfWeekLabel}
                    </span>
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-1.5 px-1.5 text-center">
                    <select
                      id={`status-${r.day}`}
                      value={r.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as AttendanceStatus;
                        onUpdateRecord(r.day, { status: newStatus });
                      }}
                      className={`w-full py-1 px-1 rounded border text-[11px] font-semibold text-center focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                        r.status === '出勤'
                          ? 'bg-white border-slate-300 text-slate-800'
                          : r.status === '欠勤'
                          ? 'bg-red-100 border-red-400 text-red-800 font-bold ring-1 ring-red-400'
                          : 'bg-emerald-50 border-emerald-300 text-emerald-800 font-medium'
                      }`}
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Clock In */}
                  <td className="py-1.5 px-1 text-center">
                    <input
                      type="time"
                      id={`start-time-${r.day}`}
                      value={r.startTime}
                      onChange={(e) => onUpdateRecord(r.day, { startTime: e.target.value })}
                      disabled={r.status !== '出勤'}
                      className="w-full py-1 px-1 rounded border border-slate-200 text-slate-800 text-center font-mono text-[11px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100/60 disabled:text-slate-400"
                    />
                  </td>

                  {/* Clock Out */}
                  <td className="py-1.5 px-1 text-center">
                    <input
                      type="time"
                      id={`end-time-${r.day}`}
                      value={r.endTime}
                      onChange={(e) => onUpdateRecord(r.day, { endTime: e.target.value })}
                      disabled={r.status !== '出勤'}
                      className="w-full py-1 px-1 rounded border border-slate-200 text-slate-800 text-center font-mono text-[11px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100/60 disabled:text-slate-400"
                    />
                  </td>

                  {/* Break Time */}
                  <td className="py-1.5 px-1 text-center">
                    <input
                      type="text"
                      id={`break-time-${r.day}`}
                      placeholder="01:00"
                      value={r.breakTime}
                      onChange={(e) => onUpdateRecord(r.day, { breakTime: e.target.value })}
                      title="休憩時間 (HH:mm)"
                      disabled={r.status !== '出勤'}
                      className="w-full py-1 px-1 rounded border border-slate-200 text-slate-700 text-center font-mono text-[11px] focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100/60 disabled:text-slate-400"
                    />
                  </td>

                  {/* Actual Work Hours (Auto Calculated) */}
                  <td className="py-2 px-1 text-center font-mono font-bold text-blue-700 bg-blue-50/20">
                    <span
                      title={`Excel計算式: =IF(OR(D${r.day + 9}="",E${r.day + 9}=""),"",MAX(0,E${r.day + 9}-D${r.day + 9}-F${r.day + 9}))`}
                      className="cursor-help inline-block px-1 rounded hover:bg-blue-100/60 transition"
                    >
                      {r.actualWorkMinutes > 0 ? r.actualWorkFormatted : '—'}
                    </span>
                  </td>

                  {/* Overtime (Auto Calculated) */}
                  <td className="py-2 px-1 text-center font-mono font-bold bg-amber-50/20">
                    <span
                      title={`Excel計算式: =IF(実働="","",MAX(0,実働-8:00))`}
                      className={`inline-block px-1 rounded transition ${
                        r.overtimeMinutes > 0
                          ? 'text-amber-700 font-bold bg-amber-100/60'
                          : 'text-slate-400'
                      }`}
                    >
                      {r.overtimeMinutes > 0 ? r.overtimeFormatted : '00:00'}
                    </span>
                  </td>

                  {/* Midnight Work */}
                  <td className="py-2 px-1 text-center font-mono text-[11px]">
                    <span
                      className={
                        r.midnightMinutes > 0
                          ? 'text-purple-700 font-bold bg-purple-100/60 px-1 rounded'
                          : 'text-slate-400'
                      }
                    >
                      {r.midnightMinutes > 0 ? r.midnightFormatted : '00:00'}
                    </span>
                  </td>

                  {/* Remarks & Badges */}
                  <td className="py-1.5 px-2">
                    <div className="flex flex-col gap-1">
                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-1">
                        {r.status === '欠勤' && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white shadow-xs">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>【欠勤】</span>
                          </span>
                        )}
                        {r.status === '病休' && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            病気休暇
                          </span>
                        )}
                        {r.isHoliday && r.holidayName && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-700">
                            祝: {r.holidayName}
                          </span>
                        )}
                      </div>

                      <input
                        type="text"
                        id={`remarks-${r.day}`}
                        placeholder="業務内容・備考・理由を入力"
                        value={r.remarks}
                        onChange={(e) => onUpdateRecord(r.day, { remarks: e.target.value })}
                        className="w-full py-0.5 px-1.5 rounded border border-slate-200 text-slate-700 text-xs focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-1.5 px-1 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        id={`btn-fill-${r.day}`}
                        onClick={() => onQuickFillDay(r.day)}
                        title="定時(09:00〜18:00)を入力"
                        className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      </button>

                      {idx > 0 && (
                        <button
                          type="button"
                          id={`btn-copy-${r.day}`}
                          onClick={() => onCopyPrevDay(r.day)}
                          title="前日の時間をコピー"
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition hidden sm:inline-block"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      )}

                      <button
                        type="button"
                        id={`btn-clear-${r.day}`}
                        onClick={() => onClearDay(r.day)}
                        title="この日の入力内容をクリア"
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-semibold text-slate-800 text-[11px]">
            <tr className="divide-x divide-slate-200">
              <td colSpan={3} className="py-2.5 px-2 text-center bg-slate-900 text-white font-bold tracking-wider">
                合計
              </td>
              <td className="py-2 px-1 text-center text-slate-400 bg-slate-50">---</td>
              <td className="py-2 px-1 text-center text-slate-400 bg-slate-50">---</td>
              {/* Total Break: Auto summed via formulas */}
              <td className="py-2 px-1 text-center font-mono font-bold text-slate-800 bg-slate-100" title="全休憩時間の合計">
                {totalBreakMinutes > 0 ? formatHrsMins(totalBreakMinutes) : '0:00'}
              </td>
              {/* Total Actual Work */}
              <td className="py-2 px-1 text-center font-mono font-bold text-blue-700 bg-blue-50/50" title="実働時間の合計">
                {formatHrsMins(totalActualMinutes)}
              </td>
              {/* Total Overtime */}
              <td className="py-2 px-1 text-center font-mono font-bold text-amber-700 bg-amber-50/50" title="残業時間の合計">
                {formatHrsMins(totalOvertimeMinutes)}
              </td>
              {/* Total Midnight */}
              <td className="py-2 px-1 text-center font-mono font-bold text-indigo-700 bg-indigo-50/50" title="深夜労働の合計">
                {formatHrsMins(totalMidnightMinutes)}
              </td>
              {/* Remarks (Empty as requested in screenshot 2) */}
              <td className="py-2 px-3 bg-slate-50"></td>
              <td className="py-2 px-1 bg-slate-50"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
