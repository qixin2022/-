import React, { useState } from 'react';
import {
  AttendanceSettings,
  DayRecord
} from '../types';
import {
  X,
  Settings,
  Wrench,
  Clock,
  User,
  Stamp,
  Check,
  Calendar,
  AlertTriangle,
  UserCheck
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AttendanceSettings;
  daysInMonth: number;
  onSave: (newSettings: AttendanceSettings) => void;
  onApplyMaintenanceToRecords: (selectedDays: number[], isDayOff: boolean, deductionTime: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  daysInMonth,
  onSave,
  onApplyMaintenanceToRecords,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'employment' | 'maintenance' | 'hours' | 'profile' | 'seals'>('employment');
  const [formData, setFormData] = useState<AttendanceSettings>(JSON.parse(JSON.stringify(settings)));

  const handleToggleDay = (day: number) => {
    const current = [...formData.maintenanceConfig.selectedDays];
    const idx = current.indexOf(day);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(day);
      current.sort((a, b) => a - b);
    }
    setFormData({
      ...formData,
      maintenanceConfig: {
        ...formData.maintenanceConfig,
        selectedDays: current,
      },
    });
  };

  const handleSaveAndApply = () => {
    onSave(formData);
    if (formData.maintenanceConfig.enabled && formData.maintenanceConfig.selectedDays.length > 0) {
      onApplyMaintenanceToRecords(
        formData.maintenanceConfig.selectedDays,
        formData.maintenanceConfig.mode === 'days_off',
        formData.maintenanceConfig.defaultDeductionTime
      );
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">勤務管理・定修・計算パラメータ設定</h3>
              <p className="text-xs text-slate-300">
                {formData.year}年{formData.month}月度の各種集計ルールと定修（定期修理）の管理
              </p>
            </div>
          </div>
          <button
            id="btn-close-settings-modal"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 overflow-x-auto">
          <button
            id="tab-btn-employment"
            onClick={() => setActiveTab('employment')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'employment'
                ? 'border-indigo-600 text-indigo-900 bg-indigo-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <span>雇用形態切替（正社員 / バイト）</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
              formData.employmentType === 'part_time' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {formData.employmentType === 'part_time' ? 'バイト' : '正社員'}
            </span>
          </button>

          <button
            id="tab-btn-maintenance"
            onClick={() => setActiveTab('maintenance')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'maintenance'
                ? 'border-amber-500 text-amber-900 bg-amber-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-4 h-4 text-amber-600" />
            <span>定修設定（点検・控除）</span>
            {formData.maintenanceConfig.selectedDays.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-[10px] flex items-center justify-center font-bold">
                {formData.maintenanceConfig.selectedDays.length}
              </span>
            )}
          </button>

          <button
            id="tab-btn-hours"
            onClick={() => setActiveTab('hours')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'hours'
                ? 'border-blue-600 text-blue-900 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-blue-600" />
            <span>所定時間・休憩</span>
          </button>

          <button
            id="tab-btn-profile"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-900 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-slate-600" />
            <span>会社・社員情報</span>
          </button>

          <button
            id="tab-btn-seals"
            onClick={() => setActiveTab('seals')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'seals'
                ? 'border-blue-600 text-blue-900 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stamp className="w-4 h-4 text-rose-600" />
            <span>印鑑欄</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          
          {/* 0. Employment Type Switching (正社員 / アルバイト・パート) */}
          {activeTab === 'employment' && (
            <div className="space-y-5">
              <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">雇用形態切替（正社員 / アルバイト・パート）</h4>
                    <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                      正社員向け「標準所定労働制・定時集計管理」と、アルバイト・パート向け「時給制・実働ベース賃金集計」をワンクリックで切り替えることができます。Excel出力や印刷フォーマットにも自動反映されます。
                    </p>
                  </div>
                </div>
              </div>

              {/* Mode Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setFormData({ ...formData, employmentType: 'regular' })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                    formData.employmentType === 'regular'
                      ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800 text-sm">正社員（一般労働時間制）</span>
                      {formData.employmentType === 'regular' && (
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      月給制・所定労働時間（1日8時間等）を基準に、所定内労働、時間外残業、深夜労働、有休取得を厳格に管理します。
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-blue-700 font-medium">
                    基準所定: {formData.standardDailyMinutes / 60}時間/日
                  </div>
                </div>

                <div
                  onClick={() => setFormData({ ...formData, employmentType: 'part_time' })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                    formData.employmentType === 'part_time'
                      ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800 text-sm">アルバイト・パート（時給制）</span>
                      {formData.employmentType === 'part_time' && (
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      実働時間に基づき給与・交通費・深夜割増を自動算定します。シフト出勤や短時間勤務の集計に最適です。
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-indigo-700 font-medium">
                    時給: ¥{formData.hourlyWage?.toLocaleString() || '1,200'} / 交通費: ¥{formData.dailyTransportation?.toLocaleString() || '0'}/日
                  </div>
                </div>
              </div>

              {/* Part-time rate configuration */}
              {formData.employmentType === 'part_time' && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    アルバイト給与・支給条件パラメータ
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        基本時給 (円)
                      </label>
                      <input
                        type="number"
                        id="input-hourly-wage"
                        value={formData.hourlyWage || 1200}
                        onChange={(e) => setFormData({ ...formData, hourlyWage: Math.max(0, Number(e.target.value)) })}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">※深夜残業(22時以降)は労働基準法に基づき25%割増計算されます</span>
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        1日あたり通勤交通費支給額 (円/日)
                      </label>
                      <input
                        type="number"
                        id="input-daily-transport"
                        value={formData.dailyTransportation ?? 0}
                        onChange={(e) => setFormData({ ...formData, dailyTransportation: Math.max(0, Number(e.target.value)) })}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">※実出勤日数に応じて自動集計されます</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* 1. Maintenance Settings (定修の设定功能) */}
          {activeTab === 'maintenance' && (
            <div className="space-y-5">
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">定修（定期修理・定期点検・休業）機能とは</h4>
                    <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                      工場・プラント・設備保守などで定期的に発生する「定修日」または「定修控除時間」を管理します。指定した日は管理表上で黄色にハイライトされ、Excelシートにも定修項目として自動連動します。
                    </p>
                  </div>
                </div>
              </div>

              {/* Maintenance Toggle & Basic Config */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    定修の有効化
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      id="checkbox-maint-enabled"
                      checked={formData.maintenanceConfig.enabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maintenanceConfig: {
                            ...formData.maintenanceConfig,
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                    />
                    <span className="text-xs text-slate-700 font-medium">
                      今月の定修管理を有効にする
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    定修の名称・区分
                  </label>
                  <input
                    type="text"
                    id="input-maint-name"
                    value={formData.maintenanceConfig.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maintenanceConfig: {
                          ...formData.maintenanceConfig,
                          name: e.target.value,
                        },
                      })
                    }
                    placeholder="例: 月次定期保守点検 / プラント定修"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    定修処理モード
                  </label>
                  <select
                    id="select-maint-mode"
                    value={formData.maintenanceConfig.mode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maintenanceConfig: {
                          ...formData.maintenanceConfig,
                          mode: e.target.value as any,
                        },
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="days_off">定修休業（所定から除外・終日定修休）</option>
                    <option value="hour_deduction">定修控除（出勤しつつ保守時間を差し引き）</option>
                    <option value="both">併用（日付ごとに個別選択）</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    既定の定修控除時間 (HH:mm)
                  </label>
                  <input
                    type="text"
                    id="input-maint-deduction"
                    value={formData.maintenanceConfig.defaultDeductionTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maintenanceConfig: {
                          ...formData.maintenanceConfig,
                          defaultDeductionTime: e.target.value,
                        },
                      })
                    }
                    placeholder="01:00"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Monthly Day Selector Chips */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-700">
                    {formData.year}年{formData.month}月の定修実施日を選択（クリックで切替）:
                  </label>
                  <span className="text-amber-700 font-bold">
                    選択中: {formData.maintenanceConfig.selectedDays.length} 日間
                  </span>
                </div>

                <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                    const isSelected = formData.maintenanceConfig.selectedDays.includes(d);
                    return (
                      <button
                        type="button"
                        key={d}
                        id={`maint-day-chip-${d}`}
                        onClick={() => handleToggleDay(d)}
                        className={`h-9 rounded-lg font-mono text-xs font-bold transition flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-amber-500 text-white shadow-xs scale-105'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'
                        }`}
                      >
                        <span>{d}日</span>
                        {isSelected && <span className="text-[9px] font-normal leading-none">定修</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Quick select helpers */}
                <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-500">
                  <span>クイック設定:</span>
                  <button
                    type="button"
                    onClick={() => {
                      // Select 2nd and 4th Saturday
                      const sats: number[] = [];
                      for (let d = 1; d <= daysInMonth; d++) {
                        const date = new Date(formData.year, formData.month - 1, d);
                        if (date.getDay() === 6) sats.push(d);
                      }
                      const targets = [sats[1], sats[3]].filter(Boolean);
                      setFormData({
                        ...formData,
                        maintenanceConfig: {
                          ...formData.maintenanceConfig,
                          selectedDays: targets,
                        },
                      });
                    }}
                    className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
                  >
                    第2・第4土曜日
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Every Wednesday
                      const weds: number[] = [];
                      for (let d = 1; d <= daysInMonth; d++) {
                        const date = new Date(formData.year, formData.month - 1, d);
                        if (date.getDay() === 3) weds.push(d);
                      }
                      setFormData({
                        ...formData,
                        maintenanceConfig: {
                          ...formData.maintenanceConfig,
                          selectedDays: weds,
                        },
                      });
                    }}
                    className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
                  >
                    毎週水曜日
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        maintenanceConfig: {
                          ...formData.maintenanceConfig,
                          selectedDays: [],
                        },
                      });
                    }}
                    className="px-2 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-700 transition"
                  >
                    選択をクリア
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. Working Hours & Lunch Break Rules */}
          {activeTab === 'hours' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    1日の所定労働時間 (時間)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      id="input-standard-hours"
                      step="0.5"
                      min="1"
                      max="12"
                      value={formData.standardDailyMinutes / 60}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          standardDailyMinutes: Number(e.target.value) * 60,
                        })
                      }
                      className="w-24 p-2 border border-slate-300 rounded-lg text-xs font-semibold text-center"
                    />
                    <span className="text-slate-600 font-medium">時間 / 日 （一般的には8時間）</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    実働時間がこれを超えた分が「時間外残業」として自動計算されます。
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    定時始業・終業の初期値
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      id="input-default-start"
                      value={formData.defaultStartTime}
                      onChange={(e) => setFormData({ ...formData, defaultStartTime: e.target.value })}
                      className="p-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                    <span>〜</span>
                    <input
                      type="time"
                      id="input-default-end"
                      value={formData.defaultEndTime}
                      onChange={(e) => setFormData({ ...formData, defaultEndTime: e.target.value })}
                      className="p-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Lunch Break Calculation Mode */}
              <div className="border-t border-slate-200 pt-4">
                <label className="block font-semibold text-slate-700 mb-2">
                  昼休憩・休憩時間の自動計算ルール（午休の計算公式）
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      id="radio-lunch-auto"
                      name="lunchMode"
                      value="auto_statutory"
                      checked={formData.lunchBreakMode === 'auto_statutory'}
                      onChange={() => setFormData({ ...formData, lunchBreakMode: 'auto_statutory' })}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-semibold text-slate-800">
                        法定基準による自動計算（推奨）
                      </span>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        拘束時間が8時間を超える場合は60分、6時間を超える場合は45分を自動で差し引きます。
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      id="radio-lunch-window"
                      name="lunchMode"
                      value="fixed_window"
                      checked={formData.lunchBreakMode === 'fixed_window'}
                      onChange={() => setFormData({ ...formData, lunchBreakMode: 'fixed_window' })}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-semibold text-slate-800">
                        固定昼休み時間帯（12:00〜13:00）との重複控除
                      </span>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        出勤〜退勤の間に12:00〜13:00が含まれる場合、重複した最大60分を自動控除します。
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      id="radio-lunch-manual"
                      name="lunchMode"
                      value="manual"
                      checked={formData.lunchBreakMode === 'manual'}
                      onChange={() => setFormData({ ...formData, lunchBreakMode: 'manual' })}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-semibold text-slate-800">
                        一律固定時間（既定値: 01:00）
                      </span>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        出勤日には一律で指定した休憩時間を初期設定し、日別に手動修正可能にします。
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 3. Company & Employee Profile */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  会社名 / 事業所名
                </label>
                <input
                  type="text"
                  id="input-company-name"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="例: 株式会社 ○○○○"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  所属部署 / 課
                </label>
                <input
                  type="text"
                  id="input-department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="例: 製造技術部 プラント保守課"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  社員番号
                </label>
                <input
                  type="text"
                  id="input-employee-id"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  placeholder="例: EMP-1024"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  氏名（社員名）
                </label>
                <input
                  type="text"
                  id="input-employee-name"
                  value={formData.employeeName}
                  onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                  placeholder="例: 山田 太郎"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          )}

          {/* 4. Approval Hanko Seals */}
          {activeTab === 'seals' && (
            <div className="space-y-4">
              <p className="text-slate-600 text-xs">
                Excel出力時および印刷プレビュー右上に配置される3枠の印鑑（承認印）ブロックの肩書と氏名を設定できます。氏名を空欄にすると、物理捺印用の空枠として出力されます。
              </p>

              <div className="grid grid-cols-3 gap-3">
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-center">
                  <span className="text-[11px] font-bold text-slate-500">承認印 1</span>
                  <input
                    type="text"
                    id="seal-title-1"
                    value={formData.seals.slot1.title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seals: { ...formData.seals, slot1: { ...formData.seals.slot1, title: e.target.value } },
                      })
                    }
                    placeholder="役職 (例: 部長)"
                    className="w-full mt-2 p-1.5 text-center text-xs font-semibold border border-slate-300 rounded bg-white"
                  />
                  <div className="mt-2 h-16 rounded border-2 border-dashed border-rose-300 flex items-center justify-center bg-rose-50/40">
                    <input
                      type="text"
                      id="seal-name-1"
                      value={formData.seals.slot1.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          seals: { ...formData.seals, slot1: { ...formData.seals.slot1, name: e.target.value } },
                        })
                      }
                      placeholder="電子印名(任意)"
                      className="w-full text-center text-xs text-rose-700 font-bold bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-center">
                  <span className="text-[11px] font-bold text-slate-500">確認印 2</span>
                  <input
                    type="text"
                    id="seal-title-2"
                    value={formData.seals.slot2.title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seals: { ...formData.seals, slot2: { ...formData.seals.slot2, title: e.target.value } },
                      })
                    }
                    placeholder="役職 (例: 課長)"
                    className="w-full mt-2 p-1.5 text-center text-xs font-semibold border border-slate-300 rounded bg-white"
                  />
                  <div className="mt-2 h-16 rounded border-2 border-dashed border-rose-300 flex items-center justify-center bg-rose-50/40">
                    <input
                      type="text"
                      id="seal-name-2"
                      value={formData.seals.slot2.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          seals: { ...formData.seals, slot2: { ...formData.seals.slot2, name: e.target.value } },
                        })
                      }
                      placeholder="電子印名(任意)"
                      className="w-full text-center text-xs text-rose-700 font-bold bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-center">
                  <span className="text-[11px] font-bold text-slate-500">担当印 3</span>
                  <input
                    type="text"
                    id="seal-title-3"
                    value={formData.seals.slot3.title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seals: { ...formData.seals, slot3: { ...formData.seals.slot3, title: e.target.value } },
                      })
                    }
                    placeholder="役職 (例: 担当)"
                    className="w-full mt-2 p-1.5 text-center text-xs font-semibold border border-slate-300 rounded bg-white"
                  />
                  <div className="mt-2 h-16 rounded border-2 border-dashed border-rose-300 flex items-center justify-center bg-rose-50/40">
                    <input
                      type="text"
                      id="seal-name-3"
                      value={formData.seals.slot3.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          seals: { ...formData.seals, slot3: { ...formData.seals.slot3, name: e.target.value } },
                        })
                      }
                      placeholder="電子印名(任意)"
                      className="w-full text-center text-xs text-rose-700 font-bold bg-transparent focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            変更は即座に集計およびExcel出力に反映されます
          </span>
          <div className="flex items-center gap-2">
            <button
              id="btn-cancel-settings"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition"
            >
              キャンセル
            </button>
            <button
              id="btn-save-settings"
              onClick={handleSaveAndApply}
              className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>設定を保存して適用</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
