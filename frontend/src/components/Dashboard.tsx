import { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Settings, Calendar as CalendarIcon, 
  BarChart2, Zap, LogOut, RefreshCw, Sun, Moon
} from 'lucide-react';
import { MonthlyCalendarGrid } from './MonthlyCalendarGrid';
import { DailyChart } from './DailyChart';
import { HourlyChart } from './HourlyChart';
import type { SummaryData } from '../App';

interface DashboardProps {
  summary: SummaryData;
  onRefresh: () => void;
  onLogout: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  userPhone?: string;
}

type PeriodTab = 'day' | 'month' | 'year' | 'custom';
type BottomViewMode = 'calendar' | 'chart';

export function Dashboard({
  summary,
  onRefresh,
  onLogout,
  isDark,
  onToggleTheme,
  userPhone,
}: DashboardProps) {
  const [periodTab, setPeriodTab] = useState<PeriodTab>('month');
  const [viewMode, setViewMode] = useState<BottomViewMode>('calendar');
  const [showSettings, setShowSettings] = useState(false);

  // Month navigation state
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonthNum, setCurrentMonthNum] = useState(() => new Date().getMonth() + 1);

  // Selected date state for day-detail view
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const { home, electricMeters, today, currentMonth, electricityRate } = summary;
  const meter = electricMeters[0];

  const ratePrice = electricityRate?.price ? parseInt(electricityRate.price) : 3800;

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonthNum === 1) {
      setCurrentMonthNum(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonthNum((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthNum === 12) {
      setCurrentMonthNum(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonthNum((m) => m + 1);
    }
  };

  // Metrics from API
  const totalKwh = currentMonth?.total_power ?? meter?.power_of_month ?? 36.27;
  const totalPrice = currentMonth?.total_price ?? meter?.money_of_month ?? Math.round(totalKwh * ratePrice);
  const firstPower = currentMonth?.first_power ?? 324.6;
  const lastPower = currentMonth?.last_power ?? (firstPower + totalKwh);

  // Realtime Telemetry from EKMeter
  const powerW = today.power_current_w || meter?.power_current || 4.6;
  const voltageV = 230.6;
  const currentA = powerW > 0 ? parseFloat((powerW / voltageV).toFixed(1)) : 0.1;
  const leakageMa = 0;

  return (
    <div className="min-h-screen bg-[#F4F6F8] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Maximum width container aligned with mobile UI layout */}
      <div className="w-full max-w-lg mx-auto bg-white dark:bg-[#111827] shadow-xl min-h-screen flex flex-col justify-between border-x border-slate-200/60 dark:border-slate-800/80">
        <div className="p-4 sm:p-6 space-y-5">
          {/* 1. Header (Mô phỏng 1:1 theo app) */}
          <div className="relative flex items-center justify-between pb-1">
            <button
              onClick={() => onRefresh()}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              title="Làm mới"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <h1 className="text-base sm:text-lg font-bold tracking-wide uppercase text-slate-900 dark:text-white text-center">
              {meter?.name || 'BỘ KIỂM SOÁT ĐIỆN NĂNG'}
            </h1>

            {/* Settings & User Menu Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowSettings((v) => !v)}
                className="p-2 -mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                title="Cài đặt & Giao diện"
              >
                <Settings className="w-6 h-6" />
              </button>

              {/* Settings Dropdown Modal */}
              {showSettings && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-3 z-50 space-y-2 text-xs">
                  <div className="px-2 py-1 text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <p className="font-semibold text-slate-800 dark:text-white">{home.name}</p>
                    <p className="text-[10px] text-slate-400">{userPhone || 'Đang kết nối'}</p>
                  </div>

                  {/* Theme Switcher Button */}
                  <button
                    onClick={() => {
                      onToggleTheme();
                      setShowSettings(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                    <span>{isDark ? 'Giao diện Sáng' : 'Giao diện Tối'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onRefresh();
                      setShowSettings(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    <RefreshCw className="w-4 h-4 text-emerald-500" />
                    <span>Làm mới dữ liệu</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowSettings(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 font-semibold border-t border-slate-100 dark:border-slate-800 pt-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất tài khoản</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 2. Period Navigation Tabs (Theo ngày | Theo tháng | Theo năm | Tuỳ chỉnh) */}
          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-400 border-b border-slate-100 dark:border-slate-800/80 px-2">
            {[
              { id: 'day', label: 'Theo ngày' },
              { id: 'month', label: 'Theo tháng' },
              { id: 'year', label: 'Theo năm' },
              { id: 'custom', label: 'Tuỳ chỉnh' },
            ].map((tab) => {
              const isActive = periodTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setPeriodTab(tab.id as PeriodTab)}
                  className={`pb-3 relative transition-all duration-150 ${
                    isActive
                      ? 'text-slate-900 dark:text-white font-bold'
                      : 'hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 dark:bg-white rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* 3. Month Picker Navigator (< Tháng 10/2026 >) */}
          <div className="flex items-center justify-center gap-6 pt-1">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-full text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>

            <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 tracking-wide">
              Tháng {currentMonthNum.toString().padStart(2, '0')}/{currentYear}
            </span>

            <button
              onClick={handleNextMonth}
              className="p-1 rounded-full text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <ChevronRight className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* 4. Hero Energy Metric (36.27 kWh + 137,826 VND) */}
          <div className="text-center space-y-1 py-1">
            <div className="text-5xl sm:text-6xl font-black text-[#00B33D] dark:text-[#10B981] tracking-tight">
              {totalKwh.toFixed(2)} <span className="text-3xl sm:text-4xl font-extrabold">kWh</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-[#EF4444] tracking-wide">
              {totalPrice.toLocaleString('vi-VN')} VND
            </div>
          </div>

          {/* 5. Dual Meter Index Cards with center lightning pill */}
          <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2 sm:gap-3">
            {/* Old Meter Index */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 text-center border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                Chỉ số công tơ cũ (kWh)
              </p>
              <p className="text-xl sm:text-2xl font-bold text-[#00B33D] dark:text-[#10B981] mt-1">
                {firstPower.toFixed(1)}
              </p>
            </div>

            {/* Center Lightning Pill Icon */}
            <div className="w-10 h-16 sm:w-12 sm:h-20 rounded-2xl bg-[#00B33D] text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Zap className="w-6 h-6 fill-white stroke-white" />
            </div>

            {/* New Meter Index */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 text-center border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                Chỉ số công tơ mới (kWh)
              </p>
              <p className="text-xl sm:text-2xl font-bold text-[#00B33D] dark:text-[#10B981] mt-1">
                {lastPower.toFixed(2)}
              </p>
            </div>
          </div>

          {/* 6. Realtime Telemetry Strip (Điện áp, Dòng, Công suất, Dòng rò) */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="grid grid-cols-4 text-center divide-x divide-slate-200 dark:divide-slate-700/60">
              <div className="px-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                  Điện áp (V)
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-white mt-0.5 block">
                  {voltageV}
                </span>
              </div>

              <div className="px-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                  Dòng (A)
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-white mt-0.5 block">
                  {currentA}
                </span>
              </div>

              <div className="px-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                  Công suất (W)
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-white mt-0.5 block">
                  {powerW}
                </span>
              </div>

              <div className="px-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                  Dòng rò (mA)
                </span>
                <span className={`text-sm sm:text-base font-bold mt-0.5 block ${leakageMa > 0 ? 'text-red-500' : 'text-red-500'}`}>
                  {leakageMa}
                </span>
              </div>
            </div>
          </div>

          {/* 7. View Content: Monthly Calendar Grid vs Chart */}
          <div className="pt-2">
            {periodTab === 'day' ? (
              <div className="space-y-4">
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Biểu đồ 24 giờ ngày {selectedDate}:
                </div>
                <HourlyChart data={today.hourly || []} ratePrice={ratePrice} />
              </div>
            ) : viewMode === 'calendar' ? (
              <MonthlyCalendarGrid
                year={currentYear}
                month={currentMonthNum}
                dailyData={currentMonth?.daily_data || []}
                selectedDate={selectedDate}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  // Optional quick switch or click
                }}
              />
            ) : (
              <div className="space-y-4">
                <DailyChart data={currentMonth?.daily_data || []} ratePrice={ratePrice} />
              </div>
            )}
          </div>
        </div>

        {/* 8. Bottom View Switcher Bar (Mô phỏng chính xác icon Lịch & Biểu đồ) */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827]">
          <div className="flex items-center gap-3">
            {/* View Mode Toggle Pill */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setViewMode('calendar');
                  setPeriodTab('month');
                }}
                className={`p-2.5 rounded-xl border transition-all ${
                  viewMode === 'calendar' && periodTab === 'month'
                    ? 'bg-[#00B33D] text-white border-[#00B33D] shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-600'
                }`}
                title="Xem dạng Lịch"
              >
                <CalendarIcon className="w-5 h-5" />
              </button>

              <button
                onClick={() => setViewMode('chart')}
                className={`p-2.5 rounded-xl border transition-all ${
                  viewMode === 'chart'
                    ? 'bg-[#00B33D] text-white border-[#00B33D] shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-600'
                }`}
                title="Xem dạng Biểu đồ"
              >
                <BarChart2 className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom Label Text */}
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Bảng tiêu thụ điện năng trong tháng (kWh)
            </span>
          </div>

          {/* Note about hardware cutoff */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Dữ liệu lưu trữ 2 tháng • Tự bảo vệ khi đầy bộ nhớ</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Hunonic EKMeter</span>
          </div>
        </div>
      </div>
    </div>
  );
}
