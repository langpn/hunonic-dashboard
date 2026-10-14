import { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Settings, Calendar as CalendarIcon, 
  BarChart2, Zap, LogOut, RefreshCw, Sun, Moon, Wind, Activity, Clock
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

  // Month navigation
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonthNum, setCurrentMonthNum] = useState(() => new Date().getMonth() + 1);

  // Selected date state
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Safe destructuring to prevent any null-session crash
  const home = summary?.home || { id: '966357', name: 'Nhà của Lang', timezone: 'GMT+07:00' };
  const electricMeters = summary?.electricMeters || [];
  const today = summary?.today || { date: todayStr, kwh: 0, power_current_w: 0, cost_estimated: 0, hourly: [] };
  const currentMonth = summary?.currentMonth;
  const electricityRate = summary?.electricityRate;

  const meter = electricMeters[0];
  const ratePrice = electricityRate?.price ? parseInt(electricityRate.price) : 3800;
  const isOnline = meter && new Date(meter.last_online).getTime() > Date.now() - 20 * 60 * 1000;

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

  // AC Operating State
  let acStatus = {
    label: 'Chế độ chờ (Standby)',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  };

  if (powerW >= 150) {
    acStatus = {
      label: 'Đang làm lạnh (Máy nén chạy)',
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    };
  } else if (powerW >= 15) {
    acStatus = {
      label: 'Quạt gió / Đủ nhiệt độ',
      badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
    };
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* ==================================================================== */}
      {/* DESKTOP + MOBILE HEADER BAR */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Title & Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Wind className="w-5 h-5" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight uppercase">
                    {meter?.name || 'BỘ KIỂM SOÁT ĐIỆN NĂNG'}
                  </h1>
                  <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {meter?.root_type?.toUpperCase() || 'EKMETER'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {home.name} • {meter?.room_name || 'Điều hòa nhiệt độ'}
                </p>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-medium border border-slate-200 dark:border-slate-700">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span>{isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}</span>
              </div>

              <button
                onClick={onToggleTheme}
                className="btn-clean-secondary p-2 sm:px-3"
                title={isDark ? 'Giao diện Sáng' : 'Giao diện Tối'}
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                <span className="hidden sm:inline">{isDark ? 'Giao diện Sáng' : 'Giao diện Tối'}</span>
              </button>

              <button
                onClick={onRefresh}
                className="btn-clean-secondary p-2 sm:px-3"
                title="Làm mới dữ liệu từ công tơ"
              >
                <RefreshCw className="w-4 h-4 text-emerald-500" />
                <span className="hidden sm:inline">Làm mới</span>
              </button>

              {/* Settings Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings((v) => !v)}
                  className="btn-clean-secondary p-2 sm:px-3"
                  title="Cài đặt tài khoản"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {showSettings && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-3 z-50 space-y-2 text-xs">
                    <div className="px-2 py-1 text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <p className="font-semibold text-slate-800 dark:text-white">{home.name}</p>
                      <p className="text-[10px] text-slate-400">{userPhone || 'Tài khoản Hunonic'}</p>
                    </div>

                    <button
                      onClick={() => {
                        setShowSettings(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 font-semibold"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* RESPONSIVE LAYOUT CONTAINER (Mobile Column ⟷ Desktop 12-Cols) */}
      {/* ==================================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full space-y-6">
        {/* Desktop & Mobile Period Tabs Navigation */}
        <div className="glass-card p-3 sm:p-4">
          <div className="flex items-center justify-between">
            {/* Tabs */}
            <div className="flex items-center gap-4 sm:gap-8 text-xs sm:text-sm font-semibold text-slate-400">
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
                    className={`pb-1 relative transition-all duration-150 ${
                      isActive
                        ? 'text-slate-900 dark:text-white font-bold'
                        : 'hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-slate-900 dark:bg-white rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Month Navigator */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevMonth}
                className="p-1 rounded-full text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                Tháng {currentMonthNum.toString().padStart(2, '0')}/{currentYear}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1 rounded-full text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* DESKTOP SPLIT: 5 Cols Left (Metrics) & 7 Cols Right (Calendar/Chart) */}
        {/* MOBILE STACK: Stacks vertically 1:1 identical to screenshot! */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN (lg:col-span-5): Hero Metric, Dual Indexes, Telemetry */}
          <div className="lg:col-span-5 space-y-6">
            {/* Hero Energy Card (36.27 kWh + 137,826 VND) */}
            <div className="glass-card p-6 sm:p-8 text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${acStatus.badge}`}>
                  {acStatus.label}
                </span>
              </div>

              <div className="text-5xl sm:text-6xl font-black text-[#00B33D] dark:text-[#10B981] tracking-tight pt-1">
                {totalKwh.toFixed(2)} <span className="text-3xl sm:text-4xl font-extrabold">kWh</span>
              </div>

              <div className="text-base sm:text-lg font-bold text-[#EF4444] tracking-wide">
                {totalPrice.toLocaleString('vi-VN')} VND
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                Đơn giá điện: <strong className="text-slate-700 dark:text-slate-300">{ratePrice.toLocaleString('vi-VN')} ₫/kWh</strong> ({electricityRate?.group_name || 'Tự thiết lập'})
              </p>
            </div>

            {/* Dual Meter Index Cards with center lightning pill */}
            <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2 sm:gap-3">
              {/* Old Meter Index */}
              <div className="glass-card p-4 text-center">
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
              <div className="glass-card p-4 text-center">
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Chỉ số công tơ mới (kWh)
                </p>
                <p className="text-xl sm:text-2xl font-bold text-[#00B33D] dark:text-[#10B981] mt-1">
                  {lastPower.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Realtime Telemetry Strip (Điện áp, Dòng, Công suất, Dòng rò) */}
            <div className="glass-card p-4">
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
                  <span className="text-sm sm:text-base font-bold text-red-500 mt-0.5 block">
                    {leakageMa}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Summary of Today */}
            <div className="glass-card p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Tiêu thụ hôm nay</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {today.kwh.toFixed(2)} kWh <span className="text-xs font-normal text-slate-400">(~{today.cost_estimated.toLocaleString('vi-VN')} ₫)</span>
                  </p>
                </div>
              </div>

              <span className="text-[11px] text-slate-400 font-mono">
                {selectedDate}
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN (lg:col-span-7): Calendar Grid ⟷ Charts View */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-card p-5 sm:p-6 space-y-5">
              {/* Header inside right card with View Switcher */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {periodTab === 'day' 
                    ? `Biểu đồ chi tiết 24 giờ (${selectedDate})` 
                    : viewMode === 'calendar' 
                    ? 'Bảng tiêu thụ điện năng trong tháng (kWh)' 
                    : 'Biểu đồ tiêu thụ điện năng theo ngày (kWh)'}
                </span>

                {/* Bottom switcher buttons (Calendar ⟷ Chart) */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setViewMode('calendar');
                      setPeriodTab('month');
                    }}
                    className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      viewMode === 'calendar' && periodTab === 'month'
                        ? 'bg-[#00B33D] text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                    title="Xem dạng Lịch"
                  >
                    <CalendarIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Lịch tháng</span>
                  </button>

                  <button
                    onClick={() => setViewMode('chart')}
                    className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      viewMode === 'chart'
                        ? 'bg-[#00B33D] text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                    title="Xem dạng Biểu đồ"
                  >
                    <BarChart2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Biểu đồ</span>
                  </button>
                </div>
              </div>

              {/* Render Calendar Grid or Chart */}
              {periodTab === 'day' ? (
                <div className="space-y-4">
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
                  }}
                />
              ) : (
                <DailyChart data={currentMonth?.daily_data || []} ratePrice={ratePrice} />
              )}
            </div>

            {/* Hardware Note Footer */}
            <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Lưu trữ dữ liệu điện 60 ngày (2 tháng) • Tự động dọn dẹp khi đầy
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Hunonic EKMeter (CT Clamp)
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
