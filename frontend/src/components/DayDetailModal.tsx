import { useState, useEffect } from 'react';
import { X, Clock, Zap, TrendingUp, Cloud, Loader2, Calendar } from 'lucide-react';
import { getVnDateString } from '../lib/time-utils';

interface HourlyPoint {
  hour: number;
  kwh: number;
  avg_power_w: number;
  samples_count?: number;
}

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string; // YYYY-MM-DD
  dayKwh?: number;
  ratePrice?: number;
  token?: string | null;
}

export function DayDetailModal({
  isOpen,
  onClose,
  dateStr,
  dayKwh = 0,
  ratePrice = 3800,
  token,
}: DayDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HourlyPoint[]>([]);
  const [totalKwh, setTotalKwh] = useState(dayKwh);
  const [firstPower, setFirstPower] = useState(0);
  const [lastPower, setLastPower] = useState(0);
  const [peakHour, setPeakHour] = useState(0);
  const [peakPowerW, setPeakPowerW] = useState(0);
  const [isFromCloud, setIsFromCloud] = useState(false);
  const [hoveredHour, setHoveredHour] = useState<HourlyPoint | null>(null);

  useEffect(() => {
    if (isOpen && dateStr) {
      fetchDayDetail(dateStr);
    }
  }, [isOpen, dateStr]);

  // Sync real-time ticking kWh for today (Vietnam timezone GMT+7)
  const isToday = getVnDateString() === dateStr;
  useEffect(() => {
    if (isToday && dayKwh > 0) {
      setTotalKwh(dayKwh);
    }
  }, [dayKwh, isToday]);

  if (!isOpen) return null;

  const fetchDayDetail = async (targetDate: string) => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/dashboard/history?type=day&date=${targetDate}`, { headers });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data.hourly || []);
        const serverKwh = json.data.total_kwh || 0;
        setTotalKwh(serverKwh > 0 ? serverKwh : dayKwh);
        setFirstPower(json.data.first_power || 0);
        setLastPower(json.data.last_power || 0);
        setPeakHour(json.data.peak_hour || 0);
        setPeakPowerW(Math.min(1240, json.data.peak_power_w || 0)); // Capped at real AC physical max 1240W
        setIsFromCloud(!!json.data.is_from_cloud);
      }
    } catch (e) {
      console.warn('Failed to fetch day detail:', e);
    } finally {
      setLoading(false);
    }
  };

  // 24 hours structure
  const hoursList = Array.from({ length: 24 }, (_, i) => {
    const existing = data.find((d) => d.hour === i);
    return existing || { hour: i, kwh: 0, avg_power_w: 0 };
  });

  const maxPowerW = Math.max(...hoursList.map((d) => d.avg_power_w), 100);
  const activePeak = hoursList.reduce((max, d) => (d.avg_power_w > max.avg_power_w ? d : max), hoursList[0]);
  const activePoint = hoveredHour || activePeak;

  // Format date display (e.g. Ngày 15 tháng 10, 2026)
  const parts = dateStr.split('-');
  const formattedDate = parts.length === 3 ? `Ngày ${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside backdrop to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Slide-Up Panel / Bottom Sheet */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 shadow-2xl rounded-t-3xl sm:rounded-2xl overflow-hidden z-10 animate-in slide-in-from-bottom duration-300 max-h-[92vh] flex flex-col">
        {/* Drag handle for mobile */}
        <div className="sm:hidden w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 mb-1" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {formattedDate}
                </h2>
                {isToday && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Hôm nay
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Phân tích tiêu thụ chi tiết 24 giờ của máy lạnh
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Top 3 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1a202c] border border-slate-200/80 dark:border-white/5">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Tổng tiêu thụ</span>
              <strong className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {totalKwh.toFixed(2)} <span className="text-xs font-normal text-slate-400">kWh</span>
              </strong>
              <span className="text-[11px] font-semibold text-rose-500 mt-0.5 block">
                ~{Math.round(totalKwh * ratePrice).toLocaleString('vi-VN')} ₫
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1a202c] border border-slate-200/80 dark:border-white/5">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Giờ cao điểm</span>
              <strong className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
                {peakHour.toString().padStart(2, '0')}:00
              </strong>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                Đỉnh: <strong className="text-slate-700 dark:text-slate-300 font-mono">{peakPowerW} W</strong>
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1a202c] border border-slate-200/80 dark:border-white/5">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Nguồn dữ liệu</span>
              <div className="flex items-center gap-1.5 mt-1">
                {isFromCloud ? (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                    <span className="text-xs font-bold text-sky-600 dark:text-sky-400">Cloud Hunonic</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">SQLite C++ Đo thực</span>
                  </>
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Chuẩn hóa lưới điện 224V
              </span>
            </div>
          </div>

          {/* Official Ground Truth Meter Indices (From Hunonic Cloud Day API Type 0) */}
          {(firstPower > 0 || lastPower > 0) && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1a202c] border border-slate-200/80 dark:border-white/5 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Chỉ số đầu ngày (00:00)</span>
                <strong className="text-sm font-bold font-mono text-slate-700 dark:text-slate-300 mt-0.5 block">
                  {firstPower.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">kWh</span>
                </strong>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 sm:mx-2" />
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Chỉ số cuối ngày (23:59)</span>
                <strong className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {lastPower.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">kWh</span>
                </strong>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 sm:mx-2" />
              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Chênh lệch chuẩn</span>
                <strong className="text-sm font-bold font-mono text-sky-600 dark:text-sky-400 mt-0.5 block">
                  +{(lastPower >= firstPower && firstPower > 0 ? lastPower - firstPower : totalKwh).toFixed(2)} <span className="text-[10px] font-normal text-slate-400">kWh</span>
                </strong>
              </div>
            </div>
          )}

          {/* Active Hover / Peak Telemetry Preview */}
          <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#1a202c] border border-slate-200/80 dark:border-white/5 text-xs">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Khung giờ</span>
                <strong className="text-slate-800 dark:text-white font-mono">
                  {activePoint.hour.toString().padStart(2, '0')}:00 - {(activePoint.hour + 1).toString().padStart(2, '0')}:00
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Công suất</span>
                <strong className="text-slate-800 dark:text-white font-mono">
                  {activePoint.avg_power_w} W
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Tiêu thụ</span>
                <strong className="text-rose-500 font-mono">
                  {activePoint.kwh.toFixed(3)} kWh
                </strong>
              </div>
            </div>
          </div>

          {/* 24-Hour Bar Chart */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
              <span className="font-semibold uppercase text-[10px] tracking-wider">
                Biểu đồ điện năng 24 giờ
              </span>
              <span className="text-[11px] font-mono">
                Rê chuột vào cột để xem chi tiết
              </span>
            </div>

            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              </div>
            ) : (
              <div className="h-48 w-full flex items-end gap-1 sm:gap-1.5 pt-4 pb-1 px-1 rounded-xl bg-slate-50/60 dark:bg-black/20 border border-slate-200/60 dark:border-white/5">
                {hoursList.map((item) => {
                  const hasPower = item.avg_power_w > 0 || item.kwh > 0;
                  const heightPercent = hasPower
                    ? Math.max(8, Math.min(100, Math.round((item.avg_power_w / maxPowerW) * 100)))
                    : 4;
                  const isHovered = hoveredHour?.hour === item.hour;
                  const isPeak = item.hour === activePeak.hour && activePeak.avg_power_w > 0;

                  return (
                    <div
                      key={item.hour}
                      onMouseEnter={() => setHoveredHour(item)}
                      onMouseLeave={() => setHoveredHour(null)}
                      className="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer relative"
                    >
                      {/* Tooltip on hover */}
                      {isHovered && (
                        <div className="absolute -top-10 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-mono font-bold px-2 py-1 rounded-lg shadow-xl whitespace-nowrap z-30 pointer-events-none">
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
                      <span
                        className={`text-[9px] mt-1.5 font-mono transition-colors ${
                          isHovered
                            ? 'text-emerald-500 font-bold'
                            : isPeak
                            ? 'text-[#EF4444] font-bold'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {item.hour % 3 === 0 || item.hour === 23 ? `${item.hour}h` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-[#181d28] border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
          <span>Chu kỳ lấy mẫu: Tích phân hình thang SQLite C++</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
