import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DayRecord, AttendanceSettings, MonthlyTotals } from '../types';
import { getJapaneseHolidaysForYear } from './holidays';

/**
 * Exports a standard, print-ready Japanese 勤務管理表 Excel workbook (.xlsx)
 * equipped with REAL EXCEL FORMULAS on cells, print setup (A4, fit to page),
 * seal boxes, and professional styling.
 */
function timeStrToSerial(timeStr: string | undefined): number | null {
  if (!timeStr || !timeStr.includes(':')) return null;
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return (h * 60 + m) / (24 * 60);
}

/**
 * Calculates Excel date serial number (Integer days since 1899-12-30).
 * Storing this as a pure number in '祝日マスタ' guarantees 100% exact VLOOKUP/MATCH
 * with Excel's native DATE(year, month, day) formula.
 */
function getExcelDateSerial(year: number, month: number, day: number): number {
  const dateUtc = Date.UTC(year, month - 1, day);
  const baseUtc = Date.UTC(1899, 11, 30);
  return Math.round((dateUtc - baseUtc) / (24 * 60 * 60 * 1000));
}

export async function exportAttendanceToExcel(
  records: DayRecord[],
  settings: AttendanceSettings,
  totals: MonthlyTotals
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = '勤務管理システム';
  workbook.lastModifiedBy = settings.employeeName || '社員';
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet(`${settings.year}年${settings.month}月 勤務管理表`, {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'portrait', // 縦向きA4 1ページ印刷
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1, // 縦1ページに綺麗に収める
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.35,
        bottom: 0.35,
        header: 0.2,
        footer: 0.2,
      },
      showGridLines: true,
    },
  });

  // Define column widths optimized for A4 portrait printing (total ~95 chars fit on A4 portrait)
  sheet.columns = [
    { key: 'colA', width: 5.5 }, // A: 日付 (Date)
    { key: 'colB', width: 5.5 }, // B: 曜日 (Day of week)
    { key: 'colC', width: 10 },  // C: 区分 (Status) - 出勤,有休,欠勤,振休,特休,病休,休日
    { key: 'colD', width: 8.5 }, // D: 出勤 (Clock-in)
    { key: 'colE', width: 8.5 }, // E: 退勤 (Clock-out)
    { key: 'colF', width: 8.5 }, // F: 休憩 (Break)
    { key: 'colG', width: 10.5 },// G: 実働時間 (Actual work)
    { key: 'colH', width: 9.5 }, // H: 時間外残業 (Overtime)
    { key: 'colI', width: 8.5 }, // I: 深夜労働 (Midnight)
    { key: 'colJ', width: 20 },  // J: 備考・業務内容 (Remarks)
  ];

  // Helper styles
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  };

  const mediumBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'medium', color: { argb: 'FF334155' } },
    left: { style: 'medium', color: { argb: 'FF334155' } },
    bottom: { style: 'medium', color: { argb: 'FF334155' } },
    right: { style: 'medium', color: { argb: 'FF334155' } },
  };

  // -------------------------------------------------------------
  // Sheet: 祝日・マスタ (Hidden or reference sheet for holiday lookup)
  // -------------------------------------------------------------
  const holidaySheet = workbook.addWorksheet('祝日マスタ');
  holidaySheet.columns = [
    { key: 'date', width: 14 },
    { key: 'name', width: 22 },
  ];
  holidaySheet.getCell('A1').value = '祝日日付';
  holidaySheet.getCell('B1').value = '祝日名称';
  holidaySheet.getCell('A1').font = { bold: true };
  holidaySheet.getCell('B1').font = { bold: true };

  // Generate complete Japanese holidays for target year - 2 to target year + 2 (5 years total)
  // This ensures changing the year in $B$2 or month in $C$2 will seamlessly lookup holidays!
  let holRow = 2;
  const targetYears = [
    settings.year - 2,
    settings.year - 1,
    settings.year,
    settings.year + 1,
    settings.year + 2,
  ];
  targetYears.forEach((y) => {
    const yHols = getJapaneseHolidaysForYear(y);
    const sortedKeys: string[] = Array.from(yHols.keys()).sort();
    sortedKeys.forEach((dStr: string) => {
      const hName = yHols.get(dStr) || '';
      const [hy, hm, hd] = dStr.split('-').map(Number);
      const cellDate = holidaySheet.getCell(`A${holRow}`);
      // Store pure Excel integer serial number so Excel DATE(...) matches with 100% precision!
      cellDate.value = getExcelDateSerial(hy, hm, hd);
      cellDate.numFmt = 'yyyy-mm-dd';
      holidaySheet.getCell(`B${holRow}`).value = hName;
      holRow++;
    });
  });
  const maxHolidayRow = holRow - 1;

  // Robust formulas to extract year and month even if user types with kanji ("2026年" or "9月")
  const yearExpr = 'IF(ISNUMBER($B$2),$B$2,VALUE(SUBSTITUTE(SUBSTITUTE($B$2,"年","")," ","")))';
  const monthExpr = 'IF(ISNUMBER($C$2),$C$2,VALUE(SUBSTITUTE(SUBSTITUTE($C$2,"月","")," ","")))';
  const getDateExpr = (dayCellOrNum: string | number) => `DATE(${yearExpr},${monthExpr},${dayCellOrNum})`;


  // Row 1: Title & Stamp box headers
  sheet.mergeCells('A1:G1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = '勤 務 管 理 表 （出勤簿・時間外集計）';
  titleCell.font = { size: 16, bold: true, color: { argb: 'FF1E293B' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

  // Stamp boxes (Approval seals) in H1:J3 (aligned to 10 columns A-J)
  sheet.getCell('H1').value = settings.seals.slot1.title || '部長';
  sheet.getCell('I1').value = settings.seals.slot2.title || '課長';
  sheet.getCell('J1').value = settings.seals.slot3.title || '担当';
  ['H1', 'I1', 'J1'].forEach((ref) => {
    const c = sheet.getCell(ref);
    c.alignment = { vertical: 'middle', horizontal: 'center' };
    c.font = { size: 9, bold: true };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    c.border = thinBorder;
  });

  // Stamp boxes row 2-3 (for physical stamps or digital name)
  sheet.mergeCells('H2:H3');
  sheet.mergeCells('I2:I3');
  sheet.mergeCells('J2:J3');
  sheet.getCell('H2').value = settings.seals.slot1.name || '';
  sheet.getCell('I2').value = settings.seals.slot2.name || '';
  sheet.getCell('J2').value = settings.seals.slot3.name || '';
  ['H2', 'I2', 'J2'].forEach((ref) => {
    const c = sheet.getCell(ref);
    c.alignment = { vertical: 'middle', horizontal: 'center' };
    c.font = { size: 10, color: { argb: 'FFB91C1C' } };
    c.border = mediumBorder;
  });

  // Row 2: Target Year / Month and Company Info
  // User enters Year in B2 (displays as "2026年") and Month in C2 (displays as "10月")!
  // All Excel formulas link to $B$2 (Year) and $C$2 (Month).
  sheet.getCell('A2').value = '対象年月:';
  sheet.getCell('A2').font = { bold: true, size: 10 };
  sheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'left' };

  sheet.getCell('B2').value = settings.year;
  sheet.getCell('B2').numFmt = '0"年"';
  sheet.getCell('B2').font = { bold: true, size: 12, color: { argb: 'FF0F172A' } };
  sheet.getCell('B2').alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getCell('B2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  sheet.getCell('B2').border = thinBorder;

  // C2 is the Month number that user can edit in Excel
  sheet.getCell('C2').value = settings.month;
  sheet.getCell('C2').numFmt = '0"月"';
  sheet.getCell('C2').font = { bold: true, size: 12, color: { argb: 'FF0F172A' } };
  sheet.getCell('C2').alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getCell('C2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  sheet.getCell('C2').border = thinBorder;

  sheet.getCell('D2').value = '会社名:';
  sheet.getCell('D2').font = { bold: true, size: 10 };
  sheet.getCell('D2').alignment = { vertical: 'middle', horizontal: 'right' };
  sheet.mergeCells('E2:G2');
  sheet.getCell('E2').value = settings.companyName || '株式会社 ○○○○';
  sheet.getCell('E2').font = { size: 10, bold: true };
  sheet.getCell('E2').alignment = { vertical: 'middle', horizontal: 'left' };

  // Row 3: Employee Details with clean, non-overlapping columns
  sheet.getCell('A3').value = settings.employmentType === 'part_time' ? '雇用形態:' : '所定労働:';
  sheet.getCell('A3').font = { bold: true, size: 9 };
  sheet.getCell('A3').alignment = { vertical: 'middle', horizontal: 'left' };
  sheet.getCell('B3').value = settings.employmentType === 'part_time' ? 'アルバイト' : `${settings.standardDailyMinutes / 60}h/日`;
  sheet.getCell('B3').font = { size: 9 };
  sheet.getCell('B3').alignment = { vertical: 'middle', horizontal: 'center' };

  sheet.getCell('C3').value = settings.employmentType === 'part_time' ? '時給:' : '部署:';
  sheet.getCell('C3').font = { bold: true, size: 9 };
  sheet.getCell('C3').alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getCell('D3').value = settings.employmentType === 'part_time' ? `¥${settings.hourlyWage?.toLocaleString() || '1,200'}` : (settings.department || '未設定');
  sheet.getCell('D3').font = { size: 9 };
  sheet.getCell('D3').alignment = { vertical: 'middle', horizontal: 'left' };

  sheet.getCell('E3').value = '社員番号:';
  sheet.getCell('E3').font = { bold: true, size: 9 };
  sheet.getCell('E3').alignment = { vertical: 'middle', horizontal: 'right' };
  sheet.getCell('F3').value = settings.employeeId || '---';
  sheet.getCell('F3').font = { size: 9 };
  sheet.getCell('F3').alignment = { vertical: 'middle', horizontal: 'center' };

  sheet.getCell('G3').value = '氏名:';
  sheet.getCell('G3').font = { bold: true, size: 9 };
  sheet.getCell('G3').alignment = { vertical: 'middle', horizontal: 'right' };
  sheet.getCell('H3').value = settings.employeeName || '未設定';
  sheet.getCell('H3').font = { bold: true, size: 10 };
  sheet.getCell('H3').alignment = { vertical: 'middle', horizontal: 'left' };

  // Row 5 to 7: Summary KPI Box with EXCEL FORMULAS (10 columns A-J)
  sheet.mergeCells('A5:J5');
  const sumHeader = sheet.getCell('A5');
  sumHeader.value = '【月次集計サマリー（リアルタイムExcel数式連動）】';
  sumHeader.font = { size: 10, bold: true, color: { argb: 'FF1E3A8A' } };
  sumHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };

  // Summary labels row 6 (With 休日日数 and 欠勤日数 explicitly calculated!)
  sheet.getRow(6).height = 22;
  const kpiHeaders = [
    { col: 'A', label: '所定日数' },
    { col: 'B', label: '出勤日数' },
    { col: 'C', label: '休日日数' },
    { col: 'D', label: '有休日数' },
    { col: 'E', label: '欠勤日数' },
    { col: 'F', label: '休日労働' },
    { col: 'G', label: '総実働時間' },
    { col: 'H', label: '時間外残業計' },
    { col: 'I', label: '深夜残業計' },
    { col: 'J', label: '所定内労働計' },
  ];

  // Full calendar rows: exactly 31 days (rows 10 to 40) so Excel formulas and month switching work cleanly
  const rowDataStart = 10;
  const daysInMaxMonth = 31;
  const rowDataEnd = rowDataStart + daysInMaxMonth - 1; // Row 40

  kpiHeaders.forEach((h) => {
    const c = sheet.getCell(`${h.col}6`);
    c.value = h.label;
    c.font = { size: 9, bold: true, color: { argb: 'FF334155' } };
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    c.border = thinBorder;
  });

  // Summary values row 7
  sheet.getRow(7).height = 24;
  // A7: 所定日数 = COUNTIFS(B10:B40,"<>土",B10:B40,"<>日",A10:A40,"<>"&"")
  sheet.getCell('A7').value = {
    formula: `COUNTIFS(B${rowDataStart}:B${rowDataEnd},"<>土",B${rowDataStart}:B${rowDataEnd},"<>日",A${rowDataStart}:A${rowDataEnd},"<>")`,
    result: totals.scheduledWorkDays,
  };
  // B7: 出勤日数 = COUNTIF(C10:C40, "出勤")
  sheet.getCell('B7').value = {
    formula: `COUNTIF(C${rowDataStart}:C${rowDataEnd},"出勤")`,
    result: totals.actualWorkDays,
  };
  // C7: 休日日数 = COUNTIF(C10:C40,"休日")+COUNTIF(C10:C40,"振休")+COUNTIF(C10:C40,"特休")+COUNTIF(C10:C40,"病休")
  sheet.getCell('C7').value = {
    formula: `COUNTIF(C${rowDataStart}:C${rowDataEnd},"休日")+COUNTIF(C${rowDataStart}:C${rowDataEnd},"振休")+COUNTIF(C${rowDataStart}:C${rowDataEnd},"特休")+COUNTIF(C${rowDataStart}:C${rowDataEnd},"病休")`,
    result: totals.totalHolidayDays,
  };
  // D7: 有休日数 = COUNTIF(C10:C40, "有休")
  sheet.getCell('D7').value = {
    formula: `COUNTIF(C${rowDataStart}:C${rowDataEnd},"有休")`,
    result: totals.paidLeaveDays,
  };
  // E7: 欠勤日数 = COUNTIF(C10:C40, "欠勤") (Highlighted if > 0)
  sheet.getCell('E7').value = {
    formula: `COUNTIF(C${rowDataStart}:C${rowDataEnd},"欠勤")`,
    result: totals.absenceDays,
  };
  // F7: 休日労働 = COUNTIFS(B10:B40,"土",C10:C40,"出勤")+COUNTIFS(B10:B40,"日",C10:C40,"出勤")
  sheet.getCell('F7').value = {
    formula: `COUNTIFS(B${rowDataStart}:B${rowDataEnd},"土",C${rowDataStart}:C${rowDataEnd},"出勤")+COUNTIFS(B${rowDataStart}:B${rowDataEnd},"日",C${rowDataStart}:C${rowDataEnd},"出勤")`,
    result: totals.holidayWorkDays,
  };
  // G7: 総実働時間 = SUM(G10:G40)
  sheet.getCell('G7').value = {
    formula: `SUM(G${rowDataStart}:G${rowDataEnd})`,
    result: totals.totalActualMinutes / (24 * 60),
  };
  sheet.getCell('G7').numFmt = '[h]:mm';

  // H7: 時間外残業計 = SUM(H10:H40)
  sheet.getCell('H7').value = {
    formula: `SUM(H${rowDataStart}:H${rowDataEnd})`,
    result: totals.totalOvertimeMinutes / (24 * 60),
  };
  sheet.getCell('H7').numFmt = '[h]:mm';

  // I7: 深夜残業計 = SUM(I10:I40)
  sheet.getCell('I7').value = {
    formula: `SUM(I${rowDataStart}:I${rowDataEnd})`,
    result: totals.totalMidnightMinutes / (24 * 60),
  };
  sheet.getCell('I7').numFmt = '[h]:mm';

  // J7: 所定内労働計 = MAX(0, G7 - H7)
  sheet.getCell('J7').value = {
    formula: `MAX(0, G7-H7)`,
    result: Math.max(0, (totals.totalActualMinutes - totals.totalOvertimeMinutes) / (24 * 60)),
  };
  sheet.getCell('J7').numFmt = '[h]:mm';

  // Format row 7 cells
  ['A', 'B', 'C', 'D', 'F'].forEach((col) => {
    const c = sheet.getCell(`${col}7`);
    c.alignment = { vertical: 'middle', horizontal: 'center' };
    c.font = { bold: true, size: 10, color: { argb: 'FF0F172A' } };
    c.border = thinBorder;
  });
  // Highlight absence cell in summary if absence exists
  const absCell = sheet.getCell('E7');
  absCell.alignment = { vertical: 'middle', horizontal: 'center' };
  absCell.font = { bold: true, size: 10, color: { argb: totals.absenceDays > 0 ? 'FFDC2626' : 'FF0F172A' } };
  absCell.border = thinBorder;
  if (totals.absenceDays > 0) {
    absCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
  }

  ['G', 'H', 'I', 'J'].forEach((col) => {
    const c = sheet.getCell(`${col}7`);
    c.alignment = { vertical: 'middle', horizontal: 'center' };
    c.font = { bold: true, size: 10, color: { argb: 'FF1D4ED8' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
    c.border = thinBorder;
  });

  // Row 9: Table Column Headers (10 columns A-J)
  sheet.getRow(9).height = 24;
  const tableHeaders = [
    { col: 'A', text: '日付' },
    { col: 'B', text: '曜日' },
    { col: 'C', text: '区分' },
    { col: 'D', text: '出勤' },
    { col: 'E', text: '退勤' },
    { col: 'F', text: '休憩' },
    { col: 'G', text: '実働時間(式)' },
    { col: 'H', text: '残業時間(式)' },
    { col: 'I', text: '深夜(式)' },
    { col: 'J', text: '備考 / 祝日名 / 業務内容' },
  ];

  tableHeaders.forEach((th) => {
    const c = sheet.getCell(`${th.col}9`);
    c.value = th.text;
    c.font = { size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    c.border = thinBorder;
  });

  // Rows 10 to 40 (Days 1 to 31): Full month daily records with dynamic Excel formulas
  // Supports dynamic months (February, 30-day months) gracefully via formulas
  for (let dayNum = 1; dayNum <= daysInMaxMonth; dayNum++) {
    const rIdx = rowDataStart + (dayNum - 1);
    const row = sheet.getRow(rIdx);
    row.height = 21;

    const record = records.find((r) => r.day === dayNum);
    const existsInCurrentMonth = dayNum <= records.length;

    // A: Day (1..31) - Dynamic check with $B$2 (Year) and $C$2 (Month)
    if (dayNum <= 28) {
      sheet.getCell(`A${rIdx}`).value = dayNum;
    } else {
      // For days 29, 30, 31: formula checks if day exists in month using $B$2 and $C$2
      sheet.getCell(`A${rIdx}`).value = {
        formula: `IF(DAY(${getDateExpr(dayNum)})=${dayNum},${dayNum},"")`,
        result: existsInCurrentMonth ? dayNum : '',
      };
    }

    // B: Day of week formula linking dynamically to Year ($B$2) and Month ($C$2)!
    sheet.getCell(`B${rIdx}`).value = {
      formula: `IF(A${rIdx}="","",TEXT(${getDateExpr(`A${rIdx}`)},"aaa"))`,
      result: record ? record.dayOfWeekLabel : '',
    };

    // C: Status - Dynamic EXCEL FORMULA!
    // When user changes Year ($B$2) or Month ($C$2):
    // 1. If date is in 祝日マスタ -> automatically "休日"
    // 2. If Saturday or Sunday -> automatically "休日"
    // 3. Otherwise -> "出勤" (or preserved custom status like 有休/病休 if present)
    const customStatus = record && ['有休', '振休', '特休', '病休', '欠勤'].includes(record.status)
      ? record.status
      : '出勤';
    sheet.getCell(`C${rIdx}`).value = {
      formula: `IF(A${rIdx}="","",IF(ISNUMBER(MATCH(${getDateExpr(`A${rIdx}`)},'祝日マスタ'!$A$2:$A$${maxHolidayRow},0)),"休日",IF(OR(B${rIdx}="土",B${rIdx}="日"),"休日","${customStatus}")))`,
      result: record ? record.status : (dayNum <= 28 ? '出勤' : ''),
    };

    // D: Clock-in time (store as real Excel time fraction for seamless formula math)
    const startSerial = record && record.startTime ? timeStrToSerial(record.startTime) : null;
    if (startSerial !== null) {
      sheet.getCell(`D${rIdx}`).value = startSerial;
      sheet.getCell(`D${rIdx}`).numFmt = 'hh:mm';
    } else {
      sheet.getCell(`D${rIdx}`).value = '';
    }

    // E: Clock-out time (store as real Excel time fraction)
    const endSerial = record && record.endTime ? timeStrToSerial(record.endTime) : null;
    if (endSerial !== null) {
      sheet.getCell(`E${rIdx}`).value = endSerial;
      sheet.getCell(`E${rIdx}`).numFmt = 'hh:mm';
    } else {
      sheet.getCell(`E${rIdx}`).value = '';
    }

    // F: Break time (store as real Excel time fraction so SUM(F10:F40) works automatically!)
    const breakSerial = record && record.breakTime && record.breakTime !== '00:00' ? timeStrToSerial(record.breakTime) : null;
    if (breakSerial !== null) {
      sheet.getCell(`F${rIdx}`).value = breakSerial;
      sheet.getCell(`F${rIdx}`).numFmt = 'hh:mm';
    } else {
      sheet.getCell(`F${rIdx}`).value = '';
    }

    // G: Actual work hours with REAL EXCEL FORMULA!
    // ActualWork = Gross(E - D) - Break(F)
    sheet.getCell(`G${rIdx}`).value = {
      formula: `IF(OR(A${rIdx}="",D${rIdx}="",E${rIdx}=""),"",MAX(0,E${rIdx}-D${rIdx}-IF(F${rIdx}="",0,F${rIdx})))`,
      result: record && record.actualWorkMinutes > 0 ? record.actualWorkMinutes / (24 * 60) : 0,
    };
    sheet.getCell(`G${rIdx}`).numFmt = 'hh:mm';

    // H: Overtime formula with REAL EXCEL FORMULA!
    // Overtime = MAX(0, ActualWork(G) - 8:00)
    sheet.getCell(`H${rIdx}`).value = {
      formula: `IF(OR(A${rIdx}="",G${rIdx}="",G${rIdx}=0),"",MAX(0, G${rIdx}-TIME(8,0,0)))`,
      result: record && record.overtimeMinutes > 0 ? record.overtimeMinutes / (24 * 60) : 0,
    };
    sheet.getCell(`H${rIdx}`).numFmt = 'hh:mm';

    // I: Midnight hours (22:00 onwards)
    sheet.getCell(`I${rIdx}`).value = {
      formula: `IF(OR(A${rIdx}="",D${rIdx}="",E${rIdx}=""),"",IF(E${rIdx}>TIME(22,0,0), MAX(0, E${rIdx}-MAX(D${rIdx},TIME(22,0,0))), 0))`,
      result: record && record.midnightMinutes > 0 ? record.midnightMinutes / (24 * 60) : 0,
    };
    sheet.getCell(`I${rIdx}`).numFmt = 'hh:mm';

    // J: Remarks / Notes - Dynamic EXCEL FORMULA to lookup Holiday Name from 祝日マスタ using $B$2 and $C$2!
    let manualNote = record ? (record.remarks || '') : '';
    const holLookupExpr = `VLOOKUP(${getDateExpr(`A${rIdx}`)},'祝日マスタ'!$A$2:$B$${maxHolidayRow},2,FALSE)`;
    if (manualNote) {
      sheet.getCell(`J${rIdx}`).value = {
        formula: `IF(A${rIdx}="","",IFERROR("[祝日: " & ${holLookupExpr} & "] " & "${manualNote}", "${manualNote}"))`,
        result: record && record.isHoliday ? `[祝日: ${record.holidayName}] ${manualNote}` : manualNote,
      };
    } else {
      sheet.getCell(`J${rIdx}`).value = {
        formula: `IF(A${rIdx}="","",IFERROR("[祝日: " & ${holLookupExpr} & "]", ""))`,
        result: record && record.isHoliday ? `[祝日: ${record.holidayName}]` : '',
      };
    }

    // User Color Requirements:
    // 1. If status is "出勤": NO COLOR (pure white / transparent)
    // 2. If status is "欠勤": SPECIALLY HIGHLIGHTED (soft red warning background + bold red text)
    // 3. ALL REST DAYS (有休, 振休, 特休, 病休, 休日, or weekend/holiday when not 出勤):
    //    MUST BE UNIFORM GENTLE GREEN (#E8F5E9 / text #166534)!
    let rowBgColor: string | null = null;
    let textColor = 'FF0F172A';
    let isBold = false;

    if (record) {
      if (record.status === '欠勤') {
        // 欠勤: 特別強調ハイライト
        rowBgColor = 'FFFEE2E2';
        textColor = 'FFB91C1C';
        isBold = true;
      } else if (record.status === '出勤') {
        // 出勤: 完全無色
        rowBgColor = null;
        textColor = 'FF0F172A';
      } else {
        // 所有的休息日（有休、振休、特休、病休、休日、土日祝）: 全て統一の優しい緑色！
        rowBgColor = 'FFE8F5E9';
        textColor = 'FF166534';
      }
    } else {
      // Default rest days for unset records
      if (dayNum > 28 && !existsInCurrentMonth) {
        rowBgColor = null;
      }
    }

    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach((col) => {
      const c = sheet.getCell(`${col}${rIdx}`);
      c.border = thinBorder;
      c.font = { size: 9, bold: isBold, color: { argb: textColor } };

      if (col === 'A' || col === 'B' || col === 'C') {
        c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      } else if (col === 'J') {
        c.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      } else {
        c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
      }

      if (rowBgColor) {
        c.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: rowBgColor },
        };
      }
    });

    // Add Excel Dropdown List for 区分 (Column C)
    // Options include 病休: 出勤, 有休, 欠勤, 振休, 特休, 病休, 休日
    const statusCell = sheet.getCell(`C${rIdx}`);
    statusCell.dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"出勤,有休,欠勤,振休,特休,病休,休日"'],
      showErrorMessage: true,
      errorTitle: '無効な区分',
      error: 'リストから「出勤」「有休」「欠勤」「振休」「特休」「病休」「休日」を選択してください。',
      showInputMessage: true,
      promptTitle: '区分選択',
      prompt: '矢印をクリックして勤怠区分を選択してください。',
    };
  }

  // Add Excel Conditional Formatting rules for columns A-J:
  // 1. 欠勤: 特別強調（薄赤背景・濃赤太字）
  // 2. 出勤: 無色（白地）
  // 3. すべての休息日（有休、振休、特休、病休、休日、土日祝）: 全て統一の優しい緑色（#E8F5E9 / #166534）
  sheet.addConditionalFormatting({
    ref: `A${rowDataStart}:J${rowDataEnd}`,
    rules: [
      {
        type: 'expression',
        priority: 1,
        formulae: [`$C${rowDataStart}="欠勤"`],
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFEE2E2' } },
          font: { bold: true, color: { argb: 'FFB91C1C' } },
        },
      },
      {
        type: 'expression',
        priority: 2,
        formulae: [`OR($C${rowDataStart}="有休",$C${rowDataStart}="振休",$C${rowDataStart}="特休",$C${rowDataStart}="病休",$C${rowDataStart}="休日",$B${rowDataStart}="土",$B${rowDataStart}="日",ISNUMBER(MATCH(${getDateExpr(`$A${rowDataStart}`)},'祝日マスタ'!$A$2:$A$${maxHolidayRow},0)))`],
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFE8F5E9' } },
          font: { color: { argb: 'FF166534' } },
        },
      },
      {
        type: 'expression',
        priority: 3,
        formulae: [`$C${rowDataStart}="出勤"`],
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFFFFF' } },
          font: { bold: false, color: { argb: 'FF0F172A' } },
        },
      },
    ],
  });

  // Bottom Grand Total Row (10 columns A-J)
  const totalRowIdx = rowDataEnd + 1;
  sheet.getCell(`A${totalRowIdx}`).value = '合計';
  sheet.mergeCells(`A${totalRowIdx}:C${totalRowIdx}`);
  sheet.getCell(`A${totalRowIdx}`).alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getCell(`A${totalRowIdx}`).font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
  sheet.getCell(`A${totalRowIdx}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };

  ['D', 'E'].forEach((col) => {
    const c = sheet.getCell(`${col}${totalRowIdx}`);
    c.value = '---';
    c.alignment = { vertical: 'middle', horizontal: 'center' };
    c.font = { size: 9, color: { argb: 'FF94A3B8' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    c.border = thinBorder;
  });

  // Total Break: Real Excel SUM formula over F10:F40 (F column contains real time serial numbers)
  sheet.getCell(`F${totalRowIdx}`).value = {
    formula: `SUM(F${rowDataStart}:F${rowDataEnd})`,
    result: totals.totalBreakMinutes / (24 * 60),
  };
  sheet.getCell(`F${totalRowIdx}`).numFmt = '[h]:mm';

  // Total Actual Work (G)
  sheet.getCell(`G${totalRowIdx}`).value = {
    formula: `SUM(G${rowDataStart}:G${rowDataEnd})`,
    result: totals.totalActualMinutes / (24 * 60),
  };
  sheet.getCell(`G${totalRowIdx}`).numFmt = '[h]:mm';

  // Total Overtime (H)
  sheet.getCell(`H${totalRowIdx}`).value = {
    formula: `SUM(H${rowDataStart}:H${rowDataEnd})`,
    result: totals.totalOvertimeMinutes / (24 * 60),
  };
  sheet.getCell(`H${totalRowIdx}`).numFmt = '[h]:mm';

  // Total Midnight (I)
  sheet.getCell(`I${totalRowIdx}`).value = {
    formula: `SUM(I${rowDataStart}:I${rowDataEnd})`,
    result: totals.totalMidnightMinutes / (24 * 60),
  };
  sheet.getCell(`I${totalRowIdx}`).numFmt = '[h]:mm';

  // User Request 截图二: 红色位置 不需要显示了 去掉内容 (Column J in Total row is blank)
  sheet.getCell(`J${totalRowIdx}`).value = '';
  sheet.getCell(`J${totalRowIdx}`).alignment = { vertical: 'middle', horizontal: 'center' };

  ['F', 'G', 'H', 'I', 'J'].forEach((col) => {
    const c = sheet.getCell(`${col}${totalRowIdx}`);
    c.font = { bold: true, size: 9.5, color: { argb: 'FF0F172A' } };
    c.alignment = { vertical: 'middle', horizontal: 'center' };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    c.border = {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'double', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
  });

  // Footer notes
  const footerRowIdx = totalRowIdx + 2;
  sheet.getCell(`A${footerRowIdx}`).value = '※ 注意事項・社内運用規定:';
  sheet.getCell(`A${footerRowIdx}`).font = { bold: true, size: 9, color: { argb: 'FF64748B' } };
  sheet.getCell(`A${footerRowIdx + 1}`).value = '1. 出退勤時間は1分単位または15分単位で記録し、実働時間・残業時間はExcel数式によって自動計算されます。';
  sheet.getCell(`A${footerRowIdx + 2}`).value = '2. 休日（土曜・日曜・祝日および有休・振休・特休・病休・指定休日）は全て同一の緑色で統一表示され、区分が「出勤」の場合は無色（通常色）となります。欠勤は赤太字で強調表示されます。';
  sheet.getCell(`A${footerRowIdx + 3}`).value = '3. 本ExcelシートはA4縦向き1ページでの標準印刷に対応しています（ファイル ＞ 印刷でそのまま出力可能）。';
  [0, 1, 2, 3].forEach((offset) => {
    sheet.getCell(`A${footerRowIdx + offset}`).font = { size: 8, color: { argb: 'FF64748B' } };
  });

  // -------------------------------------------------------------
  // Sheet 2: Formula & Settings Documentation Sheet
  // -------------------------------------------------------------
  const guideSheet = workbook.addWorksheet('数式と設定一覧 (仕様書)', {
    pageSetup: { paperSize: 9, orientation: 'portrait' },
  });

  guideSheet.columns = [
    { width: 20 },
    { width: 35 },
    { width: 45 },
  ];

  guideSheet.getCell('A1').value = '勤務管理表 Excel数式仕様書（Excel Formula Reference）';
  guideSheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FF1E293B' } };

  const formulaRows = [
    ['項目名', '使用しているExcel数式', '説明・ロジック'],
    ['日付自動制御(大の月・小の月)', '=IF(DAY(DATE(...))=29, 29, "")', '29日〜31日は、対象月（2月や30日までの月）に実在するかをDATE関数で自動判定。存在しない日は非表示。'],
    ['曜日自動判定', '=IF(A10="","",TEXT(DATE(...),"aaa"))', '年($B$2)と月($C$2)から曜日(月,火,水...)を自動計算。C2の月を変更するだけで即座に連動します。'],
    ['祝日自動判定・名称表示', '=IFERROR("[祝日: " & VLOOKUP(DATE(...),\'祝日マスタ\'!$A:$B,2,FALSE) & "]","")', '祝日マスタシートから国民の祝日・振替休日をVLOOKUPで完全自動判定。C2の月変更に即時連動。'],
    ['区分・休日の自動連動', '=IF(ISNUMBER(MATCH(DATE(...),\'祝日マスタ\'!$A:$A,0)),"休日",...)', '月を変更すると、その月の祝日・土日は自動的に「休日」になり、平日は「出勤」に自動更新。'],
    ['休息日の統一緑色ハイライト', 'OR($C10="休日",$C10="有休",$C10="振休",$C10="特休",$C10="病休",$B10="土",$B10="日",祝日)', 'すべての休息日（有休・振休・特休・病休・休日・土日祝）は同一の優しい緑色（#E8F5E9 / #166534）で統一ハイライト。'],
    ['欠勤の特別強調', '$C10="欠勤"', '区分が欠勤の日を薄赤背景・濃赤太字で特別に目立つようにハイライト表示。'],
    ['区分ドロップダウン', 'Excelリスト機能 (出勤,有休,欠勤,振休,特休,病休,休日)', '各行の区分セルで▼矢印をクリックして即座に選択・変更可能。'],
    ['実働時間計算', '=IF(OR(A10="",D10="",E10=""),"",MAX(0,E10-D10-F10))', '退勤(E) - 出勤(D) - 休憩(F) を時間形式で正確に差し引き計算。'],
    ['残業時間計算', '=IF(OR(A10="",G10=""),"",MAX(0,G10-TIME(8,0,0)))', '実働時間(G列)から所定労働時間(8:00)を引いた超過分を自動計算。'],
    ['深夜労働計算', '=IF(OR(A10="",D10="",E10=""),"",IF(E10>TIME(22,0,0),MAX(0,E10-MAX(D10,TIME(22,0,0))),0))', '22:00以降の深夜労働時間を判定し自動抽出。'],
    ['休日日数集計', '=COUNTIF(C10:C40,"休日")+COUNTIF(C10:C40,"振休")+COUNTIF(C10:C40,"特休")+COUNTIF(C10:C40,"病休")', '月間の全休日日数を完全集計。'],
    ['出勤日数集計', '=COUNTIF(C10:C40,"出勤")', '区分列の「出勤」ステータスを自動カウント。'],
    ['総実働時間合計', '=SUM(G10:G40)  ※表示形式 [h]:mm', '月間の総実働時間を累計。24時間を超えても[h]:mm形式で正常表示。'],
  ];

  formulaRows.forEach((row, i) => {
    const r = guideSheet.getRow(i + 3);
    r.values = row;
    r.height = 24;
    ['A', 'B', 'C'].forEach((col) => {
      const cell = guideSheet.getCell(`${col}${i + 3}`);
      cell.border = thinBorder;
      cell.alignment = { vertical: 'middle', wrapText: true };
      if (i === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      } else {
        if (col === 'B') {
          cell.font = { name: 'Consolas', size: 9, bold: true, color: { argb: 'FF1D4ED8' } };
        }
      }
    });
  });

  // Write file buffer and save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const filename = `勤務管理表_${settings.year}年${String(settings.month).padStart(2, '0')}月_${settings.employeeName || '社員'}.xlsx`;
  saveAs(blob, filename);
}
