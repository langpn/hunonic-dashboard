import { useState } from 'react';
import { Clock, Zap, TrendingUp } from 'lucide-react';

export interface HourlyPoint {
  hour: number;        // 0 - 23
  kwh: number;
  avg_power_w: number;
  samples_count?: number;
}

interface HourlyChartProps {
  data: HourlyPoint[];
  ratePrice?: number;
}

export function HourlyChart({ data, ratePrice = 3800 }: HourlyChartProps) {
  const [hoveredHour, setHoveredHour] = useState<HourlyPoint | null>(null);

  // 24-hour structure
  const hoursList = Array.from({ length: 24 }, (_, i) => {
    const existing = data.find(d => d.hour === i);
    return existing || { hour: i, kwh: 0, avg_power_w: 0 };
  });

  const maxPowerW = Math.max(...hoursList.map(d => d.avg_power_w), 100);
  const totalDayKwh = parseFloat(hoursList.reduce((sum, d) => sum + d.kwh, 0).toFixed(2));
  const peakPoint = hoursList.reduce((max, d) => (d.avg_power_w > max.avg_power_w ? d : max), hoursList[0]);

  // Current display point (hovered or peak/latest)
  const activePoint = hoveredHour || peakPoint;

  return (
    <div className="space-y-6">
      {/* Telemetry Indicator Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Khung giờ</p>
            <p className="text-sm font-bold text-slate-800 dark:text-white">
              {activePoint.hour.toString().padStart(2, '0')}:00 - {(activePoint.hour + 1).toString().padStart(2, '0')}:00
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Công suất điều hòa</p>
            <p className="text-sm font-bold text-sky-600 dark:text-sky-400">
              {activePoint.avg_power_w} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Watt</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Điện năng & Tiền điện</p>
            <p className="text-sm font-bold text-violet-600 dark:text-violet-300">
              {activePoint.kwh.toFixed(3)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">kWh</span>
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1.5">
                (~{Math.round(activePoint.kwh * ratePrice).toLocaleString('vi-VN')}₫)
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 24-Hour Interactive Bar Chart */}
      <div className="relative pt-6 pb-2">
        <div className="h-56 w-full flex items-end gap-1 sm:gap-2 px-1">
          {hoursList.map((item) => {
            const heightPercent = Math.max(6, Math.min(100, Math.round((item.avg_power_w / maxPowerW) * 100)));
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
                  <div className="absolute -top-11 bg-slate-900 text-white dark:bg-slate-800 text-[10px] font-semibold px-2 py-1 rounded-md shadow-lg whitespace-nowrap z-30 border border-slate-700 pointer-events-none transition-all">
                    {item.hour}h: {item.avg_power_w}W • {item.kwh} kWh
                  </div>
                )}

                {/* Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t transition-all duration-200 ${
                    isPeak
                      ? 'bg-amber-500 dark:bg-amber-400'
                      : isHovered
                      ? 'bg-emerald-500 dark:bg-emerald-400 shadow-md'
                      : 'bg-emerald-500/30 dark:bg-emerald-500/20 group-hover:bg-emerald-500/60 dark:group-hover:bg-emerald-500/40'
                  }`}
                />

                {/* X-axis label */}
                <span className={`text-[9px] sm:text-[10px] mt-2 font-mono transition-colors ${
                  isHovered 
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
                    : isPeak 
                    ? 'text-amber-600 dark:text-amber-400 font-bold' 
                    : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {item.hour % 3 === 0 || item.hour === 23 ? `${item.hour}h` : ''}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-3.5 border-t border-slate-200 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/40 dark:bg-emerald-500/30" />
              Công suất theo giờ
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 dark:bg-amber-400" />
              Cao điểm ({peakPoint.hour}h: {peakPoint.avg_power_w}W)
            </span>
          </div>

          <div className="text-right">
            Tổng cả ngày: <strong className="text-slate-800 dark:text-white">{totalDayKwh} kWh</strong> (~{(Math.round(totalDayKwh * ratePrice)).toLocaleString('vi-VN')}₫)
          </div>
        </div>
      </div>
    </div>
  );
}
