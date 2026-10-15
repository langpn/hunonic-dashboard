import { useState, useEffect } from 'react';
import { Clock, Zap, TrendingUp, ChevronLeft, ChevronRight, Loader2, Cloud } from 'lucide-react';

export interface HourlyPoint {
  hour: number;        // 0 - 23
  kwh: number;
  avg_power_w: number;
  samples_count?: number;
}

interface HourlyChartProps {
  initialDate?: string; // YYYY-MM-DD
  initialData?: HourlyPoint[];
  ratePrice?: number;
  token?: string | null;
}

export function HourlyChart({
  initialDate = new Date().toISOString().slice(0, 10),
  initialData = [],
  ratePrice = 3800,
  token,
}: HourlyChartProps) {
  const [date, setDate] = useState(initialDate);
  const [data, setData] = useState<HourlyPoint[]>(initialData);
  const [dayTotalKwh, setDayTotalKwh] = useState(0);
  const [isFromCloud, setIsFromCloud] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hoveredHour, setHoveredHour] = useState<HourlyPoint | null>(null);

  useEffect(() => {
    fetchDayData(date);
  }, [date]);

  const fetchDayData = async (targetDate: string) => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/dashboard/history?type=day&date=${targetDate}`, { headers });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data.hourly || []);
        setDayTotalKwh(json.data.total_kwh || 0);
        setIsFromCloud(!!json.data.is_from_cloud);
      }
    } catch (e) {
      console.warn('Failed to fetch day hourly data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    setDate(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    setDate(d.toISOString().slice(0, 10));
  };

  // 24-hour structure
  const hoursList = Array.from({ length: 24 }, (_, i) => {
    const existing = data.find(d => d.hour === i);
    return existing || { hour: i, kwh: 0, avg_power_w: 0 };
  });

  const maxPowerW = Math.max(...hoursList.map(d => d.avg_power_w), 100);
  const totalDayKwh = dayTotalKwh > 0 
    ? dayTotalKwh 
    : parseFloat(hoursList.reduce((sum, d) => sum + d.kwh, 0).toFixed(2));

  const peakPoint = hoursList.reduce((max, d) => (d.avg_power_w > max.avg_power_w ? d : max), hoursList[0]);
  const activePoint = hoveredHour || peakPoint;

  return (
    <div className="space-y-5">
      {/* Date Navigator Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevDay}
            className="p-1 rounded-full text-[#00B33D] dark:text-[#10B981] hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Ngày trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm sm:text-base font-bold text-[#00B33D] dark:text-[#10B981]">
            Ngày {date}
          </span>
          <button
            onClick={handleNextDay}
            className="p-1 rounded-full text-[#00B33D] dark:text-[#10B981] hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Ngày sau"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 dark:text-slate-400">Tổng cả ngày: </span>
          <strong className="text-sm font-bold text-slate-900 dark:text-white">{totalDayKwh.toFixed(2)} kWh</strong>
          <span className="text-xs text-[#EF4444] font-semibold ml-2">
            (~{Math.round(totalDayKwh * ratePrice).toLocaleString('vi-VN')} ₫)
          </span>
        </div>
      </div>

      {loading ? (
        <div className="h-56 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#00B33D]" />
        </div>
      ) : (
        <>
          {/* Cloud vs Local Note Banner if historical day */}
          {isFromCloud && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Cloud className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>
                Tổng lượng điện ngày <strong className="text-slate-800 dark:text-white">{date}</strong> được đồng bộ trực tiếp từ Cloud Hunonic: <strong className="text-[#00B33D] dark:text-[#10B981]">{totalDayKwh.toFixed(2)} kWh</strong> (~{Math.round(totalDayKwh * ratePrice).toLocaleString('vi-VN')} ₫).
              </span>
            </div>
          )}

          {/* Telemetry Indicator Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-[#00B33D] dark:text-[#10B981]">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Khung giờ</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  {activePoint.hour.toString().padStart(2, '0')}:00 - {(activePoint.hour + 1).toString().padStart(2, '0')}:00
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-[#00B33D] dark:text-[#10B981]">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Công suất điều hòa</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  {activePoint.avg_power_w} <span className="text-xs font-normal text-slate-400">Watt</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 text-[#EF4444]">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Tiêu thụ & Chi phí</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  {activePoint.kwh.toFixed(3)} <span className="text-xs font-normal text-slate-400">kWh</span>
                  <span className="text-xs font-semibold text-[#EF4444] ml-1.5">
                    (~{Math.round(activePoint.kwh * ratePrice).toLocaleString('vi-VN')}₫)
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* 24-Hour Bar Chart */}
          <div className="relative pt-4 pb-2">
            <div className="h-56 w-full flex items-end gap-1 sm:gap-2 px-1">
              {hoursList.map((item) => {
                const hasPower = item.avg_power_w > 0 || item.kwh > 0;
                const heightPercent = hasPower
                  ? Math.max(8, Math.min(100, Math.round((item.avg_power_w / maxPowerW) * 100)))
                  : 4;
                const isHovered = hoveredHour?.hour === item.hour;
                const isPeak = item.hour === peakPoint.hour && peakPoint.avg_power_w > 0;

                return (
                  <div
                    key={item.hour}
                    onMouseEnter={() => setHoveredHour(item)}
                    onMouseLeave={() => setHoveredHour(null)}
                    className="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer relative"
                  >
                    {/* Floating tooltip */}
                    {isHovered && (
                      <div className="absolute -top-11 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-bold px-2 py-1 rounded shadow-md whitespace-nowrap z-30 pointer-events-none">
                        {item.hour}h: {item.avg_power_w}W • {item.kwh} kWh
                      </div>
                    )}

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t transition-all duration-150 ${
                        !hasPower
                          ? 'bg-slate-200/70 dark:bg-slate-800/40 group-hover:bg-slate-300 dark:group-hover:bg-slate-700'
                          : isPeak
                          ? 'bg-[#EF4444] shadow-sm shadow-rose-500/20'
                          : isHovered
                          ? 'bg-emerald-500 shadow-sm'
                          : 'bg-emerald-500/80 dark:bg-emerald-400/80 group-hover:bg-emerald-500'
                      }`}
                    />

                    {/* X-axis label */}
                    <span className={`text-[9px] sm:text-[10px] mt-2 font-mono transition-colors ${
                      isHovered 
                        ? 'text-emerald-500 font-bold' 
                        : isPeak 
                        ? 'text-[#EF4444] font-bold' 
                        : 'text-slate-400 dark:text-slate-500'
                    }`}>
                      {item.hour % 3 === 0 || item.hour === 23 ? `${item.hour}h` : ''}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Footer Info */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#00B33D]/40" />
                  Công suất theo giờ
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444]" />
                  Cao điểm ({peakPoint.hour}h: {peakPoint.avg_power_w}W)
                </span>
              </div>
              <span>Biểu đồ 24 giờ</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
