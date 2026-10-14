import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface YearlyChartProps {
  initialYear?: number;
  ratePrice?: number;
  token?: string | null;
}

interface MonthPoint {
  label: string; // e.g., "2026-1", "2026-9"
  value: number; // kWh
  monthIndex: number; // 1-12
}

export function YearlyChart({ initialYear = 2026, ratePrice = 3800, token }: YearlyChartProps) {
  const [year, setYear] = useState(initialYear);
  const [data, setData] = useState<MonthPoint[]>([]);
  const [totalKwh, setTotalKwh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hoveredMonth, setHoveredMonth] = useState<MonthPoint | null>(null);

  useEffect(() => {
    fetchYearData(year);
  }, [year]);

  const fetchYearData = async (targetYear: number) => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/dashboard/history?type=year&year=${targetYear}`, { headers });
      const json = await res.json();
      
      if (json.success && json.data) {
        setTotalKwh(json.data.total_power || 0);
        const points = (json.data.graph_data || []).map((p: any, idx: number) => ({
          label: p.label || `T${idx + 1}`,
          value: p.value || 0,
          monthIndex: idx + 1,
        }));
        setData(points);
      }
    } catch (e) {
      console.warn('Failed to fetch yearly data:', e);
    } finally {
      setLoading(false);
    }
  };

  const months12 = Array.from({ length: 12 }, (_, i) => {
    const existing = data.find(d => d.monthIndex === i + 1);
    return existing || { label: `T${i + 1}`, value: 0, monthIndex: i + 1 };
  });

  const maxKwh = Math.max(...months12.map(m => m.value), 10);
  const peakMonth = months12.reduce((max, m) => (m.value > max.value ? m : max), months12[0]);
  const activeMonth = hoveredMonth || peakMonth;

  return (
    <div className="space-y-5">
      {/* Year Navigator (< Năm 2026 >) */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setYear(y => y - 1)}
            className="p-1 rounded-full text-[#00B33D] dark:text-[#10B981] hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm sm:text-base font-bold text-[#00B33D] dark:text-[#10B981]">
            Năm {year}
          </span>
          <button
            onClick={() => setYear(y => y + 1)}
            className="p-1 rounded-full text-[#00B33D] dark:text-[#10B981] hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 dark:text-slate-400">Tổng cả năm: </span>
          <strong className="text-sm font-bold text-slate-900 dark:text-white">{totalKwh.toFixed(1)} kWh</strong>
          <span className="text-xs text-[#EF4444] font-semibold ml-2">
            (~{Math.round(totalKwh * ratePrice).toLocaleString('vi-VN')} ₫)
          </span>
        </div>
      </div>

      {loading ? (
        <div className="h-56 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#00B33D]" />
        </div>
      ) : (
        <>
          {/* Active Highlight Banner */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Tháng đang chọn</span>
              <strong className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                Tháng {activeMonth.monthIndex}/{year}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Lượng điện</span>
              <strong className="text-sm font-bold text-[#00B33D] dark:text-[#10B981] mt-0.5 block">
                {activeMonth.value.toFixed(2)} kWh
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Tiền điện ước tính</span>
              <strong className="text-sm font-bold text-[#EF4444] mt-0.5 block">
                {Math.round(activeMonth.value * ratePrice).toLocaleString('vi-VN')} ₫
              </strong>
            </div>
          </div>

          {/* 12-Month Bar Chart */}
          <div className="h-56 w-full flex items-end gap-1.5 sm:gap-3 px-1 pt-4">
            {months12.map((m) => {
              const heightPercent = Math.max(6, Math.min(100, Math.round((m.value / maxKwh) * 100)));
              const isHovered = hoveredMonth?.monthIndex === m.monthIndex;
              const isPeak = m.monthIndex === peakMonth.monthIndex && peakMonth.value > 0;

              return (
                <div
                  key={m.monthIndex}
                  onMouseEnter={() => setHoveredMonth(m)}
                  onMouseLeave={() => setHoveredMonth(null)}
                  className="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer relative"
                >
                  {/* Floating tooltip */}
                  {isHovered && (
                    <div className="absolute -top-11 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-bold px-2 py-1 rounded shadow-md whitespace-nowrap z-20 pointer-events-none">
                      T{m.monthIndex}: {m.value.toFixed(1)} kWh
                    </div>
                  )}

                  {/* Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-lg transition-all duration-200 ${
                      isPeak
                        ? 'bg-[#EF4444] shadow-sm'
                        : isHovered
                        ? 'bg-[#00B33D] dark:bg-[#10B981] shadow-md'
                        : 'bg-[#00B33D]/30 dark:bg-[#10B981]/25 group-hover:bg-[#00B33D]/60'
                    }`}
                  />

                  {/* Month Label */}
                  <span className={`text-[10px] sm:text-xs mt-2 font-mono transition-colors ${
                    isHovered
                      ? 'text-[#00B33D] dark:text-[#10B981] font-bold'
                      : isPeak
                      ? 'text-[#EF4444] font-bold'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    T{m.monthIndex}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Footnote */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Cao điểm nhất: <strong className="text-[#EF4444]">Tháng {peakMonth.monthIndex} ({peakMonth.value.toFixed(1)} kWh)</strong></span>
            <span>Biểu đồ 12 tháng</span>
          </div>
        </>
      )}
    </div>
  );
}
