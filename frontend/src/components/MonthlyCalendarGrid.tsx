import { useMemo } from 'react';

export interface DayUsage {
  date: string; // YYYY-MM-DD
  kwh: number;
}

interface MonthlyCalendarGridProps {
  year: number;
  month: number; // 1-12
  dailyData: DayUsage[];
  selectedDate?: string;
  onSelectDate?: (dateStr: string, kwh: number) => void;
}

export function MonthlyCalendarGrid({
  year,
  month,
  dailyData = [],
  selectedDate,
  onSelectDate,
}: MonthlyCalendarGridProps) {
  // Map data by day string for fast lookup
  const usageMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of dailyData) {
      map.set(d.date, d.kwh);
    }
    return map;
  }, [dailyData]);

  // Generate calendar grid
  const calendarCells = useMemo(() => {
    // Month in JS Date is 0-indexed
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);

    // Days in week: Mon=1 ... Sun=7 (In VN: Th2=1 ... CN=0/7)
    let startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday, 1 is Monday
    startDayOfWeek = startDayOfWeek === 0 ? 7 : startDayOfWeek; // Make Mon=1 ... Sun=7

    const totalDays = lastDayOfMonth.getDate();

    // Previous month filler days
    const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
    const prevDaysCount = startDayOfWeek - 1;

    const cells: Array<{
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isSunday: boolean;
      kwh?: number;
    }> = [];

    // 1. Previous month days
    for (let i = prevDaysCount - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevMonth = month - 1 === 0 ? 12 : month - 1;
      const prevYear = month - 1 === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${prevMonth.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isSunday: (cells.length + 1) % 7 === 0,
      });
    }

    // 2. Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      const kwh = usageMap.get(dateStr);
      const isSunday = (cells.length + 1) % 7 === 0;
      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isSunday,
        kwh,
      });
    }

    // 3. Next month filler days (to make a full 35 or 42 grid)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month + 1 > 12 ? 1 : month + 1;
      const nextYear = month + 1 > 12 ? year + 1 : year;
      const dateStr = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isSunday: (cells.length + 1) % 7 === 0,
      });
    }

    return cells;
  }, [year, month, usageMap]);

  const weekHeaders = [
    { label: 'Th2', isSunday: false },
    { label: 'Th3', isSunday: false },
    { label: 'Th4', isSunday: false },
    { label: 'Th5', isSunday: false },
    { label: 'Th6', isSunday: false },
    { label: 'Th7', isSunday: false },
    { label: 'CN', isSunday: true },
  ];

  return (
    <div className="w-full select-none">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
        {weekHeaders.map((header) => (
          <div
            key={header.label}
            className={`text-xs sm:text-sm font-semibold py-1 ${
              header.isSunday ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {header.label}
          </div>
        ))}
      </div>

      {/* Days Matrix */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
        {calendarCells.map((cell) => {
          const isSelected = selectedDate === cell.dateStr;
          const hasKwh = cell.isCurrentMonth && cell.kwh !== undefined;

          // In screenshot: selected day is a green rounded pill with white text
          if (isSelected) {
            return (
              <div
                key={cell.dateStr}
                onClick={() => onSelectDate && onSelectDate(cell.dateStr, cell.kwh ?? 0)}
                className="h-14 sm:h-16 rounded-2xl bg-[#00B33D] text-white flex flex-col items-center justify-center p-1 cursor-pointer shadow-md transition-all duration-150 transform scale-[1.02]"
              >
                <span className="text-sm sm:text-base font-bold leading-none">
                  {cell.dayNumber}
                </span>
                <span className="text-[10px] sm:text-xs font-medium mt-1 leading-none">
                  {cell.kwh !== undefined ? `${cell.kwh.toFixed(2)} kWh` : '0.00 kWh'}
                </span>
              </div>
            );
          }

          // Inactive / Other month cell
          if (!cell.isCurrentMonth) {
            return (
              <div
                key={cell.dateStr}
                className="h-14 sm:h-16 rounded-2xl bg-slate-50 dark:bg-slate-900/40 text-slate-300 dark:text-slate-600 flex items-center justify-center text-sm font-medium"
              >
                {cell.dayNumber}
              </div>
            );
          }

          // Normal active day cell
          return (
            <div
              key={cell.dateStr}
              onClick={() => onSelectDate && onSelectDate(cell.dateStr, cell.kwh ?? 0)}
              className="h-14 sm:h-16 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 shadow-sm hover:border-emerald-500/50 flex flex-col items-center justify-center p-1 cursor-pointer transition-all duration-150"
            >
              <span
                className={`text-sm sm:text-base font-semibold leading-none ${
                  cell.isSunday
                    ? 'text-red-500 font-bold'
                    : 'text-slate-800 dark:text-slate-100'
                }`}
              >
                {cell.dayNumber}
              </span>

              {hasKwh ? (
                <span className="text-[9px] sm:text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1 leading-none">
                  {cell.kwh!.toFixed(2)} kWh
                </span>
              ) : (
                <span className="h-3 mt-1" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
