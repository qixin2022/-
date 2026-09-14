import React from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  Settings,
  Zap,
  HelpCircle,
  FileSpreadsheet,
  RotateCcw,
  UserCheck
} from 'lucide-react';
import { AttendanceSettings } from '../types';

interface HeaderBarProps {
  settings: AttendanceSettings;
  onUpdateSettings: (newSettings: Partial<AttendanceSettings>) => void;
  onOpenSettings: () => void;
  onOpenFormulas: () => void;
  onOpenPrintPreview: () => void;
  onBatchFillWeekdays: () => void;
  onResetMonth: () => void;
  onExportExcel: () => void;
  isExporting: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  settings,
  onUpdateSettings,
  onOpenSettings,
  onOpenFormulas,
  onOpenPrintPreview,
  onBatchFillWeekdays,
  onResetMonth,
  onExportExcel,
  isExporting,
}) => {
  const handlePrevMonth = () => {
    if (settings.month === 1) {
      onUpdateSettings({ year: settings.year - 1, month: 12 });
    } else {
      onUpdateSettings({ month: settings.month - 1 });
    }
  };

  const handleNextMonth = () => {
    if (settings.month === 12) {
      onUpdateSettings({ year: settings.year + 1, month: 1 });
    } else {
      onUpdateSettings({ month: settings.month + 1 });
    }
  };

  const years = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 print:hidden sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Left: App Title, Month Selector & Employee Info */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm ring-1 ring-white/10">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h1 className="text-base font-bold text-slate-100 tracking-tight whitespace-nowrap">
                勤務管理表
              </h1>
            </div>

            {/* Month Selector Component */}
            <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/80 shadow-inner">
              <button
                id="btn-prev-month"
                onClick={handlePrevMonth}
                title="前月へ"
                className="p-1.5 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-2 font-medium text-xs sm:text-sm">
                <Calendar className="w-3.5 h-3.5 text-blue-400 mr-0.5" />
                <select
                  id="select-year"
                  value={settings.year}
                  onChange={(e) => onUpdateSettings({ year: Number(e.target.value) })}
                  className="bg-transparent text-white font-bold cursor-pointer focus:outline-none text-xs sm:text-sm"
                >
                  {years.map((y) => (
                    <option key={y} value={y} className="bg-slate-800 text-white">
                      {y}年
                    </option>
                  ))}
                </select>
                <select
                  id="select-month"
                  value={settings.month}
                  onChange={(e) => onUpdateSettings({ month: Number(e.target.value) })}
                  className="bg-transparent text-white font-bold cursor-pointer focus:outline-none text-xs sm:text-sm"
                >
                  {months.map((m) => (
                    <option key={m} value={m} className="bg-slate-800 text-white">
                      {m}月
                    </option>
                  ))}
                </select>
              </div>

              <button
                id="btn-next-month"
                onClick={handleNextMonth}
                title="翌月へ"
                className="p-1.5 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Employment Type Direct Switcher Badge */}
            <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/80 text-xs font-medium">
              <button
                id="btn-switch-regular"
                onClick={() => onUpdateSettings({ employmentType: 'regular' })}
                title="正社員モード（所定時間・残業・有休集計）"
                className={`px-2.5 py-1 rounded-md transition-all ${
                  (settings.employmentType || 'regular') === 'regular'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                正社員
              </button>
              <button
                id="btn-switch-part-time"
                onClick={() => onUpdateSettings({ employmentType: 'part_time' })}
                title="アルバイト・パートモード（時給制・交通費・実働集計）"
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                  settings.employmentType === 'part_time'
                    ? 'bg-amber-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                アルバイト
                {settings.employmentType === 'part_time' && (
                  <span className="text-[10px] opacity-90">
                    (¥{settings.hourlyWage?.toLocaleString() || '1,200'})
                  </span>
                )}
              </button>
            </div>

            {/* Employee Subtitle */}
            <p className="hidden xl:block text-xs text-slate-400 truncate max-w-xs">
              {settings.companyName || '自社'} ・ {settings.department || '所属未定'} ・ {settings.employeeName || '社員氏名'}
            </p>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-batch-fill"
              onClick={onBatchFillWeekdays}
              title="平日の定時(9:00〜18:00)を一括自動入力"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">平日</span>定時一括
            </button>

            <button
              id="btn-open-settings"
              onClick={onOpenSettings}
              title="社員情報・定修設定・アルバイト時給・休憩ルールの変更"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition shadow-xs"
            >
              <Settings className="w-3.5 h-3.5 text-blue-400" />
              <span>定修・設定</span>
            </button>

            <button
              id="btn-open-formulas"
              onClick={onOpenFormulas}
              title="Excel数式と計算仕様の確認"
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700 transition"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              id="btn-print-preview"
              onClick={onOpenPrintPreview}
              title="標準A4印刷プレビュー・PDF出力"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg border border-slate-600 transition shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>印刷</span>
            </button>

            <button
              id="btn-export-excel"
              onClick={onExportExcel}
              disabled={isExporting}
              title="リアルタイムExcel数式付きの.xlsxファイルをダウンロード"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? '出力中...' : 'Excel出力 (数式付)'}</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
