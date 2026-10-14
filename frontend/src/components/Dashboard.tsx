import { useState } from 'react';
import { 
  Activity, RefreshCw, LogOut, Info, Wind
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { HourlyChart } from './HourlyChart';
import { DailyChart } from './DailyChart';
import type { SummaryData } from '../App';

interface DashboardProps {
  summary: SummaryData;
  onRefresh: () => void;
  onLogout: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  userPhone?: string;
}

export function Dashboard({ 
  summary, 
  onRefresh, 
  onLogout, 
  isDark, 
  onToggleTheme,
  userPhone 
}: DashboardProps) {
  const [chartType, setChartType] = useState<'hourly' | 'daily'>('hourly');

  const { home, electricMeters, today, currentMonth, electricityRate } = summary;
  const meter = electricMeters[0];

  const ratePrice = electricityRate?.price ? parseInt(electricityRate.price) : 3800;
  const isOnline = meter && new Date(meter.last_online).getTime() > Date.now() - 20 * 60 * 1000;

  // Determine Air Conditioner Running State based on realtime Wattage
  const powerW = today.power_current_w || meter?.power_current || 0;
  let acStatus = {
    label: 'Chế độ chờ (Standby)',
    color: 'text-slate-500 dark:text-slate-400',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    iconColor: 'text-slate-400',
  };

  if (powerW >= 150) {
    acStatus = {
      label: 'Đang làm lạnh (Block máy nén đang chạy)',
      color: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      iconColor: 'text-emerald-500',
    };
  } else if (powerW >= 15) {
    acStatus = {
      label: 'Đang quạt gió / Đã đủ nhiệt độ',
      color: 'text-sky-600 dark:text-sky-400',
      badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
      iconColor: 'text-sky-500',
    };
  }

  return (
    <div className="min-h-screen flex flex-col transition-colors">
      {/* Clean Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#0b0f19]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Title & Location */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Wind className="w-5 h-5" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Giám Sát Điện Năng Điều Hòa
                  </h1>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {home.name} • {meter?.name || 'Bộ kiểm soát điện năng'}
                </p>
              </div>
            </div>

            {/* Actions: Theme Toggle, Refresh, Logout */}
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />

              <button
                onClick={onRefresh}
                className="btn-clean-secondary p-2 sm:px-3"
                title="Làm mới dữ liệu từ công tơ"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Làm mới</span>
              </button>

              <button
                onClick={onLogout}
                className="btn-clean-secondary p-2 sm:px-3 text-rose-500 dark:text-rose-400 hover:bg-rose-500/10"
                title={`Đăng xuất (${userPhone || ''})`}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Thoát</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full space-y-6">
        {/* Core AC Status & Live Telemetry Hero Card */}
        <div className="glass-card p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            {/* Left: Realtime Power & State */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${acStatus.badge}`}>
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  {isOnline ? 'Công tơ Online' : 'Mất tín hiệu'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {acStatus.label}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Công suất tiêu thụ điều hòa
                </p>
                <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
                  {powerW} <span className="text-xl sm:text-2xl font-normal text-slate-500 dark:text-slate-400">Watt</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ước tính dòng điện: <strong className="text-slate-700 dark:text-slate-200">{(powerW > 0 ? (powerW / 226).toFixed(2) : '0.00')} A</strong> • Điện áp: <strong className="text-slate-700 dark:text-slate-200">226 V</strong>
              </p>
            </div>

            {/* Right: Today vs This Month Quick Highlights */}
            <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
              <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-left min-w-[150px]">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Điện hôm nay</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {today.kwh.toFixed(2)} <span className="text-xs font-normal text-slate-500">kWh</span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  ~{today.cost_estimated.toLocaleString('vi-VN')} ₫
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-left min-w-[150px]">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Điện tháng này</p>
                <p className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-0.5">
                  {(currentMonth?.total_power || meter?.power_of_month || 0).toFixed(2)} <span className="text-xs font-normal text-slate-500">kWh</span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  ~{(currentMonth?.total_price || meter?.money_of_month || 0).toLocaleString('vi-VN')} ₫
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Stat Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Số điện hôm nay</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {today.kwh.toFixed(2)} kWh
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block font-medium">
              ~{today.cost_estimated.toLocaleString('vi-VN')} ₫
            </span>
          </div>

          <div className="glass-card p-4">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Công suất tức thời</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {powerW} W
            </p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
              Dòng: {(powerW > 0 ? (powerW / 226).toFixed(2) : '0.00')} A
            </span>
          </div>

          <div className="glass-card p-4">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Tổng tháng này</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {(currentMonth?.total_power || meter?.power_of_month || 0).toFixed(2)} kWh
            </p>
            <span className="text-[10px] text-sky-600 dark:text-sky-400 mt-1 block font-medium">
              ~{(currentMonth?.total_price || meter?.money_of_month || 0).toLocaleString('vi-VN')} ₫
            </span>
          </div>

          <div className="glass-card p-4">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Đơn giá điện</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {ratePrice.toLocaleString('vi-VN')} ₫
            </p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
              {electricityRate?.group_name || 'Tự thiết lập'}
            </span>
          </div>
        </div>

        {/* Interactive Charts Section */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                Biểu Đồ Tiêu Thụ Điện Năng
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {chartType === 'hourly'
                  ? 'Chi tiết lượng điện chạy theo từng khung giờ trong ngày (0h - 24h)'
                  : 'Lịch sử lượng điện tiêu thụ theo từng ngày trong tháng'}
              </p>
            </div>

            {/* Toggle Switcher */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
              <button
                onClick={() => setChartType('hourly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  chartType === 'hourly'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🕒 Theo Giờ (24h)
              </button>
              <button
                onClick={() => setChartType('daily')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  chartType === 'daily'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                📅 Theo Ngày (Tháng)
              </button>
            </div>
          </div>

          {/* Render selected smooth chart */}
          {chartType === 'hourly' ? (
            <HourlyChart
              data={today.hourly || []}
              ratePrice={ratePrice}
            />
          ) : (
            <DailyChart
              data={currentMonth?.daily_data || []}
              ratePrice={ratePrice}
            />
          )}
        </div>

        {/* Technical Explanation Note regarding Power Cutoff */}
        <div className="glass-card p-5 border-l-4 border-l-amber-500 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>Về Tính Năng Tắt / Mở Ngắt Nguồn Trên Thiết Bị Này:</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Thiết bị hiện tại của bạn là dòng <strong>Bộ kiểm soát điện năng Hunonic (mã phần cứng: EKMeter)</strong>. 
            Căn cứ theo mã nguồn gốc của Hunonic (<code className="font-mono text-emerald-600 dark:text-emerald-400">Bs.EKMETER</code>), 
            đây là thiết bị đo gián tiếp thuần túy (CT Clamp / sensor đo đếm), <strong>hoàn toàn không có rơ-le cơ khí đóng/ngắt mạch bên trong</strong>. 
            Do đó, bạn <strong>không thể ngắt nguồn điều hòa từ xa trực tiếp trên công tơ này</strong>. Nếu muốn ngắt nguồn điều hòa, bạn cần lắp thêm một <strong>Công tắc công suất cao Hunonic (30A)</strong> hoặc thay bằng <strong>Aptomat thông minh Hunonic (ELMeter / ATM WiFi)</strong>.
          </p>
        </div>

        {/* 2-Month Retention Info */}
        <div className="text-center text-xs text-slate-400 dark:text-slate-500 pt-2 pb-6">
          Dữ liệu điện theo giờ được lưu trữ 60 ngày (2 tháng) • Tự động dọn dẹp để bảo vệ máy chủ
        </div>
      </main>
    </div>
  );
}
