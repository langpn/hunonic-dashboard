import { useState, useMemo } from 'react';

export interface DayUsage {
  date: string; // YYYY-MM-DD
  kwh: number;
}

interface MonthlyCalendarGridProps {
  year: number;
  month: number; // 1-12
  dailyData: DayUsage[];
  ratePrice?: number;
  selectedDate?: string;
  onSelectDate?: (dateStr: string, kwh: number) => void;
}

export function MonthlyCalendarGrid({
  year,
  month,
  dailyData = [],
  ratePrice = 3800,
  selectedDate,
  onSelectDate,
}: MonthlyCalendarGridProps) {
  const [hoveredDate, setHoveredDate] = useState<{ dateStr: string; kwh: number; day: number } | null>(null);

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
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);

    // Days in week: Mon=1 ... Sun=7 (In VN: Th2=1 ... CN=7)
    let startDayOfWeek = firstDayOfMonth.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 7 : startDayOfWeek;

    const totalDays = lastDayOfMonth.getDate();
    const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
    const prevDaysCount = startDayOfWeek - 1;

    const cells: Array<{
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isSunday: boolean;
      kwh?: number;
    }> = [];

    // 1. Previous month filler days
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

    // 3. Next month filler days
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
    <div className="w-full select-none relative">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
        {weekHeaders.map((header) => (
          <div
            key={header.label}
            className={`text-xs sm:text-sm font-bold py-1 ${
              header.isSunday ? 'text-[#EF4444]' : 'text-[#00B33D] dark:text-[#10B981]'
            }`}
          >
            {header.label}
          </div>
        ))}
      </div>

      {/* Days Matrix */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {calendarCells.map((cell) => {
          const isSelected = selectedDate === cell.dateStr;
          const hasKwh = cell.isCurrentMonth && cell.kwh !== undefined;

          // Inactive / Other month cell
          if (!cell.isCurrentMonth) {
            return (
              <div
                key={cell.dateStr}
                className="h-[52px] sm:h-15 rounded-xl flex items-center justify-center text-xs font-medium text-slate-300 dark:text-slate-600/60"
              >
                {cell.dayNumber}
              </div>
            );
          }

          // Active Selected Day (Pill in #00B33D from screenshot)
          if (isSelected) {
            return (
              <div
                key={cell.dateStr}
                onClick={() => onSelectDate && onSelectDate(cell.dateStr, cell.kwh ?? 0)}
                onMouseEnter={() => setHoveredDate({ dateStr: cell.dateStr, kwh: cell.kwh ?? 0, day: cell.dayNumber })}
                onMouseLeave={() => setHoveredDate(null)}
                className="h-[52px] sm:h-15 rounded-xl bg-[#00B33D] text-white flex flex-col items-center justify-center py-1 px-0.5 cursor-pointer shadow-md transition-all transform scale-[1.03] z-10"
              >
                <span className="text-sm font-bold leading-none">
                  {cell.dayNumber}
                </span>
                <span className="text-[9.5px] sm:text-[10.5px] font-semibold mt-1 leading-none tracking-tight">
                  {cell.kwh !== undefined ? `${cell.kwh.toFixed(2)} kWh` : '0.00 kWh'}
                </span>
              </div>
            );
          }

          // Normal active day cell
          return (
            <div
              key={cell.dateStr}
              onClick={() => onSelectDate && onSelectDate(cell.dateStr, cell.kwh ?? 0)}
              onMouseEnter={() => setHoveredDate({ dateStr: cell.dateStr, kwh: cell.kwh ?? 0, day: cell.dayNumber })}
              onMouseLeave={() => setHoveredDate(null)}
              className="h-[52px] sm:h-15 rounded-xl bg-slate-50/80 dark:bg-[#1C212D] border border-slate-200/60 dark:border-slate-800/80 hover:border-[#00B33D]/60 dark:hover:border-[#10B981]/60 flex flex-col items-center justify-center py-1 px-0.5 cursor-pointer transition-all duration-150"
            >
              <span
                className={`text-xs sm:text-sm font-semibold leading-none ${
                  cell.isSunday
                    ? 'text-[#EF4444] font-bold'
                    : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                {cell.dayNumber}
              </span>

              {hasKwh ? (
                <span className="text-[9px] sm:text-[10px] font-medium text-[#00B33D] dark:text-[#10B981] mt-1 leading-none tracking-tight">
                  {cell.kwh!.toFixed(2)} kWh
                </span>
              ) : (
                <span className="h-2.5 mt-1" />
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Hover Tooltip Detail */}
      {hoveredDate && (
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[11px] font-semibold px-3 py-1 rounded-full shadow-lg border border-slate-700 dark:border-slate-200 pointer-events-none transition-all flex items-center gap-2 z-20">
          <span>Ngày {hoveredDate.day}/{month}:</span>
          <strong className="text-[#10B981] dark:text-[#00B33D]">{hoveredDate.kwh.toFixed(2)} kWh</strong>
          <span>•</span>
          <span className="text-[#F43F5E]">~{Math.round(hoveredDate.kwh * ratePrice).toLocaleString('vi-VN')} ₫</span>
        </div>
      )}
    </div>
  );
}
