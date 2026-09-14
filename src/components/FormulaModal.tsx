import React from 'react';
import { X, HelpCircle, FileSpreadsheet, Code2, CheckCircle2 } from 'lucide-react';

interface FormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FormulaModal: React.FC<FormulaModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const formulas = [
    {
      title: '1. 毎日実働時間の自動計算公式（Daily Work Hours）',
      userReq: '每天工作时间的自动计算',
      excelFormula: '=IF(OR(D10="",E10=""), "", MAX(0, E10 - D10 - F10 - G10))',
      explanation:
        '退勤時間(E列)から出勤時間(D列)を引き、そこから昼休憩時間(F列)および定修控除時間(G列)を差し引きます。未入力時は空文字を出力し、マイナス時間を防止するためMAX(0, ...)で保護しています。',
    },
    {
      title: '2. 時間外残業時間の自動計算公式（Overtime）',
      userReq: '加班的自动计算',
      excelFormula: '=IF(H10="","", MAX(0, H10 - TIME(8,0,0)))',
      explanation:
        '計算された実働時間(H列)から1日の所定労働時間（法定8:00＝TIME(8,0,0)）を引いた超過時間分を算出します。8時間未満の場合は00:00となります。',
    },
    {
      title: '3. 曜日と祝日の按月変更公式（Dynamic Monthly Weekdays）',
      userReq: '固定节假日 按月变更的公式',
      excelFormula: '=TEXT(DATE($B$2, $D$2, A10), "aaa")',
      explanation:
        'ヘッダー部の年($B$2セル)と月($D$2セル)および日付(A列)を参照してDATE関数を組み立て、TEXT関数で日本の曜日（月、火、水、木、金、土、日）を動的に出力します。月を変更するだけでカレンダーが瞬時に追従します。',
    },
    {
      title: '4. 昼休み・休憩時間の計算公式（Lunch Break）',
      userReq: '午休时间的计算公式',
      excelFormula: '=IF(E10-D10>TIME(8,0,0), TIME(1,0,0), IF(E10-D10>TIME(6,0,0), TIME(0,45,0), TIME(0,0,0)))',
      explanation:
        '労働基準法第34条の法定休憩基準に準拠。拘束時間が8時間超の場合は最低60分、6時間超の場合は最低45分を自動計算。または12:00〜13:00の固定昼休み時間帯との重複部分を自動控除する設定にも対応。',
    },
    {
      title: '5. 定修（定期保守）の控除・集計公式（Maintenance Setting）',
      userReq: '定修的设定功能',
      excelFormula: '日別控除: G列(定修控除時間) / 月次集計: =COUNTIF(C10:C40,"定修休")+COUNTIF(K10:K40,"*定修*")',
      explanation:
        '設備の定期修理・点検・プラント保全において、指定日の出勤時間を控除するか、終日一斉休業として所定労働日数から除外する機能です。Excel上でもG列控除額のSUM集計や定修日数のCOUNTIF集計が行われます。',
    },
    {
      title: '6. 月次合計サマリー集計公式（Monthly Totals in Excel）',
      userReq: 'excel上面也要有公式',
      excelFormula: '総実働: =SUM(H10:H40)  |  総残業: =SUM(I10:I40)  |  出勤日数: =COUNTIF(C10:C40,"出勤")',
      explanation:
        '出力されるExcelシートの「月次集計サマリー」および最下部合計行には、上記すべてのSUM/COUNTIF/COUNTIFS数式が実際に埋め込まれており、Excelソフト側で時間を編集してもリアルタイムに再計算されます。',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">Excel出力数式と計算ロジック解説</h3>
              <p className="text-xs text-slate-300">
                本システムおよび出力Excelファイルに埋め込まれる標準数式の仕様一覧
              </p>
            </div>
          </div>
          <button
            id="btn-close-formula-modal"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 text-blue-900">
            <p className="font-semibold text-xs mb-1">
              💡 「Excel出力」ボタンを押すと、これらの数式が実際のExcelセルにそのまま書き込まれます。
            </p>
            <p className="text-[11px] text-blue-700">
              単なる計算結果のテキストではなく、Excel上で出退勤の数値を変更した際も数式により自動で実働時間や残業時間が連動計算されます。
            </p>
          </div>

          <div className="space-y-3">
            {formulas.map((item, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold shrink-0">
                    要件: {item.userReq}
                  </span>
                </div>
                <div className="bg-slate-900 text-emerald-400 font-mono p-2.5 rounded-lg text-xs overflow-x-auto my-2 border border-slate-800 shadow-inner">
                  {item.excelFormula}
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  {item.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            id="btn-close-formula-bottom"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
          >
            閉じる
          </button>
        </div>

      </div>
    </div>
  );
};
