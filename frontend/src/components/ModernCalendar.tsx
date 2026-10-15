import { useState, useMemo } from 'react';

export interface DayUsage {
  date: string; // YYYY-MM-DD
  kwh: number;
}

interface ModernCalendarProps {
  year: number;
  month: number; // 1-12
  dailyData: DayUsage[];
  ratePrice?: number;
  selectedDate?: string;
  onSelectDate?: (dateStr: string, kwh: number) => void;
}

export function ModernCalendar({
  year,
  month,
  dailyData = [],
  ratePrice = 3800,
  selectedDate,
  onSelectDate,
}: ModernCalendarProps) {
  const [hoveredCell, setHoveredCell] = useState<{ dateStr: string; kwh: number; day: number } | null>(null);

  // Map data by day string for fast lookup
  const usageMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of dailyData) {
      map.set(d.date, d.kwh);
    }
    return map;
  }, [dailyData]);

  const maxKwhInMonth = useMemo(() => {
    const vals = dailyData.map(d => d.kwh).filter(v => v > 0);
    return vals.length > 0 ? Math.max(...vals) : 5;
  }, [dailyData]);

  // Generate calendar grid cells
  const calendarCells = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    // Days in week: Mon=1 ... Sun=7 (In VN: T2=1 ... CN=7)
    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 7 : startDayOfWeek;

    const totalDays = lastDay.getDate();
    const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
    const prevDaysCount = startDayOfWeek - 1;

    const cells: Array<{
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isSunday: boolean;
      kwh?: number;
      intensity: number; // 0 to 1
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
        intensity: 0,
      });
    }

    // 2. Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      const kwh = usageMap.get(dateStr);
      const intensity = kwh && maxKwhInMonth > 0 ? Math.min(1, kwh / maxKwhInMonth) : 0;
      const isSunday = (cells.length + 1) % 7 === 0;

      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isSunday,
        kwh,
        intensity,
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
        intensity: 0,
      });
    }

    return cells;
  }, [year, month, usageMap, maxKwhInMonth]);

  const weekHeaders = [
    { label: 'T2', isSunday: false },
    { label: 'T3', isSunday: false },
    { label: 'T4', isSunday: false },
    { label: 'T5', isSunday: false },
    { label: 'T6', isSunday: false },
    { label: 'T7', isSunday: false },
    { label: 'CN', isSunday: true },
  ];

  return (
    <div className="w-full select-none relative">
      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 gap-2 mb-3 text-center">
        {weekHeaders.map((header) => (
          <div
            key={header.label}
            className={`text-xs font-semibold uppercase tracking-wider py-1 ${
              header.isSunday ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {header.label}
          </div>
        ))}
      </div>

      {/* Modern Heatmap Matrix */}
      <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
        {calendarCells.map((cell) => {
          const isSelected = selectedDate === cell.dateStr;
          const isToday = cell.dateStr === new Date().toISOString().slice(0, 10);
          const hasKwh = cell.isCurrentMonth && cell.kwh !== undefined && cell.kwh > 0;

          // Inactive filler day
          if (!cell.isCurrentMonth) {
            return (
              <div
                key={cell.dateStr}
                className="h-14 sm:h-16 rounded-xl flex items-center justify-center text-xs font-mono text-slate-300 dark:text-slate-700/50 select-none"
              >
                {cell.dayNumber}
              </div>
            );
          }

          // Active day cell with subtle energy bar indicator
          return (
            <div
              key={cell.dateStr}
              onClick={() => onSelectDate && onSelectDate(cell.dateStr, cell.kwh ?? 0)}
              onMouseEnter={() => setHoveredCell({ dateStr: cell.dateStr, kwh: cell.kwh ?? 0, day: cell.dayNumber })}
              onMouseLeave={() => setHoveredCell(null)}
              className={`h-14 sm:h-16 rounded-xl p-2 flex flex-col justify-between cursor-pointer transition-all duration-150 relative overflow-hidden ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-[#12161f]'
                  : isToday
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-2 border-emerald-500 shadow-sm ring-2 ring-emerald-500/40 ring-offset-1 ring-offset-white dark:ring-offset-[#12161f]'
                  : 'bg-white dark:bg-[#181d28] border border-slate-200/90 dark:border-white/5 hover:border-emerald-500/60 dark:hover:border-emerald-400/50 hover:shadow-sm'
              }`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1">
                  <span
                    className={`text-xs sm:text-sm font-semibold leading-none ${
                      isSelected
                        ? 'text-white font-bold'
                        : isToday
                        ? 'text-emerald-700 dark:text-emerald-400 font-black'
                        : cell.isSunday
                        ? 'text-rose-600 font-bold'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                  {isToday && !isSelected && (
                    <span className="hidden sm:inline-block px-1 py-0.2 text-[8px] font-bold uppercase rounded bg-emerald-600 text-white leading-tight">
                      Nay
                    </span>
                  )}
                </div>

                {/* Energy Activity Micro-Indicator */}
                {hasKwh && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected
                        ? 'bg-white'
                        : isToday
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-emerald-500'
                    }`}
                  />
                )}
              </div>

              {/* Day Consumption Number */}
              <div className="w-full">
                {hasKwh ? (
                  <span
                    className={`text-[10px] sm:text-xs font-mono font-medium tracking-tight block truncate ${
                      isSelected
                        ? 'text-emerald-100'
                        : isToday
                        ? 'text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'text-emerald-700 dark:text-emerald-400 font-semibold'
                    }`}
                  >
                    {cell.kwh!.toFixed(2)} <span className="text-[9px] opacity-80">kWh</span>
                  </span>
                ) : (
                  <span className={`text-[10px] font-mono block ${isSelected ? 'text-white/60' : 'text-slate-400 dark:text-slate-600'}`}>
                    0.00
                  </span>
                )}
              </div>

              {/* Bottom Subtle Heat Bar */}
              {hasKwh && !isSelected && (
                <div
                  style={{ width: `${Math.round(cell.intensity * 100)}%` }}
                  className={`absolute bottom-0 left-0 h-0.5 rounded-r-full ${
                    isToday ? 'bg-emerald-500' : 'bg-emerald-500/80 dark:bg-emerald-400/80'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Hover Card with Rich Metrics */}
      {hoveredCell && (
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs px-3.5 py-1.5 rounded-xl shadow-xl border border-slate-700 dark:border-slate-200 flex items-center gap-2.5 z-30 pointer-events-none transition-all">
          <span className="font-medium text-slate-400 dark:text-slate-500">Ngày {hoveredCell.day}/{month}:</span>
          <strong className="text-emerald-400 dark:text-emerald-600 font-mono">{hoveredCell.kwh.toFixed(2)} kWh</strong>
          <span className="text-slate-600 dark:text-slate-300">•</span>
          <span className="text-rose-400 dark:text-rose-600 font-medium font-mono">
            ~{Math.round(hoveredCell.kwh * ratePrice).toLocaleString('vi-VN')} ₫
          </span>
        </div>
      )}
    </div>
  );
}
