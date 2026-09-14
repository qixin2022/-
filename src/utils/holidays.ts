/**
 * Calculation of Japanese National Holidays (祝日法に基づく国民の祝日・振替休日・国民の休日)
 */

// Helper to get N-th Monday of a given month
function getNthMonday(year: number, month: number, n: number): number {
  let count = 0;
  for (let day = 1; day <= 31; day++) {
    const d = new Date(year, month - 1, day);
    if (d.getMonth() !== month - 1) break;
    if (d.getDay() === 1) {
      count++;
      if (count === n) return day;
    }
  }
  return 0;
}

// Vernal Equinox Day (春分の日) calculation formula for 1980-2099
function getVernalEquinoxDay(year: number): number {
  return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

// Autumnal Equinox Day (秋分の日) calculation formula for 1980-2099
function getAutumnalEquinoxDay(year: number): number {
  return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

export function getJapaneseHolidaysForYear(year: number): Map<string, string> {
  const holidays = new Map<string, string>(); // 'YYYY-MM-DD' -> Holiday name

  const add = (m: number, d: number, name: string) => {
    const mm = String(m).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    holidays.set(`${year}-${mm}-${dd}`, name);
  };

  // Fixed & calculated holidays
  add(1, 1, '元日');
  add(1, getNthMonday(year, 1, 2), '成人の日');
  add(2, 11, '建国記念の日');
  if (year >= 2020) {
    add(2, 23, '天皇誕生日');
  }
  add(3, getVernalEquinoxDay(year), '春分の日');
  add(4, 29, '昭和の日');
  add(5, 3, '憲法記念日');
  add(5, 4, 'みどりの日');
  add(5, 5, 'こどもの日');

  add(7, getNthMonday(year, 7, 3), '海の日');
  add(8, 11, '山の日');
  add(9, getNthMonday(year, 9, 3), '敬老の日');
  const autumnDay = getAutumnalEquinoxDay(year);
  add(9, autumnDay, '秋分の日');

  // Check for September bridge holiday (国民の休日): if Respect for Aged Day is on Monday and Autumn Equinox is Wednesday, Tuesday is off
  const respectAgedDay = getNthMonday(year, 9, 3);
  if (autumnDay - respectAgedDay === 2) {
    add(9, respectAgedDay + 1, '国民の休日');
  }

  add(10, getNthMonday(year, 10, 2), 'スポーツの日');
  add(11, 3, '文化の日');
  add(11, 23, '勤労感謝の日');

  // Calculate 振替休日 (Substitute holidays)
  // If a holiday falls on a Sunday, the next weekday that is not a holiday is a substitute holiday
  const sortedDates = Array.from(holidays.keys()).sort();
  for (const dateStr of sortedDates) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (date.getDay() === 0) {
      // Sunday! Find next day that is not already a holiday
      let subDate = new Date(y, m - 1, d + 1);
      while (true) {
        const subMonth = String(subDate.getMonth() + 1).padStart(2, '0');
        const subDay = String(subDate.getDate()).padStart(2, '0');
        const subKey = `${subDate.getFullYear()}-${subMonth}-${subDay}`;
        if (!holidays.has(subKey)) {
          holidays.set(subKey, '振替休日');
          break;
        }
        subDate.setDate(subDate.getDate() + 1);
      }
    }
  }

  return holidays;
}

export function getHolidayName(year: number, month: number, day: number): string | null {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const dateKey = `${year}-${mm}-${dd}`;
  const yearHolidays = getJapaneseHolidaysForYear(year);
  return yearHolidays.get(dateKey) || null;
}
