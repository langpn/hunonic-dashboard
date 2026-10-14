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
  dateStr?: string;
}

export function HourlyChart({ data, ratePrice = 3800, dateStr: _dateStr }: HourlyChartProps) {
  const [activeHour, setActiveHour] = useState<HourlyPoint | null>(null);

  // Fallback 24-hour structure if empty
  const hoursList = Array.from({ length: 24 }, (_, i) => {
    const existing = data.find(d => d.hour === i);
    return existing || { hour: i, kwh: 0, avg_power_w: 0 };
  });

  const maxPowerW = Math.max(...hoursList.map(d => d.avg_power_w), 100);
  const totalDayKwh = parseFloat(hoursList.reduce((sum, d) => sum + d.kwh, 0).toFixed(2));
  const peakPoint = hoursList.reduce((max, d) => (d.avg_power_w > max.avg_power_w ? d : max), hoursList[0]);

  // Selected or Peak hover point
  const currentView = activeHour || peakPoint;

  return (
    <div className="space-y-6">
      {/* HUD Telemetry Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Giờ đang chọn</p>
            <p className="text-lg font-bold text-white">
              {currentView.hour.toString().padStart(2, '0')}:00 - {(currentView.hour + 1).toString().padStart(2, '0')}:00
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Công suất trung bình</p>
            <p className="text-lg font-bold text-cyan-300">
              {currentView.avg_power_w} <span className="text-xs font-normal text-slate-400">Watt</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Tiêu thụ & Chi phí giờ</p>
            <p className="text-lg font-bold text-violet-300">
              {currentView.kwh.toFixed(3)} <span className="text-xs font-normal text-slate-400">kWh</span>
              <span className="text-xs text-slate-400 ml-2 font-normal">
                (~{Math.round(currentView.kwh * ratePrice).toLocaleString('vi-VN')}₫)
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Pure Neon SVG Bar Chart */}
      <div className="relative pt-6 pb-2">
        <div className="h-64 w-full flex items-end gap-1 sm:gap-2 px-1">
          {hoursList.map((item) => {
            const heightPercent = Math.max(6, Math.min(100, Math.round((item.avg_power_w / maxPowerW) * 100)));
            const isSelected = activeHour?.hour === item.hour;
            const isPeak = item.hour === peakPoint.hour && peakPoint.avg_power_w > 0;

            return (
              <div
                key={item.hour}
                onMouseEnter={() => setActiveHour(item)}
                onClick={() => setActiveHour(item)}
                className="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer relative"
              >
                {/* Value tooltip on hover */}
                {isSelected && (
                  <div className="absolute -top-10 bg-slate-900 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-20">
                    {item.avg_power_w} W
                  </div>
                )}

                {/* Glowing Neon Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t-sm sm:rounded-t-md transition-all duration-300 ${
                    isPeak
                      ? 'bg-gradient-to-t from-amber-500/60 to-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] border-t border-amber-300'
                      : isSelected
                      ? 'bg-gradient-to-t from-emerald-500/80 to-cyan-300 shadow-[0_0_20px_rgba(0,245,155,0.6)] border-t border-cyan-200'
                      : 'bg-gradient-to-t from-slate-800/80 via-emerald-950/40 to-emerald-500/40 hover:to-emerald-400/80 hover:shadow-[0_0_12px_rgba(0,245,155,0.3)]'
                  }`}
                />

                {/* X Axis Label */}
                <span className={`text-[9px] sm:text-[10px] mt-2 font-mono transition-colors ${
                  isSelected ? 'text-emerald-400 font-bold' : isPeak ? 'text-amber-400 font-bold' : 'text-slate-500'
                }`}>
                  {item.hour % 3 === 0 || item.hour === 23 ? `${item.hour}h` : ''}
                </span>
              </div>
            );
          })}
        </div>

        {/* Chart Legend & Peak Note */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-800/70 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 shadow-[0_0_8px_rgba(0,245,155,0.8)]" />
              Công suất theo giờ
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              Khung giờ cao điểm ({peakPoint.hour}h)
            </span>
          </div>

          <div className="text-right">
            Tổng 24h: <span className="text-white font-bold">{totalDayKwh} kWh</span> (~{(Math.round(totalDayKwh * ratePrice)).toLocaleString('vi-VN')}₫)
          </div>
        </div>
      </div>
    </div>
  );
}
