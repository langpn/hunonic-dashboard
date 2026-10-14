import { useState } from 'react';
import { 
  Zap, Activity, DollarSign, Calendar, RefreshCw, 
  Layers, Shield, Server, Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { StatCard } from './StatCard';
import { MeterCard } from './MeterCard';
import { HourlyChart } from './HourlyChart';
import { DailyChart } from './DailyChart';
import { DeviceMatrix } from './DeviceMatrix';
import { ScenarioHub } from './ScenarioHub';
import { SafetyThresholds } from './SafetyThresholds';
import { SystemDiagnostics } from './SystemDiagnostics';
import type { SummaryData } from '../App';

interface DashboardProps {
  summary: SummaryData;
  onRefresh: () => void;
}

type TabType = 'energy' | 'devices' | 'scenarios' | 'safety' | 'system';

export function Dashboard({ summary, onRefresh }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('energy');
  const [chartSubTab, setChartSubTab] = useState<'hourly' | 'daily'>('hourly');

  const { home, electricMeters, today, currentMonth, electricityRate, storage_diagnostics, allDevices } = summary;
  const primaryMeter = electricMeters[0];

  const ratePrice = electricityRate?.price ? parseInt(electricityRate.price) : 3800;
  const isOnline = primaryMeter && new Date(primaryMeter.last_online).getTime() > Date.now() - 15 * 60 * 1000;

  const powerChange = primaryMeter && primaryMeter.power_of_prev_month > 0
    ? ((primaryMeter.power_of_month - primaryMeter.power_of_prev_month) / primaryMeter.power_of_prev_month * 100)
    : 0;

  return (
    <div className="min-h-screen text-slate-100 flex flex-col">
      {/* Top Futuristic Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#04070d]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand Logo & Telemetry */}
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/20 to-violet-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(0,245,155,0.3)]">
                  <Zap className="w-6 h-6 animate-pulse" />
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(0,245,155,0.9)] absolute -top-0.5 -right-0.5" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-extrabold tracking-tight shimmer-text">
                    HUNONIC CYBER HUD
                  </h1>
                  <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold uppercase">
                    v2.0 Ultra
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                  <span>{home.name}</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-mono text-[11px] text-slate-500">{home.timezone}</span>
                </p>
              </div>
            </div>

            {/* Status & Refresh Action */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 text-xs font-semibold">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                <span className="text-slate-300">{isOnline ? 'Lưới điện: Ổn định' : 'Mất tín hiệu'}</span>
              </div>

              <button
                onClick={onRefresh}
                className="btn-mystic text-xs py-2 px-3.5"
                title="Làm mới dữ liệu từ thiết bị"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Đồng bộ</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none border-t border-white/5">
            {[
              { id: 'energy', label: 'Năng Lượng & Đo Lường', icon: Activity },
              { id: 'devices', label: 'Bảng Điều Khiển Thiết Bị', icon: Layers },
              { id: 'scenarios', label: 'Ngữ Cảnh Tự Động', icon: Sparkles },
              { id: 'safety', label: 'Bảo Vệ An Toàn', icon: Shield },
              { id: 'system', label: 'Hệ Thống & 2 Tháng', icon: Server },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/15 border border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(0,245,155,0.25)]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* ================================================================= */}
        {/* TAB 1: ENERGY TELEMETRY HUD */}
        {/* ================================================================= */}
        {activeTab === 'energy' && (
          <div className="space-y-8">
            {/* Top Glowing Hero Banner: Realtime Watt Ring + Today Stats */}
            <div className="mystic-card p-6 sm:p-8 relative overflow-hidden glow-border-emerald">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                {/* Left: Day Energy Telemetry */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <Calendar className="w-4 h-4" />
                    Tiêu thụ hôm nay ({format(new Date(), 'EEEE, dd/MM/yyyy', { locale: vi })})
                  </div>
                  <div className="text-4xl sm:text-6xl font-black text-white tracking-tight">
                    {today.kwh.toFixed(2)}{' '}
                    <span className="text-2xl sm:text-3xl font-medium text-emerald-300">kWh</span>
                  </div>
                  <p className="text-slate-300 text-xs sm:text-sm font-medium">
                    Chi phí tạm tính hôm nay:{' '}
                    <span className="text-emerald-400 font-bold">
                      {today.cost_estimated.toLocaleString('vi-VN')} ₫
                    </span>{' '}
                    <span className="text-slate-500">(@{ratePrice.toLocaleString('vi-VN')} ₫/kWh)</span>
                  </p>
                </div>

                {/* Right: Realtime Watt Circular HUD Gauge */}
                <div className="w-full lg:w-auto flex items-center justify-center sm:justify-start lg:justify-end gap-6 bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-800/80">
                  {/* Glowing Radar Ring */}
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/30 animate-spin" style={{ animationDuration: '20s' }} />
                    <div className="absolute inset-2 rounded-full border border-cyan-500/40" />
                    <div className="text-center">
                      <Activity className="w-5 h-5 text-cyan-400 mx-auto animate-pulse" />
                      <span className="text-[10px] text-slate-400 font-mono uppercase">Live Load</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                      Công suất tức thời
                    </span>
                    <div className="text-3xl sm:text-4xl font-extrabold text-cyan-300 tracking-tight mt-0.5">
                      {today.power_current_w}{' '}
                      <span className="text-base font-normal text-slate-400">Watt</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Dòng tải: {(today.power_current_w > 0 ? (today.power_current_w / 226).toFixed(2) : '0.00')} A • 226 V
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Hôm nay"
                value={`${today.kwh.toFixed(2)} kWh`}
                icon={Zap}
                colorScheme="emerald"
                subtitle={`Ước tính: ${today.cost_estimated.toLocaleString('vi-VN')} ₫`}
              />
              <StatCard
                title="Công suất tức thời"
                value={`${today.power_current_w} W`}
                icon={Activity}
                colorScheme="cyan"
                subtitle="Đo từ công tơ điện tử"
              />
              <StatCard
                title="Tổng điện tháng này"
                value={`${currentMonth?.total_power?.toFixed(2) || primaryMeter?.power_of_month?.toFixed(2) || 0} kWh`}
                icon={Zap}
                colorScheme="violet"
                trend={{ value: powerChange, label: 'so với tháng trước' }}
                trendUp={powerChange >= 0}
              />
              <StatCard
                title="Chi phí tháng tạm tính"
                value={`${(currentMonth?.total_price || primaryMeter?.money_of_month || 0).toLocaleString('vi-VN')} ₫`}
                icon={DollarSign}
                colorScheme="amber"
                subtitle={electricityRate?.group_name || 'Tự thiết lập'}
              />
            </div>

            {/* Energy Charts Container */}
            <div className="mystic-card p-6 sm:p-8 space-y-6">
              {/* Chart Switcher Sub-Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    Biểu Đồ Năng Lượng Chi Tiết
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {chartSubTab === 'hourly' 
                      ? 'Theo dõi lượng điện theo 24 giờ trong ngày (Lưu trữ 2 tháng & tự bảo vệ khi server đầy)'
                      : 'Lịch sử tiêu thụ 31 ngày trong tháng hiện tại'}
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                  <button
                    onClick={() => setChartSubTab('hourly')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      chartSubTab === 'hourly'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(0,245,155,0.3)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ⚡ Theo Giờ (24h)
                  </button>
                  <button
                    onClick={() => setChartSubTab('daily')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      chartSubTab === 'daily'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    📅 Theo Ngày (Tháng)
                  </button>
                </div>
              </div>

              {/* Render Selected Chart */}
              {chartSubTab === 'hourly' ? (
                <HourlyChart
                  data={today.hourly || []}
                  ratePrice={ratePrice}
                  dateStr={today.date}
                />
              ) : (
                <DailyChart
                  data={currentMonth?.daily_data || []}
                  ratePrice={ratePrice}
                />
              )}
            </div>

            {/* Meter Hardware Specification Telemetry Card */}
            {primaryMeter && <MeterCard meter={primaryMeter as any} />}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: DEVICE MATRIX (All Devices Control) */}
        {/* ================================================================= */}
        {activeTab === 'devices' && (
          <DeviceMatrix
            devices={allDevices}
            primaryMeterRootId={primaryMeter?.root_id}
          />
        )}

        {/* ================================================================= */}
        {/* TAB 3: SCENARIO HUB (Automations) */}
        {/* ================================================================= */}
        {activeTab === 'scenarios' && <ScenarioHub />}

        {/* ================================================================= */}
        {/* TAB 4: SAFETY THRESHOLDS */}
        {/* ================================================================= */}
        {activeTab === 'safety' && (
          <SafetyThresholds
            currentRatePrice={electricityRate?.price || '3800'}
            closingDay={31}
          />
        )}

        {/* ================================================================= */}
        {/* TAB 5: SYSTEM & 2-MONTH RETENTION */}
        {/* ================================================================= */}
        {activeTab === 'system' && (
          <SystemDiagnostics
            diagnostics={storage_diagnostics}
            onRefresh={onRefresh}
          />
        )}
      </main>

      {/* Futuristic Ambient Footer */}
      <footer className="border-t border-white/5 py-6 bg-[#04070d]/80 text-center text-xs text-slate-500">
        <p>Hunonic Smart IoT Dashboard • Tối ưu hiệu năng 60fps • Tự động dọn dẹp sau 2 tháng</p>
      </footer>
    </div>
  );
}
